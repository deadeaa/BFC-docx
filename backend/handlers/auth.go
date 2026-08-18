// backend/handlers/auth.go
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

// POST /api/auth/login
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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	accessToken, err := h.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
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
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

// POST /api/auth/refresh-token
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

	accessToken, err := h.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat token"})
		return
	}

	_ = h.db.UpdateSessionActivity(c, session.ID)

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

// POST /api/auth/logout
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

// POST /api/auth/register
//
// Endpoint publik (tidak memerlukan JWT) untuk Sign Up mandiri. Role yang
// boleh dipilih HANYA "produksi", "qa", atau "ppic" — role "admin" dan "ts" 
// tidak boleh dibuat melalui endpoint ini.
func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		FullName        string      `json:"full_name" binding:"required"`
		Username        string      `json:"username" binding:"required"`
		Password        string      `json:"password" binding:"required,min=6"`
		ConfirmPassword string      `json:"confirm_password" binding:"required"`
		Role            models.Role `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak lengkap atau tidak valid"})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Konfirmasi password tidak sama dengan password"})
		return
	}

	// Hanya role Produksi, QA, & PPIC yang boleh dibuat melalui Sign Up.
	if !req.Role.IsSignupAllowed() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Role tidak valid untuk pendaftaran mandiri"})
		return
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
		IsActive: true,
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username sudah digunakan"})
		return
	}

	// Catat ke Log Aktivitas sebagai "Registrasi user baru"
	c.Set(middleware.CtxUserID, user.ID)
	c.Set(middleware.CtxUsername, user.Username)
	c.Set(middleware.CtxRole, string(user.Role))
	audit.Log(c, h.db, audit.Entry{
		Menu:        "User Management",
		Activity:    "Registrasi User Baru",
		Description: "User baru '" + user.Username + "' mendaftar mandiri dengan role " + string(user.Role),
	})

	c.JSON(http.StatusCreated, gin.H{"message": "Registrasi berhasil, silakan login"})
}

// GET /api/auth/me
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
		"is_active":  user.IsActive,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	})
}