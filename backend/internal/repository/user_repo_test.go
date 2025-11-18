package repository

import (
	"context"
	"testing"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/google/uuid"
)

// Note: These tests require a running PostgreSQL database
// See PHASE2_TESTING.md for setup instructions

// TestUserRepository_Create tests user creation
func TestUserRepository_Create(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("test@example.com", "testuser", "hashedpassword")

	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Verify user was created
	retrieved, err := repo.GetByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve user: %v", err)
	}

	if retrieved.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, retrieved.Email)
	}

	if retrieved.Username != user.Username {
		t.Errorf("Expected username %s, got %s", user.Username, retrieved.Username)
	}
}

// TestUserRepository_GetByEmail tests email lookup
func TestUserRepository_GetByEmail(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("email@example.com", "emailuser", "hashedpassword")
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Retrieve by email
	retrieved, err := repo.GetByEmail(ctx, "email@example.com")
	if err != nil {
		t.Fatalf("Failed to retrieve user by email: %v", err)
	}

	if retrieved.ID != user.ID {
		t.Errorf("Expected ID %v, got %v", user.ID, retrieved.ID)
	}

	// Test non-existent email
	_, err = repo.GetByEmail(ctx, "nonexistent@example.com")
	if err != models.ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound, got %v", err)
	}
}

// TestUserRepository_EmailExists tests duplicate email checking
func TestUserRepository_EmailExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("exists@example.com", "existsuser", "hashedpassword")
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Check existing email
	exists, err := repo.EmailExists(ctx, "exists@example.com")
	if err != nil {
		t.Fatalf("EmailExists failed: %v", err)
	}
	if !exists {
		t.Error("Email should exist")
	}

	// Check non-existent email
	exists, err = repo.EmailExists(ctx, "notexists@example.com")
	if err != nil {
		t.Fatalf("EmailExists failed: %v", err)
	}
	if exists {
		t.Error("Email should not exist")
	}
}

// TestUserRepository_VerifyEmail tests email verification
func TestUserRepository_VerifyEmail(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("verify@example.com", "verifyuser", "hashedpassword")
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Verify email is initially false
	retrieved, _ := repo.GetByID(ctx, user.ID)
	if retrieved.EmailVerified {
		t.Error("Email should not be verified initially")
	}

	// Verify email
	err = repo.VerifyEmail(ctx, user.ID)
	if err != nil {
		t.Fatalf("Failed to verify email: %v", err)
	}

	// Check email is now verified
	retrieved, _ = repo.GetByID(ctx, user.ID)
	if !retrieved.EmailVerified {
		t.Error("Email should be verified")
	}
}

// TestUserRepository_ActivatePremium tests premium activation
func TestUserRepository_ActivatePremium(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("premium@example.com", "premiumuser", "hashedpassword")
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Check initially not premium
	retrieved, _ := repo.GetByID(ctx, user.ID)
	if retrieved.IsPremium {
		t.Error("User should not be premium initially")
	}

	// Activate premium
	err = repo.ActivatePremium(ctx, user.ID)
	if err != nil {
		t.Fatalf("Failed to activate premium: %v", err)
	}

	// Check premium is now active
	retrieved, _ = repo.GetByID(ctx, user.ID)
	if !retrieved.IsPremium {
		t.Error("User should be premium")
	}
	if retrieved.PremiumActivatedAt == nil {
		t.Error("Premium activation date should be set")
	}
}

// TestUserRepository_Delete tests user deletion with cascades
func TestUserRepository_Delete(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	user := models.NewUser("delete@example.com", "deleteuser", "hashedpassword")
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Delete user
	err = repo.Delete(ctx, user.ID)
	if err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}

	// Verify user is deleted
	_, err = repo.GetByID(ctx, user.ID)
	if err != models.ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound after deletion, got %v", err)
	}
}

// setupTestDB creates a test database connection
// This is a placeholder - you'll need to implement based on your test DB setup
func setupTestDB(t *testing.T) interface{} {
	t.Helper()

	// TODO: Implement test database setup
	// This should:
	// 1. Connect to a test PostgreSQL database
	// 2. Run migrations
	// 3. Clean up test data before each test
	// 4. Return a pgxpool.Pool

	t.Skip("Test database not configured. See PHASE2_TESTING.md for setup instructions.")
	return nil
}
