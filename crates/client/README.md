# openstaff-client

OpenStaff 本地客户端（Rust）/ Local Rust client for OpenStaff.

## 概述 / Overview

轻量级桌面客户端，提供：
- 托盘常驻
- 聊天界面
- 本机工具审批执行
- 与控制面的 WebSocket 连接

Lightweight desktop client providing:
- System tray presence
- Chat interface
- Local tool approval & execution
- WebSocket connection to control plane

## 状态 / Status

**MVP 占位 / MVP Placeholder** - 当前仅支持 `--version` 命令。

Currently only supports `--version` command.

## 使用 / Usage

```bash
# 构建 / Build
cargo build --release -p openstaff-client

# 运行 / Run
./target/release/openstaff-client --version
```

## 后续计划 / Roadmap

- 托盘 UI（tao + tray-icon）
- 聊天窗口（可选 WebView 或原生 GUI）
- 审批卡片渲染
- WebSocket 客户端
- 本机工具执行器

---

**License**: Apache-2.0
