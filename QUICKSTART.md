# OpenStaff 快速开始 / Quick Start

> 3 步实现真实 LLM 聊天对话

---

## 📋 前置要求

1. **获取 API Key**（二选一）：
   - **通义千问 (Qwen)**: https://dashscope.console.aliyun.com/
   - **智谱 AI (GLM)**: https://open.bigmodel.cn/

2. **系统依赖**：
   - Rust stable
   - Node.js >= 18
   - pnpm >= 8

详细安装指南见 [INSTALL.md](INSTALL.md)

---

## 🚀 三步开始

### 步骤 1: 安装依赖

```bash
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# 安装依赖
just install
# 或手动执行
cargo fetch && pnpm install
```

### 步骤 2: 启动服务

```bash
just dev-up
```

这将启动：
- API Service (localhost:3000)
- Gateway Service (localhost:3001) ← **新增聊天端点**
- Scheduler Service (localhost:3002)
- Runtime Service (localhost:3003)
- Desktop App (localhost:5173) ← **在浏览器中打开**

### 步骤 3: 配置 API Key

1. 在浏览器中打开 http://localhost:5173
2. 点击顶部 **Settings** 标签
3. 选择 Provider:
   - **Qwen** (通义千问) - 推荐用 `qwen-turbo`
   - **GLM** (智谱 AI) - 推荐用 `glm-4-flash`
4. 输入您的 **API Key**
5. （可选）自定义 Base URL 和 Model
6. 点击 **保存配置**

✅ 配置保存在本地浏览器，不会上传到服务器

---

## 💬 开始对话

1. 返回 **Chat** 标签
2. 在输入框输入消息，例如：
   ```
   帮我写一个 Python 斐波那契数列函数
   ```
3. 点击 **发送** 或按 Enter

🎉 您现在已连接到真实的 LLM！

---

## 🎯 功能说明

### ✅ 已实现 (MVP)

| 功能 | 说明 |
|------|------|
| **真实聊天** | 通过 Gateway `/v1/chat` 连接 Qwen/GLM |
| **BYOK** | 用户自己的 API Key，本地存储 |
| **设置界面** | 配置 Provider、Key、Model |
| **错误提示** | 无 Key 或请求失败时显示横幅 |
| **创建 Agent** | 侧边栏 `+` 按钮创建自定义 Agent |
| **失败提示** | "立即跑一次" 失败时显示错误 |

### 🔧 演示功能

- **立即跑一次 (Demo)**: 原有的 Scheduler 演示（需要 Scheduler 运行）
- **显示演示内容**: 展示模拟的周报对话

### 🚧 占位页面

- Computer、Routines、Skills、Connectors、Memory 标签为开发中占位

---

## 📝 示例对话

```
用户：请帮我总结一下今天的工作任务

Agent：好的，我正在为您整理今天的工作任务...
（根据您配置的 LLM 返回真实回复）
```

---

## 🛠️ 故障排查

### Q: 点击发送后没有响应？

A: 检查：
1. Gateway 服务是否运行 (localhost:3001)
2. 是否在 Settings 中配置了 API Key
3. 浏览器控制台是否有错误信息

```bash
# 检查服务状态
just health
```

### Q: 提示 "请先在设置中配置 API Key"？

A: 需要先在 Settings 标签配置 API Key 才能使用聊天功能。

### Q: API Key 是否安全？

A: 是的！
- API Key 仅存储在浏览器 localStorage
- 从不上传到 OpenStaff 服务器
- Gateway 只负责转发请求到 Qwen/GLM 官方 API

### Q: 能否使用环境变量配置 API Key？

A: 可以，设置环境变量后重启服务：

```bash
export OPENSTAFF_LLM_API_KEY="your-key-here"
just dev-up
```

---

## 🌟 下一步

- [ ] 添加对话历史记忆
- [ ] 支持更多 LLM Provider (OpenAI, Claude, etc.)
- [ ] 实现流式响应 (Streaming)
- [ ] 添加系统 Prompt 自定义
- [ ] Agent 人设配置

---

## 📚 相关文档

- [安装指南](INSTALL.md) - 详细的安装步骤
- [Agent 开发指南](AGENTS.md) - 开发 Agent 和 Skills
- [架构约定](docs/architecture/02-monorepo-conventions.md) - 代码库规范

---

**Git SHA**: 最新提交已推送到 main 分支

**License**: Apache-2.0  
**项目**: https://github.com/qianliang-lq/openstaff
