# OpenStaff First Test Cases

**Version**: 0.1  
**Status**: Authoritative  
**Last Updated**: 2026-09-28

---

## Overview

This document catalogs the first test cases implemented in the OpenStaff testing layer. Each case is documented with its ID, layer, location, command, offline status, and expected behavior.

> **Scope**: Backend tests only (Rust). Frontend tests and smoke tests are managed separately by the code assistant team.

---

## Test Case Catalog

| ID | Layer | Path | Command | Offline? | Expected |
|----|-------|------|---------|----------|----------|
| TC-001 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Message JSON roundtrip succeeds |
| TC-002 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Empty message roundtrip succeeds |
| TC-003 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Unicode message roundtrip succeeds |
| TC-004 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | EventEnvelope with Message payload roundtrip |
| TC-005 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | EventEnvelope with AgentStateChange roundtrip |
| TC-006 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | EventEnvelope with ToolCall roundtrip |
| TC-007 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | EventEnvelope with ApprovalRequest roundtrip |
| TC-008 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | HealthResponse roundtrip succeeds |
| TC-009 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | HealthResponse JSON format validation |
| TC-010 | Unit | `crates/protocol/src/lib.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Message creation works |
| TC-011 | Unit | `crates/protocol/src/lib.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | HealthResponse builder creates correct response |
| TC-012 | Unit/Contract | `services/api/src/main.rs` | `cargo test -p openstaff-api` | ✅ Yes | API /health endpoint returns 200 with correct JSON |
| TC-013 | Unit/Contract | `services/api/src/main.rs` | `cargo test -p openstaff-api` | ✅ Yes | API health JSON contract validation |
| TC-014 | Unit/Contract | `services/gateway/src/main.rs` | `cargo test -p openstaff-gateway` | ✅ Yes | Gateway /health endpoint returns 200 with correct JSON |
| TC-015 | Unit/Contract | `services/gateway/src/main.rs` | `cargo test -p openstaff-gateway` | ✅ Yes | Gateway health JSON contract validation |
| TC-016 | Unit/Contract | `services/scheduler/src/main.rs` | `cargo test -p openstaff-scheduler` | ✅ Yes | Scheduler /health endpoint returns 200 with correct JSON |
| TC-017 | Unit/Contract | `services/scheduler/src/main.rs` | `cargo test -p openstaff-scheduler` | ✅ Yes | Scheduler health JSON contract validation |

---

## Detailed Test Cases

### Protocol Roundtrip Tests

#### TC-001: Message JSON Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip()`

**Purpose**: Verify that `Message` types can be serialized to JSON and deserialized back without data loss.

**Steps**:
1. Create a `Message` with content `"Hello, OpenStaff!"`
2. Serialize to JSON string using `serde_json::to_string()`
3. Deserialize back to `Message` using `serde_json::from_str()`
4. Assert original equals deserialized

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_roundtrip -p openstaff-protocol
```

---

#### TC-002: Empty Message Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip_empty()`

**Purpose**: Verify edge case of empty message content.

**Expected Result**: ✅ Test passes

---

#### TC-003: Unicode Message Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip_unicode()`

**Purpose**: Verify Unicode and emoji handling in messages.

**Test Data**: `"你好，世界！🚀"`

**Expected Result**: ✅ Test passes

---

#### TC-004: EventEnvelope with Message Payload

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_event_envelope_roundtrip_message()`

**Purpose**: Verify EventEnvelope with Message payload serializes correctly.

**Test Data**:
```rust
EventEnvelope {
    event_id: "evt_123",
    event_type: "message",
    timestamp: 1727510400000,
    payload: EventPayload::Message(Message {
        content: "Test message",
    }),
}
```

**Expected Result**: ✅ Roundtrip succeeds, all fields match

---

#### TC-005: EventEnvelope with AgentStateChange

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_event_envelope_roundtrip_state_change()`

**Purpose**: Verify EventEnvelope with AgentStateChange payload.

**Test Data**:
```rust
EventPayload::AgentStateChange {
    agent_id: "agent_001",
    state: "active",
}
```

**Expected Result**: ✅ Roundtrip succeeds

---

#### TC-006: EventEnvelope with ToolCall

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_event_envelope_roundtrip_tool_call()`

**Purpose**: Verify EventEnvelope with ToolCall payload (includes nested JSON).

**Test Data**:
```rust
EventPayload::ToolCall {
    tool_name: "write_file",
    args: json!({"path": "/tmp/test.txt", "content": "Hello"}),
}
```

**Expected Result**: ✅ Roundtrip succeeds, nested JSON preserved

---

#### TC-007: EventEnvelope with ApprovalRequest

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_event_envelope_roundtrip_approval_request()`

**Purpose**: Verify EventEnvelope with ApprovalRequest payload.

**Test Data**:
```rust
EventPayload::ApprovalRequest {
    request_id: "req_001",
    action: "execute_tool",
}
```

**Expected Result**: ✅ Roundtrip succeeds

---

#### TC-008: HealthResponse Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_health_response_roundtrip()`

