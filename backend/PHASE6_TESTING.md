# Phase 6 - Stripe Payment Integration Testing Guide

Phase 6 adds premium subscription payment processing through Stripe.

## Overview

**Features Added:**
- Stripe checkout session creation
- Webhook handling for payment events
- Automatic premium status management
- Mock Stripe service for development

## Configuration

### Option A: Mock Stripe (Development/Testing)

No configuration needed! Server uses mock service automatically.

```bash
# In .env - leave Stripe credentials commented out
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_PRICE_ID=
```

Server logs: `"Using mock Stripe service"`

### Option B: Real Stripe (Production)

1. **Create Stripe Account**: https://dashboard.stripe.com
2. **Get API Keys**: Developers → API Keys
   - Secret Key: `sk_test_...` or `sk_live_...`
3. **Create Product/Price**:
   - Products → Create product
   - Copy Price ID: `price_...`
4. **Create Webhook**:
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy Signing Secret: `whsec_...`

5. **Update .env**:
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel
```

## Testing Flow

### 1. Create Checkout Session

**GraphQL Mutation:**
```graphql
mutation {
  createCheckoutSession {
    sessionID
    url
  }
}
```

**Required:** Authentication (Bearer token)

**Expected Response:**
```json
{
  "data": {
    "createCheckoutSession": {
      "sessionID": "session-from-url",
      "url": "https://checkout.stripe.test/session/cs_test_..."
    }
  }
}
```

**Mock Service:**
- Returns URL: `https://checkout.stripe.test/session/cs_test_mock_{userID}`
- No actual payment required

**Real Stripe:**
- Redirects to real Stripe checkout page
- Use test card: `4242 4242 4242 4242`
- Any future expiry, any CVC

### 2. Complete Payment

**Mock:** Simulate webhook by sending POST to `/webhooks/stripe`

**Real Stripe:** Complete payment in checkout page

### 3. Webhook Processing

**Endpoint:** `POST /webhooks/stripe`

**Supported Events:**
- `checkout.session.completed` → Activate premium
- `customer.subscription.created` → Activate premium
- `customer.subscription.updated` → Update premium status
- `customer.subscription.deleted` → Deactivate premium
- `invoice.payment_succeeded` → Confirm premium
- `invoice.payment_failed` → Log failure

**Testing Webhooks with Stripe CLI:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5221/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
```

### 4. Verify Premium Status

**Query:**
```graphql
query {
  me {
    email
    isPremium
    stateCount
    glbCount
  }
}
```

**Expected after payment:**
```json
{
  "data": {
    "me": {
      "email": "user@example.com",
      "isPremium": true,
      "stateCount": 0,
      "glbCount": 0
    }
  }
}
```

## Error Scenarios

### 1. Already Premium

**Request:** `createCheckoutSession` when user is already premium

**Response:**
```json
{
  "errors": [{
    "message": "user already has premium membership"
  }]
}
```

### 2. Not Authenticated

**Request:** `createCheckoutSession` without auth token

**Response:**
```json
{
  "errors": [{
    "message": "authentication required"
  }]
}
```

### 3. Missing Stripe Configuration

**Server logs:** `"Using mock Stripe service"`

**Behavior:** Checkout URLs work but point to mock endpoints

### 4. Invalid Webhook Signature

**Response:** `400 Bad Request` - "Invalid webhook signature"

**Solution:** Check `STRIPE_WEBHOOK_SECRET` matches webhook endpoint

## Database Verification

```sql
-- Check premium status
SELECT id, email, is_premium, premium_activated_at
FROM users
WHERE email = 'test@example.com';

