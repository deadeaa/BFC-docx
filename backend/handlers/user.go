package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"bfc-backend/audit"
	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"
	"bfc-backend/auth"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	db *repository.DB
}

func NewUserHandler(db *repository.DB) *UserHandler {
	return &UserHandler{db: db}
}

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

func (h *UserHandler) Create(c *gin.Context) {
	var req struct {
		Username string      `json:"username" binding:"required"`
		FullName string      `json:"full_name" binding:"required"`
		Password string      `json:"password" binding:"required"`
		Role     models.Role `json:"role" binding:"required"`
		Jabatan  string      `json:"jabatan"`
		IsActive *bool       `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap atau tidak valid"})
		return
	}

	if ok, msg := auth.ValidatePassword(req.Password); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}

	if req.Role == models.RoleTS {
		if req.Jabatan != "staff" && req.Jabatan != "spv" && req.Jabatan != "mgr" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Jabatan Technical Services wajib dipilih"})
			return
		}
	} else {
		req.Jabatan = ""
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
		Username:       req.Username,
		FullName:       req.FullName,
		Password:       string(hashed),
		Role:           req.Role,
		Jabatan:        req.Jabatan,
		IsActive:       isActive,
		ApprovalStatus: "approved", 
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

func (h *UserHandler) Approve(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	user, err := h.db.GetUserByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	if err := h.db.SetUserApprovalStatus(c, id, "approved"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal approve user"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Approve User Baru",
		Description: "Menyetujui user '" + user.Username + "' (role " + string(user.Role) + ")",
	})

	updated, _ := h.db.GetUserByID(c, id)
	c.JSON(http.StatusOK, updated)
}

func (h *UserHandler) Reject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	user, err := h.db.GetUserByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	if err := h.db.SetUserApprovalStatus(c, id, "rejected"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal reject user"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Reject User Baru",
		Description: "Menolak user '" + user.Username + "' (role " + string(user.Role) + ")",
	})

	updated, _ := h.db.GetUserByID(c, id)
	c.JSON(http.StatusOK, updated)
}

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
		Jabatan  *string     `json:"jabatan"`
		IsActive *bool       `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid"})
		return
	}

	
	oldUser, _ := h.db.GetUserByID(c, id)

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
	if req.Jabatan != nil {
		if *req.Jabatan == "" {
			fields["jabatan"] = nil
		} else {
			fields["jabatan"] = *req.Jabatan
		}
	}
	if req.IsActive != nil {
		fields["is_active"] = *req.IsActive
	}

	if req.Password != "" {
		if ok, msg := auth.ValidatePassword(req.Password); !ok {
			c.JSON(http.StatusBadRequest, gin.H{"message": msg})
			return
		}
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

	
	if req.FullName != "" {
		if err := h.db.SyncUserNameToReports(c, id, req.FullName); err != nil {
			log.Printf("[user.Update] sync nama ke bk_reports gagal (user_id=%d): %v", id, err)
		}
		if err := h.db.SyncUserNameToLogs(c, id, req.FullName); err != nil {
			log.Printf("[user.Update] sync nama ke activity_logs gagal (user_id=%d): %v", id, err)
		}
	}

	
	if oldUser != nil && req.Username != "" && req.Username != oldUser.Username {
		_ = h.db.DeleteUserSessions(c, id)
	}

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

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

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

func (h *UserHandler) ListPasswordResets(c *gin.Context) {
	list, err := h.db.ListPendingPasswordResets(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat permintaan"})
		return
	}
	if list == nil {
		list = []repository.PasswordResetRequest{}
	}
	c.JSON(http.StatusOK, list)
}

func (h *UserHandler) ApprovePasswordReset(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)
	user, _ := h.db.GetUserByID(c, uid)

	if err := h.db.ApprovePasswordReset(c, id, uid, user.FullName); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Gagal approve: " + err.Error()})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Approve Ganti Password",
		Description: "Menyetujui permintaan ganti password #" + strconv.Itoa(id),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Password user berhasil diubah"})
}

func (h *UserHandler) RejectPasswordReset(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		RejectNote string `json:"reject_note"`
	}
	_ = c.ShouldBindJSON(&req)

	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)
	user, _ := h.db.GetUserByID(c, uid)

	if err := h.db.RejectPasswordReset(c, id, uid, user.FullName, req.RejectNote); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Gagal reject"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Reject Ganti Password",
		Description: "Menolak permintaan ganti password #" + strconv.Itoa(id),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Permintaan ditolak"})
}