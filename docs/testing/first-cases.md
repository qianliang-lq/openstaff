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

| ID     | Layer         | Path                                 | Command                             | Offline? | Expected                                                 |
| ------ | ------------- | ------------------------------------ | ----------------------------------- | -------- | -------------------------------------------------------- |
| TC-001 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | Message JSON roundtrip succeeds                          |
| TC-002 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | Empty message roundtrip succeeds                         |
| TC-003 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | Unicode message roundtrip succeeds                       |
| TC-004 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | EventEnvelope with Message payload roundtrip             |
| TC-005 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | EventEnvelope with AgentStateChange roundtrip            |
| TC-006 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | EventEnvelope with ToolCall roundtrip                    |
| TC-007 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | EventEnvelope with ApprovalRequest roundtrip             |
| TC-008 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | HealthResponse roundtrip succeeds                        |
| TC-009 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | HealthResponse JSON format validation                    |
| TC-010 | Unit          | `crates/protocol/src/lib.rs`         | `cargo test -p openstaff-protocol`  | ✅ Yes   | Message creation works                                   |
| TC-011 | Unit          | `crates/protocol/src/lib.rs`         | `cargo test -p openstaff-protocol`  | ✅ Yes   | HealthResponse builder creates correct response          |
| TC-012 | Unit/Contract | `services/api/src/main.rs`           | `cargo test -p openstaff-api`       | ✅ Yes   | API /health endpoint returns 200 with correct JSON       |
| TC-013 | Unit/Contract | `services/api/src/main.rs`           | `cargo test -p openstaff-api`       | ✅ Yes   | API health JSON contract validation                      |
| TC-014 | Unit/Contract | `services/gateway/src/main.rs`       | `cargo test -p openstaff-gateway`   | ✅ Yes   | Gateway /health endpoint returns 200 with correct JSON   |
| TC-015 | Unit/Contract | `services/gateway/src/main.rs`       | `cargo test -p openstaff-gateway`   | ✅ Yes   | Gateway health JSON contract validation                  |
| TC-016 | Unit/Contract | `services/scheduler/src/main.rs`     | `cargo test -p openstaff-scheduler` | ✅ Yes   | Scheduler /health endpoint returns 200 with correct JSON |
| TC-017 | Unit/Contract | `services/scheduler/src/main.rs`     | `cargo test -p openstaff-scheduler` | ✅ Yes   | Scheduler health JSON contract validation                |
| TC-018 | Unit/Contract | `services/runtime/src/main.rs`       | `cargo test -p openstaff-runtime`   | ✅ Yes   | Runtime /health endpoint returns 200 with correct JSON   |
| TC-019 | Unit/Contract | `services/runtime/src/main.rs`       | `cargo test -p openstaff-runtime`   | ✅ Yes   | Runtime health JSON contract validation                  |
| TC-020 | Contract      | `crates/protocol/tests/roundtrip.rs` | `cargo test -p openstaff-protocol`  | ✅ Yes   | HealthResponse rejects JSON with extra fields            |

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

#### TC-018: Runtime Health Endpoint

**Layer**: Unit/Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_health_endpoint_returns_ok()`

**Purpose**: Verify Runtime `/health` endpoint via Router unit test.

**Expected Result**: ✅ HTTP 200 with `{"status":"ok","service":"runtime"}`

**Command**:

```bash
cargo test test_health_endpoint_returns_ok -p openstaff-runtime
```

---

#### TC-019: Runtime Health JSON Contract

**Layer**: Unit/Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_health_response_json_contract()`

**Purpose**: Validate exact JSON shape.

**Expected Result**: ✅ Correct JSON format

---

#### TC-020: HealthResponse Rejects Extra Fields

**Layer**: Contract  
**File**: `crates/protocol/tests/roundtrip.rs`  
**Function**: `test_health_response_rejects_extra_fields()`

**Purpose**: Verify HealthResponse strictly enforces contract by rejecting JSON with extra fields (e.g., "version").

**Test Data**:

- ❌ `{"status":"ok","service":"api","version":"1.0.0"}` - Should fail
- ✅ `{"status":"ok","service":"api"}` - Should succeed

**Expected Result**:

- ✅ Deserialization fails for JSON with extra fields
- ✅ Deserialization succeeds for JSON with only status and service

**Implementation**: Uses `#[serde(deny_unknown_fields)]` attribute on HealthResponse

---

## Test Execution Summary

### All Tests (Offline, CI Default Gate)

Run all backend tests:

```bash
cargo test --workspace
```

