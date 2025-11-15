package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
	"github.com/stripe/stripe-go/v81/webhook"
)

// StripeEvent wraps stripe.Event for easier handling
type StripeEvent struct {
	Event *stripe.Event
	Type  string
}

// StripeService defines the interface for payment processing operations
type StripeService interface {
	CreateCheckoutSession(ctx context.Context, userID, email string) (string, error)
	HandleWebhook(payload []byte, signature string) (*stripe.Event, error)
	GetCheckoutSession(sessionID string) (*stripe.CheckoutSession, error)
}

// RealStripeService implements StripeService using Stripe API
type RealStripeService struct {
	secretKey     string
	webhookSecret string
	priceID       string
	successURL    string
	cancelURL     string
}

// NewRealStripeService creates a new Stripe service
func NewRealStripeService(secretKey, webhookSecret, priceID, successURL, cancelURL string) *RealStripeService {
	stripe.Key = secretKey

	return &RealStripeService{
		secretKey:     secretKey,
		webhookSecret: webhookSecret,
		priceID:       priceID,
		successURL:    successURL,
		cancelURL:     cancelURL,
	}
}

// CreateCheckoutSession creates a new Stripe checkout session
func (s *RealStripeService) CreateCheckoutSession(ctx context.Context, userID, email string) (string, error) {
	if s.priceID == "" {
		return "", fmt.Errorf("stripe price ID not configured")
	}

	params := &stripe.CheckoutSessionParams{
		CustomerEmail: stripe.String(email),
		ClientReferenceID: stripe.String(userID),
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(s.priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(s.successURL),
		CancelURL:  stripe.String(s.cancelURL),
		Metadata: map[string]string{
			"user_id": userID,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		slog.Error("Failed to create Stripe checkout session", "error", err, "user_id", userID)
		return "", fmt.Errorf("failed to create checkout session: %w", err)
	}

	slog.Info("Stripe checkout session created", "session_id", sess.ID, "user_id", userID, "email", email)
	return sess.URL, nil
}

// HandleWebhook validates and processes Stripe webhook events
func (s *RealStripeService) HandleWebhook(payload []byte, signature string) (*stripe.Event, error) {
	if s.webhookSecret == "" {
		return nil, fmt.Errorf("stripe webhook secret not configured")
	}

	event, err := webhook.ConstructEvent(payload, signature, s.webhookSecret)
	if err != nil {
		slog.Error("Failed to verify Stripe webhook signature", "error", err)
		return nil, fmt.Errorf("failed to verify webhook signature: %w", err)
	}

	slog.Info("Stripe webhook received", "type", event.Type, "id", event.ID)
	return &event, nil
}

// GetCheckoutSession retrieves a checkout session by ID
func (s *RealStripeService) GetCheckoutSession(sessionID string) (*stripe.CheckoutSession, error) {
	sess, err := session.Get(sessionID, nil)
	if err != nil {
		slog.Error("Failed to retrieve checkout session", "error", err, "session_id", sessionID)
		return nil, fmt.Errorf("failed to retrieve checkout session: %w", err)
	}

	return sess, nil
}

// MockStripeService implements StripeService for testing
type MockStripeService struct {
	Sessions map[string]*MockCheckoutSession
}

// MockCheckoutSession represents a mock checkout session
type MockCheckoutSession struct {
	ID                string
	URL               string
	UserID            string
	Email             string
	PaymentStatus     string
	SubscriptionID    string
	CustomerID        string
}

// NewMockStripeService creates a new mock Stripe service
func NewMockStripeService() *MockStripeService {
	return &MockStripeService{
		Sessions: make(map[string]*MockCheckoutSession),
	}
}

// CreateCheckoutSession creates a mock checkout session
func (m *MockStripeService) CreateCheckoutSession(ctx context.Context, userID, email string) (string, error) {
	sessionID := fmt.Sprintf("cs_test_mock_%s", userID)
	checkoutURL := fmt.Sprintf("https://checkout.stripe.test/session/%s", sessionID)

	session := &MockCheckoutSession{
		ID:            sessionID,
		URL:           checkoutURL,
		UserID:        userID,
		Email:         email,
		PaymentStatus: "unpaid",
	}

	m.Sessions[sessionID] = session

	slog.Info("Mock: Stripe checkout session created", "session_id", sessionID, "user_id", userID, "email", email)
	return checkoutURL, nil
}

// HandleWebhook processes a mock webhook event
func (m *MockStripeService) HandleWebhook(payload []byte, signature string) (*stripe.Event, error) {
	var event stripe.Event
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("failed to parse webhook payload: %w", err)
	}

	slog.Info("Mock: Stripe webhook received", "type", event.Type, "id", event.ID)
	return &event, nil
}

// GetCheckoutSession retrieves a mock checkout session
func (m *MockStripeService) GetCheckoutSession(sessionID string) (*stripe.CheckoutSession, error) {
	mockSession, exists := m.Sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("checkout session not found: %s", sessionID)
	}

	// Create a Stripe checkout session object for compatibility
	session := &stripe.CheckoutSession{
		ID:                sessionID,
		URL:               mockSession.URL,
		CustomerEmail:     mockSession.Email,
		ClientReferenceID: mockSession.UserID,
		PaymentStatus:     stripe.CheckoutSessionPaymentStatus(mockSession.PaymentStatus),
		Subscription: &stripe.Subscription{
			ID: mockSession.SubscriptionID,
		},
		Customer: &stripe.Customer{
			ID: mockSession.CustomerID,
		},
	}

	return session, nil
}

