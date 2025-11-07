package repository

import (
	"context"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/google/uuid"
)

// UserRepositoryInterface defines the interface for user repository operations
type UserRepositoryInterface interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	UsernameExists(ctx context.Context, username string) (bool, error)
	Update(ctx context.Context, user *models.User) error
	VerifyEmail(ctx context.Context, userID uuid.UUID) error
	ActivatePremium(ctx context.Context, userID uuid.UUID) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	Delete(ctx context.Context, userID uuid.UUID) error
	GetStateCount(ctx context.Context, userID uuid.UUID) (int, error)
	GetGLBCount(ctx context.Context, userID uuid.UUID) (int, error)
}

// AuthTokenRepositoryInterface defines the interface for auth token repository operations
type AuthTokenRepositoryInterface interface {
	// Email verification tokens
	CreateEmailVerificationToken(ctx context.Context, token *models.EmailVerificationToken) error
	GetEmailVerificationToken(ctx context.Context, token string) (*models.EmailVerificationToken, error)
	DeleteEmailVerificationToken(ctx context.Context, token string) error
	DeleteEmailVerificationTokensByUserID(ctx context.Context, userID uuid.UUID) error

	// Password reset tokens
	CreatePasswordResetToken(ctx context.Context, token *models.PasswordResetToken) error
	GetPasswordResetToken(ctx context.Context, token string) (*models.PasswordResetToken, error)
	MarkPasswordResetTokenAsUsed(ctx context.Context, token string) error
	DeletePasswordResetTokensByUserID(ctx context.Context, userID uuid.UUID) error

	// Refresh tokens
	CreateRefreshToken(ctx context.Context, token *models.RefreshToken) error
	GetRefreshToken(ctx context.Context, token string) (*models.RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	RevokeAllRefreshTokensForUser(ctx context.Context, userID uuid.UUID) error

	// Cleanup
	DeleteExpiredTokens(ctx context.Context) (int64, error)
}
