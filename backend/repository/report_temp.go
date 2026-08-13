// backend/repository/report_template_repo.go
package repository

import (
	"context"
	"bfc-backend/models"
)

// SaveReportTemplate - Simpan template baru
func (db *DB) SaveReportTemplate(ctx context.Context, template *models.ReportTemplate) error {
	query := `
		INSERT INTO report_templates (kode_produk, nama_file, file_path, created_by)
		VALUES ($1, $2, $3, $4)
	`
	_, err := db.pool.Exec(ctx, query, 
		template.KodeProduk, template.NamaFile, template.FilePath, template.CreatedBy)
	return err
}

// UpdateReportTemplate - Update template
func (db *DB) UpdateReportTemplate(ctx context.Context, template *models.ReportTemplate) error {
	query := `
		UPDATE report_templates 
		SET kode_produk = $1, nama_file = $2, file_path = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := db.pool.Exec(ctx, query,
		template.KodeProduk, template.NamaFile, template.FilePath, template.ID)
	return err
}

// GetReportTemplateByID - Ambil template berdasarkan ID
func (db *DB) GetReportTemplateByID(ctx context.Context, id int) (*models.ReportTemplate, error) {
	var t models.ReportTemplate
	query := `SELECT id, kode_produk, nama_file, file_path, created_by, created_at, updated_at 
	          FROM report_templates WHERE id = $1`
	err := db.pool.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.KodeProduk, &t.NamaFile, &t.FilePath, &t.CreatedBy, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetReportTemplate - Ambil template berdasarkan kode_produk
func (db *DB) GetReportTemplate(ctx context.Context, kodeProduk string) (*models.ReportTemplate, error) {
	var t models.ReportTemplate
	query := `SELECT id, kode_produk, nama_file, file_path, created_by, created_at, updated_at 
	          FROM report_templates WHERE kode_produk = $1`
	err := db.pool.QueryRow(ctx, query, kodeProduk).Scan(
		&t.ID, &t.KodeProduk, &t.NamaFile, &t.FilePath, &t.CreatedBy, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// ListReportTemplates - Ambil semua template
func (db *DB) ListReportTemplates(ctx context.Context) ([]models.ReportTemplate, error) {
	rows, err := db.pool.Query(ctx, `SELECT id, kode_produk, nama_file, file_path, created_by, created_at, updated_at 
	                                 FROM report_templates ORDER BY kode_produk`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var templates []models.ReportTemplate
	for rows.Next() {
		var t models.ReportTemplate
		err := rows.Scan(&t.ID, &t.KodeProduk, &t.NamaFile, &t.FilePath, &t.CreatedBy, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

// DeleteReportTemplate - Hapus template
func (db *DB) DeleteReportTemplate(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM report_templates WHERE id = $1`, id)
	return err
}