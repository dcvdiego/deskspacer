package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
)

// ContextKey type for context keys
type ContextKey string

const (
	// UserContextKey is the context key for the authenticated user
	UserContextKey ContextKey = "user"
	// UserIDContextKey is the context key for the authenticated user ID
	UserIDContextKey ContextKey = "userID"
)

// RequireAuth is middleware that requires a valid JWT token
func RequireAuth(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				slog.Warn("Missing Authorization header", "path", r.URL.Path)
				http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
				return
			}

			// Expected format: "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				slog.Warn("Invalid Authorization header format", "path", r.URL.Path)
				http.Error(w, "Unauthorized: invalid token format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := authService.ValidateAccessToken(tokenString)
			if err != nil {
				slog.Warn("Invalid access token", "error", err, "path", r.URL.Path)
				if err == models.ErrTokenExpired {
					http.Error(w, "Unauthorized: token expired", http.StatusUnauthorized)
				} else {
					http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
				}
				return
			}

			// Add user info to context
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDContextKey, claims.UserID)
			ctx = context.WithValue(ctx, UserContextKey, claims)

			// Continue to next handler
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext extracts the user ID from the request context
func GetUserIDFromContext(ctx context.Context) (*models.User, bool) {
	claims, ok := ctx.Value(UserContextKey).(*service.JWTClaims)
	if !ok {
		return nil, false
	}

	user := &models.User{
		ID:            claims.UserID,
		Email:         claims.Email,
		IsPremium:     claims.IsPremium,
		EmailVerified: claims.EmailVerified,
	}

	return user, true
}
