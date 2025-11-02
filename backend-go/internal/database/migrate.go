package database

import (
	"context"
	"embed"
	"fmt"
	"log/slog"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
)

//go:embed migrations/*.up.sql
var migrationsFS embed.FS

// RunMigrations executes all pending database migrations
func (db *DB) RunMigrations(ctx context.Context) error {
	// Create migrations tracking table if it doesn't exist
	if err := db.createMigrationsTable(ctx); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migration files
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort .up.sql files
	var migrationFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			migrationFiles = append(migrationFiles, entry.Name())
		}
	}
	sort.Strings(migrationFiles)

	// Run each migration
	for _, filename := range migrationFiles {
		migrationName := strings.TrimSuffix(filename, ".up.sql")

		// Check if migration was already applied
		applied, err := db.isMigrationApplied(ctx, migrationName)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}

		if applied {
			slog.Debug("Migration already applied", "migration", migrationName)
			continue
		}

		// Read migration file
		content, err := migrationsFS.ReadFile("migrations/" + filename)
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", filename, err)
		}

		// Execute migration in a transaction
		tx, err := db.Pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		if _, err := tx.Exec(ctx, string(content)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		// Record migration as applied
		if err := db.recordMigration(ctx, tx, migrationName); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", filename, err)
		}

		slog.Info("Migration applied successfully", "migration", migrationName)
	}

	return nil
}

func (db *DB) createMigrationsTable(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			migration_name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`
	_, err := db.Pool.Exec(ctx, query)
	return err
}

func (db *DB) isMigrationApplied(ctx context.Context, migrationName string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE migration_name = $1)`
	err := db.Pool.QueryRow(ctx, query, migrationName).Scan(&exists)
	return exists, err
}

func (db *DB) recordMigration(ctx context.Context, tx pgx.Tx, migrationName string) error {
	query := `INSERT INTO schema_migrations (migration_name) VALUES ($1)`
	_, err := tx.Exec(ctx, query, migrationName)
	return err
}
