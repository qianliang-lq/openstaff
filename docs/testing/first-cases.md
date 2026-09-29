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

## Demo-MVP Contract Tests

### Gateway Egress Tests

#### TC-031: Gateway Egress Auth and Request Shape

**Layer**: Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_egress_fetch_auth_and_request_shape()`

**Purpose**: Verify Gateway `/v1/egress/fetch` accepts authenticated requests with correct shape and returns all required response fields.

**Test Coverage**:
- ✅ Bearer token authentication
- ✅ Request fields: url, method, max_bytes, timeout_ms, purpose, routine_id, skill_id, agent_instance_id
- ✅ Response fields: request_id (starts with `eg_`), status, final_url, content_type, body_text, truncated, bytes
- ✅ Offline mode fixture response

**Expected Result**: ✅ HTTP 200 with complete response fields

**Command**:

```bash
cargo test test_egress_fetch_auth_and_request_shape -p openstaff-gateway
```

---

#### TC-032: Gateway Egress Unauthorized

**Layer**: Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_egress_fetch_unauthorized()`

**Purpose**: Verify Gateway rejects requests with invalid Bearer token.

**Expected Result**: ✅ HTTP 401 Unauthorized

---

#### TC-033: Gateway SSRF RFC1918 Blocked

**Layer**: Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_egress_fetch_ssrf_rfc1918_blocked()`

**Purpose**: Verify Gateway blocks private network IP addresses (RFC1918) and loopback addresses.

**Test Data**:
- `http://10.0.0.1`
- `http://172.16.0.1`
- `http://192.168.1.1`
- `http://127.0.0.1`

**Expected Result**: ✅ HTTP 403 Forbidden for all private IPs

**Audit**: deny_reason recorded in audit log

---

#### TC-034: Gateway SSRF Metadata Endpoint Blocked

**Layer**: Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_egress_fetch_ssrf_metadata_blocked()`

**Purpose**: Verify Gateway blocks AWS/cloud metadata endpoint (169.254.169.254).

**Test Data**: `http://169.254.169.254/latest/meta-data/`

**Expected Result**: ✅ HTTP 403 Forbidden with "metadata" in error message

**Audit**: deny_reason recorded with "metadata endpoint blocked"

---

#### TC-035: Gateway Egress Response Fields Complete

**Layer**: Contract  
**File**: `services/gateway/src/main.rs`  
**Function**: `test_egress_fetch_response_fields_complete()`

**Purpose**: Verify Gateway `/v1/egress/fetch` response includes all required fields with correct types.

**Response Contract**:

```json
{
  "request_id": "eg_<uuid>",
  "status": 200,
  "final_url": "https://example.com/test",
  "content_type": "text/html",
  "body_text": "...",
  "truncated": false,
  "bytes": 123
}
```

**Expected Result**: ✅ All 7 fields present with correct types

**Note**: This test validates the response shape matches the 08-demo-mvp-cut spec. Offline mode uses golden fixture; live egress and desktop following job result are NEXT slice.

---

### Runtime Jobs Fire Tests

#### TC-036: Runtime Jobs Fire Accepts Request

**Layer**: Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_jobs_fire_accepts_and_returns_202()`

**Purpose**: Verify Runtime `/v1/jobs/fire` accepts job fire requests and returns 202 Accepted response.

**Request Contract**:

```json
{
  "job_id": "job_test_123",
  "routine_id": "external-insight-daily",
  "skill_id": "external-insight-public-search",
  "trigger": "manual",
  "scheduled_for": "2026-09-28T09:00:00+08:00",
  "payload": {}
}
```

**Response Contract**:

```json
{
  "job_id": "job_test_123",
  "accepted": true
}
```

**Expected Result**: ✅ HTTP 200 with `{job_id, accepted: true}`

**Note**: Real implementation returns 200 (not 202) per existing code. MVP accepts 200; 202 is preferred for async semantics.

---

#### TC-037: Runtime Jobs Fire Response Shape

**Layer**: Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_jobs_fire_response_shape()`

