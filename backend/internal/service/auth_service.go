package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"time"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/dcvdiego/deskspacer/backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// JWTClaims represents the claims in the JWT token
type JWTClaims struct {
	UserID        uuid.UUID `json:"userId"`
	Email         string    `json:"email"`
	IsPremium     bool      `json:"isPremium"`
	EmailVerified bool      `json:"emailVerified"`
	jwt.RegisteredClaims
}

// AuthService handles authentication business logic
type AuthService struct {
	userRepo         *repository.UserRepository
	tokenRepo        *repository.AuthTokenRepository
	jwtSecret        []byte
	accessExpiration  time.Duration
	refreshExpiration time.Duration
}

// NewAuthService creates a new AuthService
func NewAuthService(
	userRepo *repository.UserRepository,
	tokenRepo *repository.AuthTokenRepository,
	jwtSecret string,
	accessExpiration string,
	refreshExpiration string,
) (*AuthService, error) {
	accessDuration, err := time.ParseDuration(accessExpiration)
	if err != nil {
		return nil, fmt.Errorf("invalid access token expiration: %w", err)
	}

	refreshDuration, err := time.ParseDuration(refreshExpiration)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token expiration: %w", err)
	}

	return &AuthService{
		userRepo:          userRepo,
		tokenRepo:         tokenRepo,
		jwtSecret:         []byte(jwtSecret),
		accessExpiration:  accessDuration,
		refreshExpiration: refreshDuration,
	}, nil
}

// =============================
// Password Hashing & Validation
// =============================

// HashPassword hashes a password using bcrypt with cost 12
func (s *AuthService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		return "", err
	}
	return string(hash), nil
}

// ValidatePassword compares a hash with a plaintext password
func (s *AuthService) ValidatePassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ValidatePasswordStrength checks if password meets security requirements
func (s *AuthService) ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return models.ErrPasswordTooShort
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUpper {
		return models.ErrPasswordMissingUpper
	}

	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasLower {
		return models.ErrPasswordMissingLower
	}

	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasNumber {
		return models.ErrPasswordMissingNumber
	}

	hasSpecial := regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(password)
	if !hasSpecial {
		return models.ErrPasswordMissingSpecial
	}

	return nil
}

// =============================
// JWT Token Generation
// =============================

// GenerateTokenPair creates both access and refresh tokens for a user
func (s *AuthService) GenerateTokenPair(ctx context.Context, user *models.User) (accessToken, refreshToken string, err error) {
	// Generate access token (short-lived)
	accessToken, err = s.GenerateAccessToken(user)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token (long-lived)
	refreshToken, expiresAt, err := s.GenerateRefreshToken(ctx, user.ID)
	if err != nil {
		return "", "", err
	}

	// Store refresh token in database
	refreshTokenModel := models.NewRefreshToken(user.ID, refreshToken, expiresAt)
	err = s.tokenRepo.CreateRefreshToken(ctx, refreshTokenModel)
	if err != nil {
		return "", "", err
	}

	slog.Info("Token pair generated", "userID", user.ID, "email", user.Email)
	return accessToken, refreshToken, nil
}

// GenerateAccessToken creates a short-lived JWT access token
func (s *AuthService) GenerateAccessToken(user *models.User) (string, error) {
	expiresAt := time.Now().Add(s.accessExpiration)

	claims := JWTClaims{
		UserID:        user.ID,
		Email:         user.Email,
		IsPremium:     user.IsPremium,
		EmailVerified: user.EmailVerified,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		slog.Error("Failed to sign access token", "error", err)
		return "", err
	}

	return signedToken, nil
}

// GenerateRefreshToken creates a long-lived refresh token
func (s *AuthService) GenerateRefreshToken(ctx context.Context, userID uuid.UUID) (string, time.Time, error) {
	expiresAt := time.Now().Add(s.refreshExpiration)

	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   userID.String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		slog.Error("Failed to sign refresh token", "error", err)
		return "", time.Time{}, err
	}

	return signedToken, expiresAt, nil
}

// =============================
// JWT Token Validation
// =============================

