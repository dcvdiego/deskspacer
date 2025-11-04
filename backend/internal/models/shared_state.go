package models

import (
	"time"

	"github.com/google/uuid"
)

// SharedState represents a saved desk setup state
type SharedState struct {
	ID        uuid.UUID `json:"id"`
	StateData string    `json:"stateData" validate:"required,json,max=10485760"` // 10MB max
	ExpiresAt time.Time `json:"expiresAt"`
}

// NewSharedState creates a new SharedState with generated ID and expiration
func NewSharedState(stateData string, expirationDays int) *SharedState {
	return &SharedState{
		ID:        uuid.New(),
		StateData: stateData,
		ExpiresAt: time.Now().UTC().AddDate(0, 0, expirationDays),
	}
}

// IsExpired checks if the state has expired
func (s *SharedState) IsExpired() bool {
	return time.Now().UTC().After(s.ExpiresAt)
}
