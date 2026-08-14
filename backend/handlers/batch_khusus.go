// backend/handlers/batch_khusus.go
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

// computeBKMaterialValues menghitung nilai material berdasarkan input sisa minor
func computeBKMaterialValues(product *models.BKProduct, inputSisaMinor float64) []float64 {
	if product == nil || len(product.Materials) == 0 {
		return []float64{}
	}

	values := make([]float64, len(product.Materials))
	
	// Cari material dengan index 1 sebagai referensi (input sisa minor)
	var d4 float64 = 1.0
	for _, m := range product.Materials {
		if m.MaterialIndex == 1 {
			d4 = m.QtyPerSachet
			break
		}
	}

	for i, m := range product.Materials {
		if m.MaterialIndex == 1 {
			// Material index 1 = input sisa minor
			values[i] = inputSisaMinor
		} else if m.MaterialIndex == 0 {
			// Material index 0 = (D5 / D4) * qty_per_sachet
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else if m.MaterialIndex == 2 {
			// Material index 2 = (D5 / D4) * qty_per_sachet
			values[i] = (inputSisaMinor / d4) * m.QtyPerSachet
		} else {
			// Material lain - cari material index 2 sebagai referensi
			var e4 float64 = 1.0
			var qtyIndex2 float64 = 0
			for _, mm := range product.Materials {
				if mm.MaterialIndex == 2 {
					e4 = mm.QtyPerSachet
					qtyIndex2 = mm.QtyPerSachet
					break
				}
			}
			// e5 = (D5 / D4) * qty_per_sachet material index 2
			e5 := (inputSisaMinor / d4) * qtyIndex2
			values[i] = (e5 / e4) * m.QtyPerSachet
		}
	}

	return values
}

// GET /api/batch-khusus/products
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

// GET /api/batch-khusus/products/:kode
func (h *BatchKhususHandler) GetProduct(c *gin.Context) {
	kode := c.Param("kode")
	
	product, err := h.db.GetBKProductFullByKode(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk tidak ditemukan"})
		return
	}
	
	// // ✅ Ambil role dari context
	// role, _ := c.Get("role")
	// roleStr, _ := role.(string)
	
	// // ✅ Jika user (bukan admin), hapus qty_per_sachet dari response
	// if roleStr != "admin" {
	// 	for i := range product.Materials {
	// 		product.Materials[i].QtyPerSachet = 0
	// 	}
	// }
	
	c.JSON(http.StatusOK, product)
}

// GET /api/batch-khusus/reports/product/:kode
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

// GET /api/batch-khusus/reports/latest/:kode
func (h *BatchKhususHandler) GetLatestReport(c *gin.Context) {
	kode := c.Param("kode")
	report, err := h.db.GetLatestBKReportByProduct(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Belum ada laporan untuk produk ini"})
		return
	}
	c.JSON(http.StatusOK, report)
}

// POST /api/batch-khusus/reports
func (h *BatchKhususHandler) CreateReport(c *gin.Context) {
	var req models.CreateBKReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap: " + err.Error()})
		return
	}

	// 1. Validasi tanggal
	tgl, err := time.Parse("2006-01-02", req.TglPembuatan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format tanggal tidak valid (YYYY-MM-DD)"})
		return
	}

	// 2. Ambil data produk dari database
	product, err := h.db.GetBKProductFullByKode(c, req.KodeProduk)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk dengan kode " + req.KodeProduk + " tidak ditemukan"})
		return
	}

	// 3. Hitung semua material values
	materialValues := computeBKMaterialValues(product, req.InputSisaMinor)
	
	// 4. Hitung total
	var total float64
	for _, v := range materialValues {
		total += v
	}

	// 5. Buat detail JSON untuk disimpan
	detailData := map[string]interface{}{
		"materials":        product.Materials,
		"values":           materialValues,
		"total":            total,
		"input_sisa_minor": req.InputSisaMinor,
		"bobot_total":      req.BobotTotal,
	}
	detailJSON, _ := json.Marshal(detailData)

	// 6. Ambil user ID dari context
	userID, _ := c.Get("user_id")

	// 7. Buat report dengan detail JSON
	report := &models.BKReport{
		KodeProduk:     req.KodeProduk,
		NoBatch:        req.NoBatch,
		TglPembuatan:   tgl,
		BobotTotal:     req.BobotTotal,
		InputSisaMinor: req.InputSisaMinor,
		DetailJSON:     string(detailJSON),
		CreatedBy:      userID.(int),
	}

	// 8. Simpan ke database
	created, err := h.db.CreateBKReport(c, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan laporan: " + err.Error()})
		return
	}

	// 9. Catat audit log
	audit.Log(c, h.db, audit.Entry{
		Menu:        "Batch Khusus",
		Activity:    "Membuat Perhitungan Batch Khusus",
		Description: "Membuat perhitungan Batch Khusus untuk produk " + req.KodeProduk + ", No. Batch " + req.NoBatch,
	})

	c.JSON(http.StatusCreated, created)
}

// GET /api/batch-khusus/reports
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

// DELETE /api/batch-khusus/reports/:id — admin only
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