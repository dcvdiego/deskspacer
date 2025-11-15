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

	// Auth repositories
	userRepo      repository.UserRepositoryInterface
	authTokenRepo repository.AuthTokenRepositoryInterface
	userStateRepo *repository.UserStateRepository
	customGLBRepo *repository.CustomGLBRepository

	// Services
	authService    *service.AuthService
	emailService   service.EmailService
	storageService service.StorageService
	stripeService  service.StripeService

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
	customGLBRepo *repository.CustomGLBRepository,
	authService *service.AuthService,
	emailService service.EmailService,
	storageService service.StorageService,
	stripeService service.StripeService,
	cfg *config.Config,
) *Resolver {
	return &Resolver{
		repo:           repo,
		userRepo:       userRepo,
		authTokenRepo:  authTokenRepo,
		userStateRepo:  userStateRepo,
		customGLBRepo:  customGLBRepo,
		authService:    authService,
		emailService:   emailService,
		storageService: storageService,
		stripeService:  stripeService,
		validator:      validator.New(),
		config:         cfg,
	}
}
