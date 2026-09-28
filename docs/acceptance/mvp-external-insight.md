# External Insight MVP 验收指南

> **状态**: Demo-Ready MVP (08-demo-mvp-cut aligned)  
> **日期**: 2026-09-28  
> **范围**: 外搜洞察端到端离线演示能力

---

## 概述

本 MVP 实现了 External Insight（外搜洞察）的完整离线演示流程，严格遵循 `08-demo-mvp-cut.md` 架构：

- **Gateway**: 公网旁路唯一出口 `POST /v1/egress/fetch`，带 SSRF 防护和全量审计
- **Runtime**: Jobs fire 端点 `POST /v1/jobs/fire`，异步执行 Skill，reconcile 门禁
- **Scheduler**: Fire-only 触发器（调用 Runtime jobs/fire）
- **Desktop**: 一键「立即跑」按钮 → Scheduler → Runtime fire 语义

**关键特性**:
- ✅ 离线模式（Golden Fixture）默认启用
- ✅ 完整审计日志（Gateway egress）带 request_id/latency_ms/deny_reason
- ✅ SSRF 防护（RFC1918 + 169.254.169.254 blocked）
- ✅ Reconcile 门禁（PASS 才通知，FAILED 静默）
- ✅ 不修改 `/health` 或 `crates/protocol` EventEnvelope 枚举
- ✅ Runtime 禁止直接 reqwest 公网，一律走 Gateway

---

## 服务端点

| 服务 | 端口 | 健康检查 | 核心端点 |
| --- | --- | --- | --- |
| Gateway | 3001 | `GET /health` | `POST /v1/egress/fetch` (需 Bearer token) |
| Scheduler | 3002 | `GET /health` | `POST /demo/fire` |
| Runtime | 3003 | `GET /health` | `POST /v1/jobs/fire` (返回 202 Accepted) |
| Desktop | 5173 | (Vite dev) | UI 按钮「跑一次外搜洞察（演示）」 |

---

## 快速启动

### 1. 启动后端服务

```bash
cd /workspace

# 启动 Gateway (端口 3001)
cargo run -p openstaff-gateway &

# 启动 Scheduler (端口 3002)
cargo run -p openstaff-scheduler &

# 启动 Runtime (端口 3003)
cargo run -p openstaff-runtime &
```

**环境变量（可选）**:
- `OPENSTAFF_GATEWAY_EGRESS_MODE=offline` (默认): Gateway 返回 fixture
- `OPENSTAFF_INSIGHT_DEMO=1` (默认): Runtime 使用 golden fixture
- `RUNTIME_URL=http://localhost:3003`: Scheduler 调用的 Runtime 地址
- `RUNTIME_SERVICE_TOKEN=dev-runtime-token` (默认): Gateway 验证 Runtime 的 Bearer token

### 2. 启动 Desktop

```bash
cd /workspace/apps/desktop
pnpm install
pnpm dev
```

访问 http://localhost:5173

### 3. 运行演示

1. 在 Desktop 界面顶部栏，点击按钮：**「跑一次外搜洞察（演示）」**
2. 按钮显示「运行中...」，后台调用 Runtime demo 端点
3. 若 reconcile PASS：
   - Chat 区域出现「研」头像的报告卡片
   - 卡片展示 3 条摘要 + 完整 facts（分栏目）
   - 显示徽章「reconcile PASS」和「已审计」
4. 若 reconcile FAILED：卡片不渲染（用户无感知）

---

## 验收检查项

### TC-Gateway: 公网旁路审计 + SSRF 防护

```bash
# 调用 egress/fetch（需 Bearer token）
curl -X POST http://localhost:3001/v1/egress/fetch \
  -H "Authorization: Bearer dev-runtime-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "method": "GET",
    "max_bytes": 524288,
    "timeout_ms": 15000,
    "purpose": "external_insight",
    "routine_id": "test-001",
    "skill_id": "external-insight-public-search",
    "agent_instance_id": "agent-demo-001"
  }'

# 测试 SSRF 防护（应返回 403）
curl -X POST http://localhost:3001/v1/egress/fetch \
  -H "Authorization: Bearer dev-runtime-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://169.254.169.254/latest/meta-data",
    "method": "GET",
    "max_bytes": 524288,
    "timeout_ms": 15000,
    "purpose": "test",
    "routine_id": null,
    "skill_id": "test",
    "agent_instance_id": "test"
  }'

# 检查审计日志
cat artifacts/gateway-audit/egress-audit.jsonl
```

**预期**:
- 返回 200 + fixture HTML（offline 模式），包含 request_id, status, final_url, content_type, body_text, truncated, bytes
- SSRF 测试返回 403 Forbidden，deny_reason 记入审计
- 审计日志包含：ts, request_id, agent_instance_id, routine_id, skill_id, purpose, method, url, final_url, status, bytes, latency_ms, deny_reason

