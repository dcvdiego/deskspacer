package service

import (
	"context"
	"testing"
	"time"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/google/uuid"
)

// MockUserRepository for testing
type MockUserRepository struct {
	users map[uuid.UUID]*models.User
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users: make(map[uuid.UUID]*models.User),
	}
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
	m.users[user.ID] = user
	return nil
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, exists := m.users[id]
	if !exists {
		return nil, models.ErrUserNotFound
	}
	return user, nil
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	for _, user := range m.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, models.ErrUserNotFound
}

func (m *MockUserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	_, err := m.GetByEmail(ctx, email)
	return err == nil, nil
}

func (m *MockUserRepository) UsernameExists(ctx context.Context, username string) (bool, error) {
	for _, user := range m.users {
		if user.Username == username {
			return true, nil
		}
	}
	return false, nil
}

func (m *MockUserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	for _, user := range m.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, models.ErrUserNotFound
}

func (m *MockUserRepository) Update(ctx context.Context, user *models.User) error {
	m.users[user.ID] = user
	return nil
}

func (m *MockUserRepository) VerifyEmail(ctx context.Context, userID uuid.UUID) error {
	if user, exists := m.users[userID]; exists {
		user.EmailVerified = true
		return nil
	}
	return models.ErrUserNotFound
}

func (m *MockUserRepository) ActivatePremium(ctx context.Context, userID uuid.UUID) error {
	if user, exists := m.users[userID]; exists {
		user.IsPremium = true
		now := time.Now()
		user.PremiumActivatedAt = &now
		return nil
	}
	return models.ErrUserNotFound
}

func (m *MockUserRepository) UpdatePremiumStatus(ctx context.Context, userID uuid.UUID, isPremium bool) error {
	if user, exists := m.users[userID]; exists {
		user.IsPremium = isPremium
		if isPremium {
			now := time.Now()
			user.PremiumActivatedAt = &now
		}
		return nil
	}
	return models.ErrUserNotFound
}

func (m *MockUserRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	if user, exists := m.users[userID]; exists {
		user.PasswordHash = passwordHash
		return nil
	}
	return models.ErrUserNotFound
}

func (m *MockUserRepository) Delete(ctx context.Context, userID uuid.UUID) error {
	delete(m.users, userID)
	return nil
}

func (m *MockUserRepository) GetStateCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return 0, nil
}

func (m *MockUserRepository) GetGLBCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return 0, nil
}

// MockAuthTokenRepository for testing
type MockAuthTokenRepository struct {
	refreshTokens map[string]*models.RefreshToken
}

func NewMockAuthTokenRepository() *MockAuthTokenRepository {
	return &MockAuthTokenRepository{
		refreshTokens: make(map[string]*models.RefreshToken),
	}
}

func (m *MockAuthTokenRepository) CreateRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	m.refreshTokens[token.Token] = token
	return nil
}

func (m *MockAuthTokenRepository) GetRefreshToken(ctx context.Context, token string) (*models.RefreshToken, error) {
	t, exists := m.refreshTokens[token]
	if !exists {
		return nil, models.ErrInvalidToken
	}
	return t, nil
}

func (m *MockAuthTokenRepository) RevokeRefreshToken(ctx context.Context, token string) error {
	if t, exists := m.refreshTokens[token]; exists {
		t.Revoke()
	}
	return nil
}

func (m *MockAuthTokenRepository) RevokeAllRefreshTokensForUser(ctx context.Context, userID uuid.UUID) error {
	for _, token := range m.refreshTokens {
		if token.UserID == userID {
			token.Revoke()
		}
	}
	return nil
}

func (m *MockAuthTokenRepository) CreateEmailVerificationToken(ctx context.Context, token *models.EmailVerificationToken) error {
	return nil
}

func (m *MockAuthTokenRepository) GetEmailVerificationToken(ctx context.Context, token string) (*models.EmailVerificationToken, error) {
	return nil, models.ErrInvalidToken
}

func (m *MockAuthTokenRepository) DeleteEmailVerificationToken(ctx context.Context, token string) error {
	return nil
}

func (m *MockAuthTokenRepository) DeleteEmailVerificationTokensByUserID(ctx context.Context, userID uuid.UUID) error {
	return nil
}

func (m *MockAuthTokenRepository) CreatePasswordResetToken(ctx context.Context, token *models.PasswordResetToken) error {
	return nil
}

