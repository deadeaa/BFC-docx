package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bfc-backend/audit"
	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type BatchKhususHandler struct {
	db *repository.DB
}

func NewBatchKhususHandler(db *repository.DB) *BatchKhususHandler {
	return &BatchKhususHandler{db: db}
}



func computeBKMaterialValues(product *models.BKProduct, inputSisaMinor float64) []float64 {
	if product == nil || len(product.Materials) == 0 {
		return []float64{}
	}

	values := make([]float64, len(product.Materials))

	var d4 float64 = 1.0
	for _, m := range product.Materials {
		if m.MaterialIndex == 1 {
			d4 = m.QtyPerSachet
			break
		}
	}

	for i, m := range product.Materials {
		if m.MaterialIndex == 1 {
			values[i] = inputSisaMinor
		} else if m.MaterialIndex == 0 {
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else if m.MaterialIndex == 2 {
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else {
			var e4 float64 = 1.0
			var qtyIndex2 float64 = 0
			for _, mm := range product.Materials {
				if mm.MaterialIndex == 2 {
					e4 = mm.QtyPerSachet
					qtyIndex2 = mm.QtyPerSachet
					break
				}
			}
			e5 := (inputSisaMinor / d4) * qtyIndex2
			values[i] = (e5 / e4) * m.QtyPerSachet
		}
	}

	return values
}

func getRoleJabatan(c *gin.Context) (role string, jabatan string) {
	r, _ := c.Get(middleware.CtxRole)
	role, _ = r.(string)
	j, _ := c.Get(middleware.CtxJabatan)
	jabatan, _ = j.(string)
	return
}

func isStaffTS(role, jabatan string) bool {
	return role == "ts" && jabatan == "staff"
}

func isSPV(role, jabatan string) bool {
	return role == "ts" && jabatan == "spv"
}

func isMGR(role, jabatan string) bool {
	return role == "ts" && jabatan == "mgr"
}



func (h *BatchKhususHandler) ListProducts(c *gin.Context) {
	products, err := h.db.ListBKProducts(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data produk"})
		return
	}
	if products == nil {
		products = []models.BKProduct{}
	}
	c.JSON(http.StatusOK, products)
}

func (h *BatchKhususHandler) GetProduct(c *gin.Context) {
	kode := c.Param("kode")

	product, err := h.db.GetBKProductFullByKode(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func (h *BatchKhususHandler) GetProductReports(c *gin.Context) {
	kode := c.Param("kode")
	noBatch := c.Query("no_batch")

	reports, err := h.db.ListBKReportsByProduct(c, kode, noBatch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil riwayat"})
		return
	}
	if reports == nil {
		reports = []models.BKReport{}
	}
	c.JSON(http.StatusOK, reports)
}

func (h *BatchKhususHandler) GetLatestReport(c *gin.Context) {
	kode := c.Param("kode")
	report, err := h.db.GetLatestBKReportByProduct(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Belum ada laporan untuk produk ini"})
		return
	}
	c.JSON(http.StatusOK, report)
}



func (h *BatchKhususHandler) CreateReport(c *gin.Context) {
	var req models.CreateBKReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap: " + err.Error()})
		return
	}

	tgl, err := time.Parse("2006-01-02", req.TglPembuatan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format tanggal tidak valid (YYYY-MM-DD)"})
		return
	}

	product, err := h.db.GetBKProductFullByKode(c, req.KodeProduk)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk dengan kode " + req.KodeProduk + " tidak ditemukan"})
		return
	}

	materialValues := computeBKMaterialValues(product, req.InputSisaMinor)

	var total float64
	for _, v := range materialValues {
		total += v
	}

	detailData := map[string]interface{}{
		"materials":        product.Materials,
		"values":           materialValues,
		"total":            total,
		"input_sisa_minor": req.InputSisaMinor,
		"bobot_total":      req.BobotTotal,
	}
	detailJSON, _ := json.Marshal(detailData)

	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)

	
	status := "draft"
	if req.Status == "waiting_spv" {
		role, jabatan := getRoleJabatan(c)
		if role != "admin" && !isStaffTS(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Staff Technical Services atau Administrator yang dapat mengajukan approval"})
			return
		}
		status = "waiting_spv"
	}

	report := &models.BKReport{
		KodeProduk:     req.KodeProduk,
		NoBatch:        req.NoBatch,
		TglPembuatan:   tgl,
		BobotTotal:     req.BobotTotal,
		InputSisaMinor: req.InputSisaMinor,
		DetailJSON:     string(detailJSON),
		CreatedBy:      uid,
		Status:         status,
	}

	created, err := h.db.CreateBKReport(c, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan laporan: " + err.Error()})
		return
	}

	act := "Menyimpan Draft Perhitungan Batch Khusus"
	if status == "waiting_spv" {
		act = "Mengajukan Approval Batch Khusus"
	}
	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    act,
		Description: act + " untuk produk " + req.KodeProduk + ", No. Batch " + req.NoBatch,
	})

	c.JSON(http.StatusCreated, created)
}