**Purpose**: Validate exact response shape for jobs/fire endpoint.

**Expected Result**:
- ✅ Exactly 2 fields: `job_id`, `accepted`
- ✅ `job_id` matches request
- ✅ `accepted` is true

---

### Scheduler Fire-Only Tests

#### TC-038: Scheduler Fire-Only No Skill Execution

**Layer**: Contract  
**File**: `services/scheduler/src/main.rs`  
**Function**: `test_scheduler_fire_only_no_skill_execution()`

**Purpose**: Verify Scheduler fire-only semantics: Scheduler must NOT load Skill, call Gateway egress, run reconcile, or write facts. These operations belong to Runtime.

**Architecture Constraint** (per 08-demo-mvp-cut):

| Role | Does | Does NOT |
| --- | --- | --- |
| Scheduler | cron / manual fire → `POST /v1/jobs/fire`; record last_run | Load Skill; egress; reconcile; push report card |
| Runtime | Receive fire → run Skill → egress → facts → reconcile → PASS才通知 | Self-trigger cron |

**Expected Result**: ✅ Scheduler calls runtime jobs/fire without executing Skill logic

---

### Desktop Fire Handler Tests

#### TC-039: Desktop Fire Handler Wired

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('renders fire handler wired correctly')`

**Purpose**: Verify Desktop ChatStage has fire handler wired to process job results.

**Expected Result**: ✅ ChatStage renders without errors

---

#### TC-040: Desktop Fire Handler PASS Status

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('fire handler processes demo response with PASS status')`

**Purpose**: Verify Desktop processes demo response with reconcile_status: "PASS" and displays facts.

**Expected Result**: ✅ Facts displayed when reconcile PASS

---

#### TC-041: Desktop Fire Handler FAILED Blocks Report Card

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('fire handler blocks report card on FAILED reconcile')`

**Purpose**: Verify Desktop does NOT render report card when reconcile_status: "FAILED" (per TC-029 reconcile gate).

**Expected Result**: ✅ Report card not rendered when reconcile FAILED

---

#### TC-042: Desktop Fire Handler Manual Trigger

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('fire handler accepts manual trigger from scheduler')`

**Purpose**: Verify Desktop fire handler accepts manual trigger requests with correct shape.

**Expected Result**: ✅ Manual trigger request shape validated

---

## All Tests Summary (Updated)

### Backend Tests (Rust)

```bash
# Run all backend tests (excludes openstaff-desktop Tauri)
cargo test --workspace --exclude openstaff-desktop
```

**Expected**: ✅ 37 tests pass
- TC-001 through TC-020: Protocol + health endpoints (20 tests)
- TC-028, TC-029: External insight schema + reconcile gate (2 tests)
- TC-031 through TC-038: Demo-MVP contract tests (8 tests)
  - Gateway egress: 5 tests
  - Runtime jobs/fire: 2 tests
  - Scheduler fire-only: 1 test

### Frontend Tests (TypeScript)

```bash
# Desktop app tests
cd apps/desktop && pnpm test

# Web admin tests
cd apps/web-admin && pnpm test

# Run all frontend tests from root
pnpm test
```

**Expected**: ✅ 12 test suites pass
- TC-021 through TC-027: Shell UI (7 suites)
- TC-030: External insight report card summary ≤ 3 (1 suite)
- TC-039 through TC-042: Desktop fire handler (4 tests in 1 suite)

---

## Running Demo-MVP Tests Only

### Gateway Egress Tests (TC-031~TC-035)

```bash
cargo test -p openstaff-gateway test_egress
```

**Expected**: ✅ 5 tests pass

### Runtime Jobs Fire Tests (TC-036~TC-037)

```bash
cargo test -p openstaff-runtime test_jobs_fire
```

**Expected**: ✅ 2 tests pass

### Scheduler Fire-Only Test (TC-038)

```bash
cargo test -p openstaff-scheduler test_scheduler_fire_only
```

**Expected**: ✅ 1 test pass