func (m *MockAuthTokenRepository) GetPasswordResetToken(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	return nil, models.ErrInvalidToken
}

func (m *MockAuthTokenRepository) MarkPasswordResetTokenAsUsed(ctx context.Context, token string) error {
	return nil
}

func (m *MockAuthTokenRepository) DeletePasswordResetTokensByUserID(ctx context.Context, userID uuid.UUID) error {
	return nil
}

func (m *MockAuthTokenRepository) DeleteExpiredTokens(ctx context.Context) (int64, error) {
	return 0, nil
}

// Test Password Hashing
func TestHashPassword(t *testing.T) {
	authService := setupAuthService()

	password := "MySecurePassword123!"
	hash, err := authService.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == "" {
		t.Fatal("Hash should not be empty")
	}

	if hash == password {
		t.Fatal("Hash should not equal plaintext password")
	}
}

// Test Password Validation
func TestValidatePassword(t *testing.T) {
	authService := setupAuthService()

	password := "MySecurePassword123!"
	hash, _ := authService.HashPassword(password)

	// Test correct password
	if !authService.ValidatePassword(hash, password) {
		t.Fatal("Valid password should pass validation")
	}

	// Test incorrect password
	if authService.ValidatePassword(hash, "WrongPassword") {
		t.Fatal("Invalid password should fail validation")
	}
}

// Test Password Strength Validation
func TestValidatePasswordStrength(t *testing.T) {
	authService := setupAuthService()

	tests := []struct {
		name        string
		password    string
		shouldError bool
		expectedErr error
	}{
		{"Valid password", "SecurePass123!", false, nil},
		{"Too short", "Short1!", true, models.ErrPasswordTooShort},
		{"Missing uppercase", "lowercase123!", true, models.ErrPasswordMissingUpper},
		{"Missing lowercase", "UPPERCASE123!", true, models.ErrPasswordMissingLower},
		{"Missing number", "NoNumbers!", true, models.ErrPasswordMissingNumber},
		{"Missing special", "NoSpecial123", true, models.ErrPasswordMissingSpecial},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := authService.ValidatePasswordStrength(tt.password)
			if tt.shouldError && err == nil {
				t.Fatalf("Expected error for password '%s'", tt.password)
			}
			if !tt.shouldError && err != nil {
				t.Fatalf("Unexpected error for password '%s': %v", tt.password, err)
			}
			if tt.shouldError && err != tt.expectedErr {
				t.Fatalf("Expected error %v, got %v", tt.expectedErr, err)
			}
		})
	}
}

// Test Access Token Generation and Validation
func TestAccessToken(t *testing.T) {
	authService := setupAuthService()

	user := models.NewUser("test@example.com", "testuser", "hashedpassword")

	// Generate token
	token, err := authService.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("Failed to generate access token: %v", err)
	}

	if token == "" {
		t.Fatal("Token should not be empty")
	}

	// Validate token
	claims, err := authService.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("Failed to validate access token: %v", err)
	}

	if claims.UserID != user.ID {
		t.Fatalf("Expected UserID %v, got %v", user.ID, claims.UserID)
	}

	if claims.Email != user.Email {
		t.Fatalf("Expected Email %v, got %v", user.Email, claims.Email)
	}
}

// Test Invalid Token
func TestInvalidAccessToken(t *testing.T) {
	authService := setupAuthService()

	invalidTokens := []string{
		"",
		"invalid.token.here",
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
	}

	for _, token := range invalidTokens {
		_, err := authService.ValidateAccessToken(token)
		if err == nil {
			t.Fatalf("Invalid token should fail validation: %s", token)
		}
	}
}

