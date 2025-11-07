package repository

import (
	"context"
	"errors"
	"log/slog"

	"github.com/dcvdiego/deskspacer/backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserStateRepository handles database operations for user states
type UserStateRepository struct {
	db *pgxpool.Pool
}

// NewUserStateRepository creates a new UserStateRepository
func NewUserStateRepository(db *pgxpool.Pool) *UserStateRepository {
	return &UserStateRepository{db: db}
}

// Create inserts a new user state into the database
func (r *UserStateRepository) Create(ctx context.Context, state *models.UserState) error {
	query := `
		INSERT INTO user_states (id, user_id, name, state_data, is_public, public_token, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(ctx, query,
		state.ID,
		state.UserID,
		state.Name,
		state.StateData,
		state.IsPublic,
		state.PublicToken,
		state.CreatedAt,
		state.UpdatedAt,
	)

	if err != nil {
		slog.Error("Failed to create user state", "error", err, "userID", state.UserID)
		return err
	}

	slog.Info("User state created", "id", state.ID, "userID", state.UserID, "isPublic", state.IsPublic)
	return nil
}

// GetByID retrieves a state by its ID (must be owned by user or public)
func (r *UserStateRepository) GetByID(ctx context.Context, id uuid.UUID, requesterUserID *uuid.UUID) (*models.UserState, error) {
	query := `
		SELECT id, user_id, name, state_data, is_public, public_token, created_at, updated_at
		FROM user_states
		WHERE id = $1
	`

	state := &models.UserState{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&state.ID,
		&state.UserID,
		&state.Name,
		&state.StateData,
		&state.IsPublic,
		&state.PublicToken,
		&state.CreatedAt,
		&state.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrStateNotFound
		}
		slog.Error("Failed to get state by ID", "error", err, "id", id)
		return nil, err
	}

	// Check access permission
	if !state.CanBeAccessedBy(requesterUserID) {
		return nil, models.ErrStateAccessDenied
	}

	return state, nil
}

// GetByPublicToken retrieves a state by its public token
func (r *UserStateRepository) GetByPublicToken(ctx context.Context, token uuid.UUID) (*models.UserState, error) {
	query := `
		SELECT id, user_id, name, state_data, is_public, public_token, created_at, updated_at
		FROM user_states
		WHERE public_token = $1 AND is_public = true
	`

	state := &models.UserState{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&state.ID,
		&state.UserID,
		&state.Name,
		&state.StateData,
		&state.IsPublic,
		&state.PublicToken,
		&state.CreatedAt,
		&state.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrStateNotFound
		}
		slog.Error("Failed to get state by public token", "error", err, "token", token)
		return nil, err
	}

	return state, nil
}

// GetAllByUserID retrieves all states owned by a user
func (r *UserStateRepository) GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserState, error) {
	query := `
		SELECT id, user_id, name, state_data, is_public, public_token, created_at, updated_at
		FROM user_states
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to query user states", "error", err, "userID", userID)
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// GetPublicStates retrieves all public states
func (r *UserStateRepository) GetPublicStates(ctx context.Context) ([]*models.UserState, error) {
	query := `
		SELECT id, user_id, name, state_data, is_public, public_token, created_at, updated_at
		FROM user_states
		WHERE is_public = true
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		slog.Error("Failed to query public states", "error", err)
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// Update updates a user state
func (r *UserStateRepository) Update(ctx context.Context, state *models.UserState) error {
	query := `
		UPDATE user_states
		SET name = $2, state_data = $3, is_public = $4, public_token = $5, updated_at = $6
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		state.ID,
		state.Name,
		state.StateData,
		state.IsPublic,
		state.PublicToken,
		state.UpdatedAt,
	)

	if err != nil {
		slog.Error("Failed to update user state", "error", err, "id", state.ID)
		return err
	}

	slog.Info("User state updated", "id", state.ID)
	return nil
}

// Delete deletes a user state (only owner can delete)
func (r *UserStateRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM user_states WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		slog.Error("Failed to delete user state", "error", err, "id", id)
		return err
	}

	if result.RowsAffected() == 0 {
		return models.ErrStateNotFound
	}

	slog.Info("User state deleted", "id", id, "userID", userID)
	return nil
}

// CountByUserID returns the number of states owned by a user
func (r *UserStateRepository) CountByUserID(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM user_states WHERE user_id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// scanRows helper function to scan multiple rows
func (r *UserStateRepository) scanRows(rows pgx.Rows) ([]*models.UserState, error) {
	var states []*models.UserState

	for rows.Next() {
		state := &models.UserState{}
		err := rows.Scan(
			&state.ID,
			&state.UserID,
			&state.Name,
			&state.StateData,
			&state.IsPublic,
			&state.PublicToken,
			&state.CreatedAt,
			&state.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		states = append(states, state)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return states, nil
}
