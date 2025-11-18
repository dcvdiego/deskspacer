# Phase 4 Email Service Testing Guide

This guide provides step-by-step instructions for testing the email service integration with Resend.

## Overview

Phase 4 adds email functionality to the authentication system:
- **Email Verification**: Sent after user registration
- **Password Reset**: Sent when user requests password reset
- **Welcome Email**: Sent after successful email verification

## Prerequisites

### 1. Complete Phase 3 Setup

Ensure Phase 3 (GraphQL integration) is working:
- PostgreSQL database running
- Server configured with `.env` file
- GraphQL endpoint accessible at `http://localhost:5221/graphql`

### 2. Email Service Configuration

You have two options for testing emails:

#### Option A: Mock Email Service (Development/Testing)

No configuration needed! If `RESEND_API_KEY` is not set, the server automatically uses a mock email service that logs emails to the console.

```bash
# In .env - just leave RESEND_API_KEY commented out
# RESEND_API_KEY=
```

When the server starts, you'll see:
```
{"level":"WARN","msg":"Using mock email service (no RESEND_API_KEY configured)"}
```

Mock emails will be logged like:
```
{"level":"INFO","msg":"Mock: Email verification sent","to":"user@example.com","token":"abc123..."}
```

#### Option B: Real Resend Email Service (Production-like)

1. **Create Resend Account:**
   - Go to https://resend.com
   - Sign up for free account (100 emails/day on free tier)
   - Verify your account

2. **Get API Key:**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "DeskSpacer Dev")
   - Copy the API key (starts with `re_`)

3. **Configure Email Domain:**

   **Option 1: Use test email (easier for development)**
   ```bash
   EMAIL_FROM=onboarding@resend.dev
   ```
   This sends from Resend's test domain. Emails will be delivered but may go to spam.

   **Option 2: Use your own domain (recommended for production)**
   - Add your domain in Resend dashboard
   - Add DNS records (TXT, CNAME, DKIM)
   - Verify domain
   - Use your domain email:
     ```bash
     EMAIL_FROM=noreply@yourdomain.com
     ```

4. **Update .env:**
```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

5. **Restart server** to pick up new configuration

## Testing Email Flows

### Test 1: User Registration with Email Verification

**Expected Flow:**
1. User registers → Email verification sent
2. User clicks link in email → Email verified
3. Welcome email sent

**Steps:**

1. **Register a new user:**
```graphql
mutation {
  register(input: {
    email: "your-real-email@example.com"  # Use your real email!
    username: "testuser"
    password: "SecurePass123!"
  }) {
    user {
      id
      email
      username
      emailVerified
    }
    accessToken
  }
}
```

2. **Check your inbox:**
   - With Resend: Check your email inbox
   - With Mock: Check server logs for token

   **Mock service output:**
   ```
   {"level":"INFO","msg":"Mock: Email verification sent","to":"your-email@example.com","token":"abc123token"}
   ```

3. **Get verification token:**

   **If using Mock service:**
   - Copy token from server logs

   **If using Resend:**
   - Check your email inbox
   - Click the verification link, or
   - Extract token from URL: `http://localhost:5173/verify-email?token=YOUR_TOKEN`

   **Or query database directly:**
   ```sql
   SELECT token, expires_at
   FROM email_verification_tokens
   WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **Verify email:**
```graphql
mutation {
  verifyEmail(token: "your-token-here")
}
```

Expected response:
```json
{
  "data": {
    "verifyEmail": true
  }
}
```

5. **Check for welcome email:**
   - With Resend: Check inbox for "Welcome to DeskSpacer!"
   - With Mock: Check logs for welcome email

   **Mock service output:**
   ```
   {"level":"INFO","msg":"Mock: Welcome email sent","to":"your-email@example.com"}
   ```

6. **Verify email is verified:**
```graphql
query {
  me {
    email
    emailVerified  # Should be true now
  }
}
```

### Test 2: Password Reset Flow

**Expected Flow:**
1. User requests reset → Reset email sent
2. User clicks link → Password reset page
3. User enters new password → Password updated

**Steps:**

1. **Request password reset:**
```graphql
mutation {
  requestPasswordReset(email: "your-email@example.com")
}
```

Expected response (always returns true for security):
```json
{
  "data": {
    "requestPasswordReset": true
  }
}
```

2. **Get reset token:**

   **If using Mock service:**
   ```
   {"level":"INFO","msg":"Mock: Password reset email sent","to":"your-email@example.com","token":"xyz789token"}
   ```

   **If using Resend:**
   - Check email for "Reset Your DeskSpacer Password"
   - Extract token from reset URL

   **Or query database:**
   ```sql
   SELECT token, expires_at
   FROM password_reset_tokens
   WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Reset password:**
