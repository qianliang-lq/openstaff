# OpenStaff · 切 Tab 续聊 + Demo 真报告卡（字段钉）

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-10-05（Asia/Shanghai） |
| 裁 | CS：消息真源在云；Demo 禁虚拟「已生成 N 条」 |
| 对齐 | `20-sqlite-cloud-data.md`、`02` §8、草图 17、公网 `GET /v1/insights/latest` 活体（2026-10-05） |
| 口令 | 主验收仍 HOLD `3e73318` |

---

## 1. 切 Chat ↔ Computer 丢会话

真源：**云 SQLite** `messages`（按 `agent_id`），不是 ChatStage 内存，也不是 localStorage。

| 时机 | 动作 |
| --- | --- |
| 进入 Chat / 从 Computer 切回 / 换岗 | `GET {BASE}/v1/agents/:id/messages`，用返回气泡覆盖内存 |
| 发送成功 | 推荐 **API 在 `POST /v1/chat` 成功路径写库**（避免桌面双写丢）；桌面再拉或把回包并进列表 |
| 无 API | 明示「控制面未就绪」，**禁止**默默当已保存 |

气泡字段（与 §20 表一致）：`id`、`role`（user/assistant）、`body`、`ts`。主会话 `thread_id` 空。

写仍槽 A（连云）；GET 与现 ECS 读路径一致。

验收：Chat 有气泡 → 切 Computer → 回 Chat → **同一岗气泡还在**（杀进程再开也在）。空列表才是真的空。

---

## 2. Demo 报告卡（禁虚拟计数）

截图「✅ 运行成功！已生成 5 条外部洞察」**不是**报告。公网当时 `facts` 只有 2 条——计数是假的。

流程：

1. `POST {BASE}/demo/fire` + 槽 A → `accepted` 只表示已点火，**不是**成功报告。
2. 再 `GET {BASE}/v1/insights/latest`（BFF，禁直连 :3003）。
3. `reconcile_status != PASS` 或 `facts` 空 → 失败/空态，**禁止**绿勾「已生成 N 条」。
4. PASS：Chat 内报告卡，条数 = `facts.length`（展示 ≤3，多的进详情），禁止写死 5。

卡上只用这些字段（活体形状，2026-10-05）：

| 字段 | 画什么 |
| --- | --- |
| `timestamp` | 卡头日期 |
| `reconcile_status` | 仅 PASS 当成功 |
| `facts[].bucket` | 轴/标签 |
| `facts[].title` | 条目标题 |
| `facts[].summary_zh` | 一条摘要 |
| `facts[].url` | 可点链接（真源） |
| `facts[].tags` | 小标签，可省 |

`summary[]` 当前是抓页残片（含 HTML），**不要**当正文。正文以 `facts[].summary_zh` + `url` 为准。

内容若仍是页面壳（如 title=`Filters (0 selected)`），那是 runtime 抓取质量，另刀；本刀只绑真 JSON，不造假条。

---

## 3. 不做

- 不改 nginx、不直连 :3002/:3003
- 不把 Key 写入消息库
- 不升主口令 `3e73318`

完。
