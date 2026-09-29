# OpenStaff Development Commands
# Install just: https://github.com/casey/just

# Show available commands
default:
    @just --list

# Run full development stack (backend services + desktop)
# One command to start everything with sensible demo defaults
dev-up:
    @bash scripts/dev-up.sh

# Stop all OpenStaff development services
dev-down:
    @echo "🛑 Stopping OpenStaff services..."
    @pkill -f "cargo run -p openstaff" || echo "  No cargo processes found"
    @pkill -f "pnpm dev" || echo "  No pnpm dev processes found"
    @echo "✅ Services stopped"

# =============================================================================
# Production Deployment (Docker Compose)
# =============================================================================

# Start production services with Docker Compose
prod-up:
    @echo "🚀 Starting OpenStaff production services..."
    @echo ""
    @if [ ! -f .env.prod ]; then \
        echo "⚠️  .env.prod not found. Copy .env.prod.example and configure it:"; \
        echo "    cp .env.prod.example .env.prod"; \
        echo "    # Edit .env.prod with your settings"; \
        exit 1; \
    fi
    @mkdir -p data/artifacts
    @cd deploy/compose && docker compose -f docker-compose.prod.yml --env-file ../../.env.prod up -d --build
    @echo ""
    @echo "✅ Services started!"
    @echo ""
    @echo "📡 Check health: just prod-health"
    @echo "📝 View logs:    just prod-logs"
    @echo "🛑 Stop:         just prod-down"

# Stop production services
prod-down:
    @echo "🛑 Stopping OpenStaff production services..."
    @cd deploy/compose && docker compose -f docker-compose.prod.yml down
    @echo "✅ Services stopped"

# View production service logs
prod-logs:
    @cd deploy/compose && docker compose -f docker-compose.prod.yml logs -f

# Check health of production services
prod-health:
    @echo "🏥 Checking production service health..."
    @echo ""
    @docker exec openstaff-api curl -s http://localhost:3000/health | jq . && echo "✅ API healthy" || echo "❌ API unhealthy"
    @docker exec openstaff-gateway curl -s http://localhost:3001/health | jq . && echo "✅ Gateway healthy" || echo "❌ Gateway unhealthy"
    @docker exec openstaff-scheduler curl -s http://localhost:3002/health | jq . && echo "✅ Scheduler healthy" || echo "❌ Scheduler unhealthy"
    @docker exec openstaff-runtime curl -s http://localhost:3003/health | jq . && echo "✅ Runtime healthy" || echo "❌ Runtime unhealthy"

# Restart production services
prod-restart:
    @just prod-down
    @just prod-up

# =============================================================================
# Development (Local)
# =============================================================================

# Run full development stack (backend services only, foreground)
# Note: Consider using 'just dev-up' for background mode with desktop
dev:
    @echo "🚀 Starting OpenStaff backend services..."
    @echo ""
    @echo "Backend services will run on:"
    @echo "  - API:       http://localhost:3000"
    @echo "  - Gateway:   http://localhost:3001"
    @echo "  - Scheduler: http://localhost:3002"
    @echo "  - Runtime:   http://localhost:3003"
    @echo ""
    @echo "Frontend apps (run separately after 'pnpm install'):"
    @echo "  - Desktop:   cd apps/desktop && pnpm dev"
    @echo "  - Admin:     cd apps/web-admin && pnpm dev"
    @echo ""
    @echo "💡 Tip: Use 'just dev-up' for one-command startup with desktop"
    @echo ""
    just dev-services

# Run all backend services in parallel
# Note: Currently starts all services simultaneously.
# Per 02 §4.1, services should eventually start in dependency order:
#   Runtime → API/Gateway/Scheduler
# but for T0 stub implementation, parallel startup is acceptable.
dev-services:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' SIGINT
    cargo run -p openstaff-api &
    cargo run -p openstaff-gateway &
    cargo run -p openstaff-scheduler &
    cargo run -p openstaff-runtime &
    wait

# Install all dependencies (Rust + Node)
install:
    @echo "📦 Installing dependencies..."
    cargo fetch
    pnpm install

# Check all Rust code
check:
    @echo "🔍 Checking Rust workspace..."
    cargo check --workspace --all-features

# Run all Rust tests
# Excludes openstaff-desktop (Tauri) which requires GTK/WebKit on Linux
test:
    @echo "🧪 Running Rust tests..."
    cargo test --workspace --exclude openstaff-desktop

# Format all code (Rust + TypeScript)
format:
    @echo "✨ Formatting code..."
    cargo fmt --all
    pnpm format

# Lint all code (Rust + TypeScript)
lint:
    @echo "🔎 Linting code..."
    cargo clippy --workspace --all-features -- -D warnings
    pnpm lint

# Build all projects
build:
    @echo "🏗️  Building all projects..."
    cargo build --workspace --release
    pnpm build

# Clean all build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    cargo clean
    rm -rf apps/*/dist apps/*/node_modules packages/*/node_modules node_modules

# Run specific service
run-api:
    cargo run -p openstaff-api

run-gateway:
    cargo run -p openstaff-gateway

run-scheduler:
    cargo run -p openstaff-scheduler

run-runtime:
    cargo run -p openstaff-runtime

# Type check TypeScript projects
type-check:
    @echo "📝 Type checking TypeScript..."
    pnpm type-check

# Check health of all backend services
health:
    @echo "🏥 Checking service health..."
    @curl -s http://localhost:3000/health | jq . || echo "❌ API not running"
    @curl -s http://localhost:3001/health | jq . || echo "❌ Gateway not running"
    @curl -s http://localhost:3002/health | jq . || echo "❌ Scheduler not running"
    @curl -s http://localhost:3003/health | jq . || echo "❌ Runtime not running"

# Run smoke tests (requires services to be running - not a default CI gate)
smoke:
    @echo "💨 Running smoke tests..."
    @bash scripts/smoke.sh
