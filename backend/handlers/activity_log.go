package handlers

import (
	"net/http"
	"strconv"

	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type ActivityLogHandler struct {
	db *repository.DB
}

func NewActivityLogHandler(db *repository.DB) *ActivityLogHandler {
	return &ActivityLogHandler{db: db}
}

// GET /api/logs
// Query params (semua opsional):
//
//	search     - pencarian bebas (nama user, menu, aktivitas, deskripsi)
//	user_name  - filter nama/username (partial match)
//	role       - filter role (admin/produksi/qa)
//	activity   - filter aktivitas (partial match)
//	date_from  - filter tanggal mulai (YYYY-MM-DD)
//	date_to    - filter tanggal akhir (YYYY-MM-DD)
//	page       - halaman (default 1)
//	page_size  - jumlah baris per halaman (default 20, maks 200)
func (h *ActivityLogHandler) List(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if err != nil || pageSize < 1 {
		pageSize = 20
	}

	filter := repository.ActivityLogFilter{
		Search:   c.Query("search"),
		UserName: c.Query("user_name"),
		Role:     c.Query("role"),
		Activity: c.Query("activity"),
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		Page:     page,
		PageSize: pageSize,
	}

	logs, total, err := h.db.ListActivityLogs(c, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil log aktivitas"})
		return
	}
	if logs == nil {
		logs = []models.ActivityLog{}
	}

	c.JSON(http.StatusOK, models.ActivityLogListResponse{
		Data:     logs,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// GET /api/logs/:id — detail satu log, read-only.
func (h *ActivityLogHandler) Detail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	entry, err := h.db.GetActivityLogByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Log tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, entry)
}
