package repository

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"bfc-backend/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	pool *pgxpool.Pool
}

func New(connStr string) (*DB, error) {
	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("connect db: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return &DB{pool: pool}, nil
}

// ──────────────── USER ────────────────

func (db *DB) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	u := &models.User{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, username, full_name, password, role, is_active, created_at, updated_at
		 FROM users WHERE username = $1`, username).
		Scan(&u.ID, &u.Username, &u.FullName, &u.Password, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	u := &models.User{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, username, full_name, password, role, is_active, created_at, updated_at
		 FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Username, &u.FullName, &u.Password, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) ListUsers(ctx context.Context) ([]models.User, error) {
	rows, err := db.pool.Query(ctx,
		`SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (db *DB) CreateUser(ctx context.Context, u *models.User) (*models.User, error) {
	created := &models.User{}
	err := db.pool.QueryRow(ctx,
		`INSERT INTO users (username, full_name, password, role, is_active)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, username, full_name, role, is_active, created_at, updated_at`,
		u.Username, u.FullName, u.Password, u.Role, u.IsActive).
		Scan(&created.ID, &created.Username, &created.FullName, &created.Role, &created.IsActive, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (db *DB) UpdateUser(ctx context.Context, id int, fields map[string]interface{}) (*models.User, error) {
	setClauses := []string{}
	args := []interface{}{}
	i := 1
	for k, v := range fields {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", k, i))
		args = append(args, v)
		i++
	}
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", i))
	args = append(args, time.Now())
	i++
	args = append(args, id)

	query := fmt.Sprintf(
		`UPDATE users SET %s WHERE id = $%d
		 RETURNING id, username, full_name, role, is_active, created_at, updated_at`,
		strings.Join(setClauses, ", "), i)

	u := &models.User{}
	err := db.pool.QueryRow(ctx, query, args...).
		Scan(&u.ID, &u.Username, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) DeleteUser(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

// ──────────────── SESSION ────────────────

func (db *DB) CreateSession(ctx context.Context, s *models.Session) error {
	_, err := db.pool.Exec(ctx,
		`INSERT INTO sessions (user_id, refresh_token, last_activity, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		s.UserID, s.RefreshToken, s.LastActivity, s.ExpiresAt)
	return err
}

func (db *DB) GetSessionByRefreshToken(ctx context.Context, token string) (*models.Session, error) {
	s := &models.Session{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, user_id, refresh_token, last_activity, expires_at, created_at
		 FROM sessions WHERE refresh_token = $1`, token).
		Scan(&s.ID, &s.UserID, &s.RefreshToken, &s.LastActivity, &s.ExpiresAt, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (db *DB) UpdateSessionActivity(ctx context.Context, sessionID string) error {
	_, err := db.pool.Exec(ctx,
		`UPDATE sessions SET last_activity = $1 WHERE id = $2`, time.Now(), sessionID)
	return err
}

func (db *DB) DeleteSession(ctx context.Context, sessionID string) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID)
	return err
}

func (db *DB) DeleteUserSessions(ctx context.Context, userID int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID)
	return err
}

// ──────────────── ACTIVITY LOG ────────────────

func (db *DB) CreateActivityLog(ctx context.Context, log *models.ActivityLog) error {
	_, err := db.pool.Exec(ctx,
		`INSERT INTO activity_logs
			(user_id, user_name, role, menu, activity, description, method, endpoint, ip_address, user_agent)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		log.UserID, log.UserName, log.Role, log.Menu, log.Activity, log.Description,
		log.Method, log.Endpoint, log.IPAddress, log.UserAgent)
	return err
}

type ActivityLogFilter struct {
	Search   string
	UserName string
	Role     string
	Activity string
	DateFrom string
	DateTo   string
	Page     int
	PageSize int
}

func (db *DB) ListActivityLogs(ctx context.Context, f ActivityLogFilter) ([]models.ActivityLog, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argN := 1

	addArg := func(cond string, val interface{}) {
		where = append(where, fmt.Sprintf(cond, argN))
		args = append(args, val)
		argN++
	}

	if f.Search != "" {
		where = append(where, fmt.Sprintf(
			"(user_name ILIKE $%d OR menu ILIKE $%d OR activity ILIKE $%d OR description ILIKE $%d)",
			argN, argN, argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	if f.UserName != "" {
		addArg("user_name ILIKE $%d", "%"+f.UserName+"%")
	}
	if f.Role != "" {
		addArg("role = $%d", f.Role)
	}
	if f.Activity != "" {
		addArg("activity ILIKE $%d", "%"+f.Activity+"%")
	}
	if f.DateFrom != "" {
		addArg("created_at >= $%d", f.DateFrom+" 00:00:00")
	}
	if f.DateTo != "" {
		addArg("created_at <= $%d", f.DateTo+" 23:59:59")
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := "SELECT COUNT(*) FROM activity_logs WHERE " + whereClause
	if err := db.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	page := f.Page
	if page < 1 {
		page = 1
	}
	pageSize := f.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 200 {
		pageSize = 200
	}
	offset := (page - 1) * pageSize

	query := fmt.Sprintf(
		`SELECT id, user_id, COALESCE(user_name, ''), COALESCE(role, ''), COALESCE(menu, ''),
		        COALESCE(activity, ''), COALESCE(description, ''), COALESCE(method, ''),
		        COALESCE(endpoint, ''), COALESCE(ip_address, ''), COALESCE(user_agent, ''),
		        created_at, updated_at
		 FROM activity_logs WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, argN, argN+1)
	args = append(args, pageSize, offset)

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	logs := []models.ActivityLog{}
	for rows.Next() {
		var l models.ActivityLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.UserName, &l.Role, &l.Menu, &l.Activity,
			&l.Description, &l.Method, &l.Endpoint, &l.IPAddress, &l.UserAgent,
			&l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, 0, err
		}
		logs = append(logs, l)
	}
	return logs, total, nil
}

func (db *DB) GetActivityLogByID(ctx context.Context, id int) (*models.ActivityLog, error) {
	l := &models.ActivityLog{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, user_id, COALESCE(user_name, ''), COALESCE(role, ''), COALESCE(menu, ''),
		        COALESCE(activity, ''), COALESCE(description, ''), COALESCE(method, ''),
		        COALESCE(endpoint, ''), COALESCE(ip_address, ''), COALESCE(user_agent, ''),
		        created_at, updated_at
		 FROM activity_logs WHERE id = $1`, id).
		Scan(&l.ID, &l.UserID, &l.UserName, &l.Role, &l.Menu, &l.Activity,
			&l.Description, &l.Method, &l.Endpoint, &l.IPAddress, &l.UserAgent,
			&l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return l, nil
}

// ──────────────── MIGRATE ────────────────

func (db *DB) Migrate(ctx context.Context) error {
	_, err := db.pool.Exec(ctx, schema)
	return err
}

const schema = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
	id         SERIAL PRIMARY KEY,
	username   VARCHAR(100) UNIQUE NOT NULL,
	full_name  VARCHAR(200) NOT NULL,
	password   VARCHAR(255) NOT NULL,
	role       VARCHAR(50)  NOT NULL CHECK (role IN ('admin','produksi','qa')),
	is_active  BOOLEAN      NOT NULL DEFAULT true,
	created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
	id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id       INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	refresh_token VARCHAR(512) UNIQUE NOT NULL,
	last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at    TIMESTAMPTZ NOT NULL,
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
	id         SERIAL PRIMARY KEY,
	user_id    INT          NOT NULL,
	username   VARCHAR(100),
	action     VARCHAR(200),
	detail     TEXT,
	ip_address VARCHAR(50),
	created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_name   VARCHAR(200);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS role        VARCHAR(50);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS menu        VARCHAR(100);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS activity    VARCHAR(200);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS method      VARCHAR(10);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS endpoint    VARCHAR(255);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_agent  TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'activity_logs' AND column_name = 'username' AND is_nullable = 'NO'
	) THEN
		ALTER TABLE activity_logs ALTER COLUMN username DROP NOT NULL;
	END IF;
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'activity_logs' AND column_name = 'action' AND is_nullable = 'NO'
	) THEN
		ALTER TABLE activity_logs ALTER COLUMN action DROP NOT NULL;
	END IF;
END $$;

UPDATE activity_logs SET user_name = username WHERE user_name IS NULL AND username IS NOT NULL;
UPDATE activity_logs SET activity  = action   WHERE activity  IS NULL AND action   IS NOT NULL;
UPDATE activity_logs SET description = detail WHERE description IS NULL AND detail IS NOT NULL;
UPDATE activity_logs SET menu = 'Tidak Diketahui' WHERE menu IS NULL;
UPDATE activity_logs SET role = '' WHERE role IS NULL;
UPDATE activity_logs SET method = '' WHERE method IS NULL;
UPDATE activity_logs SET endpoint = '' WHERE endpoint IS NULL;
UPDATE activity_logs SET user_agent = '' WHERE user_agent IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id       ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_role       ON activity_logs(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_menu       ON activity_logs(menu);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity   ON activity_logs(activity);

CREATE TABLE IF NOT EXISTS bk_products (
    id          SERIAL       PRIMARY KEY,
    kode_produk VARCHAR(20)  UNIQUE NOT NULL,
    nama_produk VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bk_product_materials (
    id              SERIAL        PRIMARY KEY,
    product_id      INT           NOT NULL REFERENCES bk_products(id) ON DELETE CASCADE,
    material_index  INT           NOT NULL,
    kode_material   VARCHAR(20)   NOT NULL,
    qty_per_sachet  NUMERIC(12,4) NOT NULL,
    range_min       NUMERIC(8,4)  NOT NULL,
    range_max       NUMERIC(8,4)  NOT NULL,
    UNIQUE (product_id, material_index)
);

CREATE TABLE IF NOT EXISTS bk_product_rendemen (
    id          SERIAL        PRIMARY KEY,
    product_id  INT           NOT NULL REFERENCES bk_products(id) ON DELETE CASCADE,
    sort_order  INT           NOT NULL,
    persen      NUMERIC(8,6)  NOT NULL
);

CREATE TABLE IF NOT EXISTS bk_reports (
    id               SERIAL        PRIMARY KEY,
    kode_produk      VARCHAR(20)   NOT NULL,
    no_batch         VARCHAR(50)   NOT NULL,
    tgl_pembuatan    DATE          NOT NULL,
    bobot_total      NUMERIC(14,4) NOT NULL,
    input_sisa_minor NUMERIC(12,4) NOT NULL,
    created_by       INT           NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bk_reports_kode  ON bk_reports(kode_produk);
CREATE INDEX IF NOT EXISTS idx_bk_reports_tgl   ON bk_reports(tgl_pembuatan DESC);
CREATE INDEX IF NOT EXISTS idx_bk_materials_pid ON bk_product_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_bk_rendemen_pid  ON bk_product_rendemen(product_id);

CREATE TABLE IF NOT EXISTS bo_products (
    id          SERIAL       PRIMARY KEY,
    kode_produk VARCHAR(20)  UNIQUE NOT NULL,
    nama_produk VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bo_product_materials (
    id              SERIAL        PRIMARY KEY,
    product_id      INT           NOT NULL REFERENCES bo_products(id) ON DELETE CASCADE,
    material_index  INT           NOT NULL,
    kode_material   VARCHAR(30)   NOT NULL,
    label           VARCHAR(30)   NOT NULL,
    target_kg       NUMERIC(14,4) NOT NULL,
    UNIQUE (product_id, material_index)
);

CREATE TABLE IF NOT EXISTS bo_product_thresholds (
    id              SERIAL        PRIMARY KEY,
    product_id      INT           NOT NULL REFERENCES bo_products(id) ON DELETE CASCADE,
    criteria_index  INT           NOT NULL,
    target_index    INT           NOT NULL,
    min_ratio       NUMERIC(9,6)  NOT NULL,
    max_ratio       NUMERIC(9,6)  NOT NULL,
    UNIQUE (product_id, criteria_index, target_index)
);

CREATE TABLE IF NOT EXISTS bo_reports (
    id               SERIAL        PRIMARY KEY,
    kode_produk      VARCHAR(20)   NOT NULL,
    no_batch         VARCHAR(50)   NOT NULL,
    tgl_pembuatan    DATE          NOT NULL,
    bobot_total      NUMERIC(14,4) NOT NULL,
    kesimpulan       VARCHAR(10)   NOT NULL,
    detail_json      TEXT          NOT NULL,
    created_by       INT           NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bo_reports_kode     ON bo_reports(kode_produk);
CREATE INDEX IF NOT EXISTS idx_bo_reports_tgl      ON bo_reports(tgl_pembuatan DESC);
CREATE INDEX IF NOT EXISTS idx_bo_materials_pid    ON bo_product_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_bo_thresholds_pid   ON bo_product_thresholds(product_id);
`

var ErrNoRows = pgx.ErrNoRows

// ──────────────── BATCH KHUSUS ────────────────

func (db *DB) ListBKProducts(ctx context.Context) ([]models.BKProduct, error) {
	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk FROM bk_products ORDER BY kode_produk`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var products []models.BKProduct
	for rows.Next() {
		var p models.BKProduct
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

// ──────────────── BATCH KHUSUS ADMIN ────────────────

// ListBKProductsFull - Ambil semua produk BK dengan materials dan rendemen lengkap
func (db *DB) ListBKProductsFull(ctx context.Context) ([]models.BKProduct, error) {
	log.Printf("🔍 ListBKProductsFull: fetching all BK products with materials and rendemen")

	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk
		 FROM bk_products 
		 ORDER BY kode_produk`)
	if err != nil {
		log.Printf("❌ Query products error: %v", err)
		return nil, err
	}
	defer rows.Close()

	products := []models.BKProduct{}
	for rows.Next() {
		var p models.BKProduct
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk); err != nil {
			log.Printf("❌ Scan product error: %v", err)
			return nil, err
		}
		p.CreatedAt = time.Now()
		p.UpdatedAt = time.Now()
		p.Materials = []models.BKMaterial{}
		p.Rendemen = []models.BKRendemen{}
		products = append(products, p)
	}

	log.Printf("📦 Found %d products", len(products))

	for i, p := range products {
		log.Printf("📦 Fetching details for product: %s (ID: %d)", p.KodeProduk, p.ID)

		// Ambil materials
		mRows, err := db.pool.Query(ctx,
			`SELECT id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max
			 FROM bk_product_materials 
			 WHERE product_id = $1 
			 ORDER BY material_index`, p.ID)
		if err != nil {
			log.Printf("❌ Query materials error for product %d: %v", p.ID, err)
			continue
		}

		materials := []models.BKMaterial{}
		for mRows.Next() {
			var m models.BKMaterial
			if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
				&m.QtyPerSachet, &m.RangeMin, &m.RangeMax); err != nil {
				log.Printf("❌ Scan material error: %v", err)
				continue
			}
			materials = append(materials, m)
		}
		mRows.Close()
		products[i].Materials = materials
		log.Printf("📦 Product %s has %d materials", p.KodeProduk, len(materials))

		// Ambil rendemen
		rRows, err := db.pool.Query(ctx,
			`SELECT id, product_id, sort_order, persen
			 FROM bk_product_rendemen 
			 WHERE product_id = $1 
			 ORDER BY sort_order`, p.ID)
		if err != nil {
			log.Printf("❌ Query rendemen error for product %d: %v", p.ID, err)
			continue
		}

		rendemen := []models.BKRendemen{}
		for rRows.Next() {
			var r models.BKRendemen
			if err := rRows.Scan(&r.ID, &r.ProductID, &r.SortOrder, &r.Persen); err != nil {
				log.Printf("❌ Scan rendemen error: %v", err)
				continue
			}
			rendemen = append(rendemen, r)
		}
		rRows.Close()
		products[i].Rendemen = rendemen
		log.Printf("📦 Product %s has %d rendemen", p.KodeProduk, len(rendemen))
	}

	log.Printf("✅ ListBKProductsFull completed: %d products loaded", len(products))
	return products, nil
}

// GetBKProductByID - Ambil satu produk BK dengan materials dan rendemen lengkap
func (db *DB) GetBKProductByID(ctx context.Context, id int) (*models.BKProduct, error) {
	log.Printf("🔍 GetBKProductByID: id=%d", id)

	p := &models.BKProduct{
		Materials: []models.BKMaterial{},
		Rendemen:  []models.BKRendemen{},
	}

	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk
		 FROM bk_products WHERE id = $1`, id).
		Scan(&p.ID, &p.KodeProduk, &p.NamaProduk)
	if err != nil {
		log.Printf("❌ Query product error: %v", err)
		return nil, fmt.Errorf("product not found: %w", err)
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	// Ambil materials
	mRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max
		 FROM bk_product_materials WHERE product_id = $1 ORDER BY material_index`, p.ID)
	if err != nil {
		log.Printf("❌ Query materials error: %v", err)
		return nil, err
	}
	defer mRows.Close()

	for mRows.Next() {
		var m models.BKMaterial
		if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.QtyPerSachet, &m.RangeMin, &m.RangeMax); err != nil {
			log.Printf("❌ Scan material error: %v", err)
			return nil, err
		}
		p.Materials = append(p.Materials, m)
	}
	log.Printf("📦 Product %s has %d materials", p.KodeProduk, len(p.Materials))

	// Ambil rendemen
	rRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, sort_order, persen
		 FROM bk_product_rendemen WHERE product_id = $1 ORDER BY sort_order`, p.ID)
	if err != nil {
		log.Printf("❌ Query rendemen error: %v", err)
		return nil, err
	}
	defer rRows.Close()

	for rRows.Next() {
		var r models.BKRendemen
		if err := rRows.Scan(&r.ID, &r.ProductID, &r.SortOrder, &r.Persen); err != nil {
			log.Printf("❌ Scan rendemen error: %v", err)
			return nil, err
		}
		p.Rendemen = append(p.Rendemen, r)
	}
	log.Printf("📦 Product %s has %d rendemen", p.KodeProduk, len(p.Rendemen))

	return p, nil
}

// GetBKProductFullByKode - Ambil produk BK dengan materials dan rendemen lengkap berdasarkan kode
func (db *DB) GetBKProductFullByKode(ctx context.Context, kodeProduk string) (*models.BKProduct, error) {
	log.Printf("🔍 GetBKProductFullByKode: kode=%s", kodeProduk)

	var p models.BKProduct
	p.Materials = []models.BKMaterial{}
	p.Rendemen = []models.BKRendemen{}

	// ✅ Ambil produk - pake TRIM dan ILIKE
	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk 
		 FROM bk_products 
		 WHERE LOWER(TRIM(kode_produk)) = LOWER(TRIM($1))`,
		kodeProduk).Scan(&p.ID, &p.KodeProduk, &p.NamaProduk)
	if err != nil {
		log.Printf("❌ Query product error: %v", err)
		return nil, fmt.Errorf("product not found: %w", err)
	}
	
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	// 2. Ambil materials
	mRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max
		 FROM bk_product_materials WHERE product_id = $1 ORDER BY material_index`, p.ID)
	if err != nil {
		log.Printf("❌ Query materials error: %v", err)
		return nil, err
	}
	defer mRows.Close()

	for mRows.Next() {
		var m models.BKMaterial
		if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.QtyPerSachet, &m.RangeMin, &m.RangeMax); err != nil {
			log.Printf("❌ Scan material error: %v", err)
			return nil, err
		}
		p.Materials = append(p.Materials, m)
	}
	log.Printf("📦 Product %s has %d materials", p.KodeProduk, len(p.Materials))

	// 3. Ambil rendemen
	rRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, sort_order, persen
		 FROM bk_product_rendemen WHERE product_id = $1 ORDER BY sort_order`, p.ID)
	if err != nil {
		log.Printf("❌ Query rendemen error: %v", err)
		return nil, err
	}
	defer rRows.Close()

	for rRows.Next() {
		var r models.BKRendemen
		if err := rRows.Scan(&r.ID, &r.ProductID, &r.SortOrder, &r.Persen); err != nil {
			log.Printf("❌ Scan rendemen error: %v", err)
			return nil, err
		}
		p.Rendemen = append(p.Rendemen, r)
	}
	log.Printf("📦 Product %s has %d rendemen", p.KodeProduk, len(p.Rendemen))

	return &p, nil
}