func (h *BatchKhususHandler) GetReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	rep, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, rep)
}

func (h *BatchKhususHandler) UpdateReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	role, jabatan := getRoleJabatan(c)

	
	if role != "admin" && isMGR(role, jabatan) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Manager tidak diizinkan mengubah isi perhitungan"})
		return
	}

	existing, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	
	if existing.Status == "waiting_mgr" || existing.Status == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Laporan pada status " + existing.Status + " tidak dapat diubah",
		})
		return
	}

	
	if existing.Status == "waiting_spv" {
		if role != "admin" && !isSPV(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Supervisor atau Administrator yang dapat mengubah laporan pada status ini"})
			return
		}
	}

	var req models.UpdateBKReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap: " + err.Error()})
		return
	}

	product, err := h.db.GetBKProductFullByKode(c, existing.KodeProduk)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat produk"})
		return
	}

	materialValues := computeBKMaterialValues(product, req.InputSisaMinor)
	var total float64
	for _, v := range materialValues {
		total += v
	}

	detailData := map[string]interface{}{
		"materials":        product.Materials,
		"values":           materialValues,
		"total":            total,
		"input_sisa_minor": req.InputSisaMinor,
		"bobot_total":      req.BobotTotal,
	}
	detailJSON, _ := json.Marshal(detailData)

	if err := h.db.UpdateBKReportCalculation(c, id, req.BobotTotal, req.InputSisaMinor, string(detailJSON)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui laporan"})
		return
	}

	updated, _ := h.db.GetBKReportByID(c, id)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Mengubah Perhitungan Batch Khusus",
		Description: "Mengubah perhitungan Batch Khusus untuk produk " + existing.KodeProduk + ", No. Batch " + existing.NoBatch,
	})

	c.JSON(http.StatusOK, updated)
}



func (h *BatchKhususHandler) SubmitReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	role, jabatan := getRoleJabatan(c)
	if role != "admin" && !isStaffTS(role, jabatan) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Staff Technical Services atau Administrator yang dapat mengajukan approval"})
		return
	}

	existing, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	if existing.Status != "draft" && existing.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Hanya laporan berstatus draft atau ditolak yang dapat diajukan"})
		return
	}

	if err := h.db.SubmitBKReportForApproval(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengajukan approval"})
		return
	}

	updated, _ := h.db.GetBKReportByID(c, id)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Mengajukan Approval Batch Khusus",
		Description: "Mengajukan approval Batch Khusus untuk produk " + existing.KodeProduk + ", No. Batch " + existing.NoBatch,
	})

	c.JSON(http.StatusOK, updated)
}