### TC-Runtime: Jobs fire + 异步执行

```bash
# 调用 Runtime jobs/fire 端点
curl -X POST http://localhost:3003/v1/jobs/fire \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_test_001",
    "routine_id": "external-insight-daily",
    "skill_id": "external-insight-public-search",
    "trigger": "manual",
    "scheduled_for": "2026-09-28T12:00:00Z",
    "payload": {}
  }'
```

**预期**:
- 返回 202 Accepted: `{"job_id": "job_test_001", "accepted": true}`
- 后台异步执行，写入 `artifacts/external-insight/2026-09-28-public-facts.json`（Golden Fixture 内容）
- Runtime 日志显示「Reconcile status: PASS」
- facts 包含 5 条（竞对/组织提效/前沿模型/技术底座）

### TC-Scheduler: Fire-only（调用 Runtime jobs/fire）

```bash
# 调用 Scheduler fire 端点
curl -X POST http://localhost:3002/demo/fire \
  -H "Content-Type: application/json" \
  -d '{
    "routine_id": "external-insight-daily",
    "skill_id": "external-insight-public-search",
    "trigger": "manual"
  }'
```

**预期**:
- 返回 `{"fired": true, "job_id": "job_...", "routine_id": "external-insight-daily", "message": "Job ... fired successfully"}`
- Scheduler 生成 job_id，调用 Runtime `/v1/jobs/fire`
- Runtime 返回 202 Accepted
- Runtime 异步执行并写入 artifacts（同 TC-Runtime）

### TC-Desktop: 一键演示

1. 启动 Desktop (`pnpm dev`)
2. 点击「跑一次外搜洞察（演示）」
3. 观察 Chat 区域出现报告卡片
4. 展开「查看全部 5 条」，确认四栏目分类正确
5. 点击「打开 facts 文件」（日志输出 artifacts 路径）

**预期**:
- 卡片渲染符合 sketch 17 规范（见 `ExternalInsightReportCard.tsx`）
- 摘要 3 条 + domain chip
- 详情区分栏目（竞对/组织提效/前沿模型/技术底座）
- PDF 链接显示 📄 图标
- reconcile FAILED 时卡片不渲染

### TC-Tests: 现有测试保持绿色

```bash
# Backend tests
cargo test -p openstaff-gateway
cargo test -p openstaff-runtime
cargo test -p openstaff-scheduler

# Desktop tests
cd apps/desktop && pnpm test
```

**预期**:
- TC-028: Facts Schema Contract ✅
- TC-029: Reconcile Gate FAILED blocks report card ✅
- TC-029-pass: Reconcile Gate PASS allows report card ✅
- Desktop: 26 tests passed ✅

---

## Artifacts 路径

| 服务 | 路径 | 说明 |
| --- | --- | --- |
| Gateway | `artifacts/gateway-audit/egress-audit.jsonl` | 公网旁路审计日志（JSONL 格式） |
| Runtime | `artifacts/external-insight/<date>-public-facts.json` | 离线演示生成的 facts（从 Golden Fixture 复制） |

---

## 故障排查

### 问题 1: Desktop 报错「Failed to run demo」

**原因**: Runtime 未启动或端口不对  
**解决**:
```bash
# 检查 Runtime 是否在 3003 端口
curl http://localhost:3003/health

# 若未启动，执行
cargo run -p openstaff-runtime
```

### 问题 2: 卡片不渲染

**原因**: Reconcile FAILED（预期行为）  
**调试**:
```bash
# 查看 Runtime 日志
grep "Reconcile status" /tmp/runtime.log

# 检查 facts 文件是否生成
ls -la artifacts/external-insight/
```

### 问题 3: Gateway 审计日志为空

**原因**: 权限问题或目录未创建  
**解决**:
```bash
# 手动创建审计目录
mkdir -p artifacts/gateway-audit

# 重启 Gateway
cargo run -p openstaff-gateway
```

---

## 下一步扩展（非 MVP）

- [ ] Live 模式：Gateway 真实公网搜索（需 API Keys）
- [ ] Scheduler Cron：定时触发（非 demo fire）
- [ ] Protocol 正式事件：`EventEnvelope::ExternalInsightReport`
- [ ] Desktop 完整交互：点击 facts 打开详情、历史查询
- [ ] VPN/RSS 内搜整合（第二截）

---

## 联系

问题反馈：GitHub Issues  
文档更新：`docs/acceptance/mvp-external-insight.md`

---

**最后更新**: 2026-09-28  
**验收状态**: ✅ Demo-Ready MVP on main
