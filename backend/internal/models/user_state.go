package models

import (
	"time"

	"github.com/google/uuid"
)

// UserState represents a saved canvas state (formerly SharedState)
type UserState struct {
	ID          uuid.UUID  `json:"id"`
	UserID      *uuid.UUID `json:"userId,omitempty"` // Nullable for anonymous states
	Name        *string    `json:"name,omitempty"`
	StateData   string     `json:"stateData" validate:"required,json,max=10485760"` // 10MB limit
	IsPublic    bool       `json:"isPublic"`
	PublicToken *uuid.UUID `json:"publicToken,omitempty"` // For public sharing
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// NewUserState creates a new user state
func NewUserState(userID *uuid.UUID, name *string, stateData string, isPublic bool) *UserState {
	now := time.Now()
	state := &UserState{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      name,
		StateData: stateData,
		IsPublic:  isPublic,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Generate public token if state is public
	if isPublic {
		token := uuid.New()
		state.PublicToken = &token
	}

	return state
}

// NewAnonymousState creates a new anonymous state (for backward compatibility)
func NewAnonymousState(stateData string) *UserState {
	return NewUserState(nil, nil, stateData, true)
}

// IsOwnedBy returns true if the state belongs to the given user
func (s *UserState) IsOwnedBy(userID uuid.UUID) bool {
	return s.UserID != nil && *s.UserID == userID
}

// IsAnonymous returns true if this is an anonymous state
func (s *UserState) IsAnonymous() bool {
	return s.UserID == nil
}

// CanBeAccessedBy returns true if the user can access this state
func (s *UserState) CanBeAccessedBy(userID *uuid.UUID) bool {
	// Public states can be accessed by anyone
	if s.IsPublic {
		return true
	}

	// Private states can only be accessed by the owner
	if userID == nil || s.UserID == nil {
		return false
	}

	return *s.UserID == *userID
}

// MakePublic makes the state public and generates a public token
func (s *UserState) MakePublic() {
	s.IsPublic = true
	if s.PublicToken == nil {
		token := uuid.New()
		s.PublicToken = &token
	}
	s.UpdatedAt = time.Now()
}

// MakePrivate makes the state private and removes the public token
func (s *UserState) MakePrivate() {
	s.IsPublic = false
	s.PublicToken = nil
	s.UpdatedAt = time.Now()
}

// Update updates the state data and/or name
func (s *UserState) Update(name *string, stateData *string) {
	if name != nil {
		s.Name = name
	}
	if stateData != nil {
		s.StateData = *stateData
	}
	s.UpdatedAt = time.Now()
}