func (h *BatchKhususHandler) ApproveReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	role, jabatan := getRoleJabatan(c)
	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)

	user, err := h.db.GetUserByID(c, uid)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak valid"})
		return
	}

	existing, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	switch existing.Status {
	case "waiting_spv":
		
		if role != "admin" && !isSPV(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Supervisor (SPV) atau Administrator yang dapat menyetujui tahap ini"})
			return
		}
		if err := h.db.ApproveBKReportBySPV(c, id, user.ID, user.FullName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyetujui laporan: " + err.Error()})
			return
		}

	case "waiting_mgr":
		
		if role != "admin" && !isMGR(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Manager (MGR) atau Administrator yang dapat menyetujui tahap akhir ini"})
			return
		}
		if err := h.db.ApproveBKReportByMGR(c, id, user.ID, user.FullName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyetujui laporan: " + err.Error()})
			return
		}

	case "approved":
		c.JSON(http.StatusBadRequest, gin.H{"message": "Laporan sudah disetujui (Approved)"})
		return

	case "rejected":
		c.JSON(http.StatusBadRequest, gin.H{"message": "Laporan berstatus ditolak, harus diajukan ulang oleh Staff"})
		return

	default:
		c.JSON(http.StatusBadRequest, gin.H{"message": "Status laporan belum dalam antrean approval SPV/MGR"})
		return
	}

	updated, _ := h.db.GetBKReportByID(c, id)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Approve Perhitungan Batch Khusus",
		Description: "Approve Batch Khusus untuk produk " + existing.KodeProduk + ", No. Batch " + existing.NoBatch + " oleh " + user.FullName,
	})

	c.JSON(http.StatusOK, updated)
}



func (h *BatchKhususHandler) RejectReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	role, jabatan := getRoleJabatan(c)
	if role != "admin" && !isSPV(role, jabatan) && !isMGR(role, jabatan) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Supervisor atau Manager yang dapat menolak perhitungan"})
		return
	}

	var req models.RejectBKReportRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.RejectNote) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Catatan / alasan penolakan wajib diisi"})
		return
	}

	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)

	user, err := h.db.GetUserByID(c, uid)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak valid"})
		return
	}

	existing, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	
	switch existing.Status {
	case "waiting_spv":
		if role != "admin" && !isSPV(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Supervisor atau Administrator yang dapat menolak tahap ini"})
			return
		}
	case "waiting_mgr":
		if role != "admin" && !isMGR(role, jabatan) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Hanya Manager atau Administrator yang dapat menolak tahap ini"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"message": "Laporan tidak dalam antrean approval"})
		return
	}

	if err := h.db.RejectBKReport(c, id, user.ID, user.FullName, strings.TrimSpace(req.RejectNote)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menolak laporan"})
		return
	}

	updated, _ := h.db.GetBKReportByID(c, id)

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Reject Perhitungan Batch Khusus",
		Description: "Reject Batch Khusus untuk produk " + existing.KodeProduk + ", No. Batch " + existing.NoBatch + " oleh " + user.FullName + ", alasan: " + req.RejectNote,
	})

	c.JSON(http.StatusOK, updated)
}



func (h *BatchKhususHandler) GetNotifications(c *gin.Context) {
	role, jabatan := getRoleJabatan(c)

	resp, err := h.db.GetPendingApprovalNotifications(c, role, jabatan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat notifikasi"})
		return
	}

	c.JSON(http.StatusOK, resp)
}



func (h *BatchKhususHandler) ListReports(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if err != nil || pageSize < 1 {
		pageSize = 50
	}
	search := c.Query("search")
	status := c.Query("status")

	reports, total, err := h.db.ListBKReports(c, search, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan"})
		return
	}
	if reports == nil {
		reports = []models.BKReport{}
	}
	c.JSON(http.StatusOK, models.BKReportListResponse{
		Data:     reports,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}



func (h *BatchKhususHandler) DeleteReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	rep, err := h.db.GetBKReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	if err := h.db.DeleteBKReport(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus report"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Report Batch Khusus",
		Activity:    "Menghapus Report Batch Khusus",
		Description: "Menghapus Report Batch Khusus untuk produk " + rep.KodeProduk + ", No. Batch " + rep.NoBatch,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Report berhasil dihapus"})
}
