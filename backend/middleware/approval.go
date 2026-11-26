package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireTSStaffOrAdmin() gin.HandlerFunc {
	return RequireTSStaffOrAdminWithMessage(
		"Hanya Staff Technical Services atau Administrator yang dapat mengajukan approval",
	)
}

func RequireTSStaffOrAdminWithMessage(msg string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if isAdminOrTSStaff(c) {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"message": msg,
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

func RequireAdminTSStaffOrProduksi() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		roleStr, _ := role.(string)
		jabatan, _ := c.Get(CtxJabatan)
		jabatanStr, _ := jabatan.(string)

		if roleStr == "admin" || roleStr == "produksi" {
			c.Next()
			return
		}
		if roleStr == "ts" && jabatanStr == "staff" {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"message": "Hanya Administrator, Staff TS, atau Produksi yang dapat melakukan perhitungan Batch Overfilled",
		})
	}
}

func GuardDownloadReports() gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.Contains(c.Request.URL.Path, "/reports/download") {
			if !isAdminOrTSStaff(c) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"message": "Hanya Staff Technical Services atau Administrator yang dapat mengunduh laporan",
				})
				return
			}
		}
		c.Next()
	}
}

func GuardReportTemplates() gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.Contains(c.Request.URL.Path, "/admin/report-templates") {
			if !isAdminOrTSStaff(c) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"message": "Hanya Staff Technical Services atau Administrator yang dapat mengelola template laporan",
				})
				return
			}
		}
		c.Next()
	}
}

func isAdminOrTSStaff(c *gin.Context) bool {
	role, _ := c.Get(CtxRole)
	roleStr, _ := role.(string)
	jabatan, _ := c.Get(CtxJabatan)
	jabatanStr, _ := jabatan.(string)

	if roleStr == "admin" {
		return true
	}
	if roleStr == "ts" && jabatanStr == "staff" {
		return true
	}
	return false
}