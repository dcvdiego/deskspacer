package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dcvdiego/deskspacer/backend/internal/config"
	"github.com/dcvdiego/deskspacer/backend/internal/database"
	"github.com/dcvdiego/deskspacer/backend/internal/graph"
	"github.com/dcvdiego/deskspacer/backend/internal/middleware"
	"github.com/dcvdiego/deskspacer/backend/internal/repository"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/graphql-go/handler"
)

func main() {
	// Configure structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	slog.Info("Starting DeskSpacer Go Backend")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	slog.Info("Configuration loaded",
		"server_port", cfg.ServerPort,
		"db_host", cfg.DBHost,
		"db_name", cfg.DBName,
	)

	// Initialize database connection
	ctx := context.Background()
	db, err := database.New(ctx, cfg.DatabaseURL())
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Run database migrations
	slog.Info("Running database migrations")
	if err := db.RunMigrations(ctx); err != nil {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("Database migrations completed")

	// Initialize repositories
	repo := repository.NewSharedStateRepository(db.Pool)
	userRepo := repository.NewUserRepository(db.Pool)
	authTokenRepo := repository.NewAuthTokenRepository(db.Pool)
	userStateRepo := repository.NewUserStateRepository(db.Pool)
	customGLBRepo := repository.NewCustomGLBRepository(db.Pool)

	// Initialize AuthService
	authService, err := service.NewAuthService(
		userRepo,
		authTokenRepo,
		cfg.JWTSecret,
		cfg.JWTAccessExpiration,
		cfg.JWTRefreshExpiration,
	)
	if err != nil {
		slog.Error("Failed to create auth service", "error", err)
		os.Exit(1)
	}
	slog.Info("Auth service initialized")

	// Initialize Email Service
	var emailService service.EmailService
	if cfg.ResendAPIKey != "" {
		// Use real Resend email service
		emailService = service.NewResendEmailService(cfg.ResendAPIKey, cfg.EmailFrom, cfg.FrontendURL)
		slog.Info("Resend email service initialized", "from", cfg.EmailFrom)
	} else {
		// Use mock email service for development/testing
		emailService = service.NewMockEmailService()
		slog.Warn("Using mock email service (no RESEND_API_KEY configured)")
	}

	// Initialize Storage Service
	var storageService service.StorageService
	if cfg.R2AccessKeyID != "" && cfg.R2SecretAccessKey != "" && cfg.R2BucketName != "" {
		// Use real Cloudflare R2 storage service
		storageService, err = service.NewR2StorageService(
			cfg.R2AccessKeyID,
			cfg.R2SecretAccessKey,
			cfg.R2Endpoint,
			cfg.R2BucketName,
			cfg.R2PublicURL,
		)
		if err != nil {
			slog.Error("Failed to create R2 storage service", "error", err)
			os.Exit(1)
		}
		slog.Info("R2 storage service initialized", "bucket", cfg.R2BucketName)
	} else {
		// Use mock storage service for development/testing
		storageService = service.NewMockStorageService()
		slog.Warn("Using mock storage service (no R2 credentials configured)")
	}

	// Initialize Stripe Service
	var stripeService service.StripeService
	if cfg.StripeSecretKey != "" && cfg.StripeWebhookSecret != "" && cfg.StripePriceID != "" {
		// Use real Stripe service
		stripeService = service.NewRealStripeService(
			cfg.StripeSecretKey,
			cfg.StripeWebhookSecret,
			cfg.StripePriceID,
			cfg.StripeSuccessURL,
			cfg.StripeCancelURL,
		)
		slog.Info("Stripe service initialized", "price_id", cfg.StripePriceID)
	} else {
		// Use mock Stripe service for development/testing
		stripeService = service.NewMockStripeService()
		slog.Warn("Using mock Stripe service (no Stripe credentials configured)")
	}

	// Initialize GraphQL resolver and schema
	resolver := graph.NewResolver(repo, userRepo, authTokenRepo, userStateRepo, customGLBRepo, authService, emailService, storageService, stripeService, cfg)
	schema, err := graph.NewSchema(resolver)
	if err != nil {
		slog.Error("Failed to create GraphQL schema", "error", err)
		os.Exit(1)
	}

	// Create GraphQL handler
	graphqlHandler := handler.New(&handler.Config{
		Schema:     &schema,
		Pretty:     true,
		GraphiQL:   true, // Enable GraphiQL interface
		Playground: true,  // Enable GraphQL Playground
	})

	// Initialize router
	r := chi.NewRouter()

	// Middleware stack
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logging())
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.NewCORS(cfg.CORSAllowedOrigins))

	// Create rate limiter
	rateLimiter := middleware.NewRateLimiter(cfg.RateLimitPerMinute, cfg.RateLimitBurst)
	r.Use(rateLimiter.Middleware())

	// Health check endpoint
	r.Get("/health", middleware.NewHealthHandler(db))

	// GraphQL endpoint with optional auth
	r.With(middleware.OptionalAuth(authService)).Handle("/graphql", graphqlHandler)

	// Stripe webhook endpoint (no auth, Stripe signature verification)
	webhookHandler := middleware.NewStripeWebhookHandler(stripeService, userRepo)
	r.Post("/webhooks/stripe", webhookHandler.HandleWebhook)

	// Start background cleanup service
	cleanupService := service.NewCleanupService(repo, cfg.CleanupIntervalHours)
	go cleanupService.Start(ctx)

	// HTTP server configuration
	server := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("Server starting",
			"port", cfg.ServerPort,
			"graphql_endpoint", fmt.Sprintf("http://localhost:%s/graphql", cfg.ServerPort),
		)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server...")

	// Stop cleanup service
	cleanupService.Stop()

	// Shutdown HTTP server
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server stopped gracefully")
}