// Helper function to extract user ID from webhook event
func ExtractUserIDFromEvent(event *stripe.Event) (string, error) {
	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return "", fmt.Errorf("failed to unmarshal session: %w", err)
		}

		// Try metadata first
		if userID, ok := session.Metadata["user_id"]; ok {
			return userID, nil
		}

		// Fall back to client reference ID
		if session.ClientReferenceID != "" {
			return session.ClientReferenceID, nil
		}

		return "", fmt.Errorf("user_id not found in checkout session")

	case "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted":
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			return "", fmt.Errorf("failed to unmarshal subscription: %w", err)
		}

		if userID, ok := subscription.Metadata["user_id"]; ok {
			return userID, nil
		}

		return "", fmt.Errorf("user_id not found in subscription metadata")

	case "invoice.payment_succeeded", "invoice.payment_failed":
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			return "", fmt.Errorf("failed to unmarshal invoice: %w", err)
		}

		if invoice.Subscription != nil && invoice.Subscription.Metadata != nil {
			if userID, ok := invoice.Subscription.Metadata["user_id"]; ok {
				return userID, nil
			}
		}

		return "", fmt.Errorf("user_id not found in invoice")

	default:
		return "", fmt.Errorf("unsupported event type: %s", event.Type)
	}
}

// GetPaymentStatus extracts payment status from event
func GetPaymentStatus(event *stripe.Event) (string, error) {
	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return "", err
		}
		return string(session.PaymentStatus), nil

	case "invoice.payment_succeeded":
		return "paid", nil

	case "invoice.payment_failed":
		return "failed", nil

	case "customer.subscription.created", "customer.subscription.updated":
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			return "", err
		}
		return string(subscription.Status), nil

	case "customer.subscription.deleted":
		return "canceled", nil

	default:
		return "", fmt.Errorf("cannot extract payment status from event type: %s", event.Type)
	}
}

// IsSubscriptionActive checks if subscription is active based on event
func IsSubscriptionActive(event *stripe.Event) (bool, error) {
	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return false, err
		}
		return session.PaymentStatus == "paid", nil

	case "customer.subscription.created", "customer.subscription.updated":
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			return false, err
		}
		return subscription.Status == "active" || subscription.Status == "trialing", nil

	case "customer.subscription.deleted":
		return false, nil

	case "invoice.payment_succeeded":
		return true, nil

	case "invoice.payment_failed":
		return false, nil

	default:
		return false, fmt.Errorf("cannot determine subscription status from event type: %s", event.Type)
	}
}
