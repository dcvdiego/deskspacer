# Phase 2 Testing Guide

This guide provides step-by-step instructions for testing the Phase 2 authentication implementation.

## Overview

Phase 2 includes:
- ✅ User model with validation
- ✅ Authentication token models (email verification, password reset, refresh tokens)
- ✅ User, token, and state repositories
- ✅ AuthService with JWT and bcrypt
- ✅ HTTP middleware for authentication

We have two types of tests:
1. **Unit Tests** - Test business logic without database (fast, no setup needed)
2. **Integration Tests** - Test with real PostgreSQL database (requires setup)

---

## Quick Start: Run Unit Tests (No Database Required) ⚡

The easiest way to test Phase 2 is to run the unit tests for AuthService:

```bash
cd /home/user/deskspacer/backend

# Run unit tests only (uses mocks, no database needed)
go test ./internal/service/... -v

# Or run with more detail
go test ./internal/service/auth_service_test.go -v
```

**What these tests cover:**
- ✅ Password hashing with bcrypt
- ✅ Password validation (correct/incorrect)
- ✅ Password strength requirements
- ✅ JWT access token generation and validation
- ✅ User registration flow
- ✅ Duplicate email/username detection
- ✅ User login flow
- ✅ Invalid credential handling
- ✅ Token refresh flow
- ✅ Token revocation

**Expected output:**
```
=== RUN   TestHashPassword
--- PASS: TestHashPassword (0.25s)
=== RUN   TestValidatePassword
--- PASS: TestValidatePassword (0.50s)
=== RUN   TestValidatePasswordStrength
=== RUN   TestValidatePasswordStrength/Valid_password
--- PASS: TestValidatePasswordStrength/Valid_password (0.00s)
...
PASS
ok      github.com/dcvdiego/deskspacer/backend/internal/service    2.156s
```

---

## Integration Tests (With PostgreSQL Database) 🗄️

Integration tests verify that repositories work correctly with a real database.

### Prerequisites

You need a PostgreSQL database for integration tests. Options:

#### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name deskspacer-test-db \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=deskspacer_test \
  -p 5433:5432 \
  -d postgres:16

# Verify it's running
docker ps | grep deskspacer-test-db
```

#### Option 2: Podman

```bash
# Start PostgreSQL container
podman run --name deskspacer-test-db \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=deskspacer_test \
  -p 5433:5432 \
  -d postgres:16
```

#### Option 3: Local PostgreSQL

```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql@16

# Create test database
createdb deskspacer_test
```

### Run Migrations

Before running integration tests, apply migrations to your test database:

```bash
cd /home/user/deskspacer/backend

# Create a test .env file
cat > .env.test <<EOF
DB_HOST=localhost
DB_PORT=5433
DB_NAME=deskspacer_test
DB_USER=postgres
DB_PASSWORD=testpassword
DB_SSLMODE=disable
EOF

# Run migrations (will need to update main.go to support test env)
# For now, you can manually apply migrations:
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/001_create_shared_states.up.sql
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/002_create_users.up.sql
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/003_create_auth_tokens.up.sql
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/004_migrate_shared_states_to_user_states.up.sql
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/005_create_custom_glbs.up.sql
psql -h localhost -p 5433 -U postgres -d deskspacer_test < internal/database/migrations/006_create_payments.up.sql
```

### Configure Integration Tests

Update `internal/repository/user_repo_test.go` to connect to your test database:

```go
import (
    "github.com/jackc/pgx/v5/pgxpool"
)

func setupTestDB(t *testing.T) *pgxpool.Pool {
    t.Helper()

    ctx := context.Background()
    connString := "postgres://postgres:testpassword@localhost:5433/deskspacer_test?sslmode=disable"

    pool, err := pgxpool.New(ctx, connString)
    if err != nil {
        t.Fatalf("Unable to create connection pool: %v", err)
    }

    // Verify connection
    err = pool.Ping(ctx)
    if err != nil {
        t.Fatalf("Unable to connect to database: %v", err)
    }

    // Clean test data before each test
    cleanTestData(t, pool)

    return pool
}

func cleanTestData(t *testing.T, pool *pgxpool.Pool) {
    ctx := context.Background()

    // Delete all test data in reverse foreign key order
    _, err := pool.Exec(ctx, "TRUNCATE users, email_verification_tokens, password_reset_tokens, refresh_tokens, user_states, custom_glbs, payments CASCADE")
    if err != nil {
        t.Logf("Warning: Failed to clean test data: %v", err)
    }
}
```

### Run Integration Tests

```bash
# Run integration tests
go test ./internal/repository/... -v

# Skip integration tests (for CI/CD without database)
go test ./internal/repository/... -v -short
```

---

## Manual Testing with cURL 🧪

Once you have the server running with Phase 3 (GraphQL resolvers), you can test with cURL:

### 1. Start the Server

```bash
cd /home/user/deskspacer/backend

