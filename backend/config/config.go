package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBConnStr      string
	JWTSecret      string
	Port           string
	FrontendOrigin string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		DBConnStr:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/bfc_db?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "change-me-in-production-super-secret-key"),
		Port:           getEnv("PORT", "8080"),
		FrontendOrigin: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
