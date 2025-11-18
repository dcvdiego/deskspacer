package models

import (
	"time"

	"github.com/google/uuid"
)

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusSucceeded PaymentStatus = "succeeded"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

// Payment represents a Stripe payment record
type Payment struct {
	ID                        uuid.UUID     `json:"id"`
	UserID                    uuid.UUID     `json:"userId"`
	StripePaymentIntentID     string        `json:"stripePaymentIntentId"`
	StripeCheckoutSessionID   *string       `json:"stripeCheckoutSessionId,omitempty"`
	Amount                    int           `json:"amount"` // Amount in cents
	Currency                  string        `json:"currency"`
	Status                    PaymentStatus `json:"status"`
	Metadata                  string        `json:"metadata,omitempty"` // JSON string for flexibility
	CreatedAt                 time.Time     `json:"createdAt"`
	UpdatedAt                 time.Time     `json:"updatedAt"`
}

// NewPayment creates a new payment record
func NewPayment(userID uuid.UUID, paymentIntentID string, amount int, currency string) *Payment {
	now := time.Now()
	return &Payment{
		ID:                    uuid.New(),
		UserID:                userID,
		StripePaymentIntentID: paymentIntentID,
		Amount:                amount,
		Currency:              currency,
		Status:                PaymentStatusPending,
		CreatedAt:             now,
		UpdatedAt:             now,
	}
}

// SetCheckoutSessionID sets the Stripe Checkout Session ID
func (p *Payment) SetCheckoutSessionID(sessionID string) {
	p.StripeCheckoutSessionID = &sessionID
	p.UpdatedAt = time.Now()
}

// MarkAsSucceeded marks the payment as succeeded
func (p *Payment) MarkAsSucceeded() {
	p.Status = PaymentStatusSucceeded
	p.UpdatedAt = time.Now()
}

// MarkAsFailed marks the payment as failed
func (p *Payment) MarkAsFailed() {
	p.Status = PaymentStatusFailed
	p.UpdatedAt = time.Now()
}

// MarkAsRefunded marks the payment as refunded
func (p *Payment) MarkAsRefunded() {
	p.Status = PaymentStatusRefunded
	p.UpdatedAt = time.Now()
}

// IsSuccessful returns true if the payment was successful
func (p *Payment) IsSuccessful() bool {
	return p.Status == PaymentStatusSucceeded
}

// IsPending returns true if the payment is pending
func (p *Payment) IsPending() bool {
	return p.Status == PaymentStatusPending
}

// SetMetadata sets the metadata JSON string
func (p *Payment) SetMetadata(metadata string) {
	p.Metadata = metadata
	p.UpdatedAt = time.Now()
}
