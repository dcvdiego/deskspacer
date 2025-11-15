package graph

import (
	"fmt"

	"github.com/dcvdiego/deskspacer/backend/internal/middleware"
	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/graphql-go/graphql"
)

// ====================
// Input Type Parsers
// ====================

// parseRegisterInput parses the RegisterInput from GraphQL args
func parseRegisterInput(args map[string]interface{}) (email, username, password string, err error) {
	input, ok := args["input"].(map[string]interface{})
	if !ok {
		return "", "", "", fmt.Errorf("invalid input format")
	}

	email, ok = input["email"].(string)
	if !ok {
		return "", "", "", fmt.Errorf("email is required")
	}

	username, ok = input["username"].(string)
	if !ok {
		return "", "", "", fmt.Errorf("username is required")
	}

	password, ok = input["password"].(string)
	if !ok {
		return "", "", "", fmt.Errorf("password is required")
	}

	return email, username, password, nil
}

// parseLoginInput parses the LoginInput from GraphQL args
func parseLoginInput(args map[string]interface{}) (email, password string, err error) {
	input, ok := args["input"].(map[string]interface{})
	if !ok {
		return "", "", fmt.Errorf("invalid input format")
	}

	email, ok = input["email"].(string)
	if !ok {
		return "", "", fmt.Errorf("email is required")
	}

	password, ok = input["password"].(string)
	if !ok {
		return "", "", fmt.Errorf("password is required")
	}

	return email, password, nil
}

// ====================
// Auth Mutation Resolvers
// ====================

// Register handles user registration
func (r *Resolver) Register(params graphql.ResolveParams) (interface{}, error) {
	// Parse input
	email, username, password, err := parseRegisterInput(params.Args)
	if err != nil {
		return nil, err
	}

	// Call auth service to register user
	user, accessToken, refreshToken, err := r.authService.Register(params.Context, email, username, password)
	if err != nil {
		// Return user-friendly error messages
		switch err {
		case models.ErrEmailAlreadyExists:
			return nil, fmt.Errorf("email already registered")
		case models.ErrUsernameAlreadyExists:
			return nil, fmt.Errorf("username already taken")
		case models.ErrPasswordTooShort,
			models.ErrPasswordMissingUpper,
			models.ErrPasswordMissingLower,
			models.ErrPasswordMissingNumber,
			models.ErrPasswordMissingSpecial:
			return nil, fmt.Errorf("password does not meet requirements: %v", err)
		default:
			return nil, fmt.Errorf("registration failed: %v", err)
		}
	}

	// Get additional user stats
	stateCount, _ := r.userRepo.GetStateCount(params.Context, user.ID)
	glbCount, _ := r.userRepo.GetGLBCount(params.Context, user.ID)

	// Return AuthPayload
	return map[string]interface{}{
		"user": map[string]interface{}{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"emailVerified": user.EmailVerified,
			"isPremium":     user.IsPremium,
			"stateCount":    stateCount,
			"glbCount":      glbCount,
			"storageUsed":   user.StorageUsedBytes,
			"createdAt":     user.CreatedAt,
		},
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}, nil
}

// Login handles user authentication
func (r *Resolver) Login(params graphql.ResolveParams) (interface{}, error) {
	// Parse input
	email, password, err := parseLoginInput(params.Args)
	if err != nil {
		return nil, err
	}

	// Call auth service to login user
	user, accessToken, refreshToken, err := r.authService.Login(params.Context, email, password)
	if err != nil {
		if err == models.ErrInvalidCredentials {
			return nil, fmt.Errorf("invalid email or password")
		}
		return nil, fmt.Errorf("login failed: %v", err)
	}

	// Get additional user stats
	stateCount, _ := r.userRepo.GetStateCount(params.Context, user.ID)
	glbCount, _ := r.userRepo.GetGLBCount(params.Context, user.ID)

	// Return AuthPayload
	return map[string]interface{}{
		"user": map[string]interface{}{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"emailVerified": user.EmailVerified,
			"isPremium":     user.IsPremium,
			"stateCount":    stateCount,
			"glbCount":      glbCount,
			"storageUsed":   user.StorageUsedBytes,
			"createdAt":     user.CreatedAt,
		},
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}, nil
}

