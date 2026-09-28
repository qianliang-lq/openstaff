# OpenStaff Desktop / 桌面客户端

Tauri + React 桌面应用 / Tauri + React desktop application.

## 技术栈 / Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri 2 (Rust)
- **Protocol**: `openstaff-protocol` (shared Rust crate)

## 开发 / Development

```bash
# 安装依赖 / Install dependencies
pnpm install

# 启动开发服务器 / Start dev server
pnpm dev

# 构建生产版本 / Build for production
pnpm build

# 类型检查 / Type check
pnpm type-check

# 代码检查 / Lint
pnpm lint

# 格式化代码 / Format code
pnpm format
```

## 架构 / Architecture

```
apps/desktop/
├── src-tauri/           # Tauri Rust backend
│   ├── src/main.rs      # Tauri commands & app setup
│   └── Cargo.toml
├── src/                 # React frontend
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── styles.css
├── package.json
└── vite.config.ts
```

## 状态 / Status

**T0 占位 / T0 Placeholder** - 基础框架已就位

- ✅ Tauri + React 初始化
- ✅ Rust 后端与 React 前端通信
- ⏳ 聊天界面 - T1
- ⏳ Agent 侧栏 - T1
- ⏳ 审批卡片 - T3

---

**License**: Apache-2.0
