# OpenStaff First Test Cases

**Version**: 0.1  
**Status**: Authoritative  
**Last Updated**: 2026-09-28

---

## Overview

This document catalogs the first test cases implemented in the OpenStaff testing layer. Each case is documented with its ID, layer, location, command, offline status, and expected behavior.

---

## Test Case Catalog

| ID | Layer | Path | Command | Offline? | Expected |
|----|-------|------|---------|----------|----------|
| TC-001 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Message JSON roundtrip succeeds |
| TC-002 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Empty message roundtrip succeeds |
| TC-003 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Unicode message roundtrip succeeds |
| TC-004 | Contract | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Special chars roundtrip succeeds |
| TC-005 | Unit | `crates/protocol/src/lib.rs` | `cargo test -p openstaff-protocol` | ✅ Yes | Message creation works |
| TC-006 | Smoke | `scripts/smoke.sh` | `./scripts/smoke.sh` or `just smoke` | ❌ No (needs api:3000) | API health: `{"status":"ok","service":"api"}` |
| TC-007 | Smoke | `scripts/smoke.sh` | `./scripts/smoke.sh` or `just smoke` | ❌ No (needs gateway:3001) | Gateway health: `{"status":"ok","service":"gateway"}` |
| TC-008 | Smoke | `scripts/smoke.sh` | `./scripts/smoke.sh` or `just smoke` | ❌ No (needs scheduler:3002) | Scheduler health: `{"status":"ok","service":"scheduler"}` |
| TC-009 | Unit | `apps/desktop/src/__tests__/App.test.tsx` | `pnpm --filter @openstaff/desktop test` | ✅ Yes | Desktop app is testable |
| TC-010 | Unit | `apps/web-admin/src/__tests__/App.test.tsx` | `pnpm --filter @openstaff/web-admin test` | ✅ Yes | Web admin is testable |

---

## Detailed Test Cases

### TC-001: Message JSON Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip()`

**Purpose**: Verify that `Message` types can be serialized to JSON and deserialized back without data loss.

**Setup**: None (pure unit test)

**Steps**:
1. Create a `Message` with content `"Hello, OpenStaff!"`
2. Serialize to JSON string using `serde_json::to_string()`
3. Deserialize back to `Message` using `serde_json::from_str()`
4. Assert original content equals deserialized content

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_roundtrip -p openstaff-protocol
```

---

### TC-002: Empty Message Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip_empty()`

**Purpose**: Verify edge case of empty message content.

**Setup**: None

**Steps**:
1. Create a `Message` with empty content `""`
2. Serialize to JSON
3. Deserialize back
4. Assert content is still empty

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_roundtrip_empty -p openstaff-protocol
```

---

### TC-003: Unicode Message Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip_unicode()`

**Purpose**: Verify Unicode and emoji handling in messages.

**Setup**: None

**Steps**:
1. Create a `Message` with Unicode content `"你好，世界！🚀"`
2. Serialize to JSON
3. Deserialize back
4. Assert content matches exactly

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_roundtrip_unicode -p openstaff-protocol
```

---

### TC-004: Special Characters Roundtrip

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_message_roundtrip_special_chars()`

**Purpose**: Verify handling of special JSON characters (newlines, tabs, quotes).

**Setup**: None

**Steps**:
1. Create a `Message` with special chars: `"Line 1\nLine 2\t\"Quoted\""`
2. Serialize to JSON
3. Deserialize back
4. Assert content is preserved exactly

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_roundtrip_special_chars -p openstaff-protocol
```

---

### TC-005: Message Creation

**Layer**: Unit  
**File**: `crates/protocol/src/lib.rs`  
**Function**: `test_message_creation()`

**Purpose**: Verify basic message construction.

**Setup**: None

**Steps**:
1. Create a `Message` with content `"test"`
2. Assert content field equals `"test"`

**Expected Result**: ✅ Test passes

**Command**:
```bash
cargo test test_message_creation -p openstaff-protocol
```

---

### TC-006: API Health Check (Smoke)

**Layer**: Smoke  
**File**: `scripts/smoke.sh`  
**Function**: `check_service("api", 3000)`

**Purpose**: Verify API service is running and responds with correct health check format.

**Setup**: 
```bash
just dev  # Start all services
```

**Steps**:
1. Send `GET http://localhost:3000/health`
2. Parse JSON response
3. Assert `status == "ok"`
4. Assert `service == "api"`
5. Assert HTTP status code is 200

**Expected Result**:
```json
{
  "status": "ok",
  "service": "api"
}
```

**Command**:
```bash
./scripts/smoke.sh
# or
just smoke
```

**Online**: ❌ Requires running API service on port 3000

---

### TC-007: Gateway Health Check (Smoke)

**Layer**: Smoke  
**File**: `scripts/smoke.sh`  
**Function**: `check_service("gateway", 3001)`

**Purpose**: Verify Gateway service is running and responds with correct health check format.

**Setup**: 
```bash
just dev  # Start all services
```

