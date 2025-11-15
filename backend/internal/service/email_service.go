package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// EmailService defines the interface for sending emails
type EmailService interface {
	SendVerificationEmail(ctx context.Context, to, username, verificationToken string) error
	SendPasswordResetEmail(ctx context.Context, to, username, resetToken string) error
	SendWelcomeEmail(ctx context.Context, to, username string) error
}

// ResendEmailService implements EmailService using Resend API
type ResendEmailService struct {
	apiKey      string
	fromEmail   string
	frontendURL string
	httpClient  *http.Client
}

// ResendEmailRequest represents the Resend API email request
type ResendEmailRequest struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
	Text    string `json:"text,omitempty"`
}

// ResendEmailResponse represents the Resend API response
type ResendEmailResponse struct {
	ID    string `json:"id"`
	Error string `json:"error,omitempty"`
}

// NewResendEmailService creates a new Resend email service
func NewResendEmailService(apiKey, fromEmail, frontendURL string) *ResendEmailService {
	return &ResendEmailService{
		apiKey:      apiKey,
		fromEmail:   fromEmail,
		frontendURL: frontendURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// sendEmail sends an email via Resend API
func (s *ResendEmailService) sendEmail(ctx context.Context, to, subject, htmlBody, textBody string) error {
	// Validate inputs
	if to == "" {
		return fmt.Errorf("recipient email is required")
	}
	if subject == "" {
		return fmt.Errorf("email subject is required")
	}
	if htmlBody == "" {
		return fmt.Errorf("email body is required")
	}

	// Create request payload
	emailReq := ResendEmailRequest{
		From:    s.fromEmail,
		To:      to,
		Subject: subject,
		HTML:    htmlBody,
		Text:    textBody,
	}

	jsonData, err := json.Marshal(emailReq)
	if err != nil {
		slog.Error("Failed to marshal email request", "error", err)
		return fmt.Errorf("failed to prepare email: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		slog.Error("Failed to send email via Resend", "error", err, "to", to, "subject", subject)
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	// Parse response
	var emailResp ResendEmailResponse
	if err := json.Unmarshal(body, &emailResp); err != nil {
		slog.Error("Failed to parse Resend response", "error", err, "body", string(body))
		return fmt.Errorf("failed to parse response: %w", err)
	}

	// Check for errors
	if resp.StatusCode != http.StatusOK {
		slog.Error("Resend API error", "status", resp.StatusCode, "error", emailResp.Error, "to", to)
		return fmt.Errorf("resend API error (status %d): %s", resp.StatusCode, emailResp.Error)
	}

	slog.Info("Email sent successfully", "id", emailResp.ID, "to", to, "subject", subject)
	return nil
}

// SendVerificationEmail sends an email verification email
func (s *ResendEmailService) SendVerificationEmail(ctx context.Context, to, username, verificationToken string) error {
	verificationURL := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, verificationToken)

	subject := "Verify Your DeskSpacer Account"
	htmlBody := renderVerificationEmailHTML(username, verificationURL)
	textBody := renderVerificationEmailText(username, verificationURL)

	return s.sendEmail(ctx, to, subject, htmlBody, textBody)
}

// SendPasswordResetEmail sends a password reset email
func (s *ResendEmailService) SendPasswordResetEmail(ctx context.Context, to, username, resetToken string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, resetToken)

	subject := "Reset Your DeskSpacer Password"
	htmlBody := renderPasswordResetEmailHTML(username, resetURL)
	textBody := renderPasswordResetEmailText(username, resetURL)

	return s.sendEmail(ctx, to, subject, htmlBody, textBody)
}

// SendWelcomeEmail sends a welcome email after successful verification
func (s *ResendEmailService) SendWelcomeEmail(ctx context.Context, to, username string) error {
	subject := "Welcome to DeskSpacer!"
	htmlBody := renderWelcomeEmailHTML(username, s.frontendURL)
	textBody := renderWelcomeEmailText(username, s.frontendURL)

	return s.sendEmail(ctx, to, subject, htmlBody, textBody)
}

// Email template rendering functions

func renderVerificationEmailHTML(username, verificationURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">DeskSpacer</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi {{.Username}},</h2>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Thanks for signing up for DeskSpacer! Please verify your email address to get started.
                            </p>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                Click the button below to verify your email:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{.VerificationURL}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #999999; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                                Or copy and paste this link into your browser:<br>
                                <a href="{{.VerificationURL}}" style="color: #667eea; word-break: break-all;">{{.VerificationURL}}</a>
                            </p>
                            <p style="color: #999999; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                This link will expire in 24 hours.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                If you didn't create a DeskSpacer account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
	t := template.Must(template.New("verification").Parse(tmpl))
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Username":        username,
		"VerificationURL": verificationURL,
	})
	return buf.String()
}