// RefreshToken handles access token refresh
func (r *Resolver) RefreshToken(params graphql.ResolveParams) (interface{}, error) {
	// Get refresh token from args
	refreshToken, ok := params.Args["refreshToken"].(string)
	if !ok {
		return nil, fmt.Errorf("refreshToken is required")
	}

	// Refresh access token
	newAccessToken, err := r.authService.RefreshAccessToken(params.Context, refreshToken)
	if err != nil {
		if err == models.ErrInvalidToken || err == models.ErrTokenExpired {
			return nil, fmt.Errorf("invalid or expired refresh token")
		}
		return nil, fmt.Errorf("token refresh failed: %v", err)
	}

	// Validate the refresh token to get user ID
	userID, err := r.authService.ValidateRefreshToken(params.Context, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Get user
	user, err := r.userRepo.GetByID(params.Context, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Get additional user stats
	stateCount, _ := r.userRepo.GetStateCount(params.Context, user.ID)
	glbCount, _ := r.userRepo.GetGLBCount(params.Context, user.ID)

	// Return AuthPayload with new access token
	return map[string]interface{}{
		"user": map[string]interface{}{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"emailVerified": user.EmailVerified,
			"isPremium":     user.IsPremium,
			"stateCount":    stateCount,
			"glbCount":      glbCount,
			"storageUsed":   user.StorageUsedBytes,
			"createdAt":     user.CreatedAt,
		},
		"accessToken":  newAccessToken,
		"refreshToken": refreshToken, // Return the same refresh token
	}, nil
}

// VerifyEmail handles email verification
func (r *Resolver) VerifyEmail(params graphql.ResolveParams) (interface{}, error) {
	// Get token from args
	token, ok := params.Args["token"].(string)
	if !ok {
		return nil, fmt.Errorf("token is required")
	}

	// Get verification token from database
	verificationToken, err := r.authTokenRepo.GetEmailVerificationToken(params.Context, token)
	if err != nil {
		if err == models.ErrInvalidToken {
			return false, fmt.Errorf("invalid or expired verification token")
		}
		return false, err
	}

	// Check if token is expired
	if verificationToken.IsExpired() {
		return false, fmt.Errorf("verification token has expired")
	}

	// Verify the user's email
	err = r.userRepo.VerifyEmail(params.Context, verificationToken.UserID)
	if err != nil {
		return false, err
	}

	// Delete the used token
	_ = r.authTokenRepo.DeleteEmailVerificationToken(params.Context, token)

	return true, nil
}

// RequestPasswordReset handles password reset request
func (r *Resolver) RequestPasswordReset(params graphql.ResolveParams) (interface{}, error) {
	// Get email from args
	email, ok := params.Args["email"].(string)
	if !ok {
		return nil, fmt.Errorf("email is required")
	}

	// Check if user exists
	user, err := r.userRepo.GetByEmail(params.Context, email)
	if err != nil {
		// Don't reveal if email exists or not (security best practice)
		// Always return true
		return true, nil
	}

	// Generate password reset token
	resetToken, err := models.NewPasswordResetToken(user.ID)
	if err != nil {
		return false, err
	}

	// Save token to database
	err = r.authTokenRepo.CreatePasswordResetToken(params.Context, resetToken)
	if err != nil {
		return false, err
	}

	// TODO: Send password reset email (Phase 4 - Email Service)
	// For now, just return success

	return true, nil
}

// ResetPassword handles password reset
func (r *Resolver) ResetPassword(params graphql.ResolveParams) (interface{}, error) {
	// Get args
	token, ok := params.Args["token"].(string)
	if !ok {
		return nil, fmt.Errorf("token is required")
	}

	newPassword, ok := params.Args["newPassword"].(string)
	if !ok {
		return nil, fmt.Errorf("newPassword is required")
	}

	// Validate password strength
	err := r.authService.ValidatePasswordStrength(newPassword)
	if err != nil {
		return false, fmt.Errorf("password does not meet requirements: %v", err)
	}

	// Get reset token from database
	resetToken, err := r.authTokenRepo.GetPasswordResetToken(params.Context, token)
	if err != nil {
		if err == models.ErrInvalidToken {
			return false, fmt.Errorf("invalid or expired reset token")
		}
		return false, err
	}

	// Check if token can be used
	if !resetToken.CanUse() {
		return false, fmt.Errorf("reset token has expired or already been used")
	}

	// Hash new password
	passwordHash, err := r.authService.HashPassword(newPassword)
	if err != nil {
		return false, err
	}

	// Update user's password
	err = r.userRepo.UpdatePassword(params.Context, resetToken.UserID, passwordHash)
	if err != nil {
		return false, err
	}

	// Mark token as used
	_ = r.authTokenRepo.MarkPasswordResetTokenAsUsed(params.Context, token)

	// Revoke all refresh tokens for security
	_ = r.authTokenRepo.RevokeAllRefreshTokensForUser(params.Context, resetToken.UserID)

	return true, nil
}

// ====================
// Auth Query Resolvers
// ====================

// Me returns the currently authenticated user
func (r *Resolver) Me(params graphql.ResolveParams) (interface{}, error) {
	// Get user from context (injected by auth middleware)
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("not authenticated")
	}

	// Get full user from database
	fullUser, err := r.userRepo.GetByID(params.Context, user.ID)
	if err != nil {
		return nil, err
	}

	// Get additional stats
	stateCount, _ := r.userRepo.GetStateCount(params.Context, fullUser.ID)
	glbCount, _ := r.userRepo.GetGLBCount(params.Context, fullUser.ID)

	return map[string]interface{}{
		"id":            fullUser.ID,
		"email":         fullUser.Email,
		"username":      fullUser.Username,
		"emailVerified": fullUser.EmailVerified,
		"isPremium":     fullUser.IsPremium,
		"stateCount":    stateCount,
		"glbCount":      glbCount,
		"storageUsed":   fullUser.StorageUsedBytes,
		"createdAt":     fullUser.CreatedAt,
	}, nil
}

// CheckEmailAvailable checks if an email is available for registration
func (r *Resolver) CheckEmailAvailable(params graphql.ResolveParams) (interface{}, error) {
	email, ok := params.Args["email"].(string)
	if !ok {
		return nil, fmt.Errorf("email is required")
	}

	exists, err := r.userRepo.EmailExists(params.Context, email)
	if err != nil {
		return nil, err
	}

	// Return true if email is available (doesn't exist)
	return !exists, nil
}

// CheckUsernameAvailable checks if a username is available for registration
func (r *Resolver) CheckUsernameAvailable(params graphql.ResolveParams) (interface{}, error) {
	username, ok := params.Args["username"].(string)
	if !ok {
		return nil, fmt.Errorf("username is required")
	}

	exists, err := r.userRepo.UsernameExists(params.Context, username)
	if err != nil {
		return nil, err
	}

	// Return true if username is available (doesn't exist)
	return !exists, nil
}
