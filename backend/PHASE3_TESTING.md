# Phase 3 GraphQL Authentication Testing Guide

This guide provides step-by-step instructions for testing the GraphQL authentication system.

## Prerequisites

### 1. Start PostgreSQL Database

```bash
# Using Docker (recommended for testing)
docker run --name deskspacer-postgres \
  -e POSTGRES_DB=deskspacer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345678 \
  -p 5432:5432 \
  -d postgres:16

# Or using Podman
podman run --name deskspacer-postgres \
  -e POSTGRES_DB=deskspacer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345678 \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Create Environment File

```bash
cd backend
cp .env.example .env
```

Edit `.env` to ensure these minimum settings are configured:

```bash
# Required for testing
SERVER_PORT=5221
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deskspacer
DB_USER=postgres
DB_PASSWORD=12345678
DB_SSLMODE=disable
JWT_SECRET=test-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=168h
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost,https://studio.apollographql.com
```

### 3. Start the Server

```bash
cd backend
go run ./cmd/server
```

You should see:
```
{"time":"...","level":"INFO","msg":"Starting DeskSpacer Go Backend"}
{"time":"...","level":"INFO","msg":"Running database migrations"}
{"time":"...","level":"INFO","msg":"Database migrations completed"}
{"time":"...","level":"INFO","msg":"Auth service initialized"}
{"time":"...","level":"INFO","msg":"Server starting","port":"5221","graphql_endpoint":"http://localhost:5221/graphql"}
```

## Testing with GraphiQL/Playground

Open your browser to: `http://localhost:5221/graphql`

You'll see the GraphQL Playground interface where you can run queries interactively.

## Test Scenarios

### 1. Check Email Availability (No Auth Required)

```graphql
query {
  checkEmailAvailable(email: "test@example.com")
}
```

Expected response:
```json
{
  "data": {
    "checkEmailAvailable": true
  }
}
```

### 2. Check Username Availability (No Auth Required)

```graphql
query {
  checkUsernameAvailable(username: "testuser")
}
```

Expected response:
```json
{
  "data": {
    "checkUsernameAvailable": true
  }
}
```

### 3. Register a New User

```graphql
mutation {
  register(input: {
    email: "test@example.com"
    username: "testuser"
    password: "SecurePass123!"
  }) {
    user {
      id
      email
      username
      emailVerified
      isPremium
      stateCount
      glbCount
      storageUsed
      createdAt
    }
    accessToken
    refreshToken
  }
}
```

Expected response:
```json
{
  "data": {
    "register": {
      "user": {
        "id": "uuid-here",
        "email": "test@example.com",
        "username": "testuser",
        "emailVerified": false,
        "isPremium": false,
        "stateCount": 0,
        "glbCount": 0,
        "storageUsed": 0,
        "createdAt": "2024-..."
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "long-refresh-token-string"
    }
  }
}
```

**Save the `accessToken` for subsequent requests!**

### 4. Login

```graphql
mutation {
  login(input: {
    email: "test@example.com"
    password: "SecurePass123!"
  }) {
    user {
      id
      email
      username
      isPremium
    }
    accessToken
    refreshToken
  }
}
```

### 5. Get Current User (Requires Authentication)

Add HTTP header:
```
Authorization: Bearer <your-access-token>
```

Query:
```graphql
query {
  me {
    id
    email
    username
    emailVerified
    isPremium
    stateCount
    glbCount
    storageUsed
    createdAt
  }
}
```

Expected response:
```json
{
  "data": {
    "me": {
      "id": "uuid-here",
      "email": "test@example.com",
      "username": "testuser",
      "emailVerified": false,
      "isPremium": false,
      "stateCount": 0,
      "glbCount": 0,
      "storageUsed": 0,
      "createdAt": "2024-..."
    }
  }
}
```

### 6. Save a Canvas State (Requires Authentication)

With Authorization header:
```graphql
mutation {
  saveState(
    name: "My Dream Setup"
    stateData: "{\"models\":[{\"type\":\"monitor\",\"name\":\"LG UltraWide\",\"position\":{\"x\":0,\"y\":0,\"z\":0}}]}"
    isPublic: true
  ) {
    id
    name
    stateData
    isPublic
    publicToken
    createdAt
    updatedAt
  }
}
```

Expected response:
```json
{
  "data": {
    "saveState": {
      "id": "state-uuid",
      "name": "My Dream Setup",
      "stateData": "{\"models\":[...]}",
      "isPublic": true,
      "publicToken": "public-token-uuid",
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  }
}
```

### 7. Get My States (Requires Authentication)

```graphql
query {
  myStates {
    id
    name
    isPublic
    publicToken
    createdAt
    updatedAt
  }
}
```

### 8. Get Public State (No Auth Required)

Use the `publicToken` from step 6:

```graphql
query {
  publicState(token: "public-token-uuid-here") {
    id
    name
    stateData
    isPublic
    createdAt
  }
}
```

### 9. Update State (Requires Authentication + Ownership)

```graphql
mutation {
  updateState(
    id: "state-uuid-here"
    name: "Updated Setup Name"
    stateData: "{\"models\":[{\"type\":\"keyboard\",\"name\":\"Keychron Q1\"}]}"
    isPublic: false
  ) {
    id
    name
    stateData
    isPublic
    publicToken
    updatedAt
  }
}
```

### 10. Delete State (Requires Authentication + Ownership)

```graphql
mutation {
  deleteState(id: "state-uuid-here")
}
```

