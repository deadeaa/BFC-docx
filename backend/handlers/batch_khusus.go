package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"bfc-backend/audit"
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
	
	// // Ambil role dari context
	// role, _ := c.Get("role")
	// roleStr, _ := role.(string)
	
	// // Jika user (bukan admin), hapus qty_per_sachet dari response
	// if roleStr != "admin" {
	// 	for i := range product.Materials {
	// 		product.Materials[i].QtyPerSachet = 0
	// 	}
	// }
	
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

	userID, _ := c.Get("user_id")

	report := &models.BKReport{
		KodeProduk:     req.KodeProduk,
		NoBatch:        req.NoBatch,
		TglPembuatan:   tgl,
		BobotTotal:     req.BobotTotal,
		InputSisaMinor: req.InputSisaMinor,
		DetailJSON:     string(detailJSON),
		CreatedBy:      userID.(int),
	}

	created, err := h.db.CreateBKReport(c, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan laporan: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Membuat Perhitungan Batch Khusus",
		Description: "Membuat perhitungan Batch Khusus untuk produk " + req.KodeProduk + ", No. Batch " + req.NoBatch,
	})

	c.JSON(http.StatusCreated, created)
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

	reports, total, err := h.db.ListBKReports(c, search, page, pageSize)
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