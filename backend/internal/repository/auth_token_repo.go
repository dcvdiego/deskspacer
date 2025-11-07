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

// AuthTokenRepository handles database operations for authentication tokens
type AuthTokenRepository struct {
	db *pgxpool.Pool
}

// NewAuthTokenRepository creates a new AuthTokenRepository
func NewAuthTokenRepository(db *pgxpool.Pool) *AuthTokenRepository {
	return &AuthTokenRepository{db: db}
}

// ==========================
// Email Verification Tokens
// ==========================

// CreateEmailVerificationToken inserts a new email verification token
func (r *AuthTokenRepository) CreateEmailVerificationToken(ctx context.Context, token *models.EmailVerificationToken) error {
	query := `
		INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.Exec(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.CreatedAt,
	)

	if err != nil {
		slog.Error("Failed to create email verification token", "error", err, "userID", token.UserID)
		return err
	}

	slog.Info("Email verification token created", "userID", token.UserID)
	return nil
}

// GetEmailVerificationToken retrieves a token by its value
func (r *AuthTokenRepository) GetEmailVerificationToken(ctx context.Context, token string) (*models.EmailVerificationToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, created_at
		FROM email_verification_tokens
		WHERE token = $1
	`

	verificationToken := &models.EmailVerificationToken{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&verificationToken.ID,
		&verificationToken.UserID,
		&verificationToken.Token,
		&verificationToken.ExpiresAt,
		&verificationToken.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrInvalidToken
		}
		slog.Error("Failed to get email verification token", "error", err)
		return nil, err
	}

	return verificationToken, nil
}

// DeleteEmailVerificationToken deletes a token
func (r *AuthTokenRepository) DeleteEmailVerificationToken(ctx context.Context, token string) error {
	query := `DELETE FROM email_verification_tokens WHERE token = $1`
	_, err := r.db.Exec(ctx, query, token)
	if err != nil {
		slog.Error("Failed to delete email verification token", "error", err)
		return err
	}
	return nil
}

// DeleteEmailVerificationTokensByUserID deletes all tokens for a user
func (r *AuthTokenRepository) DeleteEmailVerificationTokensByUserID(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM email_verification_tokens WHERE user_id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

// ==========================
// Password Reset Tokens
// ==========================

// CreatePasswordResetToken inserts a new password reset token
func (r *AuthTokenRepository) CreatePasswordResetToken(ctx context.Context, token *models.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.Used,
		token.CreatedAt,
	)

	if err != nil {
		slog.Error("Failed to create password reset token", "error", err, "userID", token.UserID)
		return err
	}

	slog.Info("Password reset token created", "userID", token.UserID)
	return nil
}

// GetPasswordResetToken retrieves a token by its value
func (r *AuthTokenRepository) GetPasswordResetToken(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`

	resetToken := &models.PasswordResetToken{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&resetToken.ID,
		&resetToken.UserID,
		&resetToken.Token,
		&resetToken.ExpiresAt,
		&resetToken.Used,
		&resetToken.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrInvalidToken
		}
		slog.Error("Failed to get password reset token", "error", err)
		return nil, err
	}

	return resetToken, nil
}

// MarkPasswordResetTokenAsUsed marks a token as used
func (r *AuthTokenRepository) MarkPasswordResetTokenAsUsed(ctx context.Context, token string) error {
	query := `UPDATE password_reset_tokens SET used = true WHERE token = $1`
	_, err := r.db.Exec(ctx, query, token)
	if err != nil {
		slog.Error("Failed to mark password reset token as used", "error", err)
		return err
	}
	return nil
}

// DeletePasswordResetTokensByUserID deletes all tokens for a user
func (r *AuthTokenRepository) DeletePasswordResetTokensByUserID(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM password_reset_tokens WHERE user_id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

// ==========================
// Refresh Tokens
// ==========================

// CreateRefreshToken inserts a new refresh token
func (r *AuthTokenRepository) CreateRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token, expires_at, revoked, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.Revoked,
		token.CreatedAt,
	)

	if err != nil {
		slog.Error("Failed to create refresh token", "error", err, "userID", token.UserID)
		return err
	}

	return nil
}

// GetRefreshToken retrieves a token by its value
func (r *AuthTokenRepository) GetRefreshToken(ctx context.Context, token string) (*models.RefreshToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, revoked, created_at
		FROM refresh_tokens
		WHERE token = $1
	`

	refreshToken := &models.RefreshToken{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&refreshToken.ID,
		&refreshToken.UserID,
		&refreshToken.Token,
		&refreshToken.ExpiresAt,
		&refreshToken.Revoked,
		&refreshToken.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrInvalidToken
		}
		slog.Error("Failed to get refresh token", "error", err)
		return nil, err
	}

	return refreshToken, nil
}

// RevokeRefreshToken marks a token as revoked
func (r *AuthTokenRepository) RevokeRefreshToken(ctx context.Context, token string) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE token = $1`
	_, err := r.db.Exec(ctx, query, token)
	if err != nil {
		slog.Error("Failed to revoke refresh token", "error", err)
		return err
	}
	return nil
}

// RevokeAllRefreshTokensForUser revokes all refresh tokens for a user
func (r *AuthTokenRepository) RevokeAllRefreshTokensForUser(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		slog.Error("Failed to revoke all refresh tokens for user", "error", err, "userID", userID)
		return err
	}
	return nil
}

// DeleteExpiredTokens deletes all expired tokens (for cleanup service)
func (r *AuthTokenRepository) DeleteExpiredTokens(ctx context.Context) (int64, error) {
	var totalDeleted int64

	// Delete expired email verification tokens
	result1, err := r.db.Exec(ctx, `DELETE FROM email_verification_tokens WHERE expires_at < NOW()`)
	if err != nil {
		return 0, err
	}
	totalDeleted += result1.RowsAffected()

	// Delete expired password reset tokens
	result2, err := r.db.Exec(ctx, `DELETE FROM password_reset_tokens WHERE expires_at < NOW()`)
	if err != nil {
		return 0, err
	}
	totalDeleted += result2.RowsAffected()

	// Delete expired refresh tokens
	result3, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE expires_at < NOW()`)
	if err != nil {
		return 0, err
	}
	totalDeleted += result3.RowsAffected()

	if totalDeleted > 0 {
		slog.Info("Deleted expired tokens", "count", totalDeleted)
	}

	return totalDeleted, nil
}
