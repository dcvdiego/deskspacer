package service

import (
	"context"
	"log/slog"
	"time"

	"github.com/dcvdiego/deskspacer/backend-go/internal/repository"
)

// CleanupService periodically removes expired states from the database
type CleanupService struct {
	repo     *repository.SharedStateRepository
	interval time.Duration
	stopChan chan struct{}
}

// NewCleanupService creates a new cleanup service
func NewCleanupService(repo *repository.SharedStateRepository, intervalHours int) *CleanupService {
	return &CleanupService{
		repo:     repo,
		interval: time.Duration(intervalHours) * time.Hour,
		stopChan: make(chan struct{}),
	}
}

// Start begins the cleanup service
func (s *CleanupService) Start(ctx context.Context) {
	slog.Info("Cleanup service started",
		"interval", s.interval,
	)

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	// Run cleanup immediately on startup
	s.runCleanup(ctx)

	for {
		select {
		case <-ticker.C:
			s.runCleanup(ctx)
		case <-s.stopChan:
			slog.Info("Cleanup service stopped")
			return
		case <-ctx.Done():
			slog.Info("Cleanup service stopped due to context cancellation")
			return
		}
	}
}

// Stop stops the cleanup service
func (s *CleanupService) Stop() {
	close(s.stopChan)
}

// runCleanup executes the cleanup operation
func (s *CleanupService) runCleanup(ctx context.Context) {
	slog.Info("Running cleanup of expired states")

	count, err := s.repo.DeleteExpired(ctx)
	if err != nil {
		slog.Error("Failed to clean up expired states", "error", err)
		return
	}

	if count > 0 {
		slog.Info("Cleanup completed successfully", "deleted_count", count)
	} else {
		slog.Debug("No expired states to clean up")
	}
}