**Expected**: ✅ All 21 backend tests pass (TC-001 through TC-020)  
**Time**: ~5 seconds

---

### By Component

```bash
# Protocol tests (13 tests)
cargo test -p openstaff-protocol

# Service tests (8 tests total)
cargo test -p openstaff-api          # 2 tests
cargo test -p openstaff-gateway      # 2 tests
cargo test -p openstaff-scheduler    # 2 tests
cargo test -p openstaff-runtime      # 2 tests
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

## Shell UI Test Cases (Frontend)

### Desktop Application Tests

#### TC-021: Desktop App Rendering

**Layer**: Unit  
**File**: `apps/desktop/src/App.test.tsx`  
**Function**: Shell UI component tests

**Purpose**: Verify desktop shell UI renders correctly with all key components.

**Test Cases**:

- Titlebar component renders
- Sidebar component with agent list renders
- MainStage component with tabs renders

**Expected Result**: ✅ All components render without errors

**Command**:

```bash
cd apps/desktop && pnpm test
```

**Offline**: ✅ Yes

---

#### TC-022: Sidebar Multiple Agents

**Layer**: Unit  
**File**: `apps/desktop/src/components/Sidebar.test.tsx`

**Purpose**: Verify Sidebar displays multiple agents and shows active state.

**Expected Result**:

- ✅ Shows "产品经理数字员工", "运营专家", "研发协作"
- ✅ Active agent has `.active` class

---

#### TC-023: MainStage Tabs

**Layer**: Unit  
**File**: `apps/desktop/src/components/MainStage.test.tsx`

**Purpose**: Verify MainStage displays all tabs including Chat.

**Expected Result**:

- ✅ Shows Chat, Computer, Routines, Skills, Connectors, Memory tabs
- ✅ Chat tab active by default
- ✅ ChatStage component renders when chat tab selected

---

#### TC-024: ValidationGateWidget Actions

**Layer**: Unit  
**File**: `apps/desktop/src/components/ValidationGateWidget.test.tsx`

**Purpose**: Verify ValidationGateWidget has 通过/丢弃 buttons and dismisses correctly.

**Expected Result**:

- ✅ Shows "验证闸门 Widget"
- ✅ Shows "通过" (approve) button
- ✅ Shows "丢弃" (reject) button
- ✅ Widget dismisses after approve click
- ✅ Widget dismisses after reject click

---

### Web Admin Tests

#### TC-025: Web Admin App Rendering

**Layer**: Unit  
**File**: `apps/web-admin/src/App.test.tsx`

**Purpose**: Verify web admin shell UI renders correctly.

**Expected Result**:

- ✅ Topbar renders
- ✅ Sidebar renders
- ✅ InstancesPage renders by default

**Command**:

```bash
cd apps/web-admin && pnpm test
```

**Offline**: ✅ Yes

---

#### TC-026: Web Admin Sidebar Chinese Labels

**Layer**: Unit  
**File**: `apps/web-admin/src/components/Sidebar.test.tsx`

**Purpose**: Verify Sidebar displays Chinese navigation labels.

**Expected Result**:

- ✅ Shows "实例" (Instances)
- ✅ Shows "节点与运行时" (Nodes & Runtime)
- ✅ Shows "观测" (Observability)
- ✅ Shows "审批审计" (Approval Audit)
- ✅ Active page highlighted

---

#### TC-027: InstancesPage Table

**Layer**: Unit  
**File**: `apps/web-admin/src/pages/InstancesPage.test.tsx`

**Purpose**: Verify InstancesPage renders table with instance data.

**Expected Result**:

- ✅ Shows "Agent 实例" heading
- ✅ Table renders with headers: 实例 ID, Agent, 租户, 状态, 节点, 镜像 Digest
- ✅ Multiple instance rows render
- ✅ Status badges (Ready, Provisioning, etc.) display
- ✅ Search filter control present

---

#### TC-028: External Insight Facts Schema Contract

**Layer**: Integration  
**File**: `services/runtime/tests/external_insight_contract.rs`

**Purpose**: Validate that facts JSON conforms to the schema defined in `skills/external-insight-public-search/schema/public-facts.schema.json`.

**Test Coverage**:

- ✅ Valid golden fixture deserializes correctly
- ✅ Required fields: `bucket`, `title`, `summary_zh`, `url`, `tags`
- ✅ Bucket enum constraint: must be one of `竞对`, `组织提效`, `前沿模型`, `技术底座`
- ✅ minLength constraints: title ≥ 1, summary_zh ≥ 1
- ✅ URI format: url and optional pdf_url start with `http://` or `https://`
- ✅ minItems constraint: tags array must have ≥ 1 item
- ✅ additionalProperties: false (no extra fields allowed)
- ✅ Reject malformed facts: missing required fields, empty tags

