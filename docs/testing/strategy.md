# OpenStaff Testing Strategy

**Version**: 0.1  
**Status**: Authoritative  
**Last Updated**: 2026-09-28

---

## Overview

OpenStaff employs a multi-layered testing strategy to ensure code quality, reliability, and maintainability. This document defines the testing layers, directory conventions, and CI/CD integration for **backend services and protocol**.

> **Note**: Frontend test infrastructure (vitest/playwright) and smoke tests (`just smoke`) are managed separately by the code assistant team. This document focuses on Rust backend testing.

---

## Testing Layers

### 1. Unit Tests

**Purpose**: Test individual functions, modules, and components in isolation.

**Location**:
- Rust: `src/` directories with inline `#[test]` modules
- Example: `services/api/src/main.rs` with `#[cfg(test)] mod tests`

**Characteristics**:
- ✅ **Offline**: No network, no external services
- ✅ **Fast**: Sub-second execution
- ✅ **Isolated**: No shared state between tests

**Examples**:
- Protocol type creation and validation
- Health response builder
- Pure business logic functions

**Commands**:
```bash
# All unit tests
cargo test --workspace

# Specific service
cargo test -p openstaff-api
```

---

### 2. Contract Tests

**Purpose**: Verify that data contracts and APIs conform to specifications.

**Location**:
- `crates/protocol/tests/roundtrip.rs` - Protocol roundtrip tests
- Service unit tests that validate response schemas

**Characteristics**:
- ✅ **Offline**: No running services required
- ✅ **Fast**: Minimal overhead
- ✅ **Deterministic**: Same input → same output

**Examples**:
- JSON serialization roundtrip tests for all protocol types
- Health endpoint JSON contract validation (Router unit tests)
- EventEnvelope payload variants

**Commands**:
```bash
cargo test -p openstaff-protocol
cargo test --workspace
```

---

### 3. Health Endpoint Contract Tests

**Purpose**: Validate that health endpoints return the exact locked JSON contract without requiring running services.

**Approach**: Use axum Router unit tests with `tower::ServiceExt::oneshot()`

**Location**:
- `services/api/src/main.rs` - `#[cfg(test)] mod tests`
- `services/gateway/src/main.rs` - `#[cfg(test)] mod tests`
- `services/scheduler/src/main.rs` - `#[cfg(test)] mod tests`

**Contract**: `GET /health` → HTTP 200 + JSON `{"status":"ok","service":"<name>"}`

**Characteristics**:
- ✅ **Offline**: Tests Router without binding ports
- ✅ **Fast**: No network I/O
- ✅ **Contract enforcement**: Validates exact JSON shape

**Example**:
```rust
#[tokio::test]
async fn test_health_endpoint_returns_ok() {
    let app = Router::new().route("/health", get(health_check));
    
    let response = app.oneshot(
        Request::builder().uri("/health").body(Body::empty()).unwrap()
    ).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let health: HealthResponse = /* parse body */;
    assert_eq!(health.status, "ok");
    assert_eq!(health.service, "api");
}
```

---

### 4. Integration Tests (Future - T1+)

**Purpose**: Test interactions between components with minimal external dependencies.

**Location**:
- `tests/integration/` (planned)
- Service-level tests with in-memory backends

**Status**: Planned for T1 milestone

---

## Directory Conventions

### Rust (Backend)

```
services/api/
├── src/
│   └── main.rs           # Unit tests inline: #[cfg(test)] mod tests
└── Cargo.toml

crates/protocol/
├── src/
│   └── lib.rs            # Unit tests inline
└── tests/
    └── roundtrip.rs      # Contract tests (JSON roundtrip)
```

---

## Protocol Types

The `openstaff-protocol` crate defines all shared types:

### Core Types

- **`Message`**: Basic chat message
- **`EventEnvelope`**: Wrapper for all events with metadata
- **`EventPayload`**: Enum of event types (Message, AgentStateChange, ToolCall, ApprovalRequest)
- **`HealthResponse`**: Standardized health check response

