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

### 执行流程

1. **触发**: Scheduler 服务在每个工作日上午 9:00 触发
2. **执行**: Runtime 加载 `skills/external-insight-public-search` skill
3. **搜索**: 执行外部公开搜索（L1/L2/L3 覆盖 + 学术/智库源）
4. **生成**:
   - `artifacts/external-insight/YYYY-MM-DD-public.md` - Markdown 报告
   - `artifacts/external-insight/YYYY-MM-DD-public-facts.json` - 结构化事实
5. **推送**: 通过 WebSocket 向 Desktop 客户端推送报告卡片事件

---

## 服务边界

### Scheduler 服务职责

- 维护 cron 表达式到任务的映射
- 在指定时间触发任务
- 记录执行历史和状态
- 重试失败任务（可配置）

**不做**：

- 不执行具体搜索逻辑（由 skill 负责）
- 不生成报告内容（由 skill 负责）
- 不直接操作 UI（通过 EventEnvelope 通知）

### Skill 职责

实现 `skills/external-insight-public-search/SKILL.md` 中定义的搜索和生成逻辑：

- L1/L2/L3 三层信息源覆盖
- 学术论文（Google Scholar、arXiv）
- 中文智库报告
- 结构化输出（符合 schema）
- 去重和质量过滤

**不做**：

- 不关心调度时间（由 Scheduler 控制）
- 不直接推送到客户端（返回结果即可）

### Desktop 客户端职责

接收报告卡片事件并渲染：

- 监听 `EventEnvelope::ExternalInsightReport` 事件
- 渲染 `ExternalInsightReportCard` 组件
- 支持展开/折叠查看详情
- 提供跳转原文链接

**不做**：

- 不执行搜索（Backend 完成）
- 不生成报告内容（Skill 完成）

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
