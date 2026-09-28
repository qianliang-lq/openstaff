# OpenStaff Agent Development Guide

> **For Contributors**: Building agents, skills, and integrations for OpenStaff

---

## Quick Links

- **Architecture Conventions**: [docs/architecture/02-monorepo-conventions.md](docs/architecture/02-monorepo-conventions.md) ⭐ **START HERE**
- **Testing Strategy**: [docs/testing/strategy.md](docs/testing/strategy.md) ⭐ **Test layers & CI**
- **Protocol Reference**: [crates/protocol/](crates/protocol/)
- **Tech Plan**: [docs/2026-09-28-openstaff-tech-plan-v0.1_f5ef.md](docs/2026-09-28-openstaff-tech-plan-v0.1_f5ef.md)

---

## What is an Agent?

In OpenStaff, an **Agent** is a digital employee with:

- **Persona**: Name, role, speaking style
- **Memory**: Profile (long-term) + conversation logs
- **Routines**: Cron jobs or event-driven tasks
- **Skills**: Pluggable capabilities (APIs, tools, MCP connectors)
- **Computer**: Private sandbox (cloud container or local tools)

Agents are **NOT** just chatbots. They are stateful, auditable, and can execute approved tasks autonomously.

---

## Architecture at a Glance

```
┌─────────────────┐
│  Desktop Client │  Chat interface, approval cards
│  (Tauri+React) │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│   Control Plane │  Agent state, approvals, routing
│   (API service) │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Gateway │ │Scheduler│ │ Runtime  │
│(LLM)   │ │(Cron)  │ │ (Sandbox)│
└────────┘ └────────┘ └──────────┘
```

**Key Rules** (see [monorepo conventions](docs/architecture/02-monorepo-conventions.md)):

1. **Protocol is source of truth**: All types in `crates/protocol`
2. **Gateway is sole LLM egress**: Don't call LLMs directly
3. **Approvals via control plane tickets**: No self-approval
4. **Desktop = chat stage**: Web admin is NOT full chat

---

## Getting Started

### 1. Read the Conventions

**⭐ REQUIRED**: [docs/architecture/02-monorepo-conventions.md](docs/architecture/02-monorepo-conventions.md)

This doc defines:
- Directory layout
- Service boundaries
- Protocol as source of truth
- Approval flow
- Sandbox strategy

### 2. Set Up Local Dev

```bash
# Install dependencies
just install

# Start backend services
just dev

# Check health
just health
```

See [INSTALL.md](INSTALL.md) for system dependencies.

### 3. Explore the Protocol

```bash
cd crates/protocol
cargo doc --open
```

Key types:
- `Message` - Basic chat message
- `EventEnvelope` - Wrapper for all events
- `AgentProfile` - Agent persona & config
- `ToolCall` / `ToolResult` - Tool invocations

---

## Creating an Agent (Conceptual)

> **Note**: Full agent creation UI is coming in T1. This is the conceptual flow.

### Step 1: Define Persona

```rust
use openstaff_protocol::AgentProfile;

let agent = AgentProfile {
    name: "Product Manager Bot".to_string(),
    role: "product-manager".to_string(),
    persona: "You are a product manager focused on user research.".to_string(),
    // ... more fields
};
```

### Step 2: Assign Skills

Skills are capabilities loaded into an agent:

- **Built-in**: File operations, web search, data analysis
- **MCP Connectors**: GitHub, Slack, Linear, custom APIs
- **Custom**: Write your own (see `skills/` directory)

```toml
# Example skill manifest
[skill]
name = "github-integration"
version = "0.1.0"
requires_approval = true  # High-risk operations need approval

[[tools]]
name = "create_issue"
description = "Create a GitHub issue"
```

### Step 3: Configure Sandbox

Agents can run in:

1. **Cloud sandbox** (default): Docker container with isolated filesystem
2. **Local tools**: Execute on user's machine (requires approval)
3. **Hybrid**: Both (common for desktop workflows)