**Steps**:
1. Send `GET http://localhost:3001/health`
2. Parse JSON response
3. Assert `status == "ok"`
4. Assert `service == "gateway"`
5. Assert HTTP status code is 200

**Expected Result**:
```json
{
  "status": "ok",
  "service": "gateway"
}
```

**Command**:
```bash
./scripts/smoke.sh
# or
just smoke
```

**Online**: ❌ Requires running Gateway service on port 3001

---

### TC-008: Scheduler Health Check (Smoke)

**Layer**: Smoke  
**File**: `scripts/smoke.sh`  
**Function**: `check_service("scheduler", 3002)`

**Purpose**: Verify Scheduler service is running and responds with correct health check format.

**Setup**: 
```bash
just dev  # Start all services
```

**Steps**:
1. Send `GET http://localhost:3002/health`
2. Parse JSON response
3. Assert `status == "ok"`
4. Assert `service == "scheduler"`
5. Assert HTTP status code is 200

**Expected Result**:
```json
{
  "status": "ok",
  "service": "scheduler"
}
```

**Command**:
```bash
./scripts/smoke.sh
# or
just smoke
```

**Online**: ❌ Requires running Scheduler service on port 3002

---

### TC-009: Desktop App Unit Tests

**Layer**: Unit  
**File**: `apps/desktop/src/__tests__/App.test.tsx`

**Purpose**: Verify frontend test infrastructure is working.

**Setup**: 
```bash
cd apps/desktop && pnpm install
```

**Steps**:
1. Run Vitest
2. Execute placeholder tests
3. Assert tests pass

**Expected Result**: ✅ All tests pass

**Command**:
```bash
pnpm --filter @openstaff/desktop test
# or
cd apps/desktop && pnpm test
```

**Online**: ✅ Offline (no network required)

---

### TC-010: Web Admin Unit Tests

**Layer**: Unit  
**File**: `apps/web-admin/src/__tests__/App.test.tsx`

**Purpose**: Verify frontend test infrastructure is working.

**Setup**: 
```bash
cd apps/web-admin && pnpm install
```

**Steps**:
1. Run Vitest
2. Execute placeholder tests
3. Assert tests pass

**Expected Result**: ✅ All tests pass

**Command**:
```bash
pnpm --filter @openstaff/web-admin test
# or
cd apps/web-admin && pnpm test
```

**Online**: ✅ Offline (no network required)

---

## Test Execution Summary

### Offline Tests (CI Default Gate)

Run all offline tests (must pass for PR merge):

```bash
# Rust tests (unit + contract)
cargo test --workspace

# Frontend tests (unit)
pnpm test
```

**Expected**: ✅ All tests pass  
**Time**: ~30 seconds

---

### Online Tests (Manual/Label Triggered)

Run smoke tests (requires running services):

```bash
# Terminal 1: Start services
just dev

# Terminal 2: Run smoke tests
just smoke
```

**Expected**: ✅ All 3 services respond correctly  
**Time**: ~10 seconds (after services start)

---

## Pending Test Cases (Future Milestones)

### Approval Ticket State Machine

**Status**: 🔲 Not implemented (planned for T1)

**Test Cases**:
- TC-101: Create approval ticket
- TC-102: Approve ticket → execute action
- TC-103: Reject ticket → skip action
- TC-104: Timeout ticket → default to reject
- TC-105: Invalid state transition → error

**Reason for Deferral**: Approval ticket system not yet implemented.

**Implementation**:
- Add `#[ignore]` attribute to tests
- Implement tests alongside approval feature
- Remove `#[ignore]` when feature is complete

**Example**:
```rust
#[test]
#[ignore] // Remove when approval system is implemented
fn test_approval_ticket_workflow() {
    // Test implementation
}
```

---

### E2E Test Cases

**Status**: 🔲 Not implemented (planned for T2)

**Desktop E2E**:
- TC-201: Launch desktop app
- TC-202: Create new agent
- TC-203: Send message to agent
- TC-204: Approve tool execution
- TC-205: View agent response

**Web Admin E2E**:
- TC-301: Login to web admin
- TC-302: View agent list
- TC-303: Create new agent
- TC-304: Edit agent persona
- TC-305: View audit logs

**Reason for Deferral**: Tauri E2E testing is complex; web admin E2E deferred to focus on core functionality.

---

## Reproducing Test Failures

### Local Reproduction

```bash
# Run specific test
cargo test test_name -- --exact

# Run with output
cargo test test_name -- --nocapture

# Run frontend test
cd apps/desktop && pnpm test -- App.test.tsx
```

### CI Reproduction

```bash
# Same commands as CI workflow
cargo check --workspace
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo fmt --all -- --check
pnpm install && pnpm test
```

---

## References

- [Testing Strategy](./strategy.md) - Overall testing approach
- [Monorepo Conventions](../architecture/02-monorepo-conventions.md) - Architecture rules
- [CI Workflow](../../.github/workflows/ci.yml) - GitHub Actions config

---

**Authoritative Status**: This document catalogs all implemented test cases. Keep it updated when adding new tests.
