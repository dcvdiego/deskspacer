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

// CustomGLBRepository handles database operations for custom GLB files
type CustomGLBRepository struct {
	db *pgxpool.Pool
}

// NewCustomGLBRepository creates a new CustomGLBRepository
func NewCustomGLBRepository(db *pgxpool.Pool) *CustomGLBRepository {
	return &CustomGLBRepository{db: db}
}

// Create inserts a new custom GLB record into the database
func (r *CustomGLBRepository) Create(ctx context.Context, glb *models.CustomGLB) error {
	query := `
		INSERT INTO custom_glbs (id, user_id, filename, original_filename, file_size, storage_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.Exec(ctx, query,
		glb.ID,
		glb.UserID,
		glb.Filename,
		glb.OriginalFilename,
		glb.FileSize,
		glb.StorageURL,
		glb.CreatedAt,
	)

	if err != nil {
		slog.Error("Failed to create custom GLB", "error", err, "userID", glb.UserID, "filename", glb.Filename)
		return err
	}

	slog.Info("Custom GLB created", "id", glb.ID, "userID", glb.UserID, "filename", glb.Filename, "size", glb.FileSize)
	return nil
}

// GetByID retrieves a custom GLB by its ID
func (r *CustomGLBRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.CustomGLB, error) {
	query := `
		SELECT id, user_id, filename, original_filename, file_size, storage_url, created_at
		FROM custom_glbs
		WHERE id = $1 AND user_id = $2
	`

	glb := &models.CustomGLB{}
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&glb.ID,
		&glb.UserID,
		&glb.Filename,
		&glb.OriginalFilename,
		&glb.FileSize,
		&glb.StorageURL,
		&glb.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrGLBNotFound
		}
		slog.Error("Failed to get custom GLB by ID", "error", err, "id", id)
		return nil, err
	}

	return glb, nil
}

// GetAllByUserID retrieves all custom GLBs for a user
func (r *CustomGLBRepository) GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]*models.CustomGLB, error) {
	query := `
		SELECT id, user_id, filename, original_filename, file_size, storage_url, created_at
		FROM custom_glbs
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to query custom GLBs", "error", err, "userID", userID)
		return nil, err
	}
	defer rows.Close()

	var glbs []*models.CustomGLB
	for rows.Next() {
		glb := &models.CustomGLB{}
		err := rows.Scan(
			&glb.ID,
			&glb.UserID,
			&glb.Filename,
			&glb.OriginalFilename,
			&glb.FileSize,
			&glb.StorageURL,
			&glb.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		glbs = append(glbs, glb)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return glbs, nil
}

// Delete deletes a custom GLB (must be owned by user)
func (r *CustomGLBRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM custom_glbs WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		slog.Error("Failed to delete custom GLB", "error", err, "id", id)
		return err
	}

	if result.RowsAffected() == 0 {
		return models.ErrGLBNotFound
	}

	slog.Info("Custom GLB deleted", "id", id, "userID", userID)
	return nil
}

// CountByUserID returns the number of custom GLBs for a user
func (r *CustomGLBRepository) CountByUserID(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM custom_glbs WHERE user_id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// GetTotalSizeByUserID returns the total storage used by a user's custom GLBs
func (r *CustomGLBRepository) GetTotalSizeByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	query := `SELECT COALESCE(SUM(file_size), 0) FROM custom_glbs WHERE user_id = $1`
	var totalSize int64
	err := r.db.QueryRow(ctx, query, userID).Scan(&totalSize)
	return totalSize, err
}

// GetByFilename retrieves a custom GLB by filename and user ID
func (r *CustomGLBRepository) GetByFilename(ctx context.Context, filename string, userID uuid.UUID) (*models.CustomGLB, error) {
	query := `
		SELECT id, user_id, filename, original_filename, file_size, storage_url, created_at
		FROM custom_glbs
		WHERE filename = $1 AND user_id = $2
	`

	glb := &models.CustomGLB{}
	err := r.db.QueryRow(ctx, query, filename, userID).Scan(
		&glb.ID,
		&glb.UserID,
		&glb.Filename,
		&glb.OriginalFilename,
		&glb.FileSize,
		&glb.StorageURL,
		&glb.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrGLBNotFound
		}
		slog.Error("Failed to get custom GLB by filename", "error", err, "filename", filename)
		return nil, err
	}

	return glb, nil
}
