package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user in the system
type User struct {
	ID                 uuid.UUID  `json:"id"`
	Email              string     `json:"email" validate:"required,email,max=255"`
	Username           string     `json:"username" validate:"required,min=3,max=50,alphanum_underscore"`
	PasswordHash       string     `json:"-"` // Never expose password hash in JSON
	EmailVerified      bool       `json:"emailVerified"`
	IsPremium          bool       `json:"isPremium"`
	PremiumActivatedAt *time.Time `json:"premiumActivatedAt,omitempty"`
	StorageUsedBytes   int64      `json:"storageUsedBytes"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

// NewUser creates a new user with default values
func NewUser(email, username, passwordHash string) *User {
	now := time.Now()
	return &User{
		ID:               uuid.New(),
		Email:            email,
		Username:         username,
		PasswordHash:     passwordHash,
		EmailVerified:    false,
		IsPremium:        false,
		StorageUsedBytes: 0,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
}

// ActivatePremium sets the user to premium status
func (u *User) ActivatePremium() {
	u.IsPremium = true
	now := time.Now()
	u.PremiumActivatedAt = &now
	u.UpdatedAt = now
}

// VerifyEmail marks the user's email as verified
func (u *User) VerifyEmail() {
	u.EmailVerified = true
	u.UpdatedAt = time.Now()
}

// CanUploadGLB returns true if the user can upload custom GLBs (premium only)
func (u *User) CanUploadGLB() bool {
	return u.IsPremium
}

// GetStateLimitCount returns the maximum number of states this user can save
func (u *User) GetStateLimitCount(freeLimitCount, premiumLimitCount int) int {
	if u.IsPremium {
		return premiumLimitCount
	}
	return freeLimitCount
}

// HasStorageSpace returns true if the user has remaining storage quota
func (u *User) HasStorageSpace(additionalBytes, totalLimit int64) bool {
	return u.StorageUsedBytes+additionalBytes <= totalLimit
}

// PublicUser returns a safe version of User without sensitive fields
type PublicUser struct {
	ID             uuid.UUID  `json:"id"`
	Email          string     `json:"email"`
	Username       string     `json:"username"`
	EmailVerified  bool       `json:"emailVerified"`
	IsPremium      bool       `json:"isPremium"`
	CreatedAt      time.Time  `json:"createdAt"`
	StateCount     int        `json:"stateCount,omitempty"`
	GLBCount       int        `json:"glbCount,omitempty"`
	StorageUsed    int64      `json:"storageUsed,omitempty"`
}

// ToPublic converts a User to PublicUser (safe for API responses)
func (u *User) ToPublic() *PublicUser {
	return &PublicUser{
		ID:            u.ID,
		Email:         u.Email,
		Username:      u.Username,
		EmailVerified: u.EmailVerified,
		IsPremium:     u.IsPremium,
		CreatedAt:     u.CreatedAt,
		StorageUsed:   u.StorageUsedBytes,
	}
}
