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

// Auth validates the JWT access token and checks idle timeout by comparing
// against the session's last_activity (passed via X-Session-ID header or stored separately).
// For simplicity, idle check is enforced only at the refresh endpoint.
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

// IdleCheck returns true if idle time has exceeded 24h
func IdleCheck(lastActivity time.Time) bool {
	return time.Since(lastActivity) > 24*time.Hour
}
