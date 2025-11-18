package service

import (
	"context"
	"testing"
)

func TestMockEmailService(t *testing.T) {
	ctx := context.Background()
	mockService := NewMockEmailService()

	t.Run("SendVerificationEmail", func(t *testing.T) {
		err := mockService.SendVerificationEmail(ctx, "test@example.com", "testuser", "token123")
		if err != nil {
			t.Errorf("SendVerificationEmail failed: %v", err)
		}

		if len(mockService.Emails) != 1 {
			t.Errorf("Expected 1 email, got %d", len(mockService.Emails))
		}

		email := mockService.Emails[0]
		if email.To != "test@example.com" {
			t.Errorf("Expected to=test@example.com, got %s", email.To)
		}
		if email.Type != "verification" {
			t.Errorf("Expected type=verification, got %s", email.Type)
		}
		if email.Subject != "Verify Your DeskSpacer Account" {
			t.Errorf("Expected verification subject, got %s", email.Subject)
		}
	})

	t.Run("SendPasswordResetEmail", func(t *testing.T) {
		mockService := NewMockEmailService()
		err := mockService.SendPasswordResetEmail(ctx, "test@example.com", "testuser", "resettoken456")
		if err != nil {
			t.Errorf("SendPasswordResetEmail failed: %v", err)
		}

		if len(mockService.Emails) != 1 {
			t.Errorf("Expected 1 email, got %d", len(mockService.Emails))
		}

		email := mockService.Emails[0]
		if email.To != "test@example.com" {
			t.Errorf("Expected to=test@example.com, got %s", email.To)
		}
		if email.Type != "reset" {
			t.Errorf("Expected type=reset, got %s", email.Type)
		}
		if email.Subject != "Reset Your DeskSpacer Password" {
			t.Errorf("Expected reset subject, got %s", email.Subject)
		}
	})

	t.Run("SendWelcomeEmail", func(t *testing.T) {
		mockService := NewMockEmailService()
		err := mockService.SendWelcomeEmail(ctx, "test@example.com", "testuser")
		if err != nil {
			t.Errorf("SendWelcomeEmail failed: %v", err)
		}

		if len(mockService.Emails) != 1 {
			t.Errorf("Expected 1 email, got %d", len(mockService.Emails))
		}

		email := mockService.Emails[0]
		if email.To != "test@example.com" {
			t.Errorf("Expected to=test@example.com, got %s", email.To)
		}
		if email.Type != "welcome" {
			t.Errorf("Expected type=welcome, got %s", email.Type)
		}
		if email.Subject != "Welcome to DeskSpacer!" {
			t.Errorf("Expected welcome subject, got %s", email.Subject)
		}
	})

	t.Run("MultipleEmails", func(t *testing.T) {
		mockService := NewMockEmailService()

		mockService.SendVerificationEmail(ctx, "user1@example.com", "user1", "token1")
		mockService.SendPasswordResetEmail(ctx, "user2@example.com", "user2", "token2")
		mockService.SendWelcomeEmail(ctx, "user3@example.com", "user3")

		if len(mockService.Emails) != 3 {
			t.Errorf("Expected 3 emails, got %d", len(mockService.Emails))
		}

		// Verify all emails were stored
		types := make(map[string]bool)
		for _, email := range mockService.Emails {
			types[email.Type] = true
		}

		if !types["verification"] || !types["reset"] || !types["welcome"] {
			t.Errorf("Not all email types were sent. Got: %v", types)
		}
	})
}

func TestResendEmailService(t *testing.T) {
	ctx := context.Background()

	t.Run("Creation", func(t *testing.T) {
		service := NewResendEmailService("test-api-key", "test@example.com", "http://localhost:3000")
		if service == nil {
			t.Error("NewResendEmailService returned nil")
		}
		if service.apiKey != "test-api-key" {
			t.Errorf("Expected apiKey=test-api-key, got %s", service.apiKey)
		}
		if service.fromEmail != "test@example.com" {
			t.Errorf("Expected fromEmail=test@example.com, got %s", service.fromEmail)
		}
		if service.frontendURL != "http://localhost:3000" {
			t.Errorf("Expected frontendURL=http://localhost:3000, got %s", service.frontendURL)
		}
	})

	t.Run("InvalidInput", func(t *testing.T) {
		service := NewResendEmailService("test-key", "from@test.com", "http://localhost")

		// Test empty recipient
		err := service.sendEmail(ctx, "", "Subject", "Body", "Text")
		if err == nil {
			t.Error("Expected error for empty recipient, got nil")
		}

		// Test empty subject
		err = service.sendEmail(ctx, "to@test.com", "", "Body", "Text")
		if err == nil {
			t.Error("Expected error for empty subject, got nil")
		}

		// Test empty body
		err = service.sendEmail(ctx, "to@test.com", "Subject", "", "Text")
		if err == nil {
			t.Error("Expected error for empty body, got nil")
		}
	})
}

