package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/dcvdiego/deskspacer/backend-go/internal/database"
)

// HealthChecker interface for database health checks
type HealthChecker interface {
	Ping(ctx context.Context) error
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Time     string `json:"time"`
}

// NewHealthHandler creates an HTTP handler for health checks
func NewHealthHandler(db *database.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		response := HealthResponse{
			Status:   "healthy",
			Database: "connected",
			Time:     time.Now().UTC().Format(time.RFC3339),
		}

		// Check database connection
		if err := db.Ping(ctx); err != nil {
			response.Status = "unhealthy"
			response.Database = "disconnected"
			w.WriteHeader(http.StatusServiceUnavailable)
		} else {
			w.WriteHeader(http.StatusOK)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
