# DeskSpacer Go Backend

Go backend for DeskSpacer, providing a GraphQL API for managing shared desk setup states.

## Features

- **GraphQL API** with queries and mutations
- **PostgreSQL** database with connection pooling (pgx/v5)
- **Automatic migrations** on startup
- **Background cleanup service** for expired states
- **Rate limiting** per IP address
- **Input validation** for JSON and size limits
- **Health check endpoint** at `/health`
- **CORS** support for localhost and Apollo Studio
- **Structured logging** with slog
- **Graceful shutdown** handling
- **Hot reload** support with Air

## Tech Stack

- **Go 1.23+**
- **gqlgen** - Type-safe GraphQL server with code generation
- **pgx/v5** - PostgreSQL driver with connection pooling
- **chi** - Lightweight HTTP router
- **godotenv** - Environment variable management
- **validator/v10** - Input validation

## Project Structure

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   ├── database/                # DB connection & migrations
│   ├── graph/                   # GraphQL schema & resolvers
│   ├── models/                  # Data models
│   ├── repository/              # Data access layer
│   ├── service/                 # Background services
│   └── middleware/              # HTTP middleware (CORS, rate limit, etc.)
├── .env.example                 # Example environment variables
├── .air.toml                    # Hot reload configuration
├── Makefile                     # Common development commands
└── go.mod                       # Go dependencies
```

## Prerequisites

- **Go 1.23 or higher**
- **PostgreSQL 12+** running on port 5432

### Start PostgreSQL with Docker

```bash
docker run --name deskspacer-postgres \
  -e POSTGRES_DB=deskspacer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345678 \
  -p 5432:5432 \
  -d postgres:16
```

Or with Podman:

```bash
podman run --name deskspacer-postgres \
  -e POSTGRES_DB=deskspacer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345678 \
  -p 5432:5432 \
  -d postgres:16
```

## Getting Started

### 1. Clone and navigate to the directory

```bash
cd backend-go
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env if needed (defaults match PostgreSQL setup above)
```

### 3. Install dependencies

```bash
go mod download
```

### 4. Run the server

**Option A: Build and run**
```bash
make build
make run
```

**Option B: Direct run**
```bash
go run ./cmd/server
```

**Option C: Hot reload (requires air)**
```bash
make install-tools  # Install air
make dev            # Run with hot reload
```

The server will:
- Run migrations automatically
- Start on `http://localhost:5221`
- GraphQL endpoint: `http://localhost:5221/graphql`
- Health check: `http://localhost:5221/health`

## GraphQL API

### Queries

#### Get all non-expired states
```graphql
query {
  states {
    id
    stateData
    expiresAt
  }
}
```

#### Get state by ID
```graphql
query GetState($id: UUID!) {
  statesById(id: $id) {
    id
    stateData
    expiresAt
  }
}
```

### Mutations

#### Create a new state
```graphql
mutation AddState($sharedState: String!) {
  addState(sharedState: $sharedState) {
    id
    stateData
    expiresAt
  }
}
```

Example variables:
```json
{
  "sharedState": "{\"models\":[{\"id\":\"desk-1\",\"position\":[0,0,0]}]}"
}
```

## Configuration

All configuration is done via environment variables. See `.env.example` for available options:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `5221` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `deskspacer` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `12345678` | Database password |
| `CORS_ALLOWED_ORIGINS` | See .env.example | Comma-separated CORS origins |
| `RATE_LIMIT_PER_MINUTE` | `10` | Rate limit per IP |
| `RATE_LIMIT_BURST` | `20` | Rate limit burst size |
| `STATE_EXPIRATION_DAYS` | `15` | Days until state expires |
| `CLEANUP_INTERVAL_HOURS` | `24` | Cleanup service interval |

## Development

### Available Make Commands

```bash
make help          # Show all available commands
make build         # Build the binary
make run           # Build and run
make dev           # Run with hot reload (requires air)
make test          # Run tests
make clean         # Clean build artifacts
make install-tools # Install development tools
```

### Hot Reload

Install and use Air for automatic rebuilds during development:

```bash
make install-tools
make dev
```

### Database Migrations

Migrations are automatically run on server startup. Migration files are located in `internal/database/migrations/`.

To create a new migration, add files following the pattern:
- `XXX_description.up.sql` - Migration up
- `XXX_description.down.sql` - Migration down

## Testing

GraphQL Playground is enabled at `http://localhost:5221/graphql` when the server is running.

Test the health endpoint:
```bash
curl http://localhost:5221/health
```

Example GraphQL query:
```bash
curl -X POST http://localhost:5221/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ states { id stateData expiresAt } }"}'
```

## Comparison with C# Backend

This Go implementation maintains exact feature parity with the original C# backend:

| Feature | C# Backend | Go Backend |
|---------|-----------|------------|
| GraphQL Framework | Hot Chocolate | gqlgen (type-safe) |
| Database | EF Core + Npgsql | pgx/v5 |
| Port | 5221 | 5221 |
| State Expiration | 15 days | 15 days |
| Cleanup Interval | 24 hours | 24 hours |
| CORS | localhost + Apollo | localhost + Apollo |
| Rate Limiting | ❌ | ✅ 10 req/min + cleanup |
| Input Validation | ❌ | ✅ JSON + size check |
| Health Check | ❌ | ✅ /health |

## Architecture Improvements

The Go implementation includes several enhancements:

1. **Type-Safe GraphQL**: Using gqlgen for compile-time type safety and automatic code generation
2. **Rate Limiting**: Per-IP rate limiting prevents API abuse (10 req/min with automatic cleanup)
3. **Input Validation**: Validates JSON format and enforces 10MB size limit
4. **Health Checks**: `/health` endpoint for monitoring and load balancers
5. **Structured Logging**: JSON-formatted logs with slog
6. **Connection Pooling**: Explicit pgx pool configuration with health checks
7. **Graceful Shutdown**: Proper cleanup of resources on termination
8. **Memory Leak Prevention**: Hourly rate limiter cleanup to prevent unbounded memory growth

## License

Same as the main DeskSpacer project.