// ──────────────── BATCH KHUSUS ADMIN ────────────────

// CreateBKProduct - Buat produk BK baru
func (db *DB) CreateBKProduct(ctx context.Context, req *models.BKProductRequest) (*models.BKProduct, error) {
	log.Printf("🔍 CreateBKProduct: kode=%s", req.KodeProduk)

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var productID int
	err = tx.QueryRow(ctx,
		`INSERT INTO bk_products (kode_produk, nama_produk) 
		 VALUES ($1, $2) RETURNING id`,
		req.KodeProduk, req.NamaProduk).Scan(&productID)
	if err != nil {
		return nil, fmt.Errorf("insert product failed: %w", err)
	}

	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_materials (product_id, material_index, kode_material, qty_per_sachet, range_min, range_max)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			productID, m.MaterialIndex, m.KodeMaterial, m.QtyPerSachet, m.RangeMin, m.RangeMax)
		if err != nil {
			return nil, fmt.Errorf("insert material failed: %w", err)
		}
	}

	for _, r := range req.Rendemen {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_rendemen (product_id, sort_order, persen)
			 VALUES ($1, $2, $3)`,
			productID, r.SortOrder, r.Persen)
		if err != nil {
			return nil, fmt.Errorf("insert rendemen failed: %w", err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	log.Printf("✅ Product created with ID: %d", productID)
	return db.GetBKProductByID(ctx, productID)
}

// UpdateBKProduct - Update produk BK yang sudah ada
func (db *DB) UpdateBKProduct(ctx context.Context, id int, req *models.BKProductRequest) (*models.BKProduct, error) {
	log.Printf("🔍 UpdateBKProduct: id=%d, kode=%s", id, req.KodeProduk)

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var exists bool
	err = tx.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM bk_products WHERE id = $1)`, id).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("product with ID %d not found", id)
	}

	_, err = tx.Exec(ctx,
		`UPDATE bk_products SET nama_produk = $1, updated_at = NOW() WHERE id = $2`,
		req.NamaProduk, id)
	if err != nil {
		return nil, fmt.Errorf("update product failed: %w", err)
	}

	// Delete old materials and rendemen
	_, err = tx.Exec(ctx, `DELETE FROM bk_product_materials WHERE product_id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("delete old materials failed: %w", err)
	}
	_, err = tx.Exec(ctx, `DELETE FROM bk_product_rendemen WHERE product_id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("delete old rendemen failed: %w", err)
	}

	// Insert new materials
	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_materials (product_id, material_index, kode_material, qty_per_sachet, range_min, range_max)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			id, m.MaterialIndex, m.KodeMaterial, m.QtyPerSachet, m.RangeMin, m.RangeMax)
		if err != nil {
			return nil, fmt.Errorf("insert material failed: %w", err)
		}
	}

	// Insert new rendemen
	for _, r := range req.Rendemen {
		_, err = tx.Exec(ctx,
			`INSERT INTO bk_product_rendemen (product_id, sort_order, persen)
			 VALUES ($1, $2, $3)`,
			id, r.SortOrder, r.Persen)
		if err != nil {
			return nil, fmt.Errorf("insert rendemen failed: %w", err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	log.Printf("✅ Product updated with ID: %d", id)
	return db.GetBKProductByID(ctx, id)
}

// DeleteBKProduct - Hapus produk BK
func (db *DB) DeleteBKProduct(ctx context.Context, id int) error {
	log.Printf("🔍 DeleteBKProduct: id=%d", id)

	var exists bool
	err := db.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM bk_products WHERE id = $1)`, id).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("product with ID %d not found", id)
	}

	_, err = db.pool.Exec(ctx, `DELETE FROM bk_products WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete product failed: %w", err)
	}

	log.Printf("✅ Product deleted: ID=%d", id)
	return nil
}

