package models

import "errors"

// Common application errors
var (
	// Authentication errors
	ErrInvalidCredentials     = errors.New("invalid email or password")
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrUsernameAlreadyExists  = errors.New("username already exists")
	ErrUserNotFound           = errors.New("user not found")
	ErrInvalidToken           = errors.New("invalid or expired token")
	ErrTokenExpired           = errors.New("token has expired")
	ErrTokenAlreadyUsed       = errors.New("token has already been used")
	ErrEmailNotVerified       = errors.New("email not verified")
	ErrUnauthorized           = errors.New("unauthorized")

	// Password errors
	ErrWeakPassword           = errors.New("password does not meet requirements")
	ErrPasswordTooShort       = errors.New("password must be at least 8 characters")
	ErrPasswordMissingUpper   = errors.New("password must contain at least one uppercase letter")
	ErrPasswordMissingLower   = errors.New("password must contain at least one lowercase letter")
	ErrPasswordMissingNumber  = errors.New("password must contain at least one number")
	ErrPasswordMissingSpecial = errors.New("password must contain at least one special character")

	// State errors
	ErrStateNotFound          = errors.New("state not found")
	ErrStateLimitReached      = errors.New("state limit reached")
	ErrStateAccessDenied      = errors.New("access to state denied")

	// GLB errors
	ErrGLBNotFound            = errors.New("custom GLB not found")
	ErrGLBLimitReached        = errors.New("GLB upload limit reached")
	ErrGLBStorageLimitReached = errors.New("GLB storage limit reached")
	ErrGLBPremiumOnly         = errors.New("custom GLB uploads require premium membership")
	ErrGLBAccessDenied        = errors.New("access to GLB denied")
	ErrInvalidFileType        = errors.New("invalid file type, only GLB/GLTF files allowed")
	ErrFileTooLarge           = errors.New("file size exceeds limit")

	// Payment errors
	ErrPaymentNotFound        = errors.New("payment not found")
	ErrPaymentFailed          = errors.New("payment failed")
	ErrAlreadyPremium         = errors.New("user is already premium")

	// Validation errors
	ErrInvalidEmail           = errors.New("invalid email format")
	ErrInvalidUsername        = errors.New("invalid username format")
	ErrInvalidInput           = errors.New("invalid input")
	ErrMissingField           = errors.New("required field missing")
)