-- Expected after payment:
-- is_premium: true
-- premium_activated_at: [timestamp]
```

## Test Checklist

- [ ] Server builds successfully
- [ ] Mock Stripe service works (no credentials)
- [ ] Real Stripe service initializes (with credentials)
- [ ] Authenticated user can create checkout session
- [ ] Unauthenticated request is rejected
- [ ] Already premium user cannot create session
- [ ] Checkout session has valid URL
- [ ] Webhook endpoint is accessible (`POST /webhooks/stripe`)
- [ ] Webhook validates Stripe signature
- [ ] `checkout.session.completed` activates premium
- [ ] `customer.subscription.deleted` deactivates premium
- [ ] Premium status persists in database
- [ ] All 30 service tests pass (95 test cases)
- [ ] Frontend tests still pass (116 tests)

## Unit Test Summary

**Phase 6 Stripe Tests:**
- `TestMockStripeService` - Mock service operations
- `TestRealStripeServiceCreation` - Service initialization
- `TestStripeServiceInterface` - Interface compliance
- `TestMockCheckoutSessionFields` - Session structure
- `TestStripeEventHelpers` - Event processing helpers

**Total Service Tests:** 30 functions, 95 test cases

**Command:**
```bash
go test -v ./internal/service/...
```

## Integration Testing

### Complete E2E Flow

1. **Register User:**
```graphql
mutation {
  register(input: {
    email: "premium@example.com"
    username: "premiumuser"
    password: "SecurePass123!"
  }) {
    accessToken
    user { id email isPremium }
  }
}
```

2. **Verify Email (optional for testing):**
```sql
UPDATE users SET email_verified = true WHERE email = 'premium@example.com';
```

3. **Create Checkout:**
```graphql
mutation {
  createCheckoutSession {
    url
  }
}
```

4. **Complete Payment** (Real Stripe or simulate webhook)

5. **Verify Premium:**
```graphql
query {
  me {
    isPremium
    stateCount  # Should be 0-100 (vs 0-5 for free)
    glbCount    # Should be 0-10 (vs 0 for free)
  }
}
```

6. **Test Premium Features:**
```graphql
# Save more than 5 states (premium limit: 100)
mutation {
  saveState(name: "State 6", stateData: "{}", isPublic: false) {
    id
  }
}

# Upload custom GLB (premium only)
mutation {
  uploadCustomGLB(filename: "model.glb", fileData: "...") {
    id
  }
}
```

## Troubleshooting

### Problem: "Using mock Stripe service" but want real Stripe

**Cause:** Missing Stripe credentials in `.env`

**Solution:** Set all three: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`

### Problem: Webhook returns 400

**Cause:** Invalid signature or missing `STRIPE_WEBHOOK_SECRET`

**Solution:**
- Verify webhook secret matches Stripe dashboard
- Check `Stripe-Signature` header is present
- Use Stripe CLI for local testing

### Problem: Premium not activated after payment

**Causes:**
- Webhook not received
- Webhook processing failed
- User ID not in event metadata

**Solutions:**
- Check server logs for webhook events
- Verify webhook endpoint is publicly accessible
- Ensure checkout session includes user ID in metadata

### Problem: Cannot create checkout session

**Cause:** Missing `STRIPE_PRICE_ID`

**Error:** "stripe price ID not configured"

**Solution:** Set `STRIPE_PRICE_ID` in `.env`

## Mock vs Real Stripe

| Feature | Mock | Real Stripe |
|---------|------|-------------|
| Checkout URL | Mock endpoint | Real Stripe checkout |
| Payment | Simulated | Actual payment |
| Webhooks | Manual POST | Automatic from Stripe |
| Testing | Instant | Requires test cards |
| Cost | Free | Free (test mode) |
| Setup | None | API keys required |

## Security Considerations

1. **Webhook Signature Verification:** Always validate signatures
2. **HTTPS Required:** Webhooks only work over HTTPS in production
3. **Secret Key Security:** Never expose in client code
4. **Idempotency:** Handle duplicate webhook events gracefully
5. **User Verification:** Ensure user owns the subscription

## Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...              # Stripe API secret key
STRIPE_WEBHOOK_SECRET=whsec_...            # Webhook signing secret
STRIPE_PRICE_ID=price_...                  # Subscription price ID
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel
```

## Next Steps

After Phase 6:
- **Frontend:** Add checkout button and payment UI
- **Phase 7:** Admin panel for managing subscriptions
- **Production:** Switch to live Stripe keys

## Quick Reference

```bash
# Build
go build ./cmd/server

# Test
go test ./internal/service/...

# Run server
go run ./cmd/server

# Test webhook locally
stripe listen --forward-to localhost:5221/webhooks/stripe
```

**GraphQL Endpoint:** `http://localhost:5221/graphql`
**Webhook Endpoint:** `http://localhost:5221/webhooks/stripe`
**Health Check:** `http://localhost:5221/health`
