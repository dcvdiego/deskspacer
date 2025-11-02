package repository

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/dcvdiego/deskspacer/backend-go/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SharedStateRepository handles database operations for SharedState
type SharedStateRepository struct {
	pool *pgxpool.Pool
}

// NewSharedStateRepository creates a new SharedStateRepository
func NewSharedStateRepository(pool *pgxpool.Pool) *SharedStateRepository {
	return &SharedStateRepository{pool: pool}
}

// Create inserts a new SharedState into the database
func (r *SharedStateRepository) Create(ctx context.Context, state *models.SharedState) error {
	query := `
		INSERT INTO shared_states (id, state_data, expires_at)
		VALUES ($1, $2, $3)
	`

	_, err := r.pool.Exec(ctx, query, state.ID, state.StateData, state.ExpiresAt)
	if err != nil {
		return fmt.Errorf("failed to create shared state: %w", err)
	}

	slog.Info("Shared state created",
		"id", state.ID,
		"expires_at", state.ExpiresAt,
	)

	return nil
}

// GetAll retrieves all non-expired SharedStates
func (r *SharedStateRepository) GetAll(ctx context.Context) ([]*models.SharedState, error) {
	query := `
		SELECT id, state_data, expires_at
		FROM shared_states
		WHERE expires_at > $1
		ORDER BY expires_at DESC
	`

	rows, err := r.pool.Query(ctx, query, time.Now().UTC())
	if err != nil {
		return nil, fmt.Errorf("failed to query shared states: %w", err)
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// GetByID retrieves a non-expired SharedState by its ID
func (r *SharedStateRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SharedState, error) {
	query := `
		SELECT id, state_data, expires_at
		FROM shared_states
		WHERE id = $1 AND expires_at > $2
	`

	row := r.pool.QueryRow(ctx, query, id, time.Now().UTC())

	var state models.SharedState
	err := row.Scan(&state.ID, &state.StateData, &state.ExpiresAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("shared state not found or expired: %s", id)
		}
		return nil, fmt.Errorf("failed to query shared state: %w", err)
	}

	return &state, nil
}

// DeleteExpired removes all expired SharedStates from the database
func (r *SharedStateRepository) DeleteExpired(ctx context.Context) (int64, error) {
	query := `
		DELETE FROM shared_states
		WHERE expires_at <= $1
	`

	result, err := r.pool.Exec(ctx, query, time.Now().UTC())
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired states: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected > 0 {
		slog.Info("Expired states cleaned up", "count", rowsAffected)
	}

	return rowsAffected, nil
}

// scanRows scans multiple rows into SharedState objects
func (r *SharedStateRepository) scanRows(rows pgx.Rows) ([]*models.SharedState, error) {
	var states []*models.SharedState

	for rows.Next() {
		var state models.SharedState
		if err := rows.Scan(&state.ID, &state.StateData, &state.ExpiresAt); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		states = append(states, &state)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return states, nil
}
