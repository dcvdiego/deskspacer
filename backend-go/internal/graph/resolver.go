package graph

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/dcvdiego/deskspacer/backend-go/internal/config"
	"github.com/dcvdiego/deskspacer/backend-go/internal/models"
	"github.com/dcvdiego/deskspacer/backend-go/internal/repository"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// Resolver is the root GraphQL resolver
type Resolver struct {
	repo      *repository.SharedStateRepository
	validator *validator.Validate
	config    *config.Config
}

// NewResolver creates a new GraphQL resolver
func NewResolver(repo *repository.SharedStateRepository, cfg *config.Config) *Resolver {
	return &Resolver{
		repo:      repo,
		validator: validator.New(),
		config:    cfg,
	}
}

// Query Methods

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

// Mutation Methods

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
