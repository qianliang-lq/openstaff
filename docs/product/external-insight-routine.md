# 外部洞察例行任务

> **状态**: Stub / 概念验证  
> **目标**: 每日自动执行外部行业洞察搜索，生成结构化报告并推送到聊天界面

---

## 概述

外部洞察例行任务（External Insight Routine）是 OpenStaff 数字员工系统的一项定时任务，旨在：

1. 每日自动执行公开互联网搜索
2. 收集竞对动态、组织提效、前沿模型、技术底座四大类信息
3. 生成结构化报告（Markdown + JSON）
4. 通过聊天界面以报告卡片形式推送给用户

---

## 任务配置

### 调度规则

```rust
use openstaff_protocol::Routine;

let routine = Routine {
    name: "external-insight-daily".to_string(),
    schedule: "0 9 * * 1-5".to_string(), // 工作日每天 9:00 AM
    action: RoutineAction::InvokeSkill {
        skill: "external-insight-public-search".to_string(),
        tool: "run_daily_search".to_string(),
    },
};
```

### 执行流程（含 Reconcile 门禁）

1. **触发**: Scheduler 服务在每个工作日上午 9:00 触发 Runtime
2. **执行**: Runtime 加载 `skills/external-insight-public-search` skill
3. **搜索**: Skill 通过 Gateway bypass 工具执行外部公开搜索（L1/L2/L3 覆盖 + 学术/智库源）
4. **生成**:
   - `artifacts/external-insight/YYYY-MM-DD-public.md` - Markdown 报告
   - `artifacts/external-insight/YYYY-MM-DD-public-facts.json` - 结构化事实
5. **Reconcile 门禁**: Runtime 调用 reconcile 工具验证 facts（去重、质量检查、URL 可达性）
6. **条件推送**:
   - 若 `reconcile_status: "PASS"` → 通过 WebSocket 向 Desktop 客户端推送报告卡片事件
   - 若 `reconcile_status: "FAILED"` → 记录错误日志，不推送（或推送阻塞状态卡片）

---

## 架构边界（强制执行）

> **⚠️ 架构锁定规则** — 以下边界由 monorepo 约定强制执行，不得绕过

### 1. 执行环境：Runtime

- **所有 Skill 执行在 `runtime` 服务中运行**
- Runtime 是唯一可以加载和执行 skill 逻辑的环境
- 公开 Web 出口**仅**通过 Gateway 的 bypass 工具路径（fully audited）
- **禁止**任何服务直接访问外网以逃避审计

### 2. Scheduler 职责：触发器，非执行器

- Scheduler **只**负责触发（fire）routine
- **禁止** Scheduler 自己执行搜索或调用外部 API
- Scheduler → Runtime → Skill 的调用链不可跳过

### 3. Reconcile 门禁（CRITICAL）

**规则**：除非 facts 存在且 reconcile PASS，否则**禁止**向 Desktop 发送报告卡片事件。

#### Reconcile 流程

1. Skill 生成 `YYYY-MM-DD-public-facts.json`
2. Runtime 调用 reconcile 工具验证 facts（去重、质量检查、URL 可达性）
3. 仅当 `reconcile_status: "PASS"` 时，Runtime 才发送 `EventEnvelope::ExternalInsightReport`
4. Desktop 仅渲染已通过 reconcile 的报告

#### UI Stub 处理

当前 MVP 的 mock 数据处理方式：

- **方式 A**（推荐）：Mock facts 标记 `reconcile_status: "PASS"`，正常显示卡片
- **方式 B**：当 `reconcile_status: "FAILED"` 时，显示禁用/阻塞状态卡片：
  ```
  ┌─────────────────────────────────────┐
  │ 🔍 外部洞察日报 · 2026-09-27   [⚠️] │
  ├─────────────────────────────────────┤
  │ ⚠️ 报告验证失败                     │
  │ 本日报告未通过质量检查门禁。         │
  │ [ 查看详情 ]                        │
  └─────────────────────────────────────┘
  ```

**文档要求**：此规则必须在 `skills/external-insight-public-search/SKILL.md` 中明确说明。

### 4. 协议边界

- **禁止**修改 `crates/protocol` 中的 `EventEnvelope` 或 `HealthResponse`（当前 MVP）
- 未来扩展事件类型时，需走正式 RFC 流程
- **禁止**绕过 protocol 定义自创事件格式

---

## 服务边界（详细职责）

### Scheduler 服务

**做**：

- 维护 cron 表达式到 routine 的映射
- 在指定时间触发 Runtime 执行 skill
- 记录触发历史和状态
- 重试失败任务（可配置）

**不做**：

- ❌ 不执行具体搜索逻辑（由 Runtime 中的 skill 负责）
- ❌ 不生成报告内容（由 skill 负责）
- ❌ 不调用外部 API 或 Gateway（由 skill 负责）
- ❌ 不直接操作 UI（通过 EventEnvelope 通知）

### Runtime 服务

**做**：

