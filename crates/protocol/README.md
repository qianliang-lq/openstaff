# openstaff-protocol

OpenStaff 协议定义与类型库 / Protocol definitions and types for OpenStaff.

## 概述 / Overview

本 crate 定义了 OpenStaff 各组件间的消息协议、事件信封、工具调用、审批等核心类型。

This crate defines the core types for inter-component communication in OpenStaff: message protocols, event envelopes, tool invocations, approvals, etc.

## 状态 / Status

**MVP 占位 / MVP Placeholder** - 当前仅包含最小示例类型。

Currently contains minimal example types only.

## 使用 / Usage

```rust
use openstaff_protocol::Message;

let msg = Message {
    content: "Hello, OpenStaff!".to_string(),
};
```

## 后续计划 / Roadmap

- 完整事件信封定义（EventEnvelope）
- 工具调用与结果类型（ToolCall, ToolResult）
- 审批请求与决策类型（ApprovalRequest, ApprovalDecision）
- SendToAgent / SendToUser 消息类型

---

**License**: Apache-2.0