### Desktop Fire Handler Tests (TC-039~TC-042)

```bash
cd apps/desktop && pnpm test ChatStage
```

**Expected**: ✅ 4 tests pass

---

## Test Coverage Gaps (MVP Cut)

The demo-MVP tests validate offline contract wiring. The following are intentionally **NOT** covered (next slice):

1. **Live Egress**: Gateway live HTTP fetch (MVP uses offline fixture)
2. **Desktop Following**: Desktop polling runtime for job completion
3. **Audit Record Persistence**: Gateway audit log writes (tested but not validated by reading file)
4. **Scheduler Cron**: Scheduled triggers (MVP only tests manual fire)
5. **Error Recovery**: Runtime job retry logic
6. **EventEnvelope Expansion**: No new EventEnvelope variants added (payload idioms only)

**Honesty Note in Tests**: Test comments acknowledge that demo path uses golden fixture. Runtime→Gateway live fetch + Desktop following job result are NEXT slice. Do not claim live egress is fully wired end-to-end.

---

---

## Slice 2 Contract Tests (TC-043+)

### Runtime Egress Gateway Client Tests

#### TC-043: Runtime Uses Gateway Client for Egress

**Layer**: Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_runtime_uses_gateway_client_for_egress()`

**Purpose**: Verify Runtime does NOT use reqwest::Client directly for public egress; must use Gateway client instead (per 08-demo-mvp-cut architecture).

**Test Coverage**:
- ✅ Runtime demo module does NOT contain `reqwest::Client`
- ✅ Runtime external_insight module does NOT contain `reqwest::Client`
- ✅ All public egress goes through Gateway `/v1/egress/fetch`

**Expected Result**: ✅ No direct reqwest::Client usage in insight path

**Architecture Constraint**: Runtime MUST NOT bypass Gateway for public HTTP calls (sole egress point).

---

#### TC-044: GET /v1/insights/latest Contract Shape

**Layer**: Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_insights_latest_contract_shape()`

**Purpose**: Verify Runtime `/v1/insights/latest` endpoint returns correct response shape.

**Response Contract**:

```json
{
  "job_status": "completed" | "not_found",
  "reconcile_status": "PASS" | "FAILED" | "N/A",
  "facts": [...],
  "artifacts_path": "artifacts/external-insight/2026-09-28-public-facts.json",
  "timestamp": "2026-09-28"
}
```

**Test Coverage**:
- ✅ All required fields present: job_status, reconcile_status, facts, artifacts_path, timestamp
- ✅ facts is array type
- ✅ HTTP 200 response

**Expected Result**: ✅ Response matches contract shape

**Command**:

```bash
cargo test test_insights_latest_contract_shape -p openstaff-runtime
```

---

#### TC-045: Insights Latest Response Fields Complete

**Layer**: Contract  
**File**: `services/runtime/src/main.rs`  
**Function**: `test_insights_latest_response_fields_complete()`

**Purpose**: Validate all response fields are present with correct types.

**Expected Result**:
- ✅ job_status is string
- ✅ reconcile_status is string
- ✅ facts is array
- ✅ artifacts_path is string
- ✅ timestamp is string

---

### Desktop Polling and UI Tests

#### TC-046: Desktop Polls Insights Latest - PASS Shows Card

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('fire handler processes demo response with PASS status')`

**Purpose**: Verify Desktop processes insights/latest response with reconcile_status: "PASS" and displays report card.

**Expected Result**: ✅ Report card rendered when reconcile PASS

---

#### TC-047: Desktop Polls Insights Latest - FAILED Silent

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('fire handler blocks report card on FAILED reconcile')`

**Purpose**: Verify Desktop does NOT render report card when reconcile_status: "FAILED" (per reconcile gate TC-029).

**Expected Result**: ✅ Report card NOT rendered when reconcile FAILED (silent failure)

---

