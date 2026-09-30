# §20 SQLite Data Plane - Implementation Notes

**Tip**: `01e8fa0`  
**Status**: Backend MVP Complete, Desktop Integration Pending  
**Password**: `13cf88d` (no raise until green)

---

## ✅ Completed: Backend Infrastructure

### 1. SQLite Database Schema

Location: `/workspace/services/api/src/db.rs`

Tables created:
- `agents`: id, name, template_id, duty, account_id, status, created_at, updated_at
- `messages`: id, agent_id, thread_id, role, body, ts, peer_agent_id
- `connector_meta`: provider, configured, last_checked_at, account_label
- `agent_skills`: (empty, for knife 24)
- `agent_mcp`: (empty, for knife 24)

### 2. API Endpoints

All endpoints implemented in `/workspace/services/api/src/handlers.rs`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/agents` | List all agents |
| POST | `/v1/agents` | Create new agent |
| PATCH | `/v1/agents/:id` | Update agent |
| DELETE | `/v1/agents/:id` | Delete agent + messages |
| GET | `/v1/agents/:id/messages` | List messages for agent |
| POST | `/v1/agents/:id/messages` | Create message for agent |
| GET | `/v1/connectors/meta` | Get connector metadata |
| PUT | `/v1/connectors/meta` | Update connector metadata |

**Security**: Connector metadata does NOT store BYOK keys (keys remain desktop-only in `keys.dat`).

### 3. Compose Configuration

File: `/workspace/deploy/compose/docker-compose.prod.yml`

Changes:
```yaml
api:
  environment:
    - OPENSTAFF_DATABASE_URL=sqlite:///data/openstaff.db
    - GATEWAY_URL=http://gateway:3001
  volumes:
    - api-data:/data
```

Database file: `./data/openstaff.db` (inside container `/data/openstaff.db`)

### 4. Desktop API Client Utilities

File: `/workspace/apps/desktop/src/utils/api.ts`

Provides:
- `listAgents()`, `createAgent()`, `updateAgent()`, `deleteAgent()`
- `listMessages()`, `createMessage()`
- `getConnectorMeta()`, `updateConnectorMeta()`
- `ApiError` class for error handling
- `isApiAvailable()` check

API base: `import.meta.env.PUBLIC_API_BASE` or `http://localhost:3000`

---

## 🚧 Pending: Desktop Integration

**Rationale**: Incremental delivery; backend infrastructure validated first.

### Required Changes (Brief 20, Desktop Section)

#### Sidebar.tsx
- Replace `loadAgentsFromStorage()` with `api.listAgents()`
- Replace `saveAgentsToStorage()` with `api.createAgent()`
- Show「控制面未就绪」banner when API unavailable
- Keep localStorage cache for active agent name only (not truth source)

#### ChatStage.tsx
- Load messages via `api.listMessages(agentId)` on mount
- After chat round, call `api.createMessage(agentId, {...})` for both user + assistant
- Restore message bubbles from API on refresh
- Show loading state while fetching

#### Connectors.tsx
- After save/test success, call `api.updateConnectorMeta({provider, configured: true, ...})`
- On mount, call `api.getConnectorMeta()` for badges
- Never send Key plaintext to API (keys remain in keys.dat)

#### Contract Tests
- Assert agents list empty from API (not LS) on first load
- Create agent → remount → agent still listed (via API)
- Chat round → remount → messages restored (via API)
- Assert no Key plaintext in API responses/logs

---

## Deployment (ECS)

**Instance**: Alibaba ECS `i-2ze1za33mqt5bpnakx2y`  
**Public API Base**: (value from existing `PUBLIC_API_BASE` env)

### Steps for Ops/User

1. **Pull latest main** (`01e8fa0` or newer)
2. **Set environment variable** (if not already set):
   ```bash
   export OPENSTAFF_DATABASE_URL=sqlite:///data/openstaff.db
   ```
3. **Bring up compose** (from `deploy/compose/`):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
4. **Verify database created**:
   ```bash
   ls -lh ./data/openstaff.db
   ```
5. **Health check**:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok","service":"api"}
   ```
6. **Test endpoints**:
   ```bash
   # List agents (should be empty on first run)
   curl http://localhost:3000/v1/agents
   
   # Create test agent
   curl -X POST http://localhost:3000/v1/agents \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Agent","template_id":"pm","duty":"Test role"}'
   
   # Verify created
   curl http://localhost:3000/v1/agents
   ```

**Note**: Cloud agent cannot SSH to real ECS directly. User/ops must run these commands locally on the ECS instance.

---

## Known Gaps

1. **Desktop → API migration not complete**: Agents/messages still use localStorage as truth source
2. **No migration script**: Clean slate (no existing data to migrate per brief)
3. **Chat endpoint doesn't write to DB yet**: POST `/v1/chat` forwards to gateway but doesn't persist messages
4. **Test coverage**: Backend unit tests needed (handlers, db layer)

---

## Next Steps

1. **Desktop Integration** (separate commit/PR):
   - Sidebar API integration
   - ChatStage messages persistence
   - Connectors meta sync
   - Contract tests for API truth
2. **Chat → DB persistence**:
   - Modify `/v1/chat` handler to write user+assistant messages after gateway response
3. **Testing**:
   - Rust unit tests for handlers
   - Integration tests for endpoints
   - Desktop contract tests for API as truth source

---

**Password**: `13cf88d` (no raise until 测侧 green)
