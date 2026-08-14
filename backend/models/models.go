// backend/models/models.go
package models

import (
	"encoding/json"
	"time"
)

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleProduksi Role = "produksi"
	RoleQA       Role = "qa"
)

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	FullName  string    `json:"full_name"`
	Password  string    `json:"-"` // hashed, never serialized
	Role      Role      `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Session struct {
	ID           string    `json:"id"`
	UserID       int       `json:"user_id"`
	RefreshToken string    `json:"-"`
	LastActivity time.Time `json:"last_activity"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type ActivityLog struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	UserName    string    `json:"user_name"`
	Role        string    `json:"role"`
	Menu        string    `json:"menu"`
	Activity    string    `json:"activity"`
	Description string    `json:"description"`
	Method      string    `json:"method"`
	Endpoint    string    `json:"endpoint"`
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ActivityLogListResponse struct {
	Data     []ActivityLog `json:"data"`
	Total    int           `json:"total"`
	Page     int           `json:"page"`
	PageSize int           `json:"page_size"`
}

// ── Batch Khusus Models ──────────────────────────────────────

type BKMaterial struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	MaterialIndex int     `json:"material_index"`
	KodeMaterial  string  `json:"kode_material"`
	QtyPerSachet  float64 `json:"qty_per_sachet"`
	Teoritis      float64 `json:"teoritis"`
	RangeMin      float64 `json:"range_min"`
	RangeMax      float64 `json:"range_max"`
}

type BKRendemen struct {
	ID        int     `json:"id"`
	ProductID int     `json:"product_id"`
	SortOrder int     `json:"sort_order"`
	Persen    float64 `json:"persen"`
}

type BKProduct struct {
	ID         int          `json:"id"`
	KodeProduk string       `json:"kode_produk"`
	NamaProduk string       `json:"nama_produk"`
	Materials  []BKMaterial `json:"materials"`
	Rendemen   []BKRendemen `json:"rendemen"`
	CreatedAt  time.Time    `json:"created_at,omitempty"`
	UpdatedAt  time.Time    `json:"updated_at,omitempty"`
}

type BKReport struct {
	ID             int       `json:"id"`
	KodeProduk     string    `json:"kode_produk"`
	NamaProduk     string    `json:"nama_produk,omitempty"`
	NoBatch        string    `json:"no_batch"`
	TglPembuatan   time.Time `json:"tgl_pembuatan"`
	BobotTotal     float64   `json:"bobot_total"`
	InputSisaMinor float64   `json:"input_sisa_minor"`
	DetailJSON     string    `json:"detail_json,omitempty"` 
	CreatedBy      int       `json:"created_by"`
	CreatedByName  string    `json:"created_by_name,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type BKReportListResponse struct {
	Data     []BKReport `json:"data"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

type CreateBKReportRequest struct {
	KodeProduk     string  `json:"kode_produk" binding:"required"`
	NoBatch        string  `json:"no_batch" binding:"required"`
	TglPembuatan   string  `json:"tgl_pembuatan" binding:"required"`
	BobotTotal     float64 `json:"bobot_total" binding:"required"`
	InputSisaMinor float64 `json:"input_sisa_minor" binding:"required"`
}

// ── Batch Overfilled Models ──────────────────────────────────

type BOMaterial struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	MaterialIndex int     `json:"material_index"`
	KodeMaterial  string  `json:"kode_material"`
	Label         string  `json:"label"`
	TargetKg      float64 `json:"target_kg"`
}

type BOThreshold struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	CriteriaIndex int     `json:"criteria_index"`
	TargetIndex   int     `json:"target_index"`
	MinRatio      float64 `json:"min_ratio"`
	MaxRatio      float64 `json:"max_ratio"`
}

type BOProduct struct {
	ID         int           `json:"id"`
	KodeProduk string        `json:"kode_produk"`
	NamaProduk string        `json:"nama_produk"`
	Materials  []BOMaterial  `json:"materials"`
	Thresholds []BOThreshold `json:"thresholds"`
	CreatedAt  time.Time     `json:"created_at,omitempty"` // ✅ Tambahkan
	UpdatedAt  time.Time     `json:"updated_at,omitempty"` // ✅ Tambahkan
}