```rust
// Sandbox configuration (protocol)
use openstaff_protocol::SandboxConfig;

let config = SandboxConfig {
    provider: "compose".to_string(),  // or "k8s", "openclaw"
    resources: ResourceLimits {
        cpu_cores: 1.0,
        memory_mb: 512,
    },
    network_policy: NetworkPolicy::Restricted {
        allow_domains: vec!["api.github.com".to_string()],
    },
};
```

---

## Approval Flow (Critical)

**All high-risk operations require approval**. This is enforced by the control plane.

### How It Works

1. **Agent requests tool execution** (e.g., "write file to disk")
2. **Runtime checks risk level** (from skill manifest)
3. **If high-risk**: Runtime asks API to create approval ticket
4. **API creates ticket** and sends to Desktop client
5. **User sees approval card** in chat
6. **User approves/rejects**
7. **Desktop sends decision to API**
8. **API resolves ticket** and notifies Runtime
9. **Runtime executes or skips** based on decision

### Example: Approval Card UI

```
┌─────────────────────────────────────┐
│ ⚠️  Approval Required                │
├─────────────────────────────────────┤
│ Agent: Product Manager Bot          │
│ Action: Write file to local disk    │
│                                     │
│ Path: ~/Documents/report.md         │
│ Size: 2.4 KB                        │
│                                     │
│ Risk: High                          │
│                                     │
│ [ Approve Once ] [ Reject ]         │
└─────────────────────────────────────┘
```

### Code: Requesting Approval

```rust
use openstaff_protocol::{ApprovalRequest, RiskLevel};

let request = ApprovalRequest {
    agent_id: "agent-123".to_string(),
    tool_name: "write_file".to_string(),
    risk_level: RiskLevel::High,
    details: json!({
        "path": "~/Documents/report.md",
        "size": 2400,
    }),
    timeout_secs: 300,  // 5 minutes
};

// Send to control plane via API
api_client.create_approval_ticket(request).await?;
```

---

## Skills & MCP Connectors

### Built-in Skills (Coming Soon)

- `filesystem` - File operations
- `web-search` - Internet search
- `calculator` - Math operations
- `code-interpreter` - Python execution

### MCP (Model Context Protocol)

