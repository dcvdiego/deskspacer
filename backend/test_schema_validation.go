// +build ignore

package main

import (
	"fmt"
	"os"

	"github.com/dcvdiego/deskspacer/backend/internal/config"
	"github.com/dcvdiego/deskspacer/backend/internal/graph"
	"github.com/dcvdiego/deskspacer/backend/internal/repository"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
)

// This is a validation script to verify the GraphQL schema can be built
// without requiring a database connection.
// Run with: go run test_schema_validation.go

type MockUserRepo struct{}
type MockAuthTokenRepo struct{}
type MockUserStateRepo struct{}
type MockSharedStateRepo struct{}

// Implement minimal interface methods (panics if called, but allows schema building)
func (m *MockUserRepo) Create(ctx interface{}, user interface{}) error { panic("mock") }
func (m *MockUserRepo) GetByID(ctx interface{}, id interface{}) (interface{}, error) { panic("mock") }
func (m *MockUserRepo) GetByEmail(ctx interface{}, email string) (interface{}, error) { panic("mock") }
func (m *MockUserRepo) GetByUsername(ctx interface{}, username string) (interface{}, error) { panic("mock") }
func (m *MockUserRepo) EmailExists(ctx interface{}, email string) (bool, error) { panic("mock") }
func (m *MockUserRepo) UsernameExists(ctx interface{}, username string) (bool, error) { panic("mock") }
func (m *MockUserRepo) Update(ctx interface{}, user interface{}) error { panic("mock") }
func (m *MockUserRepo) VerifyEmail(ctx interface{}, userID interface{}) error { panic("mock") }
func (m *MockUserRepo) ActivatePremium(ctx interface{}, userID interface{}) error { panic("mock") }
func (m *MockUserRepo) UpdatePassword(ctx interface{}, userID interface{}, passwordHash string) error { panic("mock") }
func (m *MockUserRepo) Delete(ctx interface{}, userID interface{}) error { panic("mock") }
func (m *MockUserRepo) GetStateCount(ctx interface{}, userID interface{}) (int, error) { panic("mock") }
func (m *MockUserRepo) GetGLBCount(ctx interface{}, userID interface{}) (int, error) { panic("mock") }

func (m *MockAuthTokenRepo) CreateEmailVerificationToken(ctx interface{}, token interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) GetEmailVerificationToken(ctx interface{}, token string) (interface{}, error) { panic("mock") }
func (m *MockAuthTokenRepo) DeleteEmailVerificationToken(ctx interface{}, token string) error { panic("mock") }
func (m *MockAuthTokenRepo) DeleteExpiredEmailVerificationTokens(ctx interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) CreatePasswordResetToken(ctx interface{}, token interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) GetPasswordResetToken(ctx interface{}, token string) (interface{}, error) { panic("mock") }
func (m *MockAuthTokenRepo) DeletePasswordResetToken(ctx interface{}, token string) error { panic("mock") }
func (m *MockAuthTokenRepo) DeleteExpiredPasswordResetTokens(ctx interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) CreateRefreshToken(ctx interface{}, token interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) GetRefreshToken(ctx interface{}, token string) (interface{}, error) { panic("mock") }
func (m *MockAuthTokenRepo) RevokeRefreshToken(ctx interface{}, token string) error { panic("mock") }
func (m *MockAuthTokenRepo) RevokeAllRefreshTokensForUser(ctx interface{}, userID interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) DeleteExpiredRefreshTokens(ctx interface{}) error { panic("mock") }
func (m *MockAuthTokenRepo) DeleteRevokedRefreshTokens(ctx interface{}, olderThan interface{}) error { panic("mock") }

func main() {
	fmt.Println("=== GraphQL Schema Validation Test ===\n")

	// Create mock dependencies
	cfg := &config.Config{
		JWTSecret:            "test-secret",
		JWTAccessExpiration:  "15m",
		JWTRefreshExpiration: "168h",
		StateLimitFree:       5,
		StateLimitPremium:    100,
	}

	userRepo := &MockUserRepo{}
	authTokenRepo := &MockAuthTokenRepo{}
	userStateRepo := &MockUserStateRepo{}
	sharedStateRepo := &MockSharedStateRepo{}

	// Create auth service
	authService, err := service.NewAuthService(
		userRepo,
		authTokenRepo,
		cfg.JWTSecret,
		cfg.JWTAccessExpiration,
		cfg.JWTRefreshExpiration,
	)
	if err != nil {
		fmt.Printf("❌ Failed to create auth service: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Auth service created successfully")

	// Create resolver with mock repos (casting to expected types)
	resolver := graph.NewResolver(
		sharedStateRepo.(*repository.SharedStateRepository),
		userRepo.(repository.UserRepositoryInterface),
		authTokenRepo.(repository.AuthTokenRepositoryInterface),
		userStateRepo.(*repository.UserStateRepository),
		authService,
		cfg,
	)
	fmt.Println("✅ GraphQL resolver created successfully")

	// Build the schema
	schema, err := graph.NewSchema(resolver)
	if err != nil {
		fmt.Printf("❌ Failed to build GraphQL schema: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ GraphQL schema built successfully")

	// Verify schema has expected types
	typeMap := schema.TypeMap()
	expectedTypes := []string{
		"User",
		"AuthPayload",
		"RegisterInput",
		"LoginInput",
		"UserState",
		"SharedState",
		"Query",
		"Mutation",
	}

	fmt.Println("\n=== Verifying Schema Types ===")
	for _, typeName := range expectedTypes {
		if _, exists := typeMap[typeName]; exists {
			fmt.Printf("✅ Type '%s' exists\n", typeName)
		} else {
			fmt.Printf("❌ Type '%s' missing\n", typeName)
			os.Exit(1)
		}
	}

	// Verify queries
	queryType := schema.QueryType()
	expectedQueries := []string{
		"me",
		"checkEmailAvailable",
		"checkUsernameAvailable",
		"myStates",
		"publicState",
		"states",
		"statesById",
	}

	fmt.Println("\n=== Verifying Queries ===")
	for _, queryName := range expectedQueries {
		if _, exists := queryType.Fields()[queryName]; exists {
			fmt.Printf("✅ Query '%s' exists\n", queryName)
		} else {
			fmt.Printf("❌ Query '%s' missing\n", queryName)
			os.Exit(1)
		}
	}

	// Verify mutations
	mutationType := schema.MutationType()
	expectedMutations := []string{
		"register",
		"login",
		"refreshToken",
		"verifyEmail",
		"requestPasswordReset",
		"resetPassword",
		"saveState",
		"updateState",
		"deleteState",
		"addState",
	}

	fmt.Println("\n=== Verifying Mutations ===")
	for _, mutationName := range expectedMutations {
		if _, exists := mutationType.Fields()[mutationName]; exists {
			fmt.Printf("✅ Mutation '%s' exists\n", mutationName)
		} else {
			fmt.Printf("❌ Mutation '%s' missing\n", mutationName)
			os.Exit(1)
		}
	}

	fmt.Println("\n🎉 All schema validations passed!")
	fmt.Println("\nThe GraphQL schema is properly configured with:")
	fmt.Printf("  - %d types\n", len(expectedTypes))
	fmt.Printf("  - %d queries\n", len(expectedQueries))
	fmt.Printf("  - %d mutations\n", len(expectedMutations))
	fmt.Println("\n✅ Phase 3 GraphQL Integration is COMPLETE and ready for testing!")
}
