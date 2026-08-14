package handlers

import (
	"net/http"
	"strconv"
	"time"

	"bfc-backend/audit"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type BatchOverfilledHandler struct {
	db *repository.DB
}

func NewBatchOverfilledHandler(db *repository.DB) *BatchOverfilledHandler {
	return &BatchOverfilledHandler{db: db}
}

// GET /api/batch-overfilled/products
func (h *BatchOverfilledHandler) ListProducts(c *gin.Context) {
	products, err := h.db.ListBOProducts(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data produk"})
		return
	}
	if products == nil {
		products = []models.BOProduct{}
	}
	c.JSON(http.StatusOK, products)
}

// GET /api/batch-overfilled/products/:kode
func (h *BatchOverfilledHandler) GetProduct(c *gin.Context) {
	kode := c.Param("kode")
	product, err := h.db.GetBOProduct(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// GET /api/batch-overfilled/reports/latest/:kode
func (h *BatchOverfilledHandler) GetLatestReport(c *gin.Context) {
	kode := c.Param("kode")
	
	report, err := h.db.GetLatestBOReportByProduct(c, kode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Belum ada laporan untuk produk ini"})
		return
	}
	
	c.JSON(http.StatusOK, report)
}

// backend/handlers/batch_overfilled.go

// GET /api/batch-overfilled/reports/product/:kode
// Query params:
//   - no_batch: filter by batch number (optional, case insensitive)
//   - limit: max number of records (default 50)
func (h *BatchOverfilledHandler) GetProductReports(c *gin.Context) {
	kode := c.Param("kode")
	noBatch := c.Query("no_batch")
	limit := c.DefaultQuery("limit", "50")
	
	// Parse limit
	limitInt := 50
	if l, err := strconv.Atoi(limit); err == nil && l > 0 {
		limitInt = l
	}
	
	reports, err := h.db.ListBOReportsByProduct(c, kode, noBatch, limitInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil riwayat"})
		return
	}
	if reports == nil {
		reports = []models.BOReport{}
	}
	c.JSON(http.StatusOK, reports)
}

// POST /api/batch-overfilled/reports
func (h *BatchOverfilledHandler) CreateReport(c *gin.Context) {
	var req models.CreateBOReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Data tidak lengkap: " + err.Error(),
		})
		return
	}

	if req.KodeProduk == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Kode produk wajib diisi"})
		return
	}
	if req.NoBatch == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "No. Batch wajib diisi"})
		return
	}
	if req.TglPembuatan == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tanggal pembuatan wajib diisi"})
		return
	}
	if req.BobotTotal <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bobot total harus lebih dari 0"})
		return
	}
	if len(req.Detail) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Detail perhitungan wajib diisi"})
		return
	}

	tgl, err := time.Parse("2006-01-02", req.TglPembuatan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format tanggal tidak valid (YYYY-MM-DD)"})
		return
	}

	userID, _ := c.Get("user_id")
	report := &models.BOReport{
		KodeProduk:   req.KodeProduk,
		NoBatch:      req.NoBatch,
		TglPembuatan: tgl,
		BobotTotal:   req.BobotTotal,
		Kesimpulan:   req.Kesimpulan,
		DetailJSON:   string(req.Detail),
		CreatedBy:    userID.(int),
	}

	created, err := h.db.CreateBOReport(c, report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan laporan: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:     "Batch Overfilled",
		Activity: "Membuat Perhitungan Batch Overfilled",
		Description: "Membuat perhitungan Batch Overfilled untuk produk " + req.KodeProduk +
			", No. Batch " + req.NoBatch + ", Kesimpulan " + req.Kesimpulan,
	})

	c.JSON(http.StatusCreated, created)
}

// GET /api/batch-overfilled/reports
// Query params (semua opsional):
//
//	search     - pencarian bebas (kode produk, nama produk, no batch)
//	page       - halaman (default 1)
//	page_size  - jumlah baris per halaman (default 50, maks 200)
func (h *BatchOverfilledHandler) ListReports(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if err != nil || pageSize < 1 {
		pageSize = 50
	}
	search := c.Query("search")

	reports, total, err := h.db.ListBOReports(c, search, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan"})
		return
	}
	if reports == nil {
		reports = []models.BOReport{}
	}
	c.JSON(http.StatusOK, models.BOReportListResponse{
		Data:     reports,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// DELETE /api/batch-overfilled/reports/:id — admin only
func (h *BatchOverfilledHandler) DeleteReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	rep, err := h.db.GetBOReportByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report tidak ditemukan"})
		return
	}

	if err := h.db.DeleteBOReport(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus report"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Report Batch Overfilled",
		Activity:    "Menghapus Report Batch Overfilled",
		Description: "Menghapus Report Batch Overfilled untuk produk " + rep.KodeProduk + ", No. Batch " + rep.NoBatch,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Report berhasil dihapus"})
}