// ValidateAccessToken validates and parses an access token
func (s *AuthService) ValidateAccessToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, models.ErrTokenExpired
		}
		slog.Warn("Invalid access token", "error", err)
		return nil, models.ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, models.ErrInvalidToken
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token and returns the user ID
func (s *AuthService) ValidateRefreshToken(ctx context.Context, tokenString string) (uuid.UUID, error) {
	// First validate JWT signature and expiration
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return uuid.Nil, models.ErrTokenExpired
		}
		return uuid.Nil, models.ErrInvalidToken
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return uuid.Nil, models.ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, models.ErrInvalidToken
	}

	// Check if token is in database and not revoked
	storedToken, err := s.tokenRepo.GetRefreshToken(ctx, tokenString)
	if err != nil {
		return uuid.Nil, err
	}

	if !storedToken.IsValid() {
		return uuid.Nil, models.ErrInvalidToken
	}

	return userID, nil
}

// =============================
// Token Refresh Flow
// =============================

// RefreshAccessToken uses a refresh token to generate a new access token
func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshTokenString string) (string, error) {
	// Validate refresh token
	userID, err := s.ValidateRefreshToken(ctx, refreshTokenString)
	if err != nil {
		return "", err
	}

	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", err
	}

	// Generate new access token
	accessToken, err := s.GenerateAccessToken(user)
	if err != nil {
		return "", err
	}

	slog.Info("Access token refreshed", "userID", user.ID)
	return accessToken, nil
}

// RevokeRefreshToken revokes a refresh token
func (s *AuthService) RevokeRefreshToken(ctx context.Context, tokenString string) error {
	return s.tokenRepo.RevokeRefreshToken(ctx, tokenString)
}

// RevokeAllUserTokens revokes all refresh tokens for a user (for logout all devices)
func (s *AuthService) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	return s.tokenRepo.RevokeAllRefreshTokensForUser(ctx, userID)
}

// =============================
// Registration & Login
// =============================

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, email, username, password string) (*models.User, string, string, error) {
	// Validate password strength
	if err := s.ValidatePasswordStrength(password); err != nil {
		return nil, "", "", err
	}

	// Check if email already exists
	exists, err := s.userRepo.EmailExists(ctx, email)
	if err != nil {
		return nil, "", "", err
	}
	if exists {
		return nil, "", "", models.ErrEmailAlreadyExists
	}

	// Check if username already exists
	exists, err = s.userRepo.UsernameExists(ctx, username)
	if err != nil {
		return nil, "", "", err
	}
	if exists {
		return nil, "", "", models.ErrUsernameAlreadyExists
	}

	// Hash password
	passwordHash, err := s.HashPassword(password)
	if err != nil {
		return nil, "", "", err
	}

	// Create user
	user := models.NewUser(email, username, passwordHash)
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", "", err
	}

	// Generate email verification token
	verificationToken, err := models.NewEmailVerificationToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}
	if err := s.tokenRepo.CreateEmailVerificationToken(ctx, verificationToken); err != nil {
		slog.Error("Failed to create verification token", "error", err)
	}

	// Generate JWT token pair
	accessToken, refreshToken, err := s.GenerateTokenPair(ctx, user)
	if err != nil {
		return nil, "", "", err
	}

	slog.Info("User registered", "id", user.ID, "email", email, "username", username)
	return user, accessToken, refreshToken, nil
}

// Login authenticates a user with email and password
func (s *AuthService) Login(ctx context.Context, email, password string) (*models.User, string, string, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, models.ErrUserNotFound) {
			return nil, "", "", models.ErrInvalidCredentials
		}
		return nil, "", "", err
	}

	// Validate password
	if !s.ValidatePassword(user.PasswordHash, password) {
		slog.Warn("Invalid login attempt", "email", email)
		return nil, "", "", models.ErrInvalidCredentials
	}

	// Generate token pair
	accessToken, refreshToken, err := s.GenerateTokenPair(ctx, user)
	if err != nil {
		return nil, "", "", err
	}

	slog.Info("User logged in", "id", user.ID, "email", email)
	return user, accessToken, refreshToken, nil
}
