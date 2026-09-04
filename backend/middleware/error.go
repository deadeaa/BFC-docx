// backend/middleware/error.go
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Terjadi kesalahan pada server",
					"error":   err,
				})
			}
		}()
		c.Next()
	}
}