OpenStaff supports [MCP](https://modelcontextprotocol.io) for third-party integrations:

```bash
# Example: Add GitHub MCP connector
cd skills/connectors
pnpm add @modelcontextprotocol/github

# Configure in agent
# (UI in T3+)
```

### Writing Custom Skills

```rust
// skills/my-skill/src/lib.rs
use openstaff_protocol::{Skill, ToolDefinition};

pub struct MySkill;

impl Skill for MySkill {
    fn name(&self) -> &str {
        "my-custom-skill"
    }

    fn tools(&self) -> Vec<ToolDefinition> {
        vec![
            ToolDefinition {
                name: "do_something".to_string(),
                description: "Does something useful".to_string(),
                requires_approval: false,
                schema: json_schema!(...),
            }
        ]
    }

    async fn execute(&self, tool: &str, args: Value) -> Result<Value> {
        match tool {
            "do_something" => {
                // Your logic here
                Ok(json!({"result": "done"}))
            }
            _ => Err(anyhow!("Unknown tool"))
        }
    }
}
```

---

## Routines (Cron & Events)

Agents can have **routines** that run on a schedule or in response to events.

### Cron Routine

```rust
use openstaff_protocol::Routine;

let routine = Routine {
    name: "daily-standup".to_string(),
    schedule: "0 9 * * 1-5".to_string(),  // 9 AM weekdays
    action: RoutineAction::SendMessage {
        content: "Daily standup: What did you accomplish yesterday?".to_string(),
    },
};
```

### Event-Driven Routine

```rust
let routine = Routine {
    name: "on-github-issue".to_string(),
    trigger: RoutineTrigger::Webhook {
        source: "github".to_string(),
        event_type: "issues.opened".to_string(),
    },
    action: RoutineAction::InvokeSkill {
        skill: "github-integration".to_string(),
        tool: "analyze_issue".to_string(),
    },
};
```

---

## Sandboxes: Local vs Cloud

### Cloud Sandbox (Default)

- **Isolation**: Each agent gets a dedicated container
- **Persistence**: PVC (Persistent Volume Claim) for agent's files
- **Network**: Restricted egress (whitelist only)
- **Runs**: Even when user is offline (if enabled)

### Local Tools (Opt-in)

- **Use case**: User wants agent to access their local machine
- **Approval**: ALWAYS requires approval for security
- **Examples**: Read local files, run local scripts

### Hybrid Mode (Common)

Most agents use both:

1. **Cloud sandbox**: For long-running tasks, data analysis, web scraping
2. **Local tools**: For accessing user's personal files, IDE integration

---

## Testing Your Agent

### Unit Tests

```bash
# Test protocol types
cargo test -p openstaff-protocol

# Test your skill
cargo test -p my-custom-skill
```

### Integration Tests

```bash
# Start test environment
just dev

# Run integration tests
cargo test --test integration_test_name
```

### Manual Testing

```bash
# 1. Start backend
just dev

# 2. Start desktop client
cd apps/desktop && pnpm dev

# 3. Create agent via UI
# 4. Test interactions
```

---

## Debugging

### Logs

```bash
# Backend services
RUST_LOG=debug cargo run -p openstaff-api

# Desktop client (Tauri)
cd apps/desktop && pnpm dev
# Open DevTools: Right-click → Inspect
```

### Health Checks

```bash
just health

# Or manually
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Protocol Inspector (Coming Soon)

```bash
# View all messages in a session
openstaff-cli inspect-session <session-id>
```

---

## Best Practices

### 1. Use Protocol Types

✅ **Good**:
```rust
use openstaff_protocol::{Message, EventEnvelope};
let msg = Message { content: "Hello".to_string() };
```

❌ **Bad**:
```rust
struct Message { content: String }  // DON'T redefine protocol types
```

### 2. Always Request Approval for High-Risk Actions

✅ **Good**:
```rust
if tool_risk_level == RiskLevel::High {
    request_approval(tool_call).await?;
}
```

❌ **Bad**:
```rust
// Just execute without checking
write_file(path, content)?;  // DANGEROUS
```

### 3. Use Gateway for LLM Calls

✅ **Good**:
```rust
let response = gateway_client.complete(prompt).await?;
```

❌ **Bad**:
```rust
let response = openai_client.complete(prompt).await?;  // Bypass gateway
```

### 4. Follow Service Boundaries

See [monorepo conventions](docs/architecture/02-monorepo-conventions.md) for what each service should/shouldn't do.

---

## Common Pitfalls

1. **Redefining protocol types**: Always import from `openstaff-protocol`
2. **Bypassing approvals**: All high-risk tools must go through approval flow
3. **Calling LLMs directly**: Use Gateway service (sole egress point)
4. **Storing secrets in code**: Use control plane secret vault
5. **Ignoring sandbox limits**: Respect CPU/memory quotas

---

## FAQ

### Q: Can I create an agent that runs entirely locally?

A: Yes, but some features require cloud services (e.g., running while laptop is closed). Approval is always required for local tool execution.

### Q: How do I add a new LLM provider?

A: Implement the `LLMProvider` trait in Gateway service. See `services/gateway/src/providers/`.

### Q: Can agents talk to each other?

A: Yes, via `SendToAgent` protocol. Control plane routes messages between agents.

### Q: How do I deploy my agent to production?

A: Agents are deployed as container instances in K8s (or Compose locally). See `deploy/` directory.

### Q: Is there a limit on agent memory?

A: Yes, configurable per agent. Default is 512 MB RAM, 1 CPU core. Enterprise can request more.

---

## Next Steps

1. ✅ Read [monorepo conventions](docs/architecture/02-monorepo-conventions.md)
2. ✅ Set up local dev (`just install && just dev`)
3. ✅ Explore `crates/protocol` types
4. Build your first agent (T1+)
5. Write a custom skill (T2+)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/qianliang-lq/openstaff/issues)
- **Discussions**: [GitHub Discussions](https://github.com/qianliang-lq/openstaff/discussions)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**License**: Apache-2.0  
**Copyright**: 2026 OpenStaff Contributors