#### TC-048: Desktop Button Label「立即跑一次」

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('renders button with correct label')`

**Purpose**: Verify Desktop chat stage displays button with Chinese label「立即跑一次」.

**Expected Result**: ✅ Button renders with label「立即跑一次」

**UI Spec**: Button triggers manual fire via Scheduler → Runtime jobs/fire

---

#### TC-049: Report Card Avatar「产」

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('report card uses correct avatar')`

**Purpose**: Verify report card is attributed to 产品经理数字员工 with「产」avatar (not「研」per slice 2 spec).

**Expected Result**: ✅ Report card message has avatar「产」

**UI Change**: Changed from「研」(research) to「产」(product manager) per product design.

---

#### TC-050: Desktop Polls Insights Endpoint After Job Fire

**Layer**: Unit  
**File**: `apps/desktop/src/components/stages/ChatStage.test.tsx`  
**Function**: `test('polls insights endpoint after job fire')`

**Purpose**: Verify Desktop implements polling logic for insights/latest endpoint after manual trigger.

**Expected Result**: ✅ Button wired to fire job and poll insights

**Flow**: Button click → POST /demo/fire → Poll GET /v1/insights/latest → Display result

---

## All Tests Summary (Updated for Slice 2)

### Backend Tests (Rust)

```bash
# Run all backend tests (excludes openstaff-desktop Tauri)
cargo test --workspace --exclude openstaff-desktop
```

**Expected**: ✅ 40 tests pass
- TC-001 through TC-020: Protocol + health endpoints (20 tests)
- TC-028, TC-029: External insight schema + reconcile gate (2 tests)
- TC-031 through TC-038: Demo-MVP contract tests (8 tests)
- TC-043 through TC-045: Slice 2 runtime tests (3 tests)

### Frontend Tests (TypeScript)

```bash
# Desktop app tests
cd apps/desktop && pnpm test

# Web admin tests
cd apps/web-admin && pnpm test

# Run all frontend tests from root
pnpm test
```

**Expected**: ✅ 15 test suites pass
- TC-021 through TC-027: Shell UI (7 suites)
- TC-030: External insight report card summary ≤ 3 (1 suite)
- TC-039 through TC-042: Desktop fire handler (4 tests in 1 suite)
- TC-046 through TC-050: Slice 2 desktop tests (5 tests in ChatStage suite)

---

## Running Slice 2 Tests Only

### Runtime Insights Tests (TC-043~TC-045)

```bash
cargo test -p openstaff-runtime test_insights_latest
cargo test -p openstaff-runtime test_runtime_uses_gateway_client_for_egress
```

**Expected**: ✅ 3 tests pass

### Desktop Slice 2 Tests (TC-046~TC-050)

```bash
cd apps/desktop && pnpm test ChatStage
```

**Expected**: ✅ 8 tests pass (includes TC-039~TC-042 from slice 1)

---

## Test Coverage Summary (Slice 2)

### New Coverage Added

1. **Runtime Gateway Client Enforcement**: TC-043 validates no direct reqwest in insight path
2. **Insights Latest Endpoint**: TC-044, TC-045 validate new GET /v1/insights/latest contract
3. **Desktop Polling Logic**: TC-050 validates desktop follows job via insights/latest
4. **UI Copy Compliance**: TC-048 validates button label「立即跑一次」
5. **Avatar Attribution**: TC-049 validates report card uses「产」avatar per spec

### Gaps (Intentional)

The following are NOT covered (next slice or out of MVP scope):

1. **Live Gateway Fetch**: Runtime calling Gateway in live mode (uses offline fixture in MVP)
2. **Polling Performance**: Desktop polling interval/retry logic (basic implementation only)
3. **Job Failure Handling**: Runtime retry on job execution failure
4. **Audit Log Persistence Validation**: Gateway writes audit but tests don't read file back

**Honesty Note**: Tests validate offline contract wiring. Runtime uses Gateway client structure but offline fixture mode. Live egress wiring is partial (Gateway has live mode, Runtime demo doesn't call it in MVP).

---

**Authoritative Status**: This document catalogs all implemented test cases (backend + frontend). Keep it updated when adding new tests.
