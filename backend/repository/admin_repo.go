// backend/repository/admin_repository.go
package repository

import (
	"context"
	// "fmt"

	"bfc-backend/models"
)

// ──────────────── ADMIN BATCH KHUSUS ────────────────

// CreateBKProductWithConfig - Create product with materials and rendemen
func (db *DB) CreateBKProductWithConfig(ctx context.Context, req *models.AdminBKProductRequest) (*models.AdminBKProductResponse, error) {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Insert product
	var productID int
	err = tx.QueryRow(ctx,
		`INSERT INTO bk_products (kode_produk, nama_produk) VALUES ($1, $2) RETURNING id`,
		req.KodeProduk, req.NamaProduk,
	).Scan(&productID)
	if err != nil {
		return nil, err
	}

	// Insert materials
	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_materials (product_id, material_index, kode_material, qty_per_sachet, range_min, range_max)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			productID, m.MaterialIndex, m.KodeMaterial, m.QtyPerSachet, m.RangeMin, m.RangeMax,
		)
		if err != nil {
			return nil, err
		}
	}

	// Insert rendemen
	for _, r := range req.Rendemen {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_rendemen (product_id, sort_order, persen) VALUES ($1, $2, $3)`,
			productID, r.SortOrder, r.Persen,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return db.GetBKProductConfigByID(ctx, productID)
}

// UpdateBKProductWithConfig - Update product with materials and rendemen
func (db *DB) UpdateBKProductWithConfig(ctx context.Context, id int, req *models.AdminBKProductRequest) (*models.AdminBKProductResponse, error) {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Update product
	_, err = tx.Exec(ctx,
		`UPDATE bk_products SET kode_produk = $1, nama_produk = $2, updated_at = NOW() WHERE id = $3`,
		req.KodeProduk, req.NamaProduk, id,
	)
	if err != nil {
		return nil, err
	}

	// Delete existing materials and rendemen
	_, err = tx.Exec(ctx, `DELETE FROM bk_product_materials WHERE product_id = $1`, id)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM bk_product_rendemen WHERE product_id = $1`, id)
	if err != nil {
		return nil, err
	}

	// Insert new materials
	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_materials (product_id, material_index, kode_material, qty_per_sachet, range_min, range_max)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			id, m.MaterialIndex, m.KodeMaterial, m.QtyPerSachet, m.RangeMin, m.RangeMax,
		)
		if err != nil {
			return nil, err
		}
	}

	// Insert new rendemen
	for _, r := range req.Rendemen {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_rendemen (product_id, sort_order, persen) VALUES ($1, $2, $3)`,
			id, r.SortOrder, r.Persen,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return db.GetBKProductConfigByID(ctx, id)
}

// GetBKProductConfigByID - Get product with materials and rendemen
func (db *DB) GetBKProductConfigByID(ctx context.Context, id int) (*models.AdminBKProductResponse, error) {
	resp := &models.AdminBKProductResponse{}

	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk, created_at, updated_at FROM bk_products WHERE id = $1`,
		id,
	).Scan(&resp.ID, &resp.KodeProduk, &resp.NamaProduk, &resp.CreatedAt, &resp.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Get materials
	rows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max
		 FROM bk_product_materials WHERE product_id = $1 ORDER BY material_index`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m models.AdminBKProductConfig
		if err := rows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.QtyPerSachet, &m.RangeMin, &m.RangeMax); err != nil {
			return nil, err
		}
		resp.Materials = append(resp.Materials, m)
	}

	// Get rendemen
	rows2, err := db.pool.Query(ctx,
		`SELECT id, product_id, sort_order, persen FROM bk_product_rendemen WHERE product_id = $1 ORDER BY sort_order`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var r models.AdminBKRendemenConfig
		if err := rows2.Scan(&r.ID, &r.ProductID, &r.SortOrder, &r.Persen); err != nil {
			return nil, err
		}
		resp.Rendemen = append(resp.Rendemen, r)
	}

	return resp, nil
}

// ListBKProductsConfig - List all BK products with config
func (db *DB) ListBKProductsConfig(ctx context.Context) ([]models.AdminBKProductResponse, error) {
	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk, created_at, updated_at FROM bk_products ORDER BY kode_produk`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.AdminBKProductResponse{}
	for rows.Next() {
		var p models.AdminBKProductResponse
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

// DeleteBKProductWithConfig - Delete product and all related data
func (db *DB) DeleteBKProductWithConfig(ctx context.Context, id int) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM bk_products WHERE id = $1`, id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ──────────────── ADMIN BATCH OVERFILLED ────────────────

// CreateBOProductWithConfig - Create product with materials and thresholds
func (db *DB) CreateBOProductWithConfig(ctx context.Context, req *models.AdminBOProductRequest) (*models.AdminBOProductResponse, error) {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Insert product
	var productID int
	err = tx.QueryRow(ctx,
		`INSERT INTO bo_products (kode_produk, nama_produk) VALUES ($1, $2) RETURNING id`,
		req.KodeProduk, req.NamaProduk,
	).Scan(&productID)
	if err != nil {
		return nil, err
	}

	// Insert materials
	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_materials (product_id, material_index, kode_material, label, target_kg)
			 VALUES ($1, $2, $3, $4, $5)`,
			productID, m.MaterialIndex, m.KodeMaterial, m.Label, m.TargetKg,
		)
		if err != nil {
			return nil, err
		}
	}

	// Insert thresholds
	for _, t := range req.Thresholds {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_thresholds (product_id, criteria_index, target_index, min_ratio, max_ratio)
			 VALUES ($1, $2, $3, $4, $5)`,
			productID, t.CriteriaIndex, t.TargetIndex, t.MinRatio, t.MaxRatio,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return db.GetBOProductConfigByID(ctx, productID)
}

// GetBOProductConfigByID - Get product with materials and thresholds
func (db *DB) GetBOProductConfigByID(ctx context.Context, id int) (*models.AdminBOProductResponse, error) {
	resp := &models.AdminBOProductResponse{}

	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk, created_at, updated_at FROM bo_products WHERE id = $1`,
		id,
	).Scan(&resp.ID, &resp.KodeProduk, &resp.NamaProduk, &resp.CreatedAt, &resp.UpdatedAt)
	if err != nil {
		return nil, err
	}

	rows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, label, target_kg
		 FROM bo_product_materials WHERE product_id = $1 ORDER BY material_index`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m models.AdminBOProductConfig
		if err := rows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.Label, &m.TargetKg); err != nil {
			return nil, err
		}
		resp.Materials = append(resp.Materials, m)
	}

	rows2, err := db.pool.Query(ctx,
		`SELECT id, product_id, criteria_index, target_index, min_ratio, max_ratio
		 FROM bo_product_thresholds WHERE product_id = $1 ORDER BY criteria_index, target_index`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var t models.AdminBOThresholdConfig
		if err := rows2.Scan(&t.ID, &t.ProductID, &t.CriteriaIndex, &t.TargetIndex,
			&t.MinRatio, &t.MaxRatio); err != nil {
			return nil, err
		}
		resp.Thresholds = append(resp.Thresholds, t)
	}

	return resp, nil
}

// UpdateBOProductWithConfig - Update product with materials and thresholds
func (db *DB) UpdateBOProductWithConfig(ctx context.Context, id int, req *models.AdminBOProductRequest) (*models.AdminBOProductResponse, error) {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`UPDATE bo_products SET kode_produk = $1, nama_produk = $2, updated_at = NOW() WHERE id = $3`,
		req.KodeProduk, req.NamaProduk, id,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM bo_product_materials WHERE product_id = $1`, id)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM bo_product_thresholds WHERE product_id = $1`, id)
	if err != nil {
		return nil, err
	}

	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_materials (product_id, material_index, kode_material, label, target_kg)
			 VALUES ($1, $2, $3, $4, $5)`,
			id, m.MaterialIndex, m.KodeMaterial, m.Label, m.TargetKg,
		)
		if err != nil {
			return nil, err
		}
	}

	for _, t := range req.Thresholds {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_thresholds (product_id, criteria_index, target_index, min_ratio, max_ratio)
			 VALUES ($1, $2, $3, $4, $5)`,
			id, t.CriteriaIndex, t.TargetIndex, t.MinRatio, t.MaxRatio,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return db.GetBOProductConfigByID(ctx, id)
}

// ListBOProductsConfig - List all BO products with config
func (db *DB) ListBOProductsConfig(ctx context.Context) ([]models.AdminBOProductResponse, error) {
	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk, created_at, updated_at FROM bo_products ORDER BY kode_produk`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.AdminBOProductResponse{}
	for rows.Next() {
		var p models.AdminBOProductResponse
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

// DeleteBOProductWithConfig - Delete product and all related data
func (db *DB) DeleteBOProductWithConfig(ctx context.Context, id int) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM bo_products WHERE id = $1`, id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}