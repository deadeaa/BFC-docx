package handlers

import (
	"net/http"
	"strconv"

	"bfc-backend/audit"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	db *repository.DB
}

func NewAdminHandler(db *repository.DB) *AdminHandler {
	return &AdminHandler{db: db}
}


func (h *AdminHandler) ListBKProducts(c *gin.Context) {
	products, err := h.db.ListBKProductsFull(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data produk: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *AdminHandler) GetBKProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	product, err := h.db.GetBKProductByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func (h *AdminHandler) CreateBKProduct(c *gin.Context) {
	var req models.BKProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	product, err := h.db.CreateBKProduct(c, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat produk: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Khusus",
		Activity:    "Tambah Produk Batch Khusus",
		Description: "Tambah produk Batch Khusus: " + req.KodeProduk,
	})

	c.JSON(http.StatusCreated, product)
}

func (h *AdminHandler) UpdateBKProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	var req models.BKProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	product, err := h.db.UpdateBKProduct(c, id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal update produk: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Khusus",
		Activity:    "Update Produk Batch Khusus",
		Description: "Update produk Batch Khusus: " + req.KodeProduk,
	})

	c.JSON(http.StatusOK, product)
}

func (h *AdminHandler) DeleteBKProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	if err := h.db.DeleteBKProduct(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus produk"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Khusus",
		Activity:    "Hapus Produk Batch Khusus",
		Description: "Menghapus produk Batch Khusus dengan ID: " + strconv.Itoa(id),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Produk berhasil dihapus"})
}

func (h *AdminHandler) ListBOProducts(c *gin.Context) {
	products, err := h.db.ListBOProductsFull(c) 
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data produk: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *AdminHandler) GetBOProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	product, err := h.db.GetBOProductByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produk tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func (h *AdminHandler) CreateBOProduct(c *gin.Context) {
	var req models.BOProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	product, err := h.db.CreateBOProduct(c, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat produk: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Overfilled",
		Activity:    "Tambah Produk Batch Overfilled",
		Description: "Tambah produk Batch Overfilled: " + req.KodeProduk,
	})

	c.JSON(http.StatusCreated, product)
}

func (h *AdminHandler) UpdateBOProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	var req models.BOProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid: " + err.Error()})
		return
	}

	product, err := h.db.UpdateBOProduct(c, id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal update produk: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Overfilled",
		Activity:    "Update Produk Batch Overfilled",
		Description: "Update produk Batch Overfilled: " + req.KodeProduk,
	})

	c.JSON(http.StatusOK, product)
}

func (h *AdminHandler) DeleteBOProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	if err := h.db.DeleteBOProduct(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus produk: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Batch Overfilled",
		Activity:    "Hapus Produk Batch Overfilled",
		Description: "Menghapus produk Batch Overfilled dengan ID: " + strconv.Itoa(id),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Produk berhasil dihapus"})
}