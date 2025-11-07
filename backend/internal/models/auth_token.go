package models

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
)

// EmailVerificationToken represents a token for email verification
type EmailVerificationToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewEmailVerificationToken creates a new email verification token
// Token expires in 24 hours by default
func NewEmailVerificationToken(userID uuid.UUID) (*EmailVerificationToken, error) {
	token, err := generateSecureToken(32) // 32 bytes = 64 hex characters
	if err != nil {
		return nil, err
	}

	return &EmailVerificationToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		CreatedAt: time.Now(),
	}, nil
}

// IsExpired returns true if the token has expired
func (t *EmailVerificationToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// PasswordResetToken represents a token for password reset
type PasswordResetToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	Used      bool      `json:"used"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewPasswordResetToken creates a new password reset token
// Token expires in 1 hour by default
func NewPasswordResetToken(userID uuid.UUID) (*PasswordResetToken, error) {
	token, err := generateSecureToken(32)
	if err != nil {
		return nil, err
	}

	return &PasswordResetToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Used:      false,
		CreatedAt: time.Now(),
	}, nil
}

// IsExpired returns true if the token has expired
func (t *PasswordResetToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// CanUse returns true if the token can be used (not expired and not used)
func (t *PasswordResetToken) CanUse() bool {
	return !t.IsExpired() && !t.Used
}

// MarkAsUsed marks the token as used
func (t *PasswordResetToken) MarkAsUsed() {
	t.Used = true
}

// RefreshToken represents a JWT refresh token
type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	Revoked   bool      `json:"revoked"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewRefreshToken creates a new refresh token
// Token expires in 7 days by default
func NewRefreshToken(userID uuid.UUID, tokenString string, expiresAt time.Time) *RefreshToken {
	return &RefreshToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: expiresAt,
		Revoked:   false,
		CreatedAt: time.Now(),
	}
}

// IsExpired returns true if the token has expired
func (t *RefreshToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// IsValid returns true if the token is valid (not expired and not revoked)
func (t *RefreshToken) IsValid() bool {
	return !t.IsExpired() && !t.Revoked
}

// Revoke marks the token as revoked
func (t *RefreshToken) Revoke() {
	t.Revoked = true
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken(byteLength int) (string, error) {
	bytes := make([]byte, byteLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