- 加载和执行 `skills/external-insight-public-search` skill
- 提供 skill 运行的沙箱环境
- 通过 Gateway bypass 工具路径访问公开互联网（fully audited）
- 执行 reconcile 门禁检查
- 仅在 reconcile PASS 时推送事件到 Control Plane

**不做**：

- ❌ 不直接访问外网（必须通过 Gateway）
- ❌ 不绕过 reconcile 门禁发送报告

### Skill 包（`skills/external-insight-public-search`）

**做**：

- 实现搜索逻辑（L1/L2/L3 覆盖 + 学术/智库源）
- 生成结构化输出（符合 schema）
- 去重和质量过滤
- 调用 Gateway bypass 工具获取外部数据
- 生成 facts JSON 供 reconcile 验证

**不做**：

- ❌ 不关心调度时间（由 Scheduler 控制）
- ❌ 不直接推送到客户端（返回结果给 Runtime）
- ❌ 不绕过 Gateway 直接访问外网

### Desktop 客户端

**做**：

- 监听 `EventEnvelope::ExternalInsightReport` 事件
- 仅渲染 `reconcile_status: "PASS"` 的报告
- 支持展开/折叠查看详情
- 提供跳转原文链接
- 显示 reconcile FAILED 的阻塞状态（可选）

**不做**：

- ❌ 不执行搜索（Backend 完成）
- ❌ 不生成报告内容（Skill 完成）
- ❌ 不渲染未经 reconcile 的报告

---

## EventEnvelope 扩展（未来）

当前 Stub 阶段使用 mock 数据。正式实现需要在 `crates/protocol` 添加事件类型：

```rust
// crates/protocol/src/events.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventEnvelope {
    // ... 现有事件类型

    /// 外部洞察报告推送
    ExternalInsightReport {
        date: String,              // YYYY-MM-DD
        report_path: String,       // artifacts/external-insight/...
        facts_path: String,        // artifacts/external-insight/...-facts.json
        summary: Vec<String>,      // 3-5 条摘要要点
    },
}
```

---

## 报告卡片 UI 规范

### 样式主题

- **主色**: 科技红 `#FF4141` (FIND 科技红)
- **布局**: 卡片式，支持折叠/展开
- **字体**: 中文优先，清晰易读

### 内容结构

```
┌─────────────────────────────────────────────────┐
│ 🔍 外部洞察日报 · 2026-09-27              [展开] │
├─────────────────────────────────────────────────┤
│ 摘要要点：                                      │
│ • Factory CLI v0.228.0 发布 /migrate 工作流    │
│ • GitHub Copilot 企业设置校验器上线             │
│ • SWE-Prometheus 仓库治理评测基准发布           │
│                                                 │
│ [ 查看完整报告 ]                                │
└─────────────────────────────────────────────────┘
```

展开后显示四个栏目（竞对、组织提效、前沿模型、技术底座），每条包含：

- 标题
- 中文摘要
- 标签
- 原文链接
- PDF 链接（如有）

---

## 实现路线图

### T1: Stub 阶段（当前 MVP）

- [x] Skill 文档和 schema
- [x] Routine 概念文档
- [x] 前端报告卡片组件（mock 数据）
- [ ] 集成到 ChatStage
- [ ] Vitest 单元测试

### T2: Backend 集成

- [ ] Gateway 服务支持真实 Web 搜索
- [ ] Skill 实现搜索逻辑
- [ ] Scheduler 服务实现 cron 调度
- [ ] EventEnvelope 添加报告事件类型
- [ ] 集成测试（端到端）

### T3: 高级功能

- [ ] 用户自定义搜索关键词
- [ ] 历史报告查询和对比
- [ ] 导出为 PDF/邮件
- [ ] 与内网搜索结果合并（需授权）
- [ ] 多语言支持（英文报告）

---

## 测试策略

### 单元测试

- **Skill**: 测试搜索结果解析、schema 验证、去重逻辑
- **Frontend**: 测试报告卡片渲染、展开/折叠、链接跳转

### 集成测试

- **Scheduler → Skill**: 验证定时触发和任务执行
- **Skill → Desktop**: 验证事件推送和 UI 更新

### 端到端测试

- 模拟完整流程：Scheduler 触发 → Skill 执行 → 生成报告 → Desktop 显示
- 验证错误处理：网络失败、解析错误、空结果等

---

## 依赖服务

| 服务          | 用途                | 当前状态 |
| ------------- | ------------------- | -------- |
| Gateway       | LLM 调用、Web 搜索  | Stub     |
| Scheduler     | Cron 调度           | Stub     |
| Runtime       | Skill 执行环境      | Stub     |
| Control Plane | 事件路由、WebSocket | Stub     |
| Desktop       | UI 渲染             | 部分实现 |

---

## 参考资料

- **Skill 定义**: `skills/external-insight-public-search/SKILL.md`
- **Schema 规范**: `skills/external-insight-public-search/schema/public-facts.schema.json`
- **架构约定**: `docs/architecture/02-monorepo-conventions.md`
- **Protocol 参考**: `crates/protocol/`

---

**最后更新**: 2026-09-28  
**维护者**: OpenStaff Team
