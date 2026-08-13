// backend/handlers/report_template_handler.go
package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"bfc-backend/audit"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

type ReportTemplateHandler struct {
	db *repository.DB
}

func NewReportTemplateHandler(db *repository.DB) *ReportTemplateHandler {
	return &ReportTemplateHandler{db: db}
}

// GET /api/admin/report-templates
func (h *ReportTemplateHandler) ListTemplates(c *gin.Context) {
	templates, err := h.db.ListReportTemplates(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data template"})
		return
	}
	c.JSON(http.StatusOK, templates)
}

// POST /api/admin/report-templates - Upload ATAU Update template (auto-detect)
func (h *ReportTemplateHandler) UploadTemplate(c *gin.Context) {
	kodeProduk := c.PostForm("kode_produk")
	if kodeProduk == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Kode produk wajib diisi"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "File template wajib diupload"})
		return
	}

	// Validasi ekstensi
	ext := filepath.Ext(file.Filename)
	if ext != ".docx" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "File harus berformat .docx"})
		return
	}

	// Buat direktori
	uploadDir := "./uploads/templates"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat direktori"})
		return
	}

	// Cek apakah template sudah ada
	existing, _ := h.db.GetReportTemplate(c, kodeProduk)

	// Nama file baru
	filename := kodeProduk + "_template.docx"
	filePath := filepath.Join(uploadDir, filename)
	absPath, _ := filepath.Abs(filePath)

	// Hapus file lama jika ada
	if existing != nil && existing.FilePath != "" {
		os.Remove(existing.FilePath)
	}

	// Simpan file baru
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan file: " + err.Error()})
		return
	}

	fmt.Printf("✅ Template saved to: %s\n", absPath)

	userID, _ := c.Get("user_id")

	if existing != nil {
		// ✅ UPDATE - tanpa delete
		existing.NamaFile = filename
		existing.FilePath = absPath
		if err := h.db.UpdateReportTemplate(c, existing); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal update template"})
			return
		}
		audit.Log(c, h.db, audit.Entry{
			Menu:        "Admin - Report Template",
			Activity:    "Update Template Report",
			Description: fmt.Sprintf("Update template report untuk produk %s", kodeProduk),
		})
		c.JSON(http.StatusOK, gin.H{"message": "Template berhasil diupdate"})
	} else {
		// ✅ CREATE
		template := &models.ReportTemplate{
			KodeProduk: kodeProduk,
			NamaFile:   filename,
			FilePath:   absPath,
			CreatedBy:  userID.(int),
		}
		if err := h.db.SaveReportTemplate(c, template); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan template"})
			return
		}
		audit.Log(c, h.db, audit.Entry{
			Menu:        "Admin - Report Template",
			Activity:    "Upload Template Report",
			Description: fmt.Sprintf("Upload template report untuk produk %s", kodeProduk),
		})
		c.JSON(http.StatusOK, gin.H{"message": "Template berhasil diupload"})
	}
}

// GET /api/admin/report-templates/:id
func (h *ReportTemplateHandler) GetTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	template, err := h.db.GetReportTemplateByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Template tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, template)
}

// DELETE /api/admin/report-templates/:id
func (h *ReportTemplateHandler) DeleteTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}

	template, err := h.db.GetReportTemplateByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Template tidak ditemukan"})
		return
	}

	// Hapus file fisik
	if err := os.Remove(template.FilePath); err != nil {
		fmt.Printf("⚠️ Warning: failed to delete file: %v\n", err)
	}

	if err := h.db.DeleteReportTemplate(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus template"})
		return
	}

	audit.Log(c, h.db, audit.Entry{
		Menu:        "Admin - Report Template",
		Activity:    "Delete Template Report",
		Description: fmt.Sprintf("Hapus template report untuk produk %s", template.KodeProduk),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Template berhasil dihapus"})
}