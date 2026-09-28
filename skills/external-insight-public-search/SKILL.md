---
name: external-insight-public-search
description: >-
  用于数字员工系统的外部行业洞察搜索能力——竞对动态、组织提效、前沿模型、技术底座；
  涵盖TOP互联网企业、潮流初创、学术研究与智库报告；支持PDF链接；为OpenStaff提供每日行业情报。
---

# 外部洞察 · 公开搜索

用于数字员工系统的每日外部行业洞察公开搜索。写完必须落盘 facts，供后续对账和分析使用。

---

## 架构边界（CRITICAL）

### 执行环境

- **本 skill 在 `runtime` 服务中执行**，不在 scheduler 或其他服务中运行
- 公开 Web 出口**必须**通过 Gateway 的 bypass 工具路径（fully audited）
- **禁止**直接访问外网以逃避审计

### Reconcile 门禁（强制执行）

**规则**：除非 facts 存在且 reconcile PASS，否则**禁止**向 Desktop 发送报告卡片事件。

#### 流程

1. Skill 生成 `YYYY-MM-DD-public-facts.json`
2. Runtime 调用 reconcile 工具验证（去重、质量检查、URL 可达性）
3. 仅当 `reconcile_status: "PASS"` 时发送 `EventEnvelope::ExternalInsightReport`
4. Desktop 仅渲染已通过 reconcile 的报告

#### Reconcile 检查项

- ✅ URL 可达性（HTTP 200-299）
- ✅ 去重检查（与历史 covered-log 比对）
- ✅ Schema 合规性（符合 `public-facts.schema.json`）
- ✅ 内容质量（summary_zh 非空、tags 非空、bucket 有效）
- ✅ 栏目限额（每栏目硬顶 5 条）

#### 失败处理

- 若 reconcile FAILED → 记录错误日志，**不推送**报告卡片
- 可选：推送阻塞状态卡片，提示用户「报告验证失败」

---

## 输出路径

- `artifacts/external-insight/YYYY-MM-DD-public.md`
- `artifacts/external-insight/YYYY-MM-DD-public-facts.json`

`bucket`：`竞对` | `组织提效` | `前沿模型` | `技术底座`。
另：`tags`（多标签）、可选 `pdf_url`。

## 竞对按能力轴（第 1 节）

**双轨**：①明确大厂/成熟竞对；②**潮流初创**（本周刷屏、种子轮出圈、嵌入 Agent 工作流的新品）。大厂常被小公司从旁路颠覆，等长大再追成本极高——有实质增量就要写进第 1 节（或第 3/4 若更贴模型/底座）。

1. IM 原生数字员工：飞书 Agent / 豆包工作伙伴、ChatGPT Work、Claude Cowork/one Claude
2. 软件工厂：Factory、Devin×云 SCA、Coder Agent Relay、Antigravity 组织双模
3. 岗位化多专家编排：多 Agent 交付流水线
4. Harness 扩展：Claude Code Hooks、OpenClaw、Hermes、DSH/DeepSeek Harness
5. **Agent 决策/门禁层（潮流必盯）**：TypeSafe **Jev**（System One：结构化 Choice/Score/Boolean，非聊天生成；路由/工具审批/置信度门禁）；同类「嵌入 Agent 环的快决策模型」初创
6. 治理人机环：额度审批、managed permissions、HITL/合入门禁
7. 数字员工系统：OpenStaff 与同类开源/商业数字员工平台

## 另三块