```graphql
mutation {
  resetPassword(
    token: "your-reset-token-here"
    newPassword: "NewSecurePass456!"
  )
}
```

Expected response:
```json
{
  "data": {
    "resetPassword": true
  }
}
```

4. **Verify old password doesn't work:**
```graphql
mutation {
  login(input: {
    email: "your-email@example.com"
    password: "SecurePass123!"  # Old password
  }) {
    user { id }
  }
}
```

Should return error: "invalid email or password"

5. **Verify new password works:**
```graphql
mutation {
  login(input: {
    email: "your-email@example.com"
    password: "NewSecurePass456!"  # New password
  }) {
    user {
      id
      email
    }
    accessToken
  }
}
```

Should return user and tokens successfully.

## Email Templates Preview

### Verification Email

**Subject:** Verify Your DeskSpacer Account

**Content:**
- Purple gradient header with DeskSpacer logo
- Personal greeting: "Hi {username},"
- Clear call-to-action button: "Verify Email"
- Fallback text link
- 24-hour expiration notice
- Security notice

**HTML Features:**
- Responsive design (works on mobile)
- Gradient button with hover effect
- Professional email styling
- Plain text fallback

### Password Reset Email

**Subject:** Reset Your DeskSpacer Password

**Content:**
- Purple gradient header
- Personal greeting
- "Reset Password" button
- 1-hour expiration notice
- Security warning (red text)
- Notice about not sharing link

### Welcome Email

**Subject:** Welcome to DeskSpacer!

**Content:**
- Celebration header with emoji
- Welcome message
- Feature list (bullets)
- "Start Designing" button
- Premium upgrade information
- Friendly sign-off

## Testing Email Service Directly

### Manual Email Service Test

Create a test file to send emails directly:

```go
// backend/test_email.go
// +build ignore

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/dcvdiego/deskspacer/backend/internal/config"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	// Create email service
	var emailService service.EmailService
	if cfg.ResendAPIKey != "" {
		emailService = service.NewResendEmailService(cfg.ResendAPIKey, cfg.EmailFrom, cfg.FrontendURL)
		fmt.Println("Using Resend email service")
	} else {
		emailService = service.NewMockEmailService()
		fmt.Println("Using mock email service")
	}

	ctx := context.Background()

	// Test verification email
	fmt.Println("\nSending verification email...")
	err = emailService.SendVerificationEmail(ctx, "your-email@example.com", "TestUser", "test-token-123")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Println("✅ Verification email sent")
	}

	// Test password reset email
	fmt.Println("\nSending password reset email...")
	err = emailService.SendPasswordResetEmail(ctx, "your-email@example.com", "TestUser", "reset-token-456")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Println("✅ Password reset email sent")
	}

	// Test welcome email
	fmt.Println("\nSending welcome email...")
	err = emailService.SendWelcomeEmail(ctx, "your-email@example.com", "TestUser")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Println("✅ Welcome email sent")
	}

	fmt.Println("\nAll tests complete! Check your inbox.")
}
```

Run it:
```bash
cd backend
go run test_email.go
```

## Troubleshooting

### Problem: Emails not being sent (Mock service logs show but no email)

**Solution:** Check if you're using mock service. Set `RESEND_API_KEY` in `.env` to use real emails.

### Problem: Resend API returns 403 Forbidden

**Causes:**
- Invalid API key
- API key not activated
- Domain not verified (if using custom domain)