Expected response:
```json
{
  "data": {
    "deleteState": true
  }
}
```

### 11. Refresh Access Token

```graphql
mutation {
  refreshToken(refreshToken: "your-refresh-token-here") {
    user {
      id
      email
    }
    accessToken
    refreshToken
  }
}
```

### 12. Request Password Reset

```graphql
mutation {
  requestPasswordReset(email: "test@example.com")
}
```

Expected response:
```json
{
  "data": {
    "requestPasswordReset": true
  }
}
```

**Note:** In production, this will send an email. For testing, check the `password_reset_tokens` table in the database to get the token.

```sql
SELECT token FROM password_reset_tokens WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com') ORDER BY created_at DESC LIMIT 1;
```

### 13. Reset Password

```graphql
mutation {
  resetPassword(
    token: "token-from-database"
    newPassword: "NewSecurePass456!"
  )
}
```

### 14. Verify Email

Similar to password reset, get the token from the database:

```sql
SELECT token FROM email_verification_tokens WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com') ORDER BY created_at DESC LIMIT 1;
```

Then:
```graphql
mutation {
  verifyEmail(token: "token-from-database")
}
```

## Testing with cURL

### Register User

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(input: { email: \"test@example.com\", username: \"testuser\", password: \"SecurePass123!\" }) { user { id email username } accessToken refreshToken } }"
  }'
```

### Login

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test@example.com\", password: \"SecurePass123!\" }) { user { id email } accessToken refreshToken } }"
  }'
```

### Get Current User (with token)

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "query": "query { me { id email username isPremium stateCount } }"
  }'
```

### Save State (with token)

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "query": "mutation { saveState(name: \"Test Setup\", stateData: \"{\\\"models\\\":[]}\", isPublic: true) { id name publicToken } }"
  }'
```

## Testing Error Cases

### 1. Invalid Password (Too Weak)

```graphql
mutation {
  register(input: {
    email: "weak@example.com"
    username: "weakuser"
    password: "weak"
  }) {
    user { id }
  }
}
```

Expected error:
```json
{
  "errors": [{
    "message": "password must be at least 8 characters with uppercase, lowercase, number and special character"
  }]
}
```

### 2. Duplicate Email

Try registering with the same email twice:

Expected error:
```json
{
  "errors": [{
    "message": "email already exists"
  }]
}
```

### 3. Invalid Login Credentials

```graphql
mutation {
  login(input: {
    email: "test@example.com"
    password: "WrongPassword123!"
  }) {
    user { id }
  }
}
```

Expected error:
```json
{
  "errors": [{
    "message": "invalid credentials"
  }]
}
```

### 4. Unauthorized Access (No Token)

Try running `me` query without Authorization header:

Expected error:
```json
{
  "errors": [{
    "message": "unauthorized"
  }]
}
```

### 5. State Limit Exceeded

Create 5 states (free tier limit), then try to create a 6th:

Expected error:
```json
{
  "errors": [{
    "message": "state limit reached"
  }]
}
```

### 6. Access Another User's Private State

Try to access or modify a state owned by another user:

Expected error:
```json
{
  "errors": [{
    "message": "unauthorized"
  }]
}
```

## Database Verification

### Check Users Table

```sql
SELECT id, email, username, email_verified, is_premium, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

### Check User States

```sql
SELECT us.id, us.name, us.is_public, us.public_token, u.username, us.created_at
FROM user_states us
JOIN users u ON us.user_id = u.id
ORDER BY us.created_at DESC
LIMIT 10;
```

### Check Token Tables

```sql
-- Email verification tokens
SELECT user_id, token, expires_at, created_at
FROM email_verification_tokens
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Password reset tokens
SELECT user_id, token, expires_at, created_at
FROM password_reset_tokens
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Refresh tokens
SELECT user_id, token, expires_at, is_revoked, created_at
FROM refresh_tokens
WHERE expires_at > NOW() AND is_revoked = false
ORDER BY created_at DESC;
```

## Health Check

Verify the server is running:

```bash
curl http://localhost:5221/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-15T10:00:00Z"
}
```

## Performance Testing

### Rate Limiting Test

The API has rate limiting configured. Try making more than 10 requests per minute to see rate limiting in action:

```bash
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST http://localhost:5221/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"query { checkEmailAvailable(email: \"test@example.com\") }"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

After 10 requests, you should receive HTTP 429 (Too Many Requests).

## Troubleshooting

### Server won't start

1. Check PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Check environment variables are set correctly in `.env`
3. Check logs for specific error messages
4. Verify JWT_SECRET is set (required for auth service)

### Migrations fail

```bash
# Connect to database and check migration status
psql -h localhost -U postgres -d deskspacer -c "SELECT * FROM schema_migrations;"
```

### Authentication not working

1. Verify JWT_SECRET is consistent
2. Check token expiration times (access tokens expire in 15 minutes by default)
3. Ensure Authorization header format is: `Bearer <token>` (note the space)
4. Check token hasn't expired - use `refreshToken` mutation if needed

### States not saving

1. Verify user is authenticated
2. Check state count hasn't exceeded limit (5 for free users)
3. Verify stateData is valid JSON string
4. Check database user_states table for errors

## Next Steps

After confirming Phase 3 works correctly:
- Phase 4: Email Service (Resend integration for verification/password reset emails)
- Phase 5: Cloudflare R2 Storage (for custom GLB uploads)
- Phase 6: Stripe Integration (for premium upgrades)
- Phase 7: Frontend implementation (React components, Apollo Client setup)
