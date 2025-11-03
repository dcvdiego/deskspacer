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

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/dcvdiego/deskspacer/backend-go/internal/config"
	"github.com/dcvdiego/deskspacer/backend-go/internal/database"
	"github.com/dcvdiego/deskspacer/backend-go/internal/graph"
	"github.com/dcvdiego/deskspacer/backend-go/internal/graph/generated"
	"github.com/dcvdiego/deskspacer/backend-go/internal/middleware"
	"github.com/dcvdiego/deskspacer/backend-go/internal/repository"
	"github.com/dcvdiego/deskspacer/backend-go/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
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

	// Initialize repository
	repo := repository.NewSharedStateRepository(db.Pool)

	// Initialize GraphQL resolver
	resolver := graph.NewResolver(repo, cfg)

	// Create gqlgen schema and handler
	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))
	graphqlHandler := srv
	playgroundHandler := playground.Handler("GraphQL Playground", "/graphql")

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

	// GraphQL Playground (development interface)
	r.Handle("/", playgroundHandler)

	// GraphQL endpoint
	r.Handle("/graphql", graphqlHandler)

	// Start background cleanup service for expired states
	cleanupService := service.NewCleanupService(repo, cfg.CleanupIntervalHours)
	go cleanupService.Start(ctx)

	// Start rate limiter cleanup (runs every 1 hour to prevent memory leaks)
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				rateLimiter.Cleanup()
				slog.Debug("Rate limiter map cleaned up")
			case <-ctx.Done():
				return
			}
		}
	}()

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
