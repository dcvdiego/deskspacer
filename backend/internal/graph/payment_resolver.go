package graph

import (
	"fmt"

	"github.com/dcvdiego/deskspacer/backend/internal/middleware"
	"github.com/graphql-go/graphql"
)

// CreateCheckoutSession creates a Stripe checkout session for premium subscription
func (r *Resolver) CreateCheckoutSession(params graphql.ResolveParams) (interface{}, error) {
	// Check authentication
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("authentication required")
	}

	// Check if user is already premium
	if user.IsPremium {
		return nil, fmt.Errorf("user already has premium membership")
	}

	// Create Stripe checkout session
	checkoutURL, err := r.stripeService.CreateCheckoutSession(params.Context, user.ID.String(), user.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkout session: %w", err)
	}

	// Return checkout session info
	return map[string]interface{}{
		"sessionID": extractSessionID(checkoutURL),
		"url":       checkoutURL,
	}, nil
}

// extractSessionID extracts session ID from Stripe checkout URL
// URL format: https://checkout.stripe.com/c/pay/cs_test_xxx...
func extractSessionID(url string) string {
	// For production, we'd parse the URL properly
	// For now, return a placeholder since we get the full URL from Stripe
	return "session-from-url"
}
