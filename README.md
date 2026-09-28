# OpenStaff / 开源数字员工

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Build Status](https://github.com/qianliang-lq/openstaff/workflows/CI/badge.svg)](https://github.com/qianliang-lq/openstaff/actions)

[English](#english) | [中文](#中文)

---

## 中文

### 什么是 OpenStaff？

**OpenStaff（开源数字员工）** 是面向组织提效的开源「数字员工操作系统」——以聊天为第一界面、多 Agent 协同、每人/每岗一台可审计的云端电脑。

### 核心特点

- **岗位员工，而非通用闲聊**：每个 Agent 有人设、记忆、例程、技能与私有沙箱电脑
- **验证闸门内建**：重要动作经审批卡片与审计日志；能闭环再立项/交付，不能则快速丢弃
- **开源核心 + Open Core 商业模式**：核心运行时与协议开源（Apache-2.0）；云托管实例、企业私有化与合规连接器可收费

### 架构

- **桌面客户端**（Tauri 2 + React）：轻量桌面应用，聊天优先 UI；Rust 后端处理本机工具授权
- **Web 管理控制台**（React）：Agent 管理、审批策略、审计日志、系统监控
- **云端服务**（Rust 微服务）：API、LLM Gateway、调度器
- **Agent 运行时**（容器/K8s）：每个 Agent 独立沙箱、浏览器/桌面子代理、记忆与例程

详见 [docs/architecture.md](docs/architecture.md) 和完整计划文档。

### Monorepo 结构

```
openstaff/
├── apps/
│   ├── desktop/         # Tauri + React 桌面客户端
│   └── web-admin/       # React 管理控制台
├── services/
│   ├── api/             # 控制面 API
│   ├── gateway/         # LLM 网关
│   └── scheduler/       # 例程调度器
├── crates/
│   ├── protocol/        # 共享协议定义（Rust）
│   └── runtime-agent/   # Agent 运行时库
├── packages/            # 共享前端包（规划中）
└── docs/                # 完整计划文档
```

### 设计原则

> **交互形态参考**：本项目交互形态参考公开可见的 Grok Bot 等桌面助手范式。**我们不声称也不进行任何对专有产品内部实现的逆向工程。** 所有代码为独立设计与实现。

### 许可证说明

本项目采用 **Apache License 2.0**。如社区有强烈需求，未来可考虑切换至 MIT 或其他宽松许可证。

### 快速开始

项目当前处于**早期 MVP 阶段（T0 完成）**。

#### 前置要求
- Rust stable (通过 `rust-toolchain.toml` 自动管理)
- Node.js >= 18
- pnpm >= 8
- [just](https://github.com/casey/just) (可选，推荐)
- **系统依赖**: 详见 [INSTALL.md](INSTALL.md)（Tauri 桌面客户端需要 GTK 等库；仅开发后端服务则无需）

#### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# 安装所有依赖（Rust + Node.js）
just install
# 或者
cargo fetch && pnpm install
```

#### 开发

```bash
# 检查 Rust 工作区
just check
# 或 cargo check --workspace

# 运行测试
just test
# 或 cargo test --workspace

# 🚀 启动所有后端服务（一键启动）
just dev
# 服务将在以下端口运行：
# - API:       http://localhost:3000
# - Gateway:   http://localhost:3001
# - Scheduler: http://localhost:3002

# 检查服务健康状态
just health
# 或
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# 或单独运行某个服务
cargo run -p openstaff-api        # port 3000
cargo run -p openstaff-gateway    # port 3001
cargo run -p openstaff-scheduler  # port 3002

# 启动前端应用（需先 pnpm install）
cd apps/desktop && pnpm dev       # port 5173 (Tauri)
cd apps/web-admin && pnpm dev     # port 5174
```

#### 一键命令（需要 just）

```bash
just install    # 安装所有依赖
just check      # 检查 Rust 代码
just test       # 运行测试
just lint       # 代码检查
just format     # 格式化代码
just build      # 构建所有项目
```

### 文档

- **⭐ [Agent 开发指南](AGENTS.md)** - 开始开发 agents
- **⭐ [Monorepo 约定](docs/architecture/02-monorepo-conventions.md)** - 权威性架构规范
- **⭐ [测试策略](docs/testing/strategy.md)** - 测试层与 CI 集成
- [架构概览](docs/architecture.md)
- [安装指南](INSTALL.md)
- [商业计划](docs/2026-09-28-openstaff-business-plan-v0.1_6794.md)
- [产品与 UX 方案](docs/2026-09-28-openstaff-product-ux-v0.1_acb0.md)
- [技术计划](docs/2026-09-28-openstaff-tech-plan-v0.1_f5ef.md)

### 贡献

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 联系方式

- GitHub Issues: [提交问题或建议](https://github.com/qianliang-lq/openstaff/issues)

---

## English

### What is OpenStaff?

**OpenStaff (Open-Source Digital Staff OS)** is an open-source "Digital Employee Operating System" designed for organizational productivity — chat-first interface, multi-agent collaboration, and auditable cloud computers for each role.

### Key Features

- **Role-based Agents, Not Generic Chatbots**: Each agent has persona, memory, routines, skills, and a private sandbox computer
- **Built-in Validation Gates**: Critical actions require approval cards and audit logs; iterate fast, validate thoroughly
- **Open Core Model**: Core runtime and protocol are open source (Apache-2.0); cloud hosting, enterprise on-premise, and compliance connectors are commercial offerings

### Architecture

- **Local Client** (Rust): Lightweight tray + compact window, chat-first; executes local tools with user authorization
- **Cloud Instances** (Container/K8s): Each agent can have an isolated sandbox computer, browser/desktop sub-agents, memory, and routines
- **Control Plane**: Session routing, approval policies, connectors/MCP, multi-agent collaboration (SendToAgent, channels/group rooms)

See [docs/architecture.md](docs/architecture.md) and full planning docs for details.

### Design Philosophy

> **Interaction Morphology Reference**: This project's interaction design references publicly visible paradigms from desktop assistants like Grok Bot. **We do NOT claim, nor do we perform, any reverse engineering of proprietary product implementations.** All code is independently designed and implemented.

### License Note

This project is licensed under **Apache License 2.0**. If the community strongly prefers, we may consider switching to MIT or other permissive licenses in the future.

### Quick Start (Coming Soon)

The project is currently in **early MVP stage**. Build and deployment guides will be provided after T0 milestone.

```bash
# Clone the repository
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# Check Rust workspace
cargo check --workspace

# Full build and deployment docs coming soon
```

### Documentation

- **⭐ [Agent Development Guide](AGENTS.md)** - Start developing agents
- **⭐ [Monorepo Conventions](docs/architecture/02-monorepo-conventions.md)** - Authoritative architecture spec
- **⭐ [Testing Strategy](docs/testing/strategy.md)** - Test layers and CI integration
- [Business Plan](docs/2026-09-28-openstaff-business-plan-v0.1_6794.md)
- [Product & UX Plan](docs/2026-09-28-openstaff-product-ux-v0.1_acb0.md)
- [Technical Plan](docs/2026-09-28-openstaff-tech-plan-v0.1_f5ef.md)
- [Architecture Overview](docs/architecture.md)

### Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

### Contact

- GitHub Issues: [Submit issues or suggestions](https://github.com/qianliang-lq/openstaff/issues)

---

**Copyright 2026 OpenStaff Contributors**