// ──────────────── LIST BO PRODUCTS ────────────────

// ListBOProducts - Ambil daftar produk BO (tanpa materials dan thresholds)
func (db *DB) ListBOProducts(ctx context.Context) ([]models.BOProduct, error) {
	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk FROM bo_products ORDER BY kode_produk`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var products []models.BOProduct
	for rows.Next() {
		var p models.BOProduct
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (db *DB) GetBKProduct(ctx context.Context, kodeProduk string) (*models.BKProduct, error) {
	p := &models.BKProduct{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk FROM bk_products WHERE kode_produk = $1`,
		kodeProduk).Scan(&p.ID, &p.KodeProduk, &p.NamaProduk)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	mRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max
		 FROM bk_product_materials WHERE product_id = $1 ORDER BY material_index`, p.ID)
	if err != nil {
		return nil, err
	}
	defer mRows.Close()
	for mRows.Next() {
		var m models.BKMaterial
		if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.QtyPerSachet, &m.RangeMin, &m.RangeMax); err != nil {
			return nil, err
		}
		p.Materials = append(p.Materials, m)
	}

	rRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, sort_order, persen FROM bk_product_rendemen
		 WHERE product_id = $1 ORDER BY sort_order`, p.ID)
	if err != nil {
		return nil, err
	}
	defer rRows.Close()
	for rRows.Next() {
		var r models.BKRendemen
		if err := rRows.Scan(&r.ID, &r.ProductID, &r.SortOrder, &r.Persen); err != nil {
			return nil, err
		}
		p.Rendemen = append(p.Rendemen, r)
	}
	return p, nil
}

