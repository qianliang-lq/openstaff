# OpenStaff 桌面 · 连云鉴权（一页）

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-10-02（Asia/Shanghai） |
| 目的 | 本地 Tauri App **全面连 ECS**；云写接口已要 Bearer；与百炼/厂商 Key **分槽** |
| 云基址 | `http://123.57.167.155/openstaff`（无尾斜杠亦可；请求路径挂 `/v1/...`） |
| ECS tip | `0834d23`（鉴权已上）；本机手验口令仍可能 HOLD `3e73318` —— **两回事，勿混升** |
| 云 Key 真源 | ECS `/etc/openstaff.env` → `OPENSTAFF_API_KEY`；**禁止进 git** |

---

## 1. 两套钥匙，禁止混用

| 槽 | 名字（产品文案） | 用途 | 谁消费 | 请求怎么带 |
| --- | --- | --- | --- | --- |
| **A · 云控制面** | 「云 API Key」/ OpenStaff 实例鉴权 | 写 ECS API（agents CRUD、demo fire、peer-messages、connectors PUT…） | **桌面 → API** | `Authorization: Bearer <OPENSTAFF_API_KEY>`（或 `X-Api-Key`，与现 API 一致） |
| **B · 模型推理** | Connectors / 百炼·OpenAI Key | Chat 出站调模型 | **Gateway → 厂商** | 存在 connectors 机密存储；**不是**槽 A |

- 槽 A 错/缺 → 写接口 **401**，UI 明确「云鉴权失败」，禁空转。  
- 槽 B 错/缺 → Chat **401/引导配 Key**（既有 Connectors 流），与槽 A 无关。  
- GET/HEAD（health、catalog、agents 列表等）当前公网仍可无槽 A；**写必须带 A**。

---

## 2. App 默认 Base 与模式

| 模式 | `PUBLIC_API_BASE`（可设置里改） | 槽 A |
| --- | --- | --- |
| **连云（本轮默认）** | `http://123.57.167.155/openstaff` | **必填**（安全存储）；写请求自动加 Bearer |
| **本机四服**（开发/口令手验） | `http://127.0.0.1:3000` | 本机 API **未**设 `OPENSTAFF_API_KEY` 时可不填；若本机也开了鉴权则同连云 |

设置页两行并排展示，标签勿写成同一个「API Key」：

1. **云 API Base**（明文可改）  
2. **云 API Key**（首次明文录入 → 其后掩码 +「更换」；底层 OS Keychain / Tauri secure store）  
3. **Connectors 厂商 Key**（既有页，槽 B，不变）

构建期可用 `PUBLIC_API_BASE` 给默认值；**云 Key 只用运行时安全存储 / 本机 env（开发）**，`.env` 示例只写变量名不写值。

---

## 3. 存放规则（编码硬约束）

1. **禁止**把 `OPENSTAFF_API_KEY` 写入仓库、README、草图、聊天。  
2. 生产路径：macOS Keychain / Windows Credential Manager（或现有 Tauri secure plugin）；仅进程内读出拼头。  
3. 开发兜底：本机环境变量 `OPENSTAFF_API_KEY`（可选），优先级低于安全存储里用户已保存的值。  
4. 日志/错误文案：只说「鉴权失败 / 未配置云 Key」，**永不**回显 Key。  
5. 仍为公网 **HTTP**——鉴权降误写，不替代日后 HTTPS。

---

## 4. 请求行为（桌面 HTTP 客户端）

```
所有发往 PUBLIC_API_BASE 的请求：
  GET/HEAD  → 可不带槽 A（与现 ECS 行为一致）
  其它方法 → 必须带 Authorization: Bearer <槽A>；缺则本地直接拦并引导设置，少打一轮公网
```

Demo fire 等写路径：公网已是 **401（要 Bearer）**，不再是 404。

---

## 5. 验收拆两路（测）

| 路 | 怎么起 | 期望 |
| --- | --- | --- |
| 本机四服 | Base=`127.0.0.1:3000`，口令族 `3e73318` | 无槽 A 也可走通既有手验（若本机未开鉴权） |
| 连云 | Base=ECS `/openstaff`，槽 A 已存 | GET catalog/agents 200；无 Key 写 → 401；有 Key 写 → 2xx；Chat 仍走槽 B |

口令**不因**连云成功而自动升。

---

## 6. 给编码的落地顺序

1. 设置：默认 Base → 云；新增槽 A 安全存 + 掩码 UI（可与 Connectors 分栏）。  
2. API client：写方法注入 Bearer；401 → 明确失败态。  
3. **不**改 ECS；Key 从有钥匙的人/既有安全副本录入本机存储。  
4. 草图：设置页「云 Base + 云 Key」与「Connectors 百炼」两套；401/无权限卡。

完。
