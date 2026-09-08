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
		
		if roleStr != "admin" && roleStr != "ts" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
			return
		}
		
		c.Next()
	}
}

func IdleCheck(lastActivity time.Time) bool {
	return time.Since(lastActivity) > 24*time.Hour
}