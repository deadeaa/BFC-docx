package handlers

import (
	"net/http"
	"time"

	"bfc-backend/audit"
	"bfc-backend/auth"
	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db     *repository.DB
	jwtSvc *auth.Service
}

func NewAuthHandler(db *repository.DB, jwtSvc *auth.Service) *AuthHandler {
	return &AuthHandler{db: db, jwtSvc: jwtSvc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Username dan password wajib diisi"})
		return
	}

	user, err := h.db.GetUserByUsername(c, req.Username)
	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	if user.ApprovalStatus == "pending" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akun Anda masih menunggu approval Administrator. Silakan hubungi admin."})
		return
	}
	if user.ApprovalStatus == "rejected" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akun Anda ditolak oleh Administrator. Hubungi admin untuk info lebih lanjut."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	accessToken, err := h.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role), user.Jabatan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat token"})
		return
	}
	refreshToken := auth.GenerateRefreshToken()

	session := &models.Session{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		LastActivity: time.Now(),
		ExpiresAt:    time.Now().Add(auth.RefreshTokenDuration),
	}
	if err := h.db.CreateSession(c, session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat sesi"})
		return
	}

	c.SetCookie("refresh_token", refreshToken, int(auth.RefreshTokenDuration.Seconds()), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"full_name":  user.FullName,
			"role":       user.Role,
			"jabatan":    user.Jabatan,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Refresh token tidak ditemukan"})
		return
	}

	session, err := h.db.GetSessionByRefreshToken(c, refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak valid"})
		return
	}

	if time.Now().After(session.ExpiresAt) {
		_ = h.db.DeleteSession(c, session.ID)
		c.SetCookie("refresh_token", "", -1, "/", "", false, true)
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi kadaluarsa, silakan login kembali"})
		return
	}

	if time.Since(session.LastActivity) > auth.IdleTimeout {
		_ = h.db.DeleteSession(c, session.ID)
		c.SetCookie("refresh_token", "", -1, "/", "", false, true)
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak aktif, silakan login kembali"})
		return
	}

	user, err := h.db.GetUserByID(c, session.UserID)
	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak ditemukan atau tidak aktif"})
		return
	}

	accessToken, err := h.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role), user.Jabatan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat token"})
		return
	}

	_ = h.db.UpdateSessionActivity(c, session.ID)

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	refreshToken, _ := c.Cookie("refresh_token")
	if refreshToken != "" {
		session, err := h.db.GetSessionByRefreshToken(c, refreshToken)
		if err == nil {
			_ = h.db.DeleteSession(c, session.ID)
		}
	}

	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		FullName        string      `json:"full_name" binding:"required"`
		Username        string      `json:"username" binding:"required"`
		Password        string      `json:"password" binding:"required"`
		ConfirmPassword string      `json:"confirm_password" binding:"required"`
		Role            models.Role `json:"role" binding:"required"`
		Jabatan         string      `json:"jabatan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap atau tidak valid"})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Konfirmasi password tidak sama dengan password"})
		return
	}

	if ok, msg := auth.ValidatePassword(req.Password); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}

	if !req.Role.IsSignupAllowed() && req.Role != models.RoleTS {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Role tidak valid untuk pendaftaran mandiri"})
		return
	}

	if req.Role == models.RoleTS {
		if req.Jabatan != "staff" && req.Jabatan != "spv" && req.Jabatan != "mgr" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Jabatan Technical Services wajib dipilih (Staff/SPV/MGR)"})
			return
		}
	} else {
		req.Jabatan = ""
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
		IsActive:       true,
		ApprovalStatus: "pending",
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username sudah digunakan"})
		return
	}

	c.Set(middleware.CtxUserID, user.ID)
	c.Set(middleware.CtxUsername, user.Username)
	c.Set(middleware.CtxRole, string(user.Role))
	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Registrasi User Baru",
		Description: "User baru '" + user.Username + "' mendaftar dengan role " + string(user.Role) + " — menunggu approval admin",
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registrasi berhasil. Akun menunggu approval Administrator sebelum bisa login.",
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Username        string `json:"username" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required"`
		ConfirmPassword string `json:"confirm_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap"})
		return
	}
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Konfirmasi password tidak sama"})
		return
	}
	if ok, msg := auth.ValidatePassword(req.NewPassword); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}

	user, err := h.db.GetUserByUsername(c, req.Username)
	if err != nil || !user.IsActive {
		c.JSON(http.StatusNotFound, gin.H{"message": "Username tidak ditemukan atau tidak aktif"})
		return
	}
	if user.ApprovalStatus != "approved" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akun belum/tidak disetujui Administrator"})
		return
	}

	
	if exists, _ := h.db.HasPendingPasswordReset(c, user.ID); exists {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Sudah ada permintaan ganti password yang menunggu approval admin"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses password"})
		return
	}

	if err := h.db.CreatePasswordResetRequest(c, user.ID, string(hashed)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan permintaan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Permintaan ganti password dikirim. Password baru aktif setelah di-approve Administrator.",
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.CtxUserID)
	uid, _ := userID.(int)
	user, err := h.db.GetUserByID(c, uid)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"full_name":  user.FullName,
		"role":       user.Role,
		"jabatan":    user.Jabatan,
		"is_active":  user.IsActive,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	})
}
