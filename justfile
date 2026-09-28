# OpenStaff Development Commands
# Install just: https://github.com/casey/just

# Show available commands
default:
    @just --list

# Run full development stack (backend services)
dev:
    @echo "🚀 Starting OpenStaff backend services..."
    @echo ""
    @echo "Backend services will run on:"
    @echo "  - API:       http://localhost:3000"
    @echo "  - Gateway:   http://localhost:3001"
    @echo "  - Scheduler: http://localhost:3002"
    @echo ""
    @echo "Frontend apps (run separately after 'pnpm install'):"
    @echo "  - Desktop:   cd apps/desktop && pnpm dev"
    @echo "  - Admin:     cd apps/web-admin && pnpm dev"
    @echo ""
    just dev-services

# Run all backend services in parallel
dev-services:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' SIGINT
    cargo run -p openstaff-api &
    cargo run -p openstaff-gateway &
    cargo run -p openstaff-scheduler &
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
test:
    @echo "🧪 Running Rust tests..."
    cargo test --workspace

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

# Run smoke tests (requires running services)
smoke:
    @echo "🔥 Running smoke tests..."
    ./scripts/smoke.sh