func TestEmailTemplateRendering(t *testing.T) {
	t.Run("VerificationEmailHTML", func(t *testing.T) {
		html := renderVerificationEmailHTML("TestUser", "http://localhost/verify?token=abc123")

		if html == "" {
			t.Error("HTML template is empty")
		}

		// Check for key elements
		requiredStrings := []string{
			"TestUser",
			"http://localhost/verify?token=abc123",
			"Verify Email",
			"DeskSpacer",
			"24 hours",
		}

		for _, str := range requiredStrings {
			if !contains(html, str) {
				t.Errorf("HTML template missing required string: %s", str)
			}
		}
	})

	t.Run("VerificationEmailText", func(t *testing.T) {
		text := renderVerificationEmailText("TestUser", "http://localhost/verify?token=abc123")

		if text == "" {
			t.Error("Text template is empty")
		}

		requiredStrings := []string{
			"TestUser",
			"http://localhost/verify?token=abc123",
			"24 hours",
		}

		for _, str := range requiredStrings {
			if !contains(text, str) {
				t.Errorf("Text template missing required string: %s", str)
			}
		}
	})

	t.Run("PasswordResetEmailHTML", func(t *testing.T) {
		html := renderPasswordResetEmailHTML("TestUser", "http://localhost/reset?token=xyz789")

		if html == "" {
			t.Error("HTML template is empty")
		}

		requiredStrings := []string{
			"TestUser",
			"http://localhost/reset?token=xyz789",
			"Reset Password",
			"1 hour",
		}

		for _, str := range requiredStrings {
			if !contains(html, str) {
				t.Errorf("HTML template missing required string: %s", str)
			}
		}
	})

	t.Run("PasswordResetEmailText", func(t *testing.T) {
		text := renderPasswordResetEmailText("TestUser", "http://localhost/reset?token=xyz789")

		if text == "" {
			t.Error("Text template is empty")
		}

		requiredStrings := []string{
			"TestUser",
			"http://localhost/reset?token=xyz789",
			"1 hour",
		}

		for _, str := range requiredStrings {
			if !contains(text, str) {
				t.Errorf("Text template missing required string: %s", str)
			}
		}
	})

	t.Run("WelcomeEmailHTML", func(t *testing.T) {
		html := renderWelcomeEmailHTML("TestUser", "http://localhost")

		if html == "" {
			t.Error("HTML template is empty")
		}

		requiredStrings := []string{
			"TestUser",
			"http://localhost",
			"Welcome to DeskSpacer",
			"Start Designing",
		}

		for _, str := range requiredStrings {
			if !contains(html, str) {
				t.Errorf("HTML template missing required string: %s", str)
			}
		}
	})

	t.Run("WelcomeEmailText", func(t *testing.T) {
		text := renderWelcomeEmailText("TestUser", "http://localhost")

		if text == "" {
			t.Error("Text template is empty")
		}

		requiredStrings := []string{
			"TestUser",
			"http://localhost",
			"Welcome to DeskSpacer",
		}

		for _, str := range requiredStrings {
			if !contains(text, str) {
				t.Errorf("Text template missing required string: %s", str)
			}
		}
	})
}

func TestEmailServiceInterface(t *testing.T) {
	ctx := context.Background()

	t.Run("MockServiceImplementsInterface", func(t *testing.T) {
		var service EmailService = NewMockEmailService()
		if service == nil {
			t.Error("Mock service does not implement EmailService interface")
		}
	})

	t.Run("ResendServiceImplementsInterface", func(t *testing.T) {
		var service EmailService = NewResendEmailService("key", "from@test.com", "http://localhost")
		if service == nil {
			t.Error("Resend service does not implement EmailService interface")
		}
	})

	t.Run("InterfaceMethodsWork", func(t *testing.T) {
		var service EmailService = NewMockEmailService()

		err := service.SendVerificationEmail(ctx, "test@example.com", "user", "token")
		if err != nil {
			t.Errorf("SendVerificationEmail failed: %v", err)
		}

		err = service.SendPasswordResetEmail(ctx, "test@example.com", "user", "token")
		if err != nil {
			t.Errorf("SendPasswordResetEmail failed: %v", err)
		}

		err = service.SendWelcomeEmail(ctx, "test@example.com", "user")
		if err != nil {
			t.Errorf("SendWelcomeEmail failed: %v", err)
		}
	})
}

// Helper function
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) >= len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
