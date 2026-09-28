# OpenStaff Development Commands
# Install just: https://github.com/casey/just

# Show available commands
default:
    @just --list

# Run full development stack
dev:
    @echo "🚀 Starting OpenStaff development stack..."
    @echo "Note: Full stack orchestration coming soon"
    @echo "For now, run components individually:"
    @echo "  - Desktop: cd apps/desktop && pnpm dev"
    @echo "  - Admin:   cd apps/web-admin && pnpm dev"
    @echo "  - API:     cargo run -p openstaff-api"

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