// Test User Registration
func TestRegister(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	user, accessToken, refreshToken, err := authService.Register(ctx, "newuser@example.com", "newuser", "SecurePass123!")
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	if user == nil {
		t.Fatal("User should not be nil")
	}

	if user.Email != "newuser@example.com" {
		t.Fatalf("Expected email newuser@example.com, got %s", user.Email)
	}

	if user.Username != "newuser" {
		t.Fatalf("Expected username newuser, got %s", user.Username)
	}

	if accessToken == "" {
		t.Fatal("Access token should not be empty")
	}

	if refreshToken == "" {
		t.Fatal("Refresh token should not be empty")
	}

	// Verify tokens work
	claims, err := authService.ValidateAccessToken(accessToken)
	if err != nil {
		t.Fatalf("Access token validation failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Fatal("Token user ID does not match")
	}
}

// Test Duplicate Email Registration
func TestRegisterDuplicateEmail(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	// Register first user
	_, _, _, err := authService.Register(ctx, "duplicate@example.com", "user1", "SecurePass123!")
	if err != nil {
		t.Fatalf("First registration failed: %v", err)
	}

	// Try to register with same email
	_, _, _, err = authService.Register(ctx, "duplicate@example.com", "user2", "SecurePass456!")
	if err != models.ErrEmailAlreadyExists {
		t.Fatalf("Expected ErrEmailAlreadyExists, got %v", err)
	}
}

// Test Duplicate Username Registration
func TestRegisterDuplicateUsername(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	// Register first user
	_, _, _, err := authService.Register(ctx, "user1@example.com", "sameusername", "SecurePass123!")
	if err != nil {
		t.Fatalf("First registration failed: %v", err)
	}

	// Try to register with same username
	_, _, _, err = authService.Register(ctx, "user2@example.com", "sameusername", "SecurePass456!")
	if err != models.ErrUsernameAlreadyExists {
		t.Fatalf("Expected ErrUsernameAlreadyExists, got %v", err)
	}
}

// Test Login
func TestLogin(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	email := "login@example.com"
	password := "SecurePass123!"

	// Register user first
	_, _, _, err := authService.Register(ctx, email, "loginuser", password)
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	// Login
	user, accessToken, refreshToken, err := authService.Login(ctx, email, password)
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	if user == nil {
		t.Fatal("User should not be nil")
	}

	if user.Email != email {
		t.Fatalf("Expected email %s, got %s", email, user.Email)
	}

	if accessToken == "" {
		t.Fatal("Access token should not be empty")
	}

	if refreshToken == "" {
		t.Fatal("Refresh token should not be empty")
	}
}

// Test Login with Invalid Credentials
func TestLoginInvalidCredentials(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	email := "invalid@example.com"
	password := "SecurePass123!"

	// Register user
	_, _, _, err := authService.Register(ctx, email, "invaliduser", password)
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	// Try login with wrong password
	_, _, _, err = authService.Login(ctx, email, "WrongPassword123!")
	if err != models.ErrInvalidCredentials {
		t.Fatalf("Expected ErrInvalidCredentials, got %v", err)
	}

	// Try login with non-existent email
	_, _, _, err = authService.Login(ctx, "nonexistent@example.com", password)
	if err != models.ErrInvalidCredentials {
		t.Fatalf("Expected ErrInvalidCredentials, got %v", err)
	}
}

// Test Token Refresh
func TestRefreshAccessToken(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	// Register user
	user, _, refreshToken, err := authService.Register(ctx, "refresh@example.com", "refreshuser", "SecurePass123!")
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	// Wait a bit to ensure new token has different timestamp
	time.Sleep(time.Second)

	// Refresh access token
	newAccessToken, err := authService.RefreshAccessToken(ctx, refreshToken)
	if err != nil {
		t.Fatalf("Token refresh failed: %v", err)
	}

	if newAccessToken == "" {
		t.Fatal("New access token should not be empty")
	}

	// Validate new token
	claims, err := authService.ValidateAccessToken(newAccessToken)
	if err != nil {
		t.Fatalf("New access token validation failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Fatal("New token user ID does not match")
	}
}

// Test Token Revocation
func TestRevokeRefreshToken(t *testing.T) {
	authService := setupAuthService()
	ctx := context.Background()

	// Register user
	_, _, refreshToken, err := authService.Register(ctx, "revoke@example.com", "revokeuser", "SecurePass123!")
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	// Revoke token
	err = authService.RevokeRefreshToken(ctx, refreshToken)
	if err != nil {
		t.Fatalf("Token revocation failed: %v", err)
	}

	// Try to use revoked token
	_, err = authService.RefreshAccessToken(ctx, refreshToken)
	if err == nil {
		t.Fatal("Revoked token should not work")
	}
}

// Helper function to setup AuthService with mocks
func setupAuthService() *AuthService {
	userRepo := NewMockUserRepository()
	tokenRepo := NewMockAuthTokenRepository()

	authService, err := NewAuthService(
		userRepo,
		tokenRepo,
		"test-secret-key-for-jwt-tokens",
		"15m",
		"168h",
	)

	if err != nil {
		panic(err)
	}

	return authService
}
