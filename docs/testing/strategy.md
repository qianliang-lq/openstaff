# OpenStaff Testing Strategy

**Version**: 0.1  
**Status**: Authoritative  
**Last Updated**: 2026-09-28

---

## Overview

OpenStaff employs a multi-layered testing strategy to ensure code quality, reliability, and maintainability across the entire stack. This document defines the testing layers, directory conventions, and CI/CD integration.

---

## Testing Layers

### 1. Unit Tests

**Purpose**: Test individual functions, modules, and components in isolation.

**Location**:
- Rust: `src/` directories with inline `#[test]` modules or `tests/` subdirectories
- Frontend: `src/__tests__/` directories alongside source code

**Characteristics**:
- ✅ **Offline**: No network, no external services
- ✅ **Fast**: Sub-second execution
- ✅ **Isolated**: No shared state between tests

**Examples**:
- Protocol type serialization/deserialization
- Pure functions and business logic
- React component rendering (shallow)

**Commands**:
```bash
# Rust unit tests
cargo test --workspace

# Frontend unit tests
pnpm test
```

---

### 2. Contract Tests

**Purpose**: Verify that data contracts and APIs conform to specifications.

**Location**:
- `crates/protocol/tests/` - Protocol roundtrip tests
- Service integration tests that validate response schemas

**Characteristics**:
- ✅ **Offline**: No running services required
- ✅ **Fast**: Minimal overhead
- ✅ **Deterministic**: Same input → same output

**Examples**:
- JSON serialization roundtrip tests
- Health endpoint response validation (via axum Router tests)
- Type system guarantees

**Commands**:
```bash
cargo test -p openstaff-protocol
cargo test --workspace
```

---

### 3. Integration Tests

**Purpose**: Test interactions between components with minimal external dependencies.

**Location**:
- `tests/integration/` (planned)
- Service-level tests with in-memory backends

**Characteristics**:
- ⚠️ **May require setup**: In-memory databases, mock services
- ✅ **Mostly offline**: Uses test doubles, not real external services
- ⚠️ **Medium speed**: Seconds to complete

**Examples**:
- API service with mock Gateway responses
- Database migrations and queries (in-memory SQLite)
- Agent workflow with stubbed LLM calls

**Commands**:
```bash
cargo test --test integration_*
```

**Status**: T1+ milestone (planned)

---

### 4. Smoke Tests

**Purpose**: Verify that deployed services are running and reachable.

**Location**:
- `scripts/smoke.sh`
- `pnpm test:smoke` / `just smoke`

**Characteristics**:
- ❌ **Online**: Requires running services
- ✅ **Fast**: Basic health checks only
- ⚠️ **Environment-dependent**: Must be run after `just dev`

**Examples**:
- Health endpoint checks (`GET /health` → `200 OK`)
- Service reachability tests (api:3000, gateway:3001, scheduler:3002)

**Commands**:
```bash
# Start services first
just dev

# Run smoke tests (in another terminal)
just smoke
# or
pnpm test:smoke
```

**CI Integration**: Separate job, gated by `workflow_dispatch` or `test-online` label.

---

### 5. End-to-End (E2E) Tests

**Purpose**: Test complete user workflows from UI to backend.

**Location**:
- `apps/desktop/tests/e2e/` - Desktop app E2E (Playwright)
- `apps/web-admin/tests/e2e/` - Web admin E2E (Playwright)

**Characteristics**:
- ❌ **Online**: Requires all services + frontend
- ❌ **Slow**: Minutes to complete
- ⚠️ **Fragile**: UI changes can break tests

**Examples**:
- Desktop: Create agent → send message → receive response
- Web Admin: Login → view agent list → approve ticket

**Commands**:
```bash
pnpm --filter @openstaff/desktop test:e2e
pnpm --filter @openstaff/web-admin test:e2e
```

**Status**: 
- Desktop: T2+ milestone (deferred due to Tauri complexity)
- Web Admin: T1+ milestone (planned)

**CI Integration**: Separate job, manual trigger or specific label.

---

## Directory Conventions

### Rust (Backend)

```
services/api/
├── src/
│   ├── main.rs           # Unit tests inline: #[cfg(test)] mod tests
│   └── lib.rs
├── tests/                # Integration tests
│   └── health_test.rs    # (planned)
└── Cargo.toml

crates/protocol/
├── src/
│   └── lib.rs            # Unit tests inline
└── tests/
    └── roundtrip.rs      # Contract tests (JSON roundtrip)
```

### Frontend (TypeScript)

```
apps/desktop/
├── src/
│   ├── __tests__/        # Unit tests (Vitest)
│   │   └── App.test.tsx
│   └── components/
│       └── __tests__/
│           └── Button.test.tsx
├── tests/
│   └── e2e/              # E2E tests (Playwright)
│       └── .gitkeep      # (placeholder)
├── vitest.config.ts
└── playwright.config.ts  # (planned)
```

