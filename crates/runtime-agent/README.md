# openstaff-runtime-agent

OpenStaff Agent 运行时库 / Agent runtime library for OpenStaff.

## 概述 / Overview

Agent 编排核心逻辑：
- 工具调用循环
- 子代理管理（browser/desktop）
- 沙箱生命周期协调
- 审批策略集成

Agent orchestration core logic:
- Tool invocation loop
- Sub-agent management (browser/desktop)
- Sandbox lifecycle coordination
- Approval policy integration

## 状态 / Status

**MVP 占位 / MVP Placeholder** - 当前仅包含占位结构。

Currently contains placeholder structure only.

## 使用 / Usage

```rust
use openstaff_runtime_agent::Agent;

let agent = Agent::new("product-manager".to_string());
println!("Agent created: {}", agent.name());
```

## 后续计划 / Roadmap

- 完整工具调用循环实现
- 审批闸门集成
- SendToAgent / SendToUser 实现
- 沙箱 API 集成（K8s / Docker Compose）
- 记忆与例程框架

---

**License**: Apache-2.0
