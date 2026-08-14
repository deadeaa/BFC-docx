// backend/main.go
package main

import (
	"context"
	"log"
	"net/http"

	"bfc-backend/auth"
	"bfc-backend/config"
	"bfc-backend/handlers"
	"bfc-backend/middleware"
	"bfc-backend/models"
	"bfc-backend/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.Load()

	// Database
	db, err := repository.New(cfg.DBConnStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Connected to database")

	// Run migrations
	if err := db.Migrate(context.Background()); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Migrations applied")

	// Seed default admin
	seedAdmin(db, cfg)

	// JWT service
	jwtSvc := auth.NewService(cfg.JWTSecret)

	// Initialize ALL handlers
	authHandler := handlers.NewAuthHandler(db, jwtSvc)
	userHandler := handlers.NewUserHandler(db)
	bkHandler := handlers.NewBatchKhususHandler(db)
	boHandler := handlers.NewBatchOverfilledHandler(db)
	logHandler := handlers.NewActivityLogHandler(db)
	adminHandler := handlers.NewAdminHandler(db)
	reportTemplateHandler := handlers.NewReportTemplateHandler(db)
	reportDownloadHandler := handlers.NewReportDownloadHandler(db)

	// Gin router
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	// Auth routes (no JWT required for login/refresh)
	authGroup := api.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/refresh-token", authHandler.RefreshToken)
		authGroup.POST("/logout", middleware.Auth(jwtSvc), authHandler.Logout)
		authGroup.GET("/me", middleware.Auth(jwtSvc), authHandler.Me)
	}

	// Protected routes
	protected := api.Group("", middleware.Auth(jwtSvc))
	{
		// Batch Khusus
		protected.GET("/batch-khusus/products", bkHandler.ListProducts)
		protected.GET("/batch-khusus/products/:kode", bkHandler.GetProduct)
		protected.GET("/batch-khusus/reports", bkHandler.ListReports)
		protected.GET("/batch-khusus/reports/product/:kode", bkHandler.GetProductReports)
		protected.GET("/batch-khusus/reports/latest/:kode", bkHandler.GetLatestReport)

		// Batch Overfilled
		protected.GET("/batch-overfilled/products", boHandler.ListProducts)
		protected.GET("/batch-overfilled/products/:kode", boHandler.GetProduct)
		protected.GET("/batch-overfilled/reports", boHandler.ListReports)
		protected.GET("/batch-overfilled/reports/product/:kode", boHandler.GetProductReports)
		protected.GET("/batch-overfilled/reports/latest/:kode", boHandler.GetLatestReport)

		// ✅ Download Gabungan BO + BK
		protected.POST("/reports/download/combined", reportDownloadHandler.DownloadCombinedReport)
		// ✅ Download Individual (tetap ada)
		protected.GET("/reports/download/:reportId", reportDownloadHandler.DownloadReport)

		// ✅ DOWNLOAD BK ONLY - POST
		protected.POST("/reports/download", reportDownloadHandler.DownloadReportByType)

		// Simpan laporan – admin + produksi only
		calcGroup := protected.Group("", middleware.RequireRole("admin", "produksi"))
		{
			calcGroup.POST("/batch-khusus/reports", bkHandler.CreateReport)
			calcGroup.POST("/batch-overfilled/reports", boHandler.CreateReport)
		}

		// Admin only routes
		adminGroup := protected.Group("", middleware.RequireRole("admin"))
		{
			// User management
			adminGroup.GET("/users", userHandler.List)
			adminGroup.POST("/users", userHandler.Create)
			adminGroup.PUT("/users/:id", userHandler.Update)
			adminGroup.DELETE("/users/:id", userHandler.Delete)
			
			// Activity logs
			adminGroup.GET("/logs", logHandler.List)
			adminGroup.GET("/logs/:id", logHandler.Detail)

			// Delete reports
			adminGroup.DELETE("/batch-khusus/reports/:id", bkHandler.DeleteReport)
			adminGroup.DELETE("/batch-overfilled/reports/:id", boHandler.DeleteReport)

			// Admin - Batch Khusus
			adminGroup.GET("/admin/bk/products", adminHandler.ListBKProducts)
			adminGroup.GET("/admin/bk/products/:id", adminHandler.GetBKProduct)
			adminGroup.POST("/admin/bk/products", adminHandler.CreateBKProduct)
			adminGroup.PUT("/admin/bk/products/:id", adminHandler.UpdateBKProduct)
			adminGroup.DELETE("/admin/bk/products/:id", adminHandler.DeleteBKProduct)

			// Admin - Batch Overfilled
			adminGroup.GET("/admin/bo/products", adminHandler.ListBOProducts)
			adminGroup.GET("/admin/bo/products/:id", adminHandler.GetBOProduct)
			adminGroup.POST("/admin/bo/products", adminHandler.CreateBOProduct)
			adminGroup.PUT("/admin/bo/products/:id", adminHandler.UpdateBOProduct)
			adminGroup.DELETE("/admin/bo/products/:id", adminHandler.DeleteBOProduct)

			// ✅ Report Template - HANYA SEKALI
			adminGroup.GET("/admin/report-templates", reportTemplateHandler.ListTemplates)
			adminGroup.POST("/admin/report-templates", reportTemplateHandler.UploadTemplate)
			adminGroup.GET("/admin/report-templates/:id", reportTemplateHandler.GetTemplate)
			adminGroup.DELETE("/admin/report-templates/:id", reportTemplateHandler.DeleteTemplate)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("Server running on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func seedAdmin(db *repository.DB, cfg *config.Config) {
	ctx := context.Background()
	_, err := db.GetUserByUsername(ctx, "admin")
	if err == nil {
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	_, err = db.CreateUser(ctx, &models.User{
		Username: "admin",
		FullName: "Administrator",
		Password: string(hashed),
		Role:     "admin",
		IsActive: true,
	})
	if err != nil {
		log.Printf("Failed to seed admin: %v", err)
		return
	}
	log.Println("Default admin created: username=admin password=admin123")
}