**Solutions:**
- Verify API key is correct in `.env`
- Use `onboarding@resend.dev` for testing
- Check Resend dashboard for API key status

### Problem: Emails go to spam

**Solutions:**
- Verify your sending domain in Resend
- Add SPF, DKIM, DMARC records
- Use a custom domain instead of `onboarding@resend.dev`
- Avoid spam trigger words in emails

### Problem: Token expired

**Causes:**
- Email verification tokens expire in 24 hours
- Password reset tokens expire in 1 hour

**Solutions:**
- Request a new token
- Check database for token expiration time:
  ```sql
  SELECT token, expires_at, NOW() > expires_at as is_expired
  FROM email_verification_tokens
  WHERE token = 'your-token';
  ```

### Problem: Server logs show "Failed to send verification email"

**Check:**
1. Server logs for specific error message
2. Resend dashboard for API errors
3. Network connectivity
4. API rate limits (100/day on free tier)

**Solutions:**
- Check Resend API status
- Verify API key is valid
- Check rate limits in Resend dashboard
- Review error in server logs for specifics

### Problem: Links in email don't work

**Cause:** `FRONTEND_URL` in `.env` doesn't match your frontend URL

**Solution:**
```bash
# Update .env
FRONTEND_URL=http://localhost:5173  # Match your frontend URL
```

## Database Verification

### Check Email Verification Tokens
```sql
SELECT
    u.email,
    u.username,
    evt.token,
    evt.expires_at,
    evt.expires_at > NOW() as is_valid,
    evt.created_at
FROM email_verification_tokens evt
JOIN users u ON evt.user_id = u.id
ORDER BY evt.created_at DESC
LIMIT 10;
```

### Check Password Reset Tokens
```sql
SELECT
    u.email,
    u.username,
    prt.token,
    prt.expires_at,
    prt.expires_at > NOW() as is_valid,
    prt.used_at,
    prt.created_at
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
ORDER BY prt.created_at DESC
LIMIT 10;
```

### Check Email Verification Status
```sql
SELECT
    email,
    username,
    email_verified,
    created_at
FROM users
ORDER BY created_at DESC;
```

## Resend Dashboard Monitoring

Access Resend dashboard at: https://resend.com/emails

**Features:**
- View all sent emails
- See delivery status
- Check open/click rates
- View email content
- Debug delivery issues
- Monitor API usage

## Rate Limits

### Resend Free Tier:
- **100 emails/day**
- **3,000 emails/month**
- From `onboarding@resend.dev` only

### Resend Pro ($20/month):
- **50,000 emails/month**
- Custom domains
- Better deliverability

### Mock Service:
- No limits
- Perfect for development/testing

## Security Considerations

### Email Security:
- Tokens are random hex strings (32 bytes = 64 characters)
- Verification tokens expire in 24 hours
- Reset tokens expire in 1 hour
- Tokens deleted after use
- Password reset doesn't reveal if email exists

### Best Practices:
- Use HTTPS in production for `FRONTEND_URL`
- Verify your email domain for better deliverability
- Monitor Resend logs for suspicious activity
- Rate limit password reset requests (already implemented)
- Never log email content or tokens in production

## Next Steps

After confirming Phase 4 works:
- **Phase 5:** Cloudflare R2 Storage (custom GLB uploads)
- **Phase 6:** Stripe Integration (premium payments)
- **Phase 7:** Frontend Implementation (React components)

## Quick Reference

### Environment Variables
```bash
RESEND_API_KEY=re_...          # Get from resend.com
EMAIL_FROM=noreply@domain.com  # Or onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

### Common GraphQL Operations
```graphql
# Register
mutation { register(input: {...}) { ... } }

# Request Reset
mutation { requestPasswordReset(email: "...") }

# Reset Password
mutation { resetPassword(token: "...", newPassword: "...") }

# Verify Email
mutation { verifyEmail(token: "...") }
```

### Logs to Watch
```bash
# Start server and watch logs
cd backend
go run ./cmd/server | grep -i "email\|mock"
```