func (db *DB) CreateBKReport(ctx context.Context, r *models.BKReport) (*models.BKReport, error) {
	err := db.pool.QueryRow(ctx,
		`INSERT INTO bk_reports (kode_produk, no_batch, tgl_pembuatan, bobot_total, input_sisa_minor, detail_json, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		r.KodeProduk, r.NoBatch, r.TglPembuatan, r.BobotTotal, r.InputSisaMinor, r.DetailJSON, r.CreatedBy,
	).Scan(&r.ID, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	return r, nil
}

func (db *DB) ListBKReports(ctx context.Context, search string, page, pageSize int) ([]models.BKReport, int, error) {
	where := "1=1"
	args := []interface{}{}
	if search != "" {
		where = "(r.kode_produk ILIKE $1 OR p.nama_produk ILIKE $1 OR r.no_batch ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	var total int
	countQuery := fmt.Sprintf(
		`SELECT COUNT(*) FROM bk_reports r LEFT JOIN bk_products p ON p.kode_produk = r.kode_produk WHERE %s`, where)
	if err := db.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 200 {
		pageSize = 200
	}
	offset := (page - 1) * pageSize

	limitArg := len(args) + 1
	offsetArg := len(args) + 2
	query := fmt.Sprintf(
		`SELECT r.id, r.kode_produk, COALESCE(p.nama_produk,''), r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.input_sisa_minor, r.created_by, COALESCE(u.full_name,''), r.created_at
		 FROM bk_reports r
		 LEFT JOIN bk_products p ON p.kode_produk = r.kode_produk
		 LEFT JOIN users u ON u.id = r.created_by
		 WHERE %s
		 ORDER BY r.created_at DESC
		 LIMIT $%d OFFSET $%d`, where, limitArg, offsetArg)
	args = append(args, pageSize, offset)

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports := []models.BKReport{}
	for rows.Next() {
		var rep models.BKReport
		if err := rows.Scan(
			&rep.ID, &rep.KodeProduk, &rep.NamaProduk, &rep.NoBatch, &rep.TglPembuatan,
			&rep.BobotTotal, &rep.InputSisaMinor, &rep.CreatedBy, &rep.CreatedByName, &rep.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		reports = append(reports, rep)
	}
	return reports, total, nil
}

func (db *DB) GetBKReportByID(ctx context.Context, id int) (*models.BKReport, error) {
	rep := &models.BKReport{}
	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, no_batch, tgl_pembuatan, bobot_total, input_sisa_minor, created_by, created_at
		 FROM bk_reports WHERE id = $1`, id).
		Scan(&rep.ID, &rep.KodeProduk, &rep.NoBatch, &rep.TglPembuatan, &rep.BobotTotal,
			&rep.InputSisaMinor, &rep.CreatedBy, &rep.CreatedAt)
	if err != nil {
		return nil, err
	}
	return rep, nil
}

