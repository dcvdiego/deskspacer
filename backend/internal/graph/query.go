package graph

import (
	"context"
	"fmt"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/google/uuid"
)

// States returns all non-expired shared states
func (r *Resolver) States(ctx context.Context) ([]*models.SharedState, error) {
	states, err := r.repo.GetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch states: %w", err)
	}
	return states, nil
}

// StatesById returns a shared state by ID (as array for API compatibility with C# backend)
func (r *Resolver) StatesById(ctx context.Context, id uuid.UUID) ([]*models.SharedState, error) {
	state, err := r.repo.GetByID(ctx, id)
	if err != nil {
		// Return empty array if not found (matching C# behavior)
		return []*models.SharedState{}, nil
	}
	return []*models.SharedState{state}, nil
}