**Purpose**: Verify HealthResponse serialization and builder.

**Test Data**:
```rust
HealthResponse::ok("api")
```

**Expected Result**: 
- ✅ Roundtrip succeeds
- ✅ `status == "ok"`
- ✅ `service == "api"`

---

#### TC-009: HealthResponse JSON Format

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_health_response_json_format()`

**Purpose**: Validate exact JSON shape of health response.

**Expected JSON**:
```json
{
  "status": "ok",
  "service": "gateway"
}
```

**Validation**:
- ✅ Exactly 2 fields
- ✅ No extra fields
- ✅ Correct values

---

### Protocol Unit Tests

#### TC-010: Message Creation

**Layer**: Unit  
**File**: `crates/protocol/src/lib.rs`  
**Function**: `test_message_creation()`

**Purpose**: Verify basic message construction.

**Expected Result**: ✅ Message object created successfully

---

#### TC-011: HealthResponse Builder

**Layer**: Unit  
**File**: `crates/protocol/src/lib.rs`  
**Function**: `test_health_response_builder()`

**Purpose**: Verify `HealthResponse::ok()` builder creates correct response.

**Expected Result**:
- ✅ `status == "ok"`
- ✅ `service` matches input

---

### Service Health Contract Tests

#### TC-012: API Health Endpoint

**Layer**: Unit/Contract  
**File**: `services/api/src/main.rs`  
**Function**: `test_health_endpoint_returns_ok()`

**Purpose**: Verify API `/health` endpoint via Router unit test (no port binding).

**Steps**:
1. Create Router with `/health` route
2. Send request to `/health` using `tower::ServiceExt::oneshot()`
3. Assert HTTP 200 status code
4. Parse response body as `HealthResponse`
5. Assert `status == "ok"` and `service == "api"`

**Expected Result**: ✅ HTTP 200 with correct JSON shape

**Command**:
```bash
cargo test test_health_endpoint_returns_ok -p openstaff-api
```

**Offline**: ✅ Yes (uses Router directly, no network)

---

#### TC-013: API Health JSON Contract

**Layer**: Unit/Contract  
**File**: `services/api/src/main.rs`  
**Function**: `test_health_response_json_contract()`

**Purpose**: Validate exact JSON shape without HTTP layer.

**Expected Result**: 
- ✅ Exactly 2 fields
- ✅ Correct values

---

#### TC-014: Gateway Health Endpoint

**Layer**: Unit/Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_health_endpoint_returns_ok()`

**Purpose**: Verify Gateway `/health` endpoint via Router unit test.

**Expected Result**: ✅ HTTP 200 with `{"status":"ok","service":"gateway"}`

**Command**:
```bash
cargo test test_health_endpoint_returns_ok -p openstaff-gateway
```

---

#### TC-015: Gateway Health JSON Contract

**Layer**: Unit/Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_health_response_json_contract()`

**Purpose**: Validate exact JSON shape.

**Expected Result**: ✅ Correct JSON format

---

#### TC-016: Scheduler Health Endpoint

**Layer**: Unit/Contract  
**File**: `services/scheduler/src/main.rs`  
**Function**: `test_health_endpoint_returns_ok()`

**Purpose**: Verify Scheduler `/health` endpoint via Router unit test.

**Expected Result**: ✅ HTTP 200 with `{"status":"ok","service":"scheduler"}`

**Command**:
```bash
cargo test test_health_endpoint_returns_ok -p openstaff-scheduler
```

---

#### TC-017: Scheduler Health JSON Contract

**Layer**: Unit/Contract  
**File**: `services/scheduler/src/main.rs`  
**Function**: `test_health_response_json_contract()`

**Purpose**: Validate exact JSON shape.

**Expected Result**: ✅ Correct JSON format

---

## Test Execution Summary

### All Tests (Offline, CI Default Gate)

Run all backend tests:

```bash
cargo test --workspace
```

**Expected**: ✅ All 18 tests pass  
**Time**: ~5 seconds

---

### By Component

```bash
# Protocol tests (12 tests)
cargo test -p openstaff-protocol

# Service tests (6 tests total)
cargo test -p openstaff-api          # 2 tests
cargo test -p openstaff-gateway      # 2 tests
cargo test -p openstaff-scheduler    # 2 tests
```

---

## Reproducing Test Failures

### Local Reproduction

```bash
# Run specific test
cargo test test_name -- --exact

# Run with output
cargo test test_name -- --nocapture

# Run with backtrace
RUST_BACKTRACE=1 cargo test test_name
```

### CI Reproduction

```bash
# Same commands as CI workflow
cargo check --workspace
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo fmt --all -- --check
```

---

## References

- [Testing Strategy](./strategy.md) - Overall testing approach
- [Monorepo Conventions](../architecture/02-monorepo-conventions.md) - Architecture rules
- [CI Workflow](../../.github/workflows/ci.yml) - GitHub Actions config

---

**Authoritative Status**: This document catalogs all implemented backend test cases. Keep it updated when adding new tests.
