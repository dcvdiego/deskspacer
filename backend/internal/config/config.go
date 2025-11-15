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
	DBSSLMode  string

	// CORS configuration
	CORSAllowedOrigins []string

	// Rate limiting (requests per minute)
	RateLimitPerMinute       int
	RateLimitBurst           int
	RateLimitAuthPer15Min    int
	RateLimitPasswordPer1Hour int

	// JWT configuration
	JWTSecret            string
	JWTAccessExpiration  string // e.g., "15m"
	JWTRefreshExpiration string // e.g., "168h" (7 days)

	// Email configuration (Resend)
	ResendAPIKey string
	EmailFrom    string
	FrontendURL  string

	// Cloudflare R2 configuration
	R2AccountID        string
	R2AccessKeyID      string
	R2SecretAccessKey  string
	R2Endpoint         string
	R2BucketName       string
	R2PublicURL        string

	// Stripe configuration
	StripeSecretKey    string
	StripeWebhookSecret string
	StripePriceID      string
	StripeSuccessURL   string
	StripeCancelURL    string

	// Feature limits
	StateLimitFree         int
	StateLimitPremium      int
	GLBLimitPremium        int
	GLBSizeLimit           int64 // bytes
	GLBTotalStorageLimit   int64 // bytes

	// State expiration in days (for anonymous states)
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

		// Database defaults
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBName:     getEnv("DB_NAME", "deskspacer"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "12345678"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"), // Use "require" for Neon.tech

		// CORS defaults
		CORSAllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{
			"http://localhost:5173",
			"http://localhost",
			"https://studio.apollographql.com",
		}),

		// Rate limiting defaults
		RateLimitPerMinute:       getEnvInt("RATE_LIMIT_PER_MINUTE", 10),
		RateLimitBurst:           getEnvInt("RATE_LIMIT_BURST", 20),
		RateLimitAuthPer15Min:    getEnvInt("RATE_LIMIT_AUTH_PER_15MIN", 5),
		RateLimitPasswordPer1Hour: getEnvInt("RATE_LIMIT_PASSWORD_PER_1HOUR", 3),

		// JWT defaults
		JWTSecret:            getEnv("JWT_SECRET", "change-this-secret-in-production"),
		JWTAccessExpiration:  getEnv("JWT_ACCESS_EXPIRATION", "15m"),
		JWTRefreshExpiration: getEnv("JWT_REFRESH_EXPIRATION", "168h"), // 7 days

		// Email defaults (Resend)
		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		EmailFrom:    getEnv("EMAIL_FROM", "noreply@example.com"),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:5173"),

		// Cloudflare R2 defaults
		R2AccountID:       getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2Endpoint:        getEnv("R2_ENDPOINT", ""),
		R2BucketName:      getEnv("R2_BUCKET_NAME", "deskspacer-glbs"),
		R2PublicURL:       getEnv("R2_PUBLIC_URL", ""),

		// Stripe defaults
		StripeSecretKey:    getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		StripePriceID:      getEnv("STRIPE_PRICE_ID", ""),
		StripeSuccessURL:   getEnv("STRIPE_SUCCESS_URL", "http://localhost:5173/payment/success"),
		StripeCancelURL:    getEnv("STRIPE_CANCEL_URL", "http://localhost:5173/payment/cancel"),

		// Feature limits
		StateLimitFree:       getEnvInt("STATE_LIMIT_FREE", 5),
		StateLimitPremium:    getEnvInt("STATE_LIMIT_PREMIUM", 100),
		GLBLimitPremium:      getEnvInt("GLB_LIMIT_PREMIUM", 10),
		GLBSizeLimit:         getEnvInt64("GLB_SIZE_LIMIT", 5242880),      // 5MB
		GLBTotalStorageLimit: getEnvInt64("GLB_TOTAL_STORAGE_LIMIT", 52428800), // 50MB

		// State expiration defaults (for anonymous states)
		StateExpirationDays:  getEnvInt("STATE_EXPIRATION_DAYS", 15),
		CleanupIntervalHours: getEnvInt("CLEANUP_INTERVAL_HOURS", 24),
	}

	return config, nil
}

// DatabaseURL returns the PostgreSQL connection string
func (c *Config) DatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
		c.DBSSLMode,
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

// getEnvInt64 gets an int64 environment variable with a default value
func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}