func (db *DB) DeleteBKReport(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM bk_reports WHERE id = $1`, id)
	return err
}

// ──────────────── BATCH OVERFILLED ────────────────

func (db *DB) GetBOProduct(ctx context.Context, kodeProduk string) (*models.BOProduct, error) {
	p := &models.BOProduct{
		Materials:  []models.BOMaterial{},
		Thresholds: []models.BOThreshold{},
	}
	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk FROM bo_products WHERE kode_produk = $1`,
		kodeProduk).Scan(&p.ID, &p.KodeProduk, &p.NamaProduk)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	mRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, label, target_kg
		 FROM bo_product_materials WHERE product_id = $1 ORDER BY material_index`, p.ID)
	if err != nil {
		return nil, err
	}
	defer mRows.Close()
	for mRows.Next() {
		var m models.BOMaterial
		if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.Label, &m.TargetKg); err != nil {
			return nil, err
		}
		p.Materials = append(p.Materials, m)
	}

	tRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, criteria_index, target_index, min_ratio, max_ratio
		 FROM bo_product_thresholds WHERE product_id = $1 ORDER BY criteria_index, target_index`, p.ID)
	if err != nil {
		return nil, err
	}
	defer tRows.Close()
	for tRows.Next() {
		var t models.BOThreshold
		if err := tRows.Scan(&t.ID, &t.ProductID, &t.CriteriaIndex, &t.TargetIndex,
			&t.MinRatio, &t.MaxRatio); err != nil {
			return nil, err
		}
		p.Thresholds = append(p.Thresholds, t)
	}
	return p, nil
}

// ──────────────── BATCH OVERFILLED ADMIN ────────────────

