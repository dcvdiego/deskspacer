package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server configuration
	ServerPort string

	// Database configuration
	DBHost     string
	DBPort     string
	DBName     string
	DBUser     string
	DBPassword string

	// CORS configuration
	CORSAllowedOrigins []string

	// Rate limiting (requests per minute)
	RateLimitPerMinute int
	RateLimitBurst     int

	// State expiration in days
	StateExpirationDays int

	// Cleanup interval in hours
	CleanupIntervalHours int
}

// Load loads configuration from environment variables and .env file
func Load() (*Config, error) {
	// Try to load .env file (ignore error if file doesn't exist)
	_ = godotenv.Load()

	config := &Config{
		// Server defaults
		ServerPort: getEnv("SERVER_PORT", "5221"),

		// Database defaults (matching C# backend)
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBName:     getEnv("DB_NAME", "deskspacer"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "12345678"),

		// CORS defaults
		CORSAllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{
			"http://localhost:5173",
			"http://localhost",
			"https://studio.apollographql.com",
		}),

		// Rate limiting defaults
		RateLimitPerMinute: getEnvInt("RATE_LIMIT_PER_MINUTE", 10),
		RateLimitBurst:     getEnvInt("RATE_LIMIT_BURST", 20),

		// State expiration defaults (matching C# backend)
		StateExpirationDays:  getEnvInt("STATE_EXPIRATION_DAYS", 15),
		CleanupIntervalHours: getEnvInt("CLEANUP_INTERVAL_HOURS", 24),
	}

	return config, nil
}

// DatabaseURL returns the PostgreSQL connection string
func (c *Config) DatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
	)
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets an integer environment variable with a default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvSlice gets a comma-separated environment variable as a slice
func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}
