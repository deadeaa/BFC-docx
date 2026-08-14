// backend/models/report.go
package models

import "time"

// ReportDetail - struktur untuk detail perhitungan yang disimpan di JSON
type ReportDetail struct {
	Materials []struct {
		KodeMaterial    string  `json:"kode_material"`
		Label           string  `json:"label"`
		TargetKg        float64 `json:"target_kg"`
		HasilBatching   float64 `json:"hasil_batching"`
		Perbandingan    float64 `json:"perbandingan"`
		Ratio           float64 `json:"ratio"`
		TargetBaru      float64 `json:"target_baru"`
		TambahanReproses float64 `json:"tambahan_reproses"`
	} `json:"materials"`
	BobotTotal     float64 `json:"bobot_total"`
	NilaiTertinggi float64 `json:"nilai_tertinggi"`
	Kriteria       []struct {
		MaterialIndex int    `json:"materialIndex"`
		Label         string `json:"label"`
		Status        string `json:"status"`
		PivotValue    float64 `json:"pivotValue"`
		Checks        []struct {
			TargetIndex  int     `json:"targetIndex"`
			MinRatio     float64 `json:"minRatio"`
			MaxRatio     float64 `json:"maxRatio"`
			ActualRatio  float64 `json:"actualRatio"`
			Passed       bool    `json:"passed"`
		} `json:"checks"`
	} `json:"kriteria"`
	Kesimpulan string `json:"kesimpulan"`
}

// ReportTemplate - untuk template DOCX
type ReportTemplate struct {
	ID          int       `json:"id" db:"id"`
	KodeProduk  string    `json:"kode_produk" db:"kode_produk"`
	NamaFile    string    `json:"nama_file" db:"nama_file"`
	FilePath    string    `json:"file_path" db:"file_path"`
	CreatedBy   int       `json:"created_by" db:"created_by"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}