// ListBOProductsFull - Ambil semua produk BO dengan materials dan thresholds lengkap
func (db *DB) ListBOProductsFull(ctx context.Context) ([]models.BOProduct, error) {
	log.Printf("🔍 ListBOProductsFull: fetching all BO products with materials and thresholds")

	rows, err := db.pool.Query(ctx,
		`SELECT id, kode_produk, nama_produk
		 FROM bo_products 
		 ORDER BY kode_produk`)
	if err != nil {
		log.Printf("❌ Query products error: %v", err)
		return nil, err
	}
	defer rows.Close()

	products := []models.BOProduct{}
	for rows.Next() {
		var p models.BOProduct
		if err := rows.Scan(&p.ID, &p.KodeProduk, &p.NamaProduk); err != nil {
			log.Printf("❌ Scan product error: %v", err)
			return nil, err
		}
		p.CreatedAt = time.Now()
		p.UpdatedAt = time.Now()
		p.Materials = []models.BOMaterial{}
		p.Thresholds = []models.BOThreshold{}
		products = append(products, p)
	}

	log.Printf("📦 Found %d products", len(products))

	for i, p := range products {
		log.Printf("📦 Fetching details for product: %s (ID: %d)", p.KodeProduk, p.ID)

		mRows, err := db.pool.Query(ctx,
			`SELECT id, product_id, material_index, kode_material, label, target_kg
			 FROM bo_product_materials 
			 WHERE product_id = $1 
			 ORDER BY material_index`, p.ID)
		if err != nil {
			log.Printf("❌ Query materials error for product %d: %v", p.ID, err)
			continue
		}

		materials := []models.BOMaterial{}
		for mRows.Next() {
			var m models.BOMaterial
			if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
				&m.Label, &m.TargetKg); err != nil {
				log.Printf("❌ Scan material error: %v", err)
				continue
			}
			materials = append(materials, m)
		}
		mRows.Close()
		products[i].Materials = materials
		log.Printf("📦 Product %s has %d materials", p.KodeProduk, len(materials))

		tRows, err := db.pool.Query(ctx,
			`SELECT id, product_id, criteria_index, target_index, min_ratio, max_ratio
			 FROM bo_product_thresholds 
			 WHERE product_id = $1 
			 ORDER BY criteria_index, target_index`, p.ID)
		if err != nil {
			log.Printf("❌ Query thresholds error for product %d: %v", p.ID, err)
			continue
		}

		thresholds := []models.BOThreshold{}
		for tRows.Next() {
			var t models.BOThreshold
			if err := tRows.Scan(&t.ID, &t.ProductID, &t.CriteriaIndex, &t.TargetIndex,
				&t.MinRatio, &t.MaxRatio); err != nil {
				log.Printf("❌ Scan threshold error: %v", err)
				continue
			}
			thresholds = append(thresholds, t)
		}
		tRows.Close()
		products[i].Thresholds = thresholds
		log.Printf("📦 Product %s has %d thresholds", p.KodeProduk, len(thresholds))
	}

	log.Printf("✅ ListBOProductsFull completed: %d products loaded", len(products))
	return products, nil
}

// GetBOProductByID - Ambil satu produk BO dengan materials dan thresholds lengkap
func (db *DB) GetBOProductByID(ctx context.Context, id int) (*models.BOProduct, error) {
	log.Printf("🔍 GetBOProductByID: id=%d", id)

	p := &models.BOProduct{
		Materials:  []models.BOMaterial{},
		Thresholds: []models.BOThreshold{},
	}

	err := db.pool.QueryRow(ctx,
		`SELECT id, kode_produk, nama_produk
		 FROM bo_products WHERE id = $1`, id).
		Scan(&p.ID, &p.KodeProduk, &p.NamaProduk)
	if err != nil {
		log.Printf("❌ Query product error: %v", err)
		return nil, fmt.Errorf("product not found: %w", err)
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	mRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, material_index, kode_material, label, target_kg
		 FROM bo_product_materials WHERE product_id = $1 ORDER BY material_index`, p.ID)
	if err != nil {
		log.Printf("❌ Query materials error: %v", err)
		return nil, err
	}
	defer mRows.Close()

	for mRows.Next() {
		var m models.BOMaterial
		if err := mRows.Scan(&m.ID, &m.ProductID, &m.MaterialIndex, &m.KodeMaterial,
			&m.Label, &m.TargetKg); err != nil {
			log.Printf("❌ Scan material error: %v", err)
			return nil, err
		}
		p.Materials = append(p.Materials, m)
	}
	log.Printf("📦 Product %s has %d materials", p.KodeProduk, len(p.Materials))

	tRows, err := db.pool.Query(ctx,
		`SELECT id, product_id, criteria_index, target_index, min_ratio, max_ratio
		 FROM bo_product_thresholds WHERE product_id = $1 ORDER BY criteria_index, target_index`, p.ID)
	if err != nil {
		log.Printf("❌ Query thresholds error: %v", err)
		return nil, err
	}
	defer tRows.Close()

	for tRows.Next() {
		var t models.BOThreshold
		if err := tRows.Scan(&t.ID, &t.ProductID, &t.CriteriaIndex, &t.TargetIndex,
			&t.MinRatio, &t.MaxRatio); err != nil {
			log.Printf("❌ Scan threshold error: %v", err)
			return nil, err
		}
		p.Thresholds = append(p.Thresholds, t)
	}
	log.Printf("📦 Product %s has %d thresholds", p.KodeProduk, len(p.Thresholds))

	return p, nil
}

// CreateBOProduct - Buat produk BO baru
func (db *DB) CreateBOProduct(ctx context.Context, req *models.BOProductRequest) (*models.BOProduct, error) {
	log.Printf("🔍 CreateBOProduct: kode=%s", req.KodeProduk)

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var productID int
	err = tx.QueryRow(ctx,
		`INSERT INTO bo_products (kode_produk, nama_produk) 
		 VALUES ($1, $2) RETURNING id`,
		req.KodeProduk, req.NamaProduk).Scan(&productID)
	if err != nil {
		return nil, fmt.Errorf("insert product failed: %w", err)
	}

	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_materials (product_id, material_index, kode_material, label, target_kg)
			 VALUES ($1, $2, $3, $4, $5)`,
			productID, m.MaterialIndex, m.KodeMaterial, m.Label, m.TargetKg)
		if err != nil {
			return nil, fmt.Errorf("insert material failed: %w", err)
		}
	}

	for _, t := range req.Thresholds {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_thresholds (product_id, criteria_index, target_index, min_ratio, max_ratio)
			 VALUES ($1, $2, $3, $4, $5)`,
			productID, t.CriteriaIndex, t.TargetIndex, t.MinRatio, t.MaxRatio)
		if err != nil {
			return nil, fmt.Errorf("insert threshold failed: %w", err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	log.Printf("✅ Product created with ID: %d", productID)
	return db.GetBOProductByID(ctx, productID)
}

// UpdateBOProduct - Update produk BO yang sudah ada
func (db *DB) UpdateBOProduct(ctx context.Context, id int, req *models.BOProductRequest) (*models.BOProduct, error) {
	log.Printf("🔍 UpdateBOProduct: id=%d, kode=%s", id, req.KodeProduk)

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var exists bool
	err = tx.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM bo_products WHERE id = $1)`, id).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("product with ID %d not found", id)
	}

	_, err = tx.Exec(ctx,
		`UPDATE bo_products SET nama_produk = $1, updated_at = NOW() WHERE id = $2`,
		req.NamaProduk, id)
	if err != nil {
		return nil, fmt.Errorf("update product failed: %w", err)
	}

	_, err = tx.Exec(ctx, `DELETE FROM bo_product_materials WHERE product_id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("delete old materials failed: %w", err)
	}
	_, err = tx.Exec(ctx, `DELETE FROM bo_product_thresholds WHERE product_id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("delete old thresholds failed: %w", err)
	}

	for _, m := range req.Materials {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_materials (product_id, material_index, kode_material, label, target_kg)
			 VALUES ($1, $2, $3, $4, $5)`,
			id, m.MaterialIndex, m.KodeMaterial, m.Label, m.TargetKg)
		if err != nil {
			return nil, fmt.Errorf("insert material failed: %w", err)
		}
	}

	for _, t := range req.Thresholds {
		_, err = tx.Exec(ctx,
			`INSERT INTO bo_product_thresholds (product_id, criteria_index, target_index, min_ratio, max_ratio)
			 VALUES ($1, $2, $3, $4, $5)`,
			id, t.CriteriaIndex, t.TargetIndex, t.MinRatio, t.MaxRatio)
		if err != nil {
			return nil, fmt.Errorf("insert threshold failed: %w", err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	log.Printf("✅ Product updated with ID: %d", id)
	return db.GetBOProductByID(ctx, id)
}

// DeleteBOProduct - Hapus produk BO
func (db *DB) DeleteBOProduct(ctx context.Context, id int) error {
	log.Printf("🔍 DeleteBOProduct: id=%d", id)

	var exists bool
	err := db.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM bo_products WHERE id = $1)`, id).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("product with ID %d not found", id)
	}

	_, err = db.pool.Exec(ctx, `DELETE FROM bo_products WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete product failed: %w", err)
	}

	log.Printf("✅ Product deleted: ID=%d", id)
	return nil
}

// ──────────────── BO REPORTS ────────────────

func (db *DB) CreateBOReport(ctx context.Context, r *models.BOReport) (*models.BOReport, error) {
	log.Printf("🔍 CreateBOReport: kode=%s, noBatch=%s", r.KodeProduk, r.NoBatch)

	err := db.pool.QueryRow(ctx,
		`INSERT INTO bo_reports (kode_produk, no_batch, tgl_pembuatan, bobot_total, kesimpulan, detail_json, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		r.KodeProduk, r.NoBatch, r.TglPembuatan, r.BobotTotal, r.Kesimpulan, r.DetailJSON, r.CreatedBy,
	).Scan(&r.ID, &r.CreatedAt)

	if err != nil {
		log.Printf("❌ Insert error: %v", err)
		return nil, err
	}

	var createdByName string
	err = db.pool.QueryRow(ctx,
		`SELECT full_name FROM users WHERE id = $1`,
		r.CreatedBy,
	).Scan(&createdByName)
	if err == nil {
		r.CreatedByName = createdByName
	}

	var namaProduk string
	err = db.pool.QueryRow(ctx,
		`SELECT nama_produk FROM bo_products WHERE LOWER(kode_produk) = LOWER($1)`,
		r.KodeProduk,
	).Scan(&namaProduk)
	if err == nil {
		r.NamaProduk = namaProduk
	}

	log.Printf("✅ Report created: ID=%d", r.ID)
	return r, nil
}