- **组织提效**：研发效能、协作工具、工作流自动化、代码审查、CI/CD、团队管理等
- **前沿模型**：含 Jev 类非生成式决策模型发版、新 LLM 发布、模型评测、训练方法等
- **技术底座**：每次必查 Hooks/OpenClaw/Hermes/DSH/**Jev·TypeSafe**，包含 MCP、Agent 框架、工具编排等

## 三层覆盖（群雄+初创）

**L1 群雄必扫（每天）**  
美：OpenAI / Anthropic / Google·Gemini·Antigravity / Meta / xAI·Grok / Microsoft·Copilot / Amazon Bedrock  
中：智谱 GLM / 阿里通义·Qwen / 月之暗面 Kimi / 字节豆包·Seed / DeepSeek / 百度文心（有增量才写）  
动作：changelog、GitHub release、公司 blog；有真实 URL。

**L2 稍具规模初创（信号捞）**  
融资/出圈：seed、Series A/B、出 stealth、early access、GA、waitlist  
分发：OpenRouter、LangChain、Vercel AI Gateway、Cloudflare、HF  
品类：coding agent、harness、model router、System One、evals、agent gateway

**L3 大厂孵化旁路**  
`(OpenAI|Anthropic|Google|阿里|字节|智谱) + (spinout|alumni|前*研究员|创业|孵化)`；样例 TypeSafe/Jev。

竞对双轨不变：明确对手 + 潮流初创；与数字员工/Like Code/选模路由/底座无关的融资软文不写。

## 学术与严肃源（加权）

每日外搜**除** L1 changelog / L2 初创信号外，增加严肃源扫掠（减少营销短文占比）：

1. **Google Scholar**（近 7 日优先）：`coding agent` / `LLM agent` / `software engineering agent` / `human-in-the-loop` / `model routing` / `agent evaluation` + `2026`
2. **arXiv**（cs.AI / cs.SE / cs.LG）：同主题；入选条必须能落到 `https://arxiv.org/abs/...` 且尽量附 `https://arxiv.org/pdf/....pdf`
3. **智库/研报**：Epoch、Anthropic Institute、**RAND（兰德，仅免费全文）**、OpenAI/Google 安全或度量长文、国内信通院/清研等——有 PDF 或长文 URL
4. **TOP 学校实验室**：Stanford/MIT/CMU/伯克利/清华/北大等官方页或论文

`public-facts.json` 每条增加 `tags: string[]`，可选 `pdf_url`。

入选门槛：可核验 + 与数字员工/Like Code/选模路由/底座/组织提效相关；纯软文/体验帖不进。

第 5 节合成时按标签打启示三标签，对照数字员工系统路线图。

## 中文 AI 智库 PDF

除 Scholar/arXiv 外，每日增加中文智库发现：

1. 智库官网：甲子光年、亿欧、易观、艾瑞、量子位智库等报告列表，优先直链 PDF
2. 搜狗微信发现层：`weixin.sogou.com` 搜「AI智库报告」「数字员工 报告」「Agent 研究报告」等 → 跟到官网/阅读原文 PDF
3. 转载聚合「附全文下载」可作跳板；公号正文不作唯一落盘源

门槛：与数字员工/Like Code/选模/质检强相关；`tags` 含 `智库报告` 或 `研究报告`；有则写 `pdf_url`。

## 规则

- 有真实 URL；covered-log 去重
- 启示不进 public 稿
- 第 5 节用「外部镜像→我方差距→低成本下一步」，参考数字员工系统架构

## 栏目条数

合成进终稿时：每栏目（映射 1–4）目标 3～5、硬顶 5；超则 re-rank 裁进 discarded。

## 成功标准

1. 输出完整的 markdown 报告（4 个栏目）
2. 输出结构化的 facts JSON（符合 schema）
3. 每个栏目 3-5 条，硬顶 5 条
4. 包含 URL、标签、可选 PDF 链接
5. 中文摘要清晰、准确
6. **通过 reconcile 门禁检查（`reconcile_status: "PASS"`）**
7. 仅在 reconcile PASS 后才发送报告卡片到 Desktop

---

## 技术约束

- **执行位置**: Runtime 服务
- **网络访问**: 仅通过 Gateway bypass 工具路径
- **输出验证**: 必须通过 reconcile 门禁
- **协议约束**: 不修改 `crates/protocol` EventEnvelope（当前 MVP）
- **调度触发**: 由 Scheduler 服务触发，skill 不关心调度时间
