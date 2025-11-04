package graph

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
)

// AddState creates a new shared state
func (r *Resolver) AddState(ctx context.Context, sharedState string) (*models.SharedState, error) {
	// Validate that the input is valid JSON
	var js json.RawMessage
	if err := json.Unmarshal([]byte(sharedState), &js); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}

	// Validate size (10MB max)
	const maxSize = 10 * 1024 * 1024 // 10MB
	if len(sharedState) > maxSize {
		return nil, fmt.Errorf("state data too large (max %d bytes)", maxSize)
	}

	// Create new state with expiration
	state := models.NewSharedState(sharedState, r.config.StateExpirationDays)

	// Save to database
	if err := r.repo.Create(ctx, state); err != nil {
		return nil, fmt.Errorf("failed to save state: %w", err)
	}

	return state, nil
}