func renderVerificationEmailText(username, verificationURL string) string {
	return fmt.Sprintf(`Hi %s,

Thanks for signing up for DeskSpacer! Please verify your email address to get started.

Verify your email by clicking this link:
%s

This link will expire in 24 hours.

If you didn't create a DeskSpacer account, you can safely ignore this email.

Best regards,
The DeskSpacer Team`, username, verificationURL)
}

func renderPasswordResetEmailHTML(username, resetURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">DeskSpacer</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi {{.Username}},</h2>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                We received a request to reset your password for your DeskSpacer account.
                            </p>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                Click the button below to reset your password:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{.ResetURL}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #999999; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                                Or copy and paste this link into your browser:<br>
                                <a href="{{.ResetURL}}" style="color: #667eea; word-break: break-all;">{{.ResetURL}}</a>
                            </p>
                            <p style="color: #999999; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                This link will expire in 1 hour.
                            </p>
                            <p style="color: #ff6b6b; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px; font-weight: bold;">
                                ⚠️ If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                For security, never share this link with anyone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
	t := template.Must(template.New("reset").Parse(tmpl))
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Username": username,
		"ResetURL": resetURL,
	})
	return buf.String()
}

func renderPasswordResetEmailText(username, resetURL string) string {
	return fmt.Sprintf(`Hi %s,

We received a request to reset your password for your DeskSpacer account.

Reset your password by clicking this link:
%s

This link will expire in 1 hour.

⚠️ If you didn't request a password reset, please ignore this email or contact support if you have concerns.

For security, never share this link with anyone.

Best regards,
The DeskSpacer Team`, username, resetURL)
}

func renderWelcomeEmailHTML(username, frontendURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DeskSpacer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Welcome to DeskSpacer!</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi {{.Username}},</h2>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Your email has been verified! You're all set to start designing your dream desk setup.
                            </p>
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                With DeskSpacer, you can:
                            </p>
                            <ul style="color: #666666; line-height: 1.8; margin: 0 0 30px 20px; font-size: 16px;">
                                <li>Visualize your desk setup in 3D before buying</li>
                                <li>Save up to 5 different desk configurations</li>
                                <li>Share your setups with friends</li>
                                <li>Explore and get inspired by community setups</li>
                            </ul>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{.FrontendURL}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Start Designing</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #999999; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                                Want more? Upgrade to Premium for:
                            </p>
                            <ul style="color: #999999; line-height: 1.6; margin: 10px 0 0 20px; font-size: 14px;">
                                <li>Save up to 100 desk configurations</li>
                                <li>Upload custom 3D models (10 files, 50MB storage)</li>
                                <li>Lifetime access for just $9.99</li>
                            </ul>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                Happy designing! 🖥️✨
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
	t := template.Must(template.New("welcome").Parse(tmpl))
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Username":    username,
		"FrontendURL": frontendURL,
	})
	return buf.String()
}

func renderWelcomeEmailText(username, frontendURL string) string {
	return fmt.Sprintf(`Hi %s,

🎉 Welcome to DeskSpacer!

Your email has been verified! You're all set to start designing your dream desk setup.

With DeskSpacer, you can:
- Visualize your desk setup in 3D before buying
- Save up to 5 different desk configurations
- Share your setups with friends
- Explore and get inspired by community setups

Start designing now: %s

Want more? Upgrade to Premium for:
- Save up to 100 desk configurations
- Upload custom 3D models (10 files, 50MB storage)
- Lifetime access for just $9.99

Happy designing! 🖥️✨

Best regards,
The DeskSpacer Team`, username, frontendURL)
}

// MockEmailService is a mock implementation for testing
type MockEmailService struct {
	Emails []MockEmail
}

type MockEmail struct {
	To      string
	Subject string
	Type    string // "verification", "reset", "welcome"
}

func NewMockEmailService() *MockEmailService {
	return &MockEmailService{
		Emails: make([]MockEmail, 0),
	}
}

func (m *MockEmailService) SendVerificationEmail(ctx context.Context, to, username, verificationToken string) error {
	m.Emails = append(m.Emails, MockEmail{
		To:      to,
		Subject: "Verify Your DeskSpacer Account",
		Type:    "verification",
	})
	slog.Info("Mock: Email verification sent", "to", to, "token", verificationToken)
	return nil
}

func (m *MockEmailService) SendPasswordResetEmail(ctx context.Context, to, username, resetToken string) error {
	m.Emails = append(m.Emails, MockEmail{
		To:      to,
		Subject: "Reset Your DeskSpacer Password",
		Type:    "reset",
	})
	slog.Info("Mock: Password reset email sent", "to", to, "token", resetToken)
	return nil
}

func (m *MockEmailService) SendWelcomeEmail(ctx context.Context, to, username string) error {
	m.Emails = append(m.Emails, MockEmail{
		To:      to,
		Subject: "Welcome to DeskSpacer!",
		Type:    "welcome",
	})
	slog.Info("Mock: Welcome email sent", "to", to)
	return nil
}