### Scripts

```
scripts/
├── smoke.sh              # Smoke tests
└── check-health.sh       # Health check utility
```

---

## CI/CD Matrix

### Default PR Gate (Required for Merge)

**Runs on**: Every push, every PR  
**Must Pass**: ✅ All jobs must succeed

| Job             | Command                  | Offline? | Speed  |
|-----------------|--------------------------|----------|--------|
| Check           | `cargo check --workspace` | ✅ Yes    | Fast   |
| Test (Rust)     | `cargo test --workspace`  | ✅ Yes    | Fast   |
| Test (Frontend) | `pnpm test`               | ✅ Yes    | Fast   |
| Format          | `cargo fmt --check`       | ✅ Yes    | Fast   |
| Clippy          | `cargo clippy -- -D warnings` | ✅ Yes | Fast   |

**Total Time**: ~5 minutes

---

### Online Tests (Optional)

**Runs on**: Manual trigger (`workflow_dispatch`) or label (`test-online`)  
**Purpose**: Integration and smoke testing with running services

| Job         | Command               | Offline? | Speed  |
|-------------|-----------------------|----------|--------|
| Smoke Tests | `./scripts/smoke.sh`  | ❌ No     | Medium |

**Total Time**: ~10 minutes (includes service startup)

---

### E2E Tests (Optional)

**Runs on**: Manual trigger or label (`test-e2e`)  
**Purpose**: Full-stack UI testing

| Job         | Command                              | Offline? | Speed |
|-------------|--------------------------------------|----------|-------|
| E2E Desktop | `pnpm --filter @openstaff/desktop test:e2e` | ❌ No | Slow  |
| E2E Admin   | `pnpm --filter @openstaff/web-admin test:e2e` | ❌ No | Slow  |

**Total Time**: ~20 minutes  
**Status**: T2+ milestone (deferred)

---

## Local Development Workflow

### Fast Feedback Loop (Recommended)

```bash
# Terminal 1: Watch mode for tests
cargo watch -x test

# Terminal 2: Frontend watch mode
cd apps/desktop && pnpm test:watch
```

### Full Pre-Commit Check

```bash
just format    # Auto-format code
just lint      # Linters + Clippy
just test      # All offline tests
```

### Manual Smoke Test

```bash
# Terminal 1: Start services
just dev

# Terminal 2: Run smoke tests
just smoke
```

---

## Test Coverage Goals

| Layer       | Coverage Target | Priority |
|-------------|-----------------|----------|
| Unit        | 80%+            | High     |
| Contract    | 100%            | Critical |
| Integration | 60%+            | Medium   |
| Smoke       | 100% endpoints  | High     |
| E2E         | Critical paths  | Low (T2+)|

---

## Adding New Tests

### When to Write Unit Tests

✅ **Always**:
- New functions or modules
- Bug fixes (regression tests)
- Business logic changes

### When to Write Contract Tests

✅ **Always**:
- New protocol types
- API schema changes
- Breaking changes

### When to Write Integration Tests

⚠️ **Sometimes**:
- Complex workflows (multi-service)
- Database interactions
- Auth flows

### When to Write E2E Tests

❌ **Rarely** (T2+):
- Critical user journeys only
- High-value, low-change workflows

---

## Troubleshooting

### Test Failures

```bash
# Run single test
cargo test test_name

# Show test output
cargo test -- --nocapture

# Frontend test debugging
cd apps/desktop && pnpm test:watch
```

### Smoke Test Failures

```bash
# Check if services are running
just health

# Restart services
pkill -f openstaff-  # Stop all services
just dev             # Restart
```

### CI Failures

1. **Check CI logs** for specific error
2. **Reproduce locally**: Run same command as CI
3. **Fix locally**, then push

---

## Future Enhancements (Roadmap)

### T1 Milestone
- ✅ Protocol roundtrip tests
- ✅ Health check contract tests
- ✅ Smoke tests
- 🔲 Basic integration tests (in-memory)

### T2 Milestone
- 🔲 Web Admin E2E tests (Playwright)
- 🔲 API schema validation tests
- 🔲 Load testing (K6 or similar)

### T3 Milestone
- 🔲 Desktop E2E tests (Tauri + Playwright)
- 🔲 Multi-agent workflow tests
- 🔲 Chaos engineering tests

---

## References

- [First Test Cases](./first-cases.md) - Concrete test case catalog
- [Monorepo Conventions](../architecture/02-monorepo-conventions.md) - Architecture rules
- [CI Workflow](../../.github/workflows/ci.yml) - GitHub Actions config

---

**Authoritative Status**: This document defines the official testing strategy. All tests must align with these conventions.
