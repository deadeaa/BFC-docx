// Package audit menyediakan satu titik pencatatan Log Aktivitas (Audit Trail)
// yang dipakai bersama oleh seluruh handler (users, batch khusus, batch
// overfilled, master data, dst) agar tidak ada duplikasi kode.
//
// ATURAN PEMAKAIAN — WAJIB DIPATUHI:
//   - Panggil audit.Log() HANYA setelah sebuah aksi benar-benar BERHASIL
//     mengubah data atau menghasilkan output (create, update, delete,
//     export, print, download, reset password, ubah role, dsb).
//   - JANGAN panggil audit.Log() untuk: login, logout, membuka halaman /
//     navigasi menu, refresh, scroll, search, filter, pagination, sorting,
//     hover, membuka/menutup modal, atau klik tombol yang tidak mengubah data.
package audit

import (
	"log"

	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-gonic/gin"
)

// Entry adalah satu-satunya hal yang perlu diisi manual oleh setiap handler.
// Field lain (user, nama user, role, method, endpoint, IP, user agent,
// timestamp) diambil otomatis dari request/context oleh Log().
type Entry struct {
	// Menu — nama menu/modul tempat aktivitas terjadi, mis. "Batch Overfilled",
	// "Batch Khusus", "Report", "User Management", "Master Data".
	Menu string
	// Activity — nama aktivitas singkat & baku, mis. "Membuat Perhitungan
	// Batch Overfilled", "Menghapus User", "Mengunduh Report".
	Activity string
	// Description — deskripsi lengkap berbahasa natural untuk ditampilkan
	// di halaman Log Aktivitas, mis. "Membuat perhitungan Batch Overfilled
	// untuk produk PBSJ1 (No. Batch B-001)".
	Description string
}

// Log mencatat satu baris Activity Log ke database. Dirancang untuk dipanggil
// langsung dari handler setelah operasi mutasi berhasil, contoh:
//
//	audit.Log(c, h.db, audit.Entry{
//	    Menu:        "Batch Overfilled",
//	    Activity:    "Membuat Perhitungan Batch Overfilled",
//	    Description: "Membuat perhitungan Batch Overfilled untuk produk " + kodeProduk,
//	})
//
// Kegagalan mencatat log TIDAK boleh menggagalkan response utama — karena itu
// error dari CreateActivityLog sengaja diabaikan (best-effort).
func Log(c *gin.Context, db *repository.DB, e Entry) {
	if db == nil {
		return
	}

	userIDVal, hasUserID := c.Get(middleware.CtxUserID)
	usernameVal, hasUsername := c.Get(middleware.CtxUsername)
	roleVal, _ := c.Get(middleware.CtxRole)
	if !hasUserID || !hasUsername {
		// Tidak ada user terautentikasi di context — tidak mungkin terjadi
		// pada route yang dilindungi middleware.Auth, tapi tetap dijaga
		// agar audit.Log() aman dipanggil dari mana pun.
		log.Printf("[audit.Log] dibatalkan: context tidak punya user_id/username (menu=%q activity=%q)", e.Menu, e.Activity)
		return
	}

	userID, _ := userIDVal.(int)
	username, _ := usernameVal.(string)
	role, _ := roleVal.(string)
	if userID == 0 || username == "" {
		log.Printf("[audit.Log] dibatalkan: userID/username kosong setelah type assertion (menu=%q activity=%q)", e.Menu, e.Activity)
		return
	}

	if err := db.CreateActivityLog(c, &models.ActivityLog{
		UserID:      userID,
		UserName:    username,
		Role:        role,
		Menu:        e.Menu,
		Activity:    e.Activity,
		Description: e.Description,
		Method:      c.Request.Method,
		Endpoint:    c.FullPath(),
		IPAddress:   c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	}); err != nil {
		// TEMPORARY DEBUG LOGGING — hapus setelah root cause ditemukan.
		// Error sengaja tidak menggagalkan response utama (best-effort),
		// tapi perlu terlihat di console backend agar bisa didiagnosis.
		log.Printf("[audit.Log] gagal menyimpan activity log (menu=%q activity=%q user=%q): %v",
			e.Menu, e.Activity, username, err)
	}
}
