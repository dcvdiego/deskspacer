.PHONY: help run build dev test clean install-tools

# Default target
help:
	@echo "Available commands:"
	@echo "  make run          - Build and run the server"
	@echo "  make build        - Build the binary"
	@echo "  make dev          - Run with hot reload (requires air)"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make install-tools - Install development tools (air, etc.)"

# Run the server
run: build
	@echo "Starting server..."
	@./bin/server

# Build the binary
build:
	@echo "Building..."
	@go build -o bin/server ./cmd/server

# Run with hot reload
dev:
	@echo "Starting development server with hot reload..."
	@air

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/ tmp/
	@go clean

# Install development tools
install-tools:
	@echo "Installing air for hot reload..."
	@go install github.com/air-verse/air@latest
	@echo "Tools installed successfully!"
