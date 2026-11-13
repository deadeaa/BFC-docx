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