# Make sure you have a .env file configured
cp .env.example .env
# Edit .env with your database credentials

# Run the server
go run ./cmd/server
```

### 2. Test Registration (Coming in Phase 3)

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(input: { email: \"test@example.com\", username: \"testuser\", password: \"SecurePass123!\" }) { user { id email username } accessToken refreshToken } }"
  }'
```

### 3. Test Login (Coming in Phase 3)

```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test@example.com\", password: \"SecurePass123!\" }) { user { id email username isPremium } accessToken refreshToken } }"
  }'
```

### 4. Test Protected Query with Token (Coming in Phase 3)

```bash
# Save the token from login response
TOKEN="your-access-token-here"

curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "{ me { id email username emailVerified isPremium } }"
  }'
```

---

## Testing Checklist ✅

### Unit Tests (No Database)

- [ ] Run `go test ./internal/service/... -v`
- [ ] Verify all tests pass
- [ ] Check test coverage: `go test ./internal/service/... -cover`

### Password Security

- [ ] Verify weak passwords are rejected
- [ ] Verify strong passwords are accepted
- [ ] Verify password hashing works
- [ ] Verify password validation works

### JWT Tokens

- [ ] Verify access tokens are generated
- [ ] Verify access tokens can be validated
- [ ] Verify invalid tokens are rejected
- [ ] Verify expired tokens are rejected (may need to adjust expiration for testing)

### Registration Flow

- [ ] Verify new users can register
- [ ] Verify duplicate emails are rejected
- [ ] Verify duplicate usernames are rejected
- [ ] Verify both tokens are returned

### Login Flow

- [ ] Verify users can login with correct credentials
- [ ] Verify login fails with wrong password
- [ ] Verify login fails with non-existent email

### Token Refresh

- [ ] Verify refresh token can generate new access token
- [ ] Verify revoked tokens don't work

### Integration Tests (With Database)

- [ ] Setup test PostgreSQL database
- [ ] Apply all migrations
- [ ] Configure test database connection
- [ ] Run `go test ./internal/repository/... -v`
- [ ] Verify user CRUD operations
- [ ] Verify email verification
- [ ] Verify premium activation
- [ ] Verify cascade deletes work

---

## Common Issues & Troubleshooting 🔧

### Issue: "package deskspacer/internal/models is not in std"

**Solution:** Import paths are incorrect. Make sure all imports use:
```go
import "github.com/dcvdiego/deskspacer/backend/internal/..."
```

### Issue: "connection refused" when running integration tests

**Solution:** Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# or
sudo systemctl status postgresql
```

### Issue: "relation does not exist"

**Solution:** Migrations haven't been run. Apply migrations to test database:
```bash
psql -h localhost -p 5433 -U postgres -d deskspacer_test -f internal/database/migrations/*.up.sql
```

### Issue: Tests fail with "duplicate key value violates unique constraint"

**Solution:** Test data isn't being cleaned between tests. Make sure `cleanTestData()` is called in `setupTestDB()`.

### Issue: "bcrypt: hashedPassword is not the hash of the given password"

**Solution:** This is normal for invalid password tests. Check that you're testing the right scenario.

---

## Test Coverage Report 📊

Generate a coverage report:

```bash
# Generate coverage for auth service
go test ./internal/service/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html

# Open in browser
open coverage.html  # macOS
xdg-open coverage.html  # Linux
```

**Expected coverage:**
- `auth_service.go`: ~85-95%
- Most uncovered lines should be error handling paths

---

## Next Steps 🚀

After verifying Phase 2 tests pass:

1. ✅ **Phase 3: GraphQL Integration**
   - Add auth mutations to GraphQL schema
   - Create auth resolvers
   - Wire up middleware to GraphQL endpoint
   - Test with GraphiQL

2. ✅ **Phase 4: Email Service**
   - Integrate Resend for email sending
   - Test email verification flow
   - Test password reset flow

3. ✅ **Phase 5: Frontend Integration**
   - Add React auth forms
   - Test login/signup flows
   - Test protected routes

---

## Quick Reference Commands 📝

```bash
# Run all unit tests
go test ./internal/service/... -v

# Run specific test
go test ./internal/service/... -v -run TestRegister

# Run with coverage
go test ./internal/service/... -cover

# Run integration tests (requires database)
go test ./internal/repository/... -v

# Skip integration tests
go test ./... -short

# Run all tests
go test ./... -v

# Build the server
go build ./cmd/server

# Run the server
./server
```

---

## Questions or Issues? 💬

If you encounter issues:

1. Check that all migrations have been applied
2. Verify database connection string is correct
3. Ensure JWT_SECRET is set in config
4. Check that Go dependencies are installed (`go mod tidy`)
5. Review test output for specific error messages

Good luck testing! 🎉