### Usage

```rust
use openstaff_protocol::{HealthResponse, EventEnvelope, EventPayload};

// Health endpoint
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse::ok("api"))
}

// Event creation
let event = EventEnvelope {
    event_id: "evt_123".to_string(),
    event_type: "message".to_string(),
    timestamp: 1727510400000,
    payload: EventPayload::Message(Message {
        content: "Hello".to_string(),
    }),
};
```

---

## CI/CD Pipeline

### Default PR Gate (Required for Merge)

**Runs on**: Every push, every PR  
**Must Pass**: ✅ All jobs must succeed

| Job    | Command                           | Offline? | Speed |
|--------|-----------------------------------|----------|-------|
| Check  | `cargo check --workspace`         | ✅ Yes    | Fast  |
| Test   | `cargo test --workspace`          | ✅ Yes    | Fast  |
| Format | `cargo fmt --check`               | ✅ Yes    | Fast  |
| Clippy | `cargo clippy -- -D warnings`     | ✅ Yes    | Fast  |

**Total Time**: ~3-5 minutes

**Key Point**: All tests are **offline** - no running services required!

---

## Test Coverage Summary

### Current Coverage (T0)

| Component | Unit Tests | Contract Tests | Integration Tests |
|-----------|------------|----------------|-------------------|
| Protocol  | ✅ 2       | ✅ 10          | -                 |
| API       | ✅ 2       | -              | -                 |
| Gateway   | ✅ 2       | -              | -                 |
| Scheduler | ✅ 2       | -              | -                 |

**Total**: 18 tests, all offline, all passing ✅

---

## Local Development Workflow

### Fast Feedback Loop (Recommended)

```bash
# Terminal 1: Watch mode for tests
cargo watch -x test

# Or run tests manually
cargo test --workspace
```

### Full Pre-Commit Check

```bash
just format    # Auto-format code
just lint      # Linters + Clippy
just test      # All offline tests
```

### Running Specific Tests

```bash
# Protocol tests only
cargo test -p openstaff-protocol

# Service tests only
cargo test -p openstaff-api
cargo test -p openstaff-gateway
cargo test -p openstaff-scheduler

# Single test
cargo test test_health_endpoint_returns_ok
```

---

## Test Coverage Goals

| Layer       | Coverage Target | Priority |
|-------------|-----------------|----------|
| Unit        | 80%+            | High     |
| Contract    | 100%            | Critical |
| Integration | 60%+            | Medium   |

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

**Example**:
```rust
// In crates/protocol/tests/roundtrip.rs
#[test]
fn test_new_type_roundtrip() {
    let original = NewType { /* ... */ };
    let json = serde_json::to_string(&original).unwrap();
    let deserialized: NewType = serde_json::from_str(&json).unwrap();
    assert_eq!(original, deserialized);
}
```

---

## Troubleshooting

### Test Failures

```bash
# Run single test
cargo test test_name -- --exact

# Show test output
cargo test -- --nocapture

# Show backtraces
RUST_BACKTRACE=1 cargo test
```

### CI Failures

1. **Check CI logs** for specific error
2. **Reproduce locally**: Run same command as CI
3. **Fix locally**, then push

---

## Future Enhancements (Roadmap)

### T1 Milestone
- ✅ Protocol roundtrip tests (done)
- ✅ Health contract tests (done)
- 🔲 Integration tests (in-memory services)
- 🔲 API schema validation

### T2 Milestone
- 🔲 Load testing (K6 or similar)
- 🔲 Chaos engineering tests

---

## References

- [First Test Cases](./first-cases.md) - Concrete test case catalog
- [Monorepo Conventions](../architecture/02-monorepo-conventions.md) - Architecture rules
- [CI Workflow](../../.github/workflows/ci.yml) - GitHub Actions config

---

**Authoritative Status**: This document defines the official backend testing strategy. All backend tests must align with these conventions.

**Frontend & Smoke Tests**: Managed separately - see code assistant's documentation when available.
