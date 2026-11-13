package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireTSStaffOrAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		roleStr, _ := role.(string)
		jabatan, _ := c.Get(CtxJabatan)
		jabatanStr, _ := jabatan.(string)

		if roleStr == "admin" {
			c.Next()
			return
		}
		if roleStr == "ts" && jabatanStr == "staff" {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"message": "Hanya Staff Technical Services atau Administrator yang dapat mengajukan approval",
		})
	}
}


func RequireApprover() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		roleStr, _ := role.(string)
		jabatan, _ := c.Get(CtxJabatan)
		jabatanStr, _ := jabatan.(string)

		if roleStr == "admin" || jabatanStr == "spv" || jabatanStr == "mgr" {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"message": "Hanya Supervisor, Manager, atau Administrator yang dapat melakukan approval",
		})
	}
}
