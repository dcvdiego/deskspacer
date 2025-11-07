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

// UserRepository handles database operations for users
type UserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user into the database
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, username, password_hash, email_verified, is_premium, storage_used_bytes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		user.PasswordHash,
		user.EmailVerified,
		user.IsPremium,
		user.StorageUsedBytes,
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		slog.Error("Failed to create user", "error", err, "email", user.Email)
		return err
	}

	slog.Info("User created", "id", user.ID, "email", user.Email, "username", user.Username)
	return nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified, is_premium, premium_activated_at,
		       storage_used_bytes, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerified,
		&user.IsPremium,
		&user.PremiumActivatedAt,
		&user.StorageUsedBytes,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		slog.Error("Failed to get user by ID", "error", err, "id", id)
		return nil, err
	}

	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified, is_premium, premium_activated_at,
		       storage_used_bytes, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerified,
		&user.IsPremium,
		&user.PremiumActivatedAt,
		&user.StorageUsedBytes,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		slog.Error("Failed to get user by email", "error", err, "email", email)
		return nil, err
	}

	return user, nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, email_verified, is_premium, premium_activated_at,
		       storage_used_bytes, created_at, updated_at
		FROM users
		WHERE username = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.EmailVerified,
		&user.IsPremium,
		&user.PremiumActivatedAt,
		&user.StorageUsedBytes,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		slog.Error("Failed to get user by username", "error", err, "username", username)
		return nil, err
	}

	return user, nil
}

// EmailExists checks if an email is already registered
func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`
	var exists bool
	err := r.db.QueryRow(ctx, query, email).Scan(&exists)
	return exists, err
}

// UsernameExists checks if a username is already taken
func (r *UserRepository) UsernameExists(ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`
	var exists bool
	err := r.db.QueryRow(ctx, query, username).Scan(&exists)
	return exists, err
}

// Update updates a user's information
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET email = $2, username = $3, email_verified = $4, is_premium = $5,
		    premium_activated_at = $6, storage_used_bytes = $7, updated_at = $8
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		user.EmailVerified,
		user.IsPremium,
		user.PremiumActivatedAt,
		user.StorageUsedBytes,
		user.UpdatedAt,
	)

	if err != nil {
		slog.Error("Failed to update user", "error", err, "id", user.ID)
		return err
	}

	slog.Info("User updated", "id", user.ID, "email", user.Email)
	return nil
}

// VerifyEmail marks a user's email as verified
func (r *UserRepository) VerifyEmail(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to verify email", "error", err, "userID", userID)
		return err
	}
	slog.Info("Email verified", "userID", userID)
	return nil
}

// ActivatePremium sets a user to premium status
func (r *UserRepository) ActivatePremium(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE users
		SET is_premium = true, premium_activated_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to activate premium", "error", err, "userID", userID)
		return err
	}
	slog.Info("Premium activated", "userID", userID)
	return nil
}

// UpdatePassword updates a user's password hash
func (r *UserRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, userID, passwordHash)
	if err != nil {
		slog.Error("Failed to update password", "error", err, "userID", userID)
		return err
	}
	slog.Info("Password updated", "userID", userID)
	return nil
}

// Delete deletes a user (cascades to all related records)
func (r *UserRepository) Delete(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to delete user", "error", err, "userID", userID)
		return err
	}
	slog.Info("User deleted", "userID", userID)
	return nil
}

// GetStateCount returns the number of states owned by a user
func (r *UserRepository) GetStateCount(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM user_states WHERE user_id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// GetGLBCount returns the number of custom GLBs owned by a user
func (r *UserRepository) GetGLBCount(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM custom_glbs WHERE user_id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}
