# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeskSpacer is a 3D desk setup visualization tool inspired by Deskspacing.com. Users can draft their dream desk setups before purchasing by placing and transforming 3D models of peripherals and accessories in a virtual environment.

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite, Three.js with React-Three/Fiber ecosystem (@react-three/fiber, @react-three/drei, @react-three/postprocessing), MUI + Emotion, Zustand for state management, Apollo Client for GraphQL
- **Backend (C#)**: .NET 9 with ASP.NET Core, Hot Chocolate (GraphQL), PostgreSQL via Entity Framework Core
- **Backend (Go)**: Go 1.23+, graphql-go, pgx/v5 for PostgreSQL, chi router (see `/backend-go` directory)
- **Testing**: Vitest, Testing Library, @react-three/test-renderer

## Development Commands

### Frontend (from `/frontend` directory)

```bash
# Install dependencies
pnpm i

# Run development server (Vite on port 5173)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code (ESLint)
pnpm lint

# Generate model components from GLB files
pnpm generate [category]  # categories: monitors, desks, keyboards, mousepads, mice, or 'all'
```

### Backend - C# (from `/backend` directory)

```bash
# Run development server with hot reload (default port 5221)
dotnet watch

# Build
dotnet build

# Run migrations
dotnet ef database update
```

### Backend - Go (from `/backend-go` directory)

```bash
# Run with hot reload (requires air: make install-tools)
make dev

# Build and run
make build && make run

# Or run directly
go run ./cmd/server

# Install development tools (air for hot reload)
make install-tools
```

**Note:** The Go backend provides the same GraphQL API as the C# backend with additional improvements (rate limiting, input validation, health checks). Both backends are functionally equivalent and use the same database schema.

### Full Stack

Backend requires PostgreSQL running on port 5432. Default credentials in `appsettings.json`: database=deskspacer, user=postgres, password=12345678. Use Docker/Podman to run PostgreSQL locally.

Frontend requires `.env` file based on `.env.example` with `VITE_BACKEND_URL` and `VITE_WEB_URL`.

## Architecture

### Frontend Architecture

**State Management:**
- Zustand store (`utils/store.tsx`) manages 3D model state with persistence to browser storage
- Store tracks: models array with position, rotation, bounds, locked state
- Apollo Client handles GraphQL communication with backend for sharing states

**3D Scene Structure:**
- `App.tsx` is the main entry point containing the Three.js Canvas
- Uses React-Three/Fiber for declarative 3D rendering
- Post-processing effects via @react-three/postprocessing (Selection, Outline, EffectComposer)
- OrbitControls for camera manipulation
- TransformControls (in TransformModel component) for manipulating selected objects

**Component Organization:**
- `components/models/` - 3D model components (generated from GLB files)
  - `modelComponentsMapping.ts` - Central registry mapping model names to React components
  - `rooms/` - Room/environment components
  - `utils/` - CollisionBounds and other 3D utilities
- `components/UI/` - 2D interface components (Header, modals, etc.)
- `utils/` - Store, Apollo client setup, helper utilities, constants

**Model Processing:**
- `scripts/processModels.ts` generates React components from GLB files in `/public/models`
- Category handlers in `scripts/handlers/` define processing rules per model type
- Automatically updates `modelComponentsMapping.ts` registry

### Backend Architecture (C#)

**GraphQL API:**
- Hot Chocolate GraphQL server on .NET
- `GraphQL/Types/Query.cs` - Queries (GetStatesById)
- `GraphQL/Types/Mutation.cs` - Mutations (AddStateToDb)
- `GraphQL/Types/SharedState.cs` - State entity type
- `GraphQL/Types/AddStateToDbInput.cs` - Input types

**Data Layer:**
- `Data/AppDbContext.cs` - EF Core database context
- PostgreSQL database via Entity Framework Core
- Migrations in `Migrations/` directory

**Services:**
- `Services/ExpiredStateCleanupService.cs` - Background service to clean up old shared states
- Registered as hosted service in `Program.cs`

**CORS Configuration:**
- Allows localhost and Apollo Studio origins for development

### Backend Architecture (Go)

**Project Structure (Standard Go Layout):**
- `cmd/server/main.go` - Application entry point
- `internal/config/` - Configuration management with environment variables
- `internal/database/` - pgx connection pool setup and migrations
- `internal/graph/` - GraphQL schema definition and resolvers
- `internal/models/` - Data models (SharedState)
- `internal/repository/` - Data access layer with pgx queries
- `internal/service/` - Background cleanup service
- `internal/middleware/` - CORS, rate limiting, logging, health checks

**GraphQL API:**
- graphql-go/graphql for schema implementation
- Queries: `states` (all non-expired), `statesById(id: UUID)`
- Mutation: `addState(sharedState: String!)`
- Custom scalar types: UUID, Time

**Data Layer:**
- pgx/v5 with connection pooling (25 max, 5 min connections)
- Embedded SQL migrations run automatically on startup
- Repository pattern for database operations

**Improvements over C# backend:**
- Rate limiting: 10 requests/minute per IP (configurable)
- Input validation: JSON format validation and 10MB size limit
- Health check endpoint: `/health` returns JSON status
- Structured logging: JSON-formatted logs with slog
- Graceful shutdown: Proper cleanup of connections and services

**Configuration:**
- All settings via environment variables (`.env` file supported)
- Same default values as C# backend for compatibility
- See `backend-go/.env.example` for all options

### Commit Conventions

This project uses semantic commits (conventionalcommits.org) and semver. ESLint and Prettier are enforced via Husky pre-commit hooks.

## Critical 3D Model Scaling Note

**IMPORTANT**: All existing 3D models use an incorrect scale ratio where 1m = 1in. For example, a 25-inch monitor is actually 25m in the model file.

When adding new models with accurate real-world measurements, they must be **scaled by 39.3701** to match existing models. This scale factor is also the basis for the measurement tool. Refactoring this would require updating all existing models or implementing Python automation scripts.

## Sharing Feature

The app allows users to share their desk setups:
1. Frontend serializes scene state (models array with positions, rotations, bounds)
2. GraphQL mutation `AddStateToDb` saves state to PostgreSQL with generated UUID
3. Users can load shared states via UUID query parameter
4. Backend cleanup service periodically removes expired states
