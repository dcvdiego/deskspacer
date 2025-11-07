package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/dcvdiego/deskspacer/backend/internal/service"
)

// OptionalAuth is middleware that optionally injects user info if a valid token is present
// Unlike RequireAuth, this middleware does NOT return an error if auth is missing/invalid
// It simply continues without user context
func OptionalAuth(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// No auth provided, continue without user context
				next.ServeHTTP(w, r)
				return
			}

			// Expected format: "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				// Invalid format, continue without user context
				slog.Debug("Invalid Authorization header format (optional auth)", "path", r.URL.Path)
				next.ServeHTTP(w, r)
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := authService.ValidateAccessToken(tokenString)
			if err != nil {
				// Invalid token, continue without user context
				slog.Debug("Invalid access token (optional auth)", "error", err, "path", r.URL.Path)
				next.ServeHTTP(w, r)
				return
			}

			// Add user info to context
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDContextKey, claims.UserID)
			ctx = context.WithValue(ctx, UserContextKey, claims)

			slog.Debug("User authenticated (optional auth)", "userID", claims.UserID, "path", r.URL.Path)

			// Continue to next handler with user context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
