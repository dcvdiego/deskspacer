package graph

import (
	"github.com/dcvdiego/deskspacer/backend-go/internal/config"
	"github.com/dcvdiego/deskspacer/backend-go/internal/repository"
	"github.com/go-playground/validator/v10"
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
