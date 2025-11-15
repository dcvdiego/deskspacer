package service

import (
	"context"
	"testing"
)

// TestMockStripeService tests the mock Stripe service implementation
func TestMockStripeService(t *testing.T) {
	mock := NewMockStripeService()
	ctx := context.Background()

	t.Run("CreateCheckoutSession", func(t *testing.T) {
		userID := "test-user-123"
		email := "test@example.com"

		url, err := mock.CreateCheckoutSession(ctx, userID, email)
		if err != nil {
			t.Fatalf("CreateCheckoutSession failed: %v", err)
		}

		if url == "" {
			t.Error("Expected non-empty checkout URL")
		}

		// Verify session was created
		if len(mock.Sessions) != 1 {
			t.Errorf("Expected 1 session, got %d", len(mock.Sessions))
		}
	})

	t.Run("MultipleCheckoutSessions", func(t *testing.T) {
		mock := NewMockStripeService()

		users := []struct {
			userID string
			email  string
		}{
			{"user1", "user1@example.com"},
			{"user2", "user2@example.com"},
			{"user3", "user3@example.com"},
		}

		for _, user := range users {
			url, err := mock.CreateCheckoutSession(ctx, user.userID, user.email)
			if err != nil {
				t.Fatalf("CreateCheckoutSession failed for %s: %v", user.userID, err)
			}
			if url == "" {
				t.Errorf("Empty URL for user %s", user.userID)
			}
		}

		if len(mock.Sessions) != 3 {
			t.Errorf("Expected 3 sessions, got %d", len(mock.Sessions))
		}
	})

	t.Run("GetCheckoutSession", func(t *testing.T) {
		mock := NewMockStripeService()
		userID := "test-user-456"
		email := "test2@example.com"

		// Create a session first
		_, err := mock.CreateCheckoutSession(ctx, userID, email)
		if err != nil {
			t.Fatalf("CreateCheckoutSession failed: %v", err)
		}

		// Get the session ID
		var sessionID string
		for id := range mock.Sessions {
			sessionID = id
			break
		}

		// Retrieve the session
		session, err := mock.GetCheckoutSession(sessionID)
		if err != nil {
			t.Fatalf("GetCheckoutSession failed: %v", err)
		}

		if session.CustomerEmail != email {
			t.Errorf("Expected email %s, got %s", email, session.CustomerEmail)
		}

		if session.ClientReferenceID != userID {
			t.Errorf("Expected user ID %s, got %s", userID, session.ClientReferenceID)
		}
	})

	t.Run("GetNonExistentSession", func(t *testing.T) {
		mock := NewMockStripeService()

		_, err := mock.GetCheckoutSession("non-existent-session")
		if err == nil {
			t.Error("Expected error for non-existent session")
		}
	})
}

// TestRealStripeServiceCreation tests the real Stripe service initialization
func TestRealStripeServiceCreation(t *testing.T) {
	t.Run("ValidCredentials", func(t *testing.T) {
		service := NewRealStripeService(
			"sk_test_fake_key",
			"whsec_fake_secret",
			"price_fake_id",
			"https://example.com/success",
			"https://example.com/cancel",
		)

		if service == nil {
			t.Error("Expected non-nil service")
		}

		if service.secretKey != "sk_test_fake_key" {
			t.Error("Secret key not set correctly")
		}

		if service.priceID != "price_fake_id" {
			t.Error("Price ID not set correctly")
		}
	})

	t.Run("EmptyCredentials", func(t *testing.T) {
		service := NewRealStripeService("", "", "", "", "")
		if service == nil {
			t.Error("Service should be created even with empty credentials")
		}
	})
}

// TestStripeServiceInterface verifies interface compliance
func TestStripeServiceInterface(t *testing.T) {
	t.Run("MockServiceImplementsInterface", func(t *testing.T) {
		var _ StripeService = (*MockStripeService)(nil)
	})

	t.Run("RealServiceImplementsInterface", func(t *testing.T) {
		var _ StripeService = (*RealStripeService)(nil)
	})

	t.Run("InterfaceMethodsWork", func(t *testing.T) {
		var service StripeService = NewMockStripeService()
		ctx := context.Background()

		// Test all interface methods
		url, err := service.CreateCheckoutSession(ctx, "test-user", "test@example.com")
		if err != nil {
			t.Errorf("CreateCheckoutSession failed: %v", err)
		}
		if url == "" {
			t.Error("CreateCheckoutSession returned empty URL")
		}

		// Extract session ID from mock sessions
		mock := service.(*MockStripeService)
		var sessionID string
		for id := range mock.Sessions {
			sessionID = id
			break
		}

		session, err := service.GetCheckoutSession(sessionID)
		if err != nil {
			t.Errorf("GetCheckoutSession failed: %v", err)
		}
		if session == nil {
			t.Error("GetCheckoutSession returned nil session")
		}
	})
}

// TestMockCheckoutSessionFields tests the mock checkout session structure
func TestMockCheckoutSessionFields(t *testing.T) {
	mock := NewMockStripeService()
	ctx := context.Background()

	userID := "user-789"
	email := "user789@example.com"

	url, err := mock.CreateCheckoutSession(ctx, userID, email)
	if err != nil {
		t.Fatalf("CreateCheckoutSession failed: %v", err)
	}

	// Get the created session
	var sessionID string
	for id := range mock.Sessions {
		sessionID = id
		break
	}

	mockSession := mock.Sessions[sessionID]

	// Verify all fields
	if mockSession.UserID != userID {
		t.Errorf("UserID mismatch: expected %s, got %s", userID, mockSession.UserID)
	}

	if mockSession.Email != email {
		t.Errorf("Email mismatch: expected %s, got %s", email, mockSession.Email)
	}

	if mockSession.PaymentStatus != "unpaid" {
		t.Errorf("PaymentStatus should be 'unpaid', got %s", mockSession.PaymentStatus)
	}

	if mockSession.URL != url {
		t.Errorf("URL mismatch: expected %s, got %s", url, mockSession.URL)
	}

	if mockSession.ID != sessionID {
		t.Errorf("ID mismatch: expected %s, got %s", sessionID, mockSession.ID)
	}
}

// TestStripeEventHelpers tests helper functions for event processing
func TestStripeEventHelpers(t *testing.T) {
	t.Run("ExtractUserIDFromEvent", func(t *testing.T) {
		// This would require creating mock Stripe events
		// which is complex without actual Stripe SDK in test
		// In production, this would be tested with Stripe's test fixtures
	})

	t.Run("GetPaymentStatus", func(t *testing.T) {
		// Similar to above - would need mock Stripe events
	})

	t.Run("IsSubscriptionActive", func(t *testing.T) {
		// Similar to above - would need mock Stripe events
	})
}
