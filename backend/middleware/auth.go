// backend/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"
	"time"

	"bfc-backend/auth"

	"github.com/gin-gonic/gin"
)

const CtxUserID = "user_id"
const CtxUsername = "username"
const CtxRole = "role"

// Auth validates the JWT access token
func Auth(jwtSvc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Authorization header missing"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtSvc.ValidateAccessToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid atau kadaluarsa"})
			return
		}
		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxUsername, claims.Username)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}

// RequireRole checks that the authenticated user has one of the given roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		roleStr, _ := role.(string)
		for _, r := range roles {
			if r == roleStr {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
	}
}

// AdminOrTSOnly middleware untuk membatasi akses hanya untuk Admin dan TS
func AdminOrTSOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(CtxRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
			return
		}
		
		roleStr, ok := role.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
			return
		}
		
		// Admin atau TS yang memiliki akses penuh
		if roleStr != "admin" && roleStr != "ts" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
			return
		}
		
		c.Next()
	}
}

// IdleCheck returns true if idle time has exceeded 24h
func IdleCheck(lastActivity time.Time) bool {
	return time.Since(lastActivity) > 24*time.Hour
}