func (db *DB) ListBOReports(ctx context.Context, search string, page, pageSize int) ([]models.BOReport, int, error) {
	where := "1=1"
	args := []interface{}{}
	if search != "" {
		where = "(r.kode_produk ILIKE $1 OR p.nama_produk ILIKE $1 OR r.no_batch ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	var total int
	countQuery := fmt.Sprintf(
		`SELECT COUNT(*) FROM bo_reports r LEFT JOIN bo_products p ON p.kode_produk = r.kode_produk WHERE %s`, where)
	if err := db.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 200 {
		pageSize = 200
	}
	offset := (page - 1) * pageSize

	limitArg := len(args) + 1
	offsetArg := len(args) + 2
	query := fmt.Sprintf(
		`SELECT r.id, r.kode_produk, COALESCE(p.nama_produk,''), r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.kesimpulan, r.detail_json, r.created_by, COALESCE(u.full_name,''), r.created_at
		 FROM bo_reports r
		 LEFT JOIN bo_products p ON p.kode_produk = r.kode_produk
		 LEFT JOIN users u ON u.id = r.created_by
		 WHERE %s
		 ORDER BY r.created_at DESC
		 LIMIT $%d OFFSET $%d`, where, limitArg, offsetArg)
	args = append(args, pageSize, offset)

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	reports := []models.BOReport{}
	for rows.Next() {
		var rep models.BOReport
		if err := rows.Scan(
			&rep.ID, &rep.KodeProduk, &rep.NamaProduk, &rep.NoBatch, &rep.TglPembuatan,
			&rep.BobotTotal, &rep.Kesimpulan, &rep.DetailJSON, &rep.CreatedBy, &rep.CreatedByName, &rep.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		reports = append(reports, rep)
	}
	return reports, total, nil
}

func (db *DB) GetBOReportByID(ctx context.Context, id int) (*models.BOReport, error) {
	rep := &models.BOReport{}
	err := db.pool.QueryRow(ctx,
		`SELECT r.id, r.kode_produk, COALESCE(p.nama_produk,''), r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.kesimpulan, r.detail_json, r.created_by, COALESCE(u.full_name,''), r.created_at
		 FROM bo_reports r
		 LEFT JOIN bo_products p ON p.kode_produk = r.kode_produk
		 LEFT JOIN users u ON u.id = r.created_by
		 WHERE r.id = $1`, id).Scan(
		&rep.ID, &rep.KodeProduk, &rep.NamaProduk, &rep.NoBatch, &rep.TglPembuatan,
		&rep.BobotTotal, &rep.Kesimpulan, &rep.DetailJSON,
		&rep.CreatedBy, &rep.CreatedByName, &rep.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return rep, nil
}

func (db *DB) DeleteBOReport(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM bo_reports WHERE id = $1`, id)
	return err
}

// ──────────────── GET LATEST BO REPORT ────────────────

func (db *DB) GetLatestBOReportByProduct(ctx context.Context, kodeProduk string) (*models.BOReport, error) {
	log.Printf("🔍 GetLatestBOReportByProduct: kode=%s", kodeProduk)

	rep := &models.BOReport{}
	err := db.pool.QueryRow(ctx,
		`SELECT r.id, r.kode_produk, COALESCE(p.nama_produk, '') as nama_produk,
		        r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.kesimpulan, r.detail_json,
		        COALESCE(r.created_by, 0) as created_by,
		        COALESCE(u.full_name, '') as created_by_name,
		        r.created_at
		 FROM bo_reports r
		 LEFT JOIN bo_products p ON p.kode_produk = r.kode_produk
		 LEFT JOIN users u ON u.id = r.created_by
		 WHERE LOWER(r.kode_produk) = LOWER($1)
		 ORDER BY r.created_at DESC
		 LIMIT 1`,
		kodeProduk).Scan(
		&rep.ID,
		&rep.KodeProduk,
		&rep.NamaProduk,
		&rep.NoBatch,
		&rep.TglPembuatan,
		&rep.BobotTotal,
		&rep.Kesimpulan,
		&rep.DetailJSON,
		&rep.CreatedBy,
		&rep.CreatedByName,
		&rep.CreatedAt,
	)
	if err != nil {
		log.Printf("❌ Query error: %v", err)
		return nil, err
	}
	log.Printf("✅ Found report: ID=%d, NoBatch=%s", rep.ID, rep.NoBatch)
	return rep, nil
}

func (db *DB) ListBOReportsByProduct(ctx context.Context, kodeProduk string, noBatch string, limit int) ([]models.BOReport, error) {
	log.Printf("🔍 ListBOReportsByProduct: kode=%s, noBatch=%s, limit=%d", kodeProduk, noBatch, limit)

	query := `
		SELECT r.id, r.kode_produk, COALESCE(p.nama_produk, '') as nama_produk,
		       r.no_batch, r.tgl_pembuatan,
		       r.bobot_total, r.kesimpulan, r.detail_json,
		       COALESCE(r.created_by, 0) as created_by,
		       COALESCE(u.full_name, '') as created_by_name,
		       r.created_at
		FROM bo_reports r
		LEFT JOIN bo_products p ON p.kode_produk = r.kode_produk
		LEFT JOIN users u ON u.id = r.created_by
		WHERE LOWER(r.kode_produk) = LOWER($1)
	`
	args := []interface{}{kodeProduk}
	argIdx := 2

	if noBatch != "" && noBatch != "all" && noBatch != "undefined" && noBatch != "null" {
		query += fmt.Sprintf(" AND LOWER(r.no_batch) = LOWER($%d)", argIdx)
		args = append(args, noBatch)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY r.created_at DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		log.Printf("❌ Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	reports := []models.BOReport{}
	for rows.Next() {
		var rep models.BOReport
		if err := rows.Scan(
			&rep.ID,
			&rep.KodeProduk,
			&rep.NamaProduk,
			&rep.NoBatch,
			&rep.TglPembuatan,
			&rep.BobotTotal,
			&rep.Kesimpulan,
			&rep.DetailJSON,
			&rep.CreatedBy,
			&rep.CreatedByName,
			&rep.CreatedAt,
		); err != nil {
			log.Printf("❌ Scan error: %v", err)
			return nil, err
		}
		reports = append(reports, rep)
	}

	log.Printf("✅ Found %d reports after filter", len(reports))
	return reports, nil
}

// ──────────────── GET LATEST & LIST BY PRODUCT FOR BK ────────────────

func (db *DB) GetLatestBKReportByProduct(ctx context.Context, kodeProduk string) (*models.BKReport, error) {
	log.Printf("🔍 GetLatestBKReportByProduct: kode=%s", kodeProduk)

	rep := &models.BKReport{}
	err := db.pool.QueryRow(ctx,
		`SELECT r.id, r.kode_produk, COALESCE(p.nama_produk,''), r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.input_sisa_minor, 
		        COALESCE(r.created_by, 0) as created_by, 
		        COALESCE(u.full_name,'') as created_by_name, 
		        r.created_at
		 FROM bk_reports r
		 LEFT JOIN bk_products p ON p.kode_produk = r.kode_produk
		 LEFT JOIN users u ON u.id = r.created_by
		 WHERE LOWER(r.kode_produk) = LOWER($1)
		 ORDER BY r.created_at DESC
		 LIMIT 1`,
		kodeProduk).Scan(
		&rep.ID, &rep.KodeProduk, &rep.NamaProduk, &rep.NoBatch, &rep.TglPembuatan,
		&rep.BobotTotal, &rep.InputSisaMinor, &rep.CreatedBy, &rep.CreatedByName, &rep.CreatedAt,
	)
	if err != nil {
		log.Printf("❌ Query error: %v", err)
		return nil, err
	}

	log.Printf("✅ Found BK report: ID=%d, NoBatch=%s", rep.ID, rep.NoBatch)
	return rep, nil
}

func (db *DB) ListBKReportsByProduct(ctx context.Context, kodeProduk string, noBatch string) ([]models.BKReport, error) {
	log.Printf("🔍 ListBKReportsByProduct: kode=%s, noBatch=%s", kodeProduk, noBatch)

	query := `
		SELECT r.id, r.kode_produk, COALESCE(p.nama_produk,''), r.no_batch, r.tgl_pembuatan,
		        r.bobot_total, r.input_sisa_minor, 
		        COALESCE(r.created_by, 0) as created_by, 
		        COALESCE(u.full_name,'') as created_by_name, 
		        r.created_at
		FROM bk_reports r
		LEFT JOIN bk_products p ON p.kode_produk = r.kode_produk
		LEFT JOIN users u ON u.id = r.created_by
		WHERE LOWER(r.kode_produk) = LOWER($1)
	`
	args := []interface{}{kodeProduk}
	argIdx := 2

	if noBatch != "" && noBatch != "all" {
		query += fmt.Sprintf(" AND LOWER(r.no_batch) = LOWER($%d)", argIdx)
		args = append(args, noBatch)
		argIdx++
	}

	query += " ORDER BY r.created_at DESC"

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		log.Printf("❌ Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	reports := []models.BKReport{}
	for rows.Next() {
		var rep models.BKReport
		if err := rows.Scan(
			&rep.ID, &rep.KodeProduk, &rep.NamaProduk, &rep.NoBatch, &rep.TglPembuatan,
			&rep.BobotTotal, &rep.InputSisaMinor, &rep.CreatedBy, &rep.CreatedByName, &rep.CreatedAt,
		); err != nil {
			log.Printf("❌ Scan error: %v", err)
			return nil, err
		}
		reports = append(reports, rep)
	}

	log.Printf("✅ Found %d BK reports", len(reports))
	return reports, nil
}