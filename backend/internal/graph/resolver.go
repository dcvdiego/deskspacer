package graph

import (
	"github.com/dcvdiego/deskspacer/backend/internal/config"
	"github.com/dcvdiego/deskspacer/backend/internal/repository"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
	"github.com/go-playground/validator/v10"
)

// Resolver is the root GraphQL resolver
type Resolver struct {
	// Existing repositories
	repo *repository.SharedStateRepository

	// New auth repositories
	userRepo      repository.UserRepositoryInterface
	authTokenRepo repository.AuthTokenRepositoryInterface
	userStateRepo *repository.UserStateRepository

	// Services
	authService *service.AuthService

	// Utilities
	validator *validator.Validate
	config    *config.Config
}

// NewResolver creates a new GraphQL resolver
func NewResolver(
	repo *repository.SharedStateRepository,
	userRepo repository.UserRepositoryInterface,
	authTokenRepo repository.AuthTokenRepositoryInterface,
	userStateRepo *repository.UserStateRepository,
	authService *service.AuthService,
	cfg *config.Config,
) *Resolver {
	return &Resolver{
		repo:          repo,
		userRepo:      userRepo,
		authTokenRepo: authTokenRepo,
		userStateRepo: userStateRepo,
		authService:   authService,
		validator:     validator.New(),
		config:        cfg,
	}
}