**Expected Result**:

- ✅ Golden fixture passes all schema constraints
- ✅ Malformed facts are rejected

---

#### TC-029: External Insight Reconcile Gate

**Layer**: Integration  
**File**: `services/runtime/tests/external_insight_contract.rs`

**Purpose**: Verify reconcile gate enforcement: FAILED reconcile must not produce report card payload; PASS reconcile allows payload with summary ≤ 3 items.

**Reconcile Contract**:

- When `reconcile_status: "FAILED"` → Runtime **must not** emit EventEnvelope
- When `reconcile_status: "PASS"` → Runtime **may** emit EventEnvelope with report card
- UI **must not** render card unless reconcile PASS (silent failure)

**Test Coverage**:

- ✅ FAILED reconcile blocks report card emission
- ✅ FAILED reconcile returns None for payload creation
- ✅ PASS reconcile allows report card emission
- ✅ PASS reconcile creates payload with facts and summary
- ✅ Summary limited to ≤ 3 items (hardcoded constraint)

**Expected Result**:

- ✅ `should_emit_report_card(FAILED)` returns false
- ✅ `should_emit_report_card(PASS)` returns true
- ✅ `create_report_card_payload_if_passed(FAILED)` returns None
- ✅ `create_report_card_payload_if_passed(PASS)` returns Some with valid payload

---

#### TC-030: External Insight Report Card Summary ≤ 3

**Layer**: Unit  
**File**: `apps/desktop/src/components/ExternalInsightReportCard.test.tsx`

**Purpose**: Verify report card UI limits summary display to ≤ 3 items (product spec: 摘要要点 硬限制).

**Test Coverage**:

- ✅ Renders exactly 3 summary items when facts.length = 3
- ✅ Renders ≤ 3 summary items when facts.length > 3
- ✅ Fourth and fifth items not displayed in summary
- ✅ Detailed view shows all facts (no truncation)

**Expected Result**:

- ✅ `summaryFacts = facts.slice(0, 3)` enforces hard limit
- ✅ UI displays at most 3 bullet points in collapsed state
- ✅ Expand button reveals full content without summary limit

---

## All Tests Summary

### Backend Tests (Rust)

```bash
# Run all backend tests (excludes openstaff-desktop Tauri)
cargo test --workspace --exclude openstaff-desktop
```

**Expected**: ✅ 25 tests pass (TC-001 through TC-020, TC-028, TC-029)

**Note**: TC-028 and TC-029 are integration tests in `services/runtime/tests/external_insight_contract.rs`.

### Frontend Tests (TypeScript)

```bash
# Desktop app tests
cd apps/desktop && pnpm test

# Web admin tests
cd apps/web-admin && pnpm test

# Run all frontend tests from root
pnpm test
```

**Expected**: ✅ 8 test suites pass (TC-021 through TC-027, TC-030)

**Note**: TC-030 is already implemented in `ExternalInsightReportCard.test.tsx` (line 107-134).

---

## External Insight Test Suite

### Architecture Gate Compliance

The external-insight MVP tests enforce critical architecture boundaries (§8 from `docs/architecture/02-monorepo-conventions.md`):

1. **Execution Environment**: Tests assume skill executes in `runtime` service (not scheduler)
2. **Public Egress**: Tests validate facts schema without testing actual web access (Gateway bypass is audited separately)
3. **Reconcile Gate**: Tests enforce that FAILED reconcile **must not** emit report card (product spec: silent failure)
4. **Protocol Truth**: Tests do **not** invent `EventEnvelope::ExternalInsightReport` (stub payload only)

### Test Fixtures

- **Golden Fixture**: `tests/fixtures/external-insight-golden-facts.json`
  - 5 sample facts covering all 4 buckets (竞对, 组织提效, 前沿模型, 技术底座)
  - Includes required fields + optional `pdf_url`
  - Valid URLs and tags for realism

### Running External Insight Tests

```bash
# Backend: Schema + Reconcile Gate
cargo test -p openstaff-runtime external_insight

# Frontend: Report Card UI
cd apps/desktop && pnpm test ExternalInsightReportCard

# All external-insight tests
cargo test external_insight && cd apps/desktop && pnpm test ExternalInsightReportCard
```

---

**Authoritative Status**: This document catalogs all implemented test cases (backend + frontend). Keep it updated when adding new tests.
