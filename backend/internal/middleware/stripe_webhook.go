package middleware

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/dcvdiego/deskspacer/backend/internal/repository"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
	"github.com/google/uuid"
)

// StripeWebhookHandler handles Stripe webhook events
type StripeWebhookHandler struct {
	stripeService service.StripeService
	userRepo      repository.UserRepositoryInterface
}

// NewStripeWebhookHandler creates a new webhook handler
func NewStripeWebhookHandler(stripeService service.StripeService, userRepo repository.UserRepositoryInterface) *StripeWebhookHandler {
	return &StripeWebhookHandler{
		stripeService: stripeService,
		userRepo:      userRepo,
	}
}

// HandleWebhook processes incoming Stripe webhook events
func (h *StripeWebhookHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	// Read request body
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Error("Failed to read webhook body", "error", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Get Stripe signature header
	signature := r.Header.Get("Stripe-Signature")
	if signature == "" {
		slog.Error("Missing Stripe-Signature header")
		http.Error(w, "Missing Stripe-Signature header", http.StatusBadRequest)
		return
	}

	// Verify and parse webhook event
	event, err := h.stripeService.HandleWebhook(payload, signature)
	if err != nil {
		slog.Error("Failed to verify webhook", "error", err)
		http.Error(w, "Invalid webhook signature", http.StatusBadRequest)
		return
	}

	// Process the event
	ctx := context.Background()
	if err := h.processEvent(ctx, event); err != nil {
		slog.Error("Failed to process webhook event", "type", event.Type, "error", err)
		// Return 200 to acknowledge receipt even if processing failed
		// Stripe will retry if we return non-200
		w.WriteHeader(http.StatusOK)
		return
	}

	// Acknowledge successful processing
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"received": true}`))
}

// processEvent handles different Stripe event types
func (h *StripeWebhookHandler) processEvent(ctx context.Context, event interface{}) error {
	stripeEvent, ok := event.(*service.StripeEvent)
	if !ok {
		// Try to handle as stripe.Event
		return h.processStripeEvent(ctx, event)
	}

	switch stripeEvent.Type {
	case "checkout.session.completed":
		return h.handleCheckoutCompleted(ctx, stripeEvent)

	case "customer.subscription.created":
		return h.handleSubscriptionCreated(ctx, stripeEvent)

	case "customer.subscription.updated":
		return h.handleSubscriptionUpdated(ctx, stripeEvent)

	case "customer.subscription.deleted":
		return h.handleSubscriptionDeleted(ctx, stripeEvent)

	case "invoice.payment_succeeded":
		return h.handlePaymentSucceeded(ctx, stripeEvent)

	case "invoice.payment_failed":
		return h.handlePaymentFailed(ctx, stripeEvent)

	default:
		slog.Info("Unhandled webhook event type", "type", stripeEvent.Type)
		return nil
	}
}

// processStripeEvent handles stripe.Event type
func (h *StripeWebhookHandler) processStripeEvent(ctx context.Context, event interface{}) error {
	// This is a fallback for when we get stripe.Event directly
	slog.Info("Processing Stripe event", "event", event)
	return nil
}

// handleCheckoutCompleted handles successful checkout completion
func (h *StripeWebhookHandler) handleCheckoutCompleted(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		return fmt.Errorf("failed to extract user ID: %w", err)
	}

	// Parse user ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Get user
	user, err := h.userRepo.GetByID(ctx, uid)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Upgrade to premium
	if err := h.userRepo.UpdatePremiumStatus(ctx, uid, true); err != nil {
		return fmt.Errorf("failed to update premium status: %w", err)
	}

	slog.Info("User upgraded to premium", "user_id", userID, "email", user.Email)
	return nil
}

// handleSubscriptionCreated handles new subscription creation
func (h *StripeWebhookHandler) handleSubscriptionCreated(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		return fmt.Errorf("failed to extract user ID: %w", err)
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Activate premium
	if err := h.userRepo.UpdatePremiumStatus(ctx, uid, true); err != nil {
		return fmt.Errorf("failed to activate premium: %w", err)
	}

	slog.Info("Premium subscription activated", "user_id", userID)
	return nil
}

// handleSubscriptionUpdated handles subscription updates
func (h *StripeWebhookHandler) handleSubscriptionUpdated(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		return fmt.Errorf("failed to extract user ID: %w", err)
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Check if subscription is still active
	isActive, err := service.IsSubscriptionActive(event.Event)
	if err != nil {
		return fmt.Errorf("failed to check subscription status: %w", err)
	}

	// Update premium status based on subscription status
	if err := h.userRepo.UpdatePremiumStatus(ctx, uid, isActive); err != nil {
		return fmt.Errorf("failed to update premium status: %w", err)
	}

	slog.Info("Premium subscription updated", "user_id", userID, "active", isActive)
	return nil
}

// handleSubscriptionDeleted handles subscription cancellation
func (h *StripeWebhookHandler) handleSubscriptionDeleted(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		return fmt.Errorf("failed to extract user ID: %w", err)
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Deactivate premium
	if err := h.userRepo.UpdatePremiumStatus(ctx, uid, false); err != nil {
		return fmt.Errorf("failed to deactivate premium: %w", err)
	}

	slog.Info("Premium subscription canceled", "user_id", userID)
	return nil
}

// handlePaymentSucceeded handles successful payment
func (h *StripeWebhookHandler) handlePaymentSucceeded(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		// Payment succeeded but no user ID found - this might be initial setup
		slog.Warn("Payment succeeded but no user ID found in invoice")
		return nil
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Ensure premium is active (should already be active from subscription events)
	if err := h.userRepo.UpdatePremiumStatus(ctx, uid, true); err != nil {
		return fmt.Errorf("failed to confirm premium status: %w", err)
	}

	slog.Info("Payment succeeded, premium confirmed", "user_id", userID)
	return nil
}

// handlePaymentFailed handles failed payment
func (h *StripeWebhookHandler) handlePaymentFailed(ctx context.Context, event *service.StripeEvent) error {
	userID, err := service.ExtractUserIDFromEvent(event.Event)
	if err != nil {
		slog.Warn("Payment failed but no user ID found in invoice")
		return nil
	}

	slog.Warn("Payment failed for user", "user_id", userID)
	// Don't immediately revoke premium - Stripe will handle retry logic
	// Premium will be revoked via subscription.deleted event if all retries fail
	return nil
}