type BOReport struct {
	ID            int       `json:"id"`
	KodeProduk    string    `json:"kode_produk"`
	NamaProduk    string    `json:"nama_produk,omitempty"`
	NoBatch       string    `json:"no_batch"`
	TglPembuatan  time.Time `json:"tgl_pembuatan"`
	BobotTotal    float64   `json:"bobot_total"`
	Kesimpulan    string    `json:"kesimpulan"`
	DetailJSON    string    `json:"detail_json"`
	CreatedBy     int       `json:"created_by"`
	CreatedByName string    `json:"created_by_name,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type BOReportListResponse struct {
	Data     []BOReport `json:"data"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

type CreateBOReportRequest struct {
	KodeProduk   string          `json:"kode_produk" binding:"required"`
	NoBatch      string          `json:"no_batch" binding:"required"`
	TglPembuatan string          `json:"tgl_pembuatan" binding:"required"`
	BobotTotal   float64         `json:"bobot_total" binding:"required"`
	Kesimpulan   string          `json:"kesimpulan" binding:"required"`
	Detail       json.RawMessage `json:"detail" binding:"required"`
}

// ──────────────────────────────────────────────────────────────
// ── ADMIN CONFIG MODELS ──────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// AdminBKProductConfig untuk konfigurasi produk Batch Khusus
type AdminBKProductConfig struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	MaterialIndex int     `json:"material_index"`
	KodeMaterial  string  `json:"kode_material"`
	QtyPerSachet  float64 `json:"qty_per_sachet"`
	Teoritis      float64 `json:"teoritis"`
	RangeMin      float64 `json:"range_min"`
	RangeMax      float64 `json:"range_max"`
}

type AdminBKRendemenConfig struct {
	ID        int     `json:"id"`
	ProductID int     `json:"product_id"`
	SortOrder int     `json:"sort_order"`
	Persen    float64 `json:"persen"`
}

type AdminBOProductConfig struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	MaterialIndex int     `json:"material_index"`
	KodeMaterial  string  `json:"kode_material"`
	Label         string  `json:"label"`
	TargetKg      float64 `json:"target_kg"`
}

type AdminBOThresholdConfig struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	CriteriaIndex int     `json:"criteria_index"`
	TargetIndex   int     `json:"target_index"`
	MinRatio      float64 `json:"min_ratio"`
	MaxRatio      float64 `json:"max_ratio"`
}

// AdminBKProductRequest untuk create/update produk Batch Khusus
type AdminBKProductRequest struct {
	KodeProduk string                 `json:"kode_produk" binding:"required"`
	NamaProduk string                 `json:"nama_produk" binding:"required"`
	Materials  []AdminBKProductConfig `json:"materials"`
	Rendemen   []AdminBKRendemenConfig `json:"rendemen"`
}

type AdminBOProductRequest struct {
	KodeProduk string                   `json:"kode_produk" binding:"required"`
	NamaProduk string                   `json:"nama_produk" binding:"required"`
	Materials  []AdminBOProductConfig   `json:"materials"`
	Thresholds []AdminBOThresholdConfig `json:"thresholds"`
}

type AdminBKProductResponse struct {
	ID         int                    `json:"id"`
	KodeProduk string                 `json:"kode_produk"`
	NamaProduk string                 `json:"nama_produk"`
	Materials  []AdminBKProductConfig `json:"materials"`
	Rendemen   []AdminBKRendemenConfig `json:"rendemen"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

type AdminBOProductResponse struct {
	ID         int                     `json:"id"`
	KodeProduk string                  `json:"kode_produk"`
	NamaProduk string                  `json:"nama_produk"`
	Materials  []AdminBOProductConfig  `json:"materials"`
	Thresholds []AdminBOThresholdConfig `json:"thresholds"`
	CreatedAt  time.Time               `json:"created_at"`
	UpdatedAt  time.Time               `json:"updated_at"`
}

type BOProductRequest struct {
	KodeProduk string          `json:"kode_produk" binding:"required"`
	NamaProduk string          `json:"nama_produk" binding:"required"`
	Materials  []BOMaterial    `json:"materials"`
	Thresholds []BOThreshold   `json:"thresholds"`
}

type BKProductRequest struct {
	KodeProduk string        `json:"kode_produk" binding:"required"`
	NamaProduk string        `json:"nama_produk" binding:"required"`
	Materials  []BKMaterial  `json:"materials"`
	Rendemen   []BKRendemen  `json:"rendemen"`
}
