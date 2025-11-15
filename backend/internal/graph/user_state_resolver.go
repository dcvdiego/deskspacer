package graph

import (
	"github.com/dcvdiego/deskspacer/backend/internal/middleware"
	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/google/uuid"
	"github.com/graphql-go/graphql"
)

// MyStates returns all states owned by the authenticated user
func (r *Resolver) MyStates(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, models.ErrUnauthorized
	}

	// Get user states
	states, err := r.userStateRepo.GetAllByUserID(params.Context, user.ID)
	if err != nil {
		return nil, err
	}

	// Convert to response format
	result := make([]map[string]interface{}, len(states))
	for i, state := range states {
		result[i] = map[string]interface{}{
			"id":          state.ID,
			"name":        state.Name,
			"stateData":   state.StateData,
			"isPublic":    state.IsPublic,
			"publicToken": state.PublicToken,
			"createdAt":   state.CreatedAt,
			"updatedAt":   state.UpdatedAt,
		}
	}

	return result, nil
}

// PublicState returns a public state by its public token
func (r *Resolver) PublicState(params graphql.ResolveParams) (interface{}, error) {
	token, ok := params.Args["token"].(uuid.UUID)
	if !ok {
		return nil, models.ErrInvalidInput
	}

	// Get public state
	state, err := r.userStateRepo.GetByPublicToken(params.Context, token)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":          state.ID,
		"name":        state.Name,
		"stateData":   state.StateData,
		"isPublic":    state.IsPublic,
		"publicToken": state.PublicToken,
		"createdAt":   state.CreatedAt,
		"updatedAt":   state.UpdatedAt,
	}, nil
}

// SaveState creates a new state for the authenticated user
func (r *Resolver) SaveState(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, models.ErrUnauthorized
	}

	// Parse arguments
	name, ok := params.Args["name"].(string)
	if !ok || name == "" {
		return nil, models.ErrInvalidInput
	}

	stateData, ok := params.Args["stateData"].(string)
	if !ok || stateData == "" {
		return nil, models.ErrInvalidInput
	}

	isPublic := false
	if val, ok := params.Args["isPublic"].(bool); ok {
		isPublic = val
	}

	// Check state limit
	count, err := r.userStateRepo.CountByUserID(params.Context, user.ID)
	if err != nil {
		return nil, err
	}

	limit := r.config.StateLimitFree
	if user.IsPremium {
		limit = r.config.StateLimitPremium
	}

	if count >= limit {
		return nil, models.ErrStateLimitReached
	}

	// Create state
	state := models.NewUserState(&user.ID, &name, stateData, isPublic)
	if err := r.userStateRepo.Create(params.Context, state); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":          state.ID,
		"name":        state.Name,
		"stateData":   state.StateData,
		"isPublic":    state.IsPublic,
		"publicToken": state.PublicToken,
		"createdAt":   state.CreatedAt,
		"updatedAt":   state.UpdatedAt,
	}, nil
}

// UpdateState updates an existing user state
func (r *Resolver) UpdateState(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, models.ErrUnauthorized
	}

	// Parse state ID
	stateID, ok := params.Args["id"].(uuid.UUID)
	if !ok {
		return nil, models.ErrInvalidInput
	}

	// Get existing state (with ownership check)
	state, err := r.userStateRepo.GetByID(params.Context, stateID, &user.ID)
	if err != nil {
		return nil, err
	}

	// Check ownership
	if state.UserID == nil || *state.UserID != user.ID {
		return nil, models.ErrUnauthorized
	}

	// Update fields if provided
	if name, ok := params.Args["name"].(string); ok && name != "" {
		state.Name = &name
	}

	if stateData, ok := params.Args["stateData"].(string); ok && stateData != "" {
		state.StateData = stateData
	}

	if isPublic, ok := params.Args["isPublic"].(bool); ok {
		if isPublic {
			state.MakePublic()
		} else {
			state.MakePrivate()
		}
	}

	// Update timestamp
	state.Update(nil, nil)

	// Save changes
	if err := r.userStateRepo.Update(params.Context, state); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":          state.ID,
		"name":        state.Name,
		"stateData":   state.StateData,
		"isPublic":    state.IsPublic,
		"publicToken": state.PublicToken,
		"createdAt":   state.CreatedAt,
		"updatedAt":   state.UpdatedAt,
	}, nil
}

// DeleteState deletes a user state
func (r *Resolver) DeleteState(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, models.ErrUnauthorized
	}

	// Parse state ID
	stateID, ok := params.Args["id"].(uuid.UUID)
	if !ok {
		return nil, models.ErrInvalidInput
	}

	// Delete state (repository enforces ownership)
	if err := r.userStateRepo.Delete(params.Context, stateID, user.ID); err != nil {
		return nil, err
	}

	return true, nil
}
