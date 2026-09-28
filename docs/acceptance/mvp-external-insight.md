# External Insight MVP 验收指南

> **状态**: Demo-Ready MVP  
> **日期**: 2026-09-28  
> **范围**: 外搜洞察端到端离线演示能力

---

## 概述

本 MVP 实现了 External Insight（外搜洞察）的完整离线演示流程：

- **Gateway**: 公网旁路工具（web_fetch/web_search），带全量审计
- **Runtime**: Skill 执行管道，reconcile 门禁，artifacts 写入
- **Scheduler**: Fire-only 触发器（调用 Runtime）
- **Desktop**: 一键演示按钮，渲染报告卡片（sketch 17 规范）

**关键特性**:
- ✅ 离线模式（Golden Fixture）默认启用
- ✅ 完整审计日志（Gateway egress）
- ✅ Reconcile 门禁（PASS 才发卡）
- ✅ 不修改 `/health` 或 `crates/protocol`

---

## 服务端点

| 服务 | 端口 | 健康检查 | Demo 端点 |
| --- | --- | --- | --- |
| Gateway | 3001 | `GET /health` | `POST /bypass/web_fetch`<br>`POST /bypass/web_search` |
| Scheduler | 3002 | `GET /health` | `POST /demo/fire` |
| Runtime | 3003 | `GET /health` | `POST /demo/external-insight/run` |
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

### TC-Gateway: 公网旁路审计

```bash
# 调用 web_fetch
curl -X POST http://localhost:3001/bypass/web_fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "role": "demo", "routine_id": "test-001"}'

# 检查审计日志
cat artifacts/gateway-audit/egress-audit.jsonl
```

**预期**:
- 返回 200 + fixture HTML（offline 模式）
- 审计日志包含：timestamp, role, routine_id, url, status, bytes, operation

### TC-Runtime: Demo 端点 + Reconcile

```bash
# 直接调用 Runtime demo 端点
curl -X POST http://localhost:3003/demo/external-insight/run \
  -H "Content-Type: application/json" \
  -d '{"use_fixture": true}'
```

**预期**:
- 返回 JSON: `{"reconcile_status": "PASS", "facts": [...], "summary": [...], "artifacts_path": "...", "timestamp": "2026-09-28"}`
- 写入 `artifacts/external-insight/2026-09-28-public-facts.json`（Golden Fixture 内容）
- summary 最多 3 条
- facts 包含 5 条（竞对/组织提效/前沿模型/技术底座）

### TC-Scheduler: Fire-only

```bash
# 调用 Scheduler fire 端点
curl -X POST http://localhost:3002/demo/fire \
  -H "Content-Type: application/json" \
  -d '{"skill": "external-insight-public-search"}'
```

**预期**:
- 返回 `{"fired": true, "skill": "...", "runtime_url": "...", "message": "..."}`
- Scheduler 转发请求到 Runtime
- Runtime 写入 artifacts（同 TC-Runtime）

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
