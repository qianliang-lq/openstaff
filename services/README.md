# OpenStaff 服务 / Services

本目录包含 OpenStaff 云端服务的占位与规划。

This directory contains placeholders and plans for OpenStaff cloud services.

## 服务概览 / Services Overview

### api

**控制面 API / Control Plane API**

- 会话管理与路由 / Session management & routing
- Agent CRUD 操作 / Agent CRUD operations
- 审批策略管理 / Approval policy management
- 连接器配置（密钥保险库）/ Connector configuration (secret vault)

**状态 / Status**: 占位 / Placeholder

---

### scheduler

**例程调度器 / Routine Scheduler**

- Cron 例程管理 / Cron routine management
- 事件驱动触发器 / Event-driven triggers
- 例程消息投递 / Routine message delivery

**状态 / Status**: 占位 / Placeholder

---

### gateway

**LLM 网关 / LLM Gateway**

- 多模型路由 / Multi-model routing
- 限流与配额 / Rate limiting & quota
- 密钥管理（客户 Key / 托管 Key）/ Key management (customer/hosted keys)
- 审计关联 / Audit correlation

**状态 / Status**: 占位 / Placeholder

---

## 后续实现 / Roadmap

服务实现将在 T1-T6 里程碑中逐步展开：

Services will be implemented progressively in T1-T6 milestones:

- **T1**: 最小 API + 回声 Runtime / Minimal API + echo Runtime
- **T2**: 真实沙箱集成 / Real sandbox integration
- **T3**: 审批卡片端到端 / Approval cards end-to-end
- **T4**: 多 Agent + SendToAgent / Multi-agent + SendToAgent
- **T5**: 例程 Cron 触发 / Routine Cron triggers

---

**License**: Apache-2.0
