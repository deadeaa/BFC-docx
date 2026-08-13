package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"bfc-backend/audit"
	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	db *repository.DB
}

func NewUserHandler(db *repository.DB) *UserHandler {
	return &UserHandler{db: db}
}

// GET /api/users
func (h *UserHandler) List(c *gin.Context) {
	users, err := h.db.ListUsers(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data user"})
		return
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}

// POST /api/users
func (h *UserHandler) Create(c *gin.Context) {
	var req struct {
		Username string      `json:"username" binding:"required"`
		FullName string      `json:"full_name" binding:"required"`
		Password string      `json:"password" binding:"required,min=6"`
		Role     models.Role `json:"role" binding:"required"`
		IsActive *bool       `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap atau tidak valid"})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses password"})
		return
	}

	user, err := h.db.CreateUser(c, &models.User{
		Username: req.Username,
		FullName: req.FullName,
		Password: string(hashed),
		Role:     req.Role,
		IsActive: isActive,
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username sudah digunakan"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Menambah User",
		Description: "Menambahkan user baru '" + user.Username + "' dengan role " + string(user.Role),
	})

	c.JSON(http.StatusCreated, user)
}

// PUT /api/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	var req struct {
		Username string      `json:"username"`
		FullName string      `json:"full_name"`
		Password string      `json:"password"`
		Role     models.Role `json:"role"`
		IsActive *bool       `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid"})
		return
	}

	fields := map[string]interface{}{}
	if req.Username != "" {
		fields["username"] = req.Username
	}
	if req.FullName != "" {
		fields["full_name"] = req.FullName
	}
	if req.Role != "" {
		fields["role"] = req.Role
	}
	if req.IsActive != nil {
		fields["is_active"] = *req.IsActive
	}
	if req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses password"})
			return
		}
		fields["password"] = string(hashed)
	}

	user, err := h.db.UpdateUser(c, id, fields)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui user"})
		return
	}

	// Aktivitas & deskripsi disesuaikan agar sesuai kategori pada Log Aktivitas:
	// "Mengubah Role User", "Reset Password User", atau "Mengubah User" (umum).
	changed := []string{}
	if req.FullName != "" || req.Username != "" {
		changed = append(changed, "data user")
	}
	if req.Password != "" {
		changed = append(changed, "password (reset)")
	}
	if req.Role != "" {
		changed = append(changed, "role menjadi "+string(req.Role))
	}
	if req.IsActive != nil {
		changed = append(changed, "status aktif")
	}

	activityName := "Mengubah User"
	switch {
	case req.Password != "" && req.Role == "" && req.FullName == "" && req.Username == "" && req.IsActive == nil:
		activityName = "Reset Password User"
	case req.Role != "" && req.Password == "" && req.FullName == "" && req.Username == "" && req.IsActive == nil:
		activityName = "Mengubah Role User"
	}

	description := "Memperbarui user '" + user.Username + "'"
	if len(changed) > 0 {
		description += ": " + strings.Join(changed, ", ")
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    activityName,
		Description: description,
	})

	c.JSON(http.StatusOK, user)
}

// DELETE /api/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	// Prevent self-delete
	currentUserID, _ := c.Get(middleware.CtxUserID)
	if currentUserID.(int) == id {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tidak bisa menghapus akun sendiri"})
		return
	}

	if err := h.db.DeleteUser(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus user"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Menghapus User",
		Description: "Menghapus user ID " + strconv.Itoa(id),
	})

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}
