# OpenStaff · Demo / Insights API BFF（正刀切面）

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-10-02（Asia/Shanghai） |
| 裁 | CS：**先短后正**；本文只锁 **正** |
| 前置短 | 连云 Base 下 Demo **禁用/明示降级**（仅本机四服）；禁 insights 404 空转；口令 HOLD `3e73318` |
| 动机 | 公网 nginx **只反代 API:3000**；`fire` 在 scheduler:3002、`insights` 在 runtime:3003 —— 桌面改路径验不出 |

---

## 1. 洞（为何桌面无解）

```text
Desktop ──PUBLIC_API_BASE──► nginx /openstaff/ ──► api:3000
                                                    │
                         ✗ 公网无 :3002/:3003        │ 正刀：API 内网代发
                                                    ▼
                              scheduler:3002  POST …/jobs/fire（或既有 fire 契约）
                              runtime:3003    GET  …/insights/latest（或既有路径）
```

- 公网 `GET /v1/insights/latest` → **404**（API 无此路由 / 未反代 runtime）。
- 公网 `POST /demo/fire` → 鉴权后仍 **不等于** 已接到 scheduler（除非 API 真代发）。
- **禁止**桌面直连 `*:3002` / `*:3003`（本机四服也统一经 API Base，避免两套客户端）。

---

## 2. 目标契约（桌面只认这两条）

均挂在 **`PUBLIC_API_BASE`**（连云或本机 `:3000`），**禁**直连 scheduler/runtime 端口。

### 2.1 点火（写 · 槽 A）

```http
POST /demo/fire
Authorization: Bearer <槽A>
Content-Type: application/json

{ }   // 体可空或带 routine/skill 覆盖；与现桌面 Demo 一致即可
```

| 期望 | 说明 |
| --- | --- |
| 202 / 200 | API 已把 fire **转发**到内网 scheduler（或 API 进程内等价触发）；应答可含 `job_id` / `accepted` |
| 401 | 缺/错槽 A |
| 503 / 502 | scheduler 不可达 — UI 明示，**禁**当成功去轮询 insights |

本机四服：API 未开 Key 时可无槽 A（与 23 一致）；连云必须槽 A。

### 2.2 最新洞察（读）

```http
GET /v1/insights/latest
```

| 期望 | 说明 |
| --- | --- |
| 200 + body | API **代理** runtime 最新洞察（形状与现本机 runtime 一致，桌面解析不变） |
| 204 / 404（业务空） | 尚无产出 — UI 空态，**禁**当「洞」死轮询；短刀连云禁用后本条可暂不碰 |
| 502 | runtime 不可达 |

读路径：与现 ECS 一致，**可不强制**槽 A；若后续统一读也要 Key，另开 ADR，本刀不扩。

---

## 3. API 内实现边界

| 做 | 不做 |
| --- | --- |
| API 用内网 URL（env）调 scheduler / runtime | nginx 增反代 `:3002/:3003` 到公网 |
| 写 fire：校验槽 A 后再转发 | 桌面拼 scheduler/runtime host |
| 读 insights：反向代理或薄封装 runtime 响应 | 改 protocol 大枚举；改 `/health` 四服形状 |
| 超时/错误映射成明确 HTTP + 文案友好 body | 在 API 里重跑 Skill / 重做 egress |

建议 env（名可微调，须进部署说明）：

- `OPENSTAFF_SCHEDULER_URL`（例 `http://127.0.0.1:3002`）
- `OPENSTAFF_RUNTIME_URL`（例 `http://127.0.0.1:3003`）
- 既有 `OPENSTAFF_API_KEY`（槽 A 校验）

内网转发可用既有 service token（若 runtime/scheduler 已要）；**公网只见 API**。

转发语义对齐 `08-demo-mvp-cut.md`：scheduler **只产 fire**；执行仍在 runtime。

---

## 4. nginx / ECS

- **继续只反代 API**（`:3000` → `/openstaff/`）。
- **不**把 3002/3003 暴露公网。
- 部署：API 二进制含 BFF 路由后滚动 `openstaff-api`；scheduler/runtime 契约若已存在则只配 URL，不改安全组。

---

## 5. 桌面（正刀落地后）

1. 连云 Base：**重新启用** Demo（撤短刀禁用），fire / poll 只打 Base 上两路径 + 写带槽 A。  
2. 本机四服：行为与现一致（经 `:3000`，不直连 3002/3003）。  
3. ChatStage / 槽 B：**不动**（已 `c235d80`）。  
4. 草图 26：正刀 **不动**；短态由设计另补，正上线可收回「仅本机」提示。

---

## 6. 验收（测 · 正落地后才升连云 Demo 口令）

| # | 步骤 | 过线 |
| --- | --- | --- |
| 1 | Base=云 + 槽 A → `POST …/demo/fire` | 非 401/404；scheduler 侧可见接受（或 API 返回 accepted） |
| 2 | 同 Base → `GET …/v1/insights/latest` | 非公网 404；有数据 200 / 无数据空态（非挂死） |
| 3 | 抓包/代码 | **无** 对 `:3002`/`:3003` 的桌面请求 |
| 4 | Base=本机四服 | Demo 仍能 fire + 出 insights（回归） |
| 5 | 口令 | 正过线后由 CS/测 **显式升**「连云 Demo 端到端」；短阶段继续 HOLD `3e73318` |

---

## 7. 编码顺序

1. **短**（进行中）：桌面连云禁用 Demo + 停 insights 空转；出 tip 叠测。  
2. **正 · API**：加 BFF 两路由 + env；本机 compose 冒烟后再 ECS。  
3. **正 · 桌面**：撤连云禁用，走 Base；回归 ChatStage。  
4. 测升口令；草图收短态（可选）。

完。
