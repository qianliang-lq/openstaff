# Contributing to OpenStaff / 贡献指南

[English](#english) | [中文](#中文)

---

## 中文

感谢你对 OpenStaff 的关注！我们欢迎各种形式的贡献。

### 如何贡献

1. **报告问题**：在 [Issues](https://github.com/qianliang-lq/openstaff/issues) 提交 bug 报告或功能建议
2. **代码贡献**：
   - Fork 本仓库
   - 创建功能分支 (`git checkout -b feature/your-feature`)
   - 提交变更 (`git commit -m 'Add some feature'`)
   - 推送到分支 (`git push origin feature/your-feature`)
   - 提交 Pull Request

### 开发环境

- Rust stable (见 `rust-toolchain.toml`)
- 推荐 IDE：VS Code + rust-analyzer

### 代码规范

- 运行 `cargo fmt` 格式化代码
- 运行 `cargo clippy` 检查代码质量
- 确保 `cargo test --workspace` 通过
- 确保 `cargo check --workspace` 通过

### 提交信息

- 使用清晰的提交信息
- 中英文均可
- 格式示例：`feat: 添加 Agent 沙箱隔离功能` 或 `fix: 修复审批卡片渲染问题`

### Pull Request 指南

- PR 标题简洁明了
- 描述清楚改动内容和原因
- 关联相关 Issue（如 `Closes #123`）
- 确保 CI 通过

### 许可证

所有贡献将采用 Apache-2.0 许可证。提交 PR 即表示你同意此许可。

### 行为准则

- 尊重所有贡献者
- 专注于技术讨论
- 避免人身攻击或不当言论

---

## English

Thank you for your interest in OpenStaff! We welcome contributions of all kinds.

### How to Contribute

1. **Report Issues**: Submit bug reports or feature requests via [Issues](https://github.com/qianliang-lq/openstaff/issues)
2. **Code Contributions**:
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/your-feature`)
   - Commit your changes (`git commit -m 'Add some feature'`)
   - Push to the branch (`git push origin feature/your-feature`)
   - Submit a Pull Request

### Development Setup

- Rust stable (see `rust-toolchain.toml`)
- Recommended IDE: VS Code + rust-analyzer

### Code Standards

- Run `cargo fmt` to format code
- Run `cargo clippy` for linting
- Ensure `cargo test --workspace` passes
- Ensure `cargo check --workspace` passes

### Commit Messages

- Use clear commit messages
- Both English and Chinese are acceptable
- Examples: `feat: add agent sandbox isolation` or `fix: repair approval card rendering`

### Pull Request Guidelines

- PR title should be concise and clear
- Describe what changed and why
- Link related issues (e.g., `Closes #123`)
- Ensure CI passes

### License

All contributions will be licensed under Apache-2.0. By submitting a PR, you agree to this license.

### Code of Conduct

- Respect all contributors
- Focus on technical discussions
- Avoid personal attacks or inappropriate language

---

**Thank you for contributing to OpenStaff! / 感谢你为 OpenStaff 做出贡献！**
