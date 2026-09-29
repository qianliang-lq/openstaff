# UI 对齐草图验收清单

## Chat 空态 (草图 19) ✅

### 布局

- ✅ 居中引导卡片 (`chat-empty-state` + `empty-card`)
- ✅ 顶栏状态徽标 "未配置 Key" 红色 (`status-pill no-key`)

### 内容

- ✅ 🔑 大图标 (`empty-icon`)
- ✅ 标题: "先配置模型 Key，才能开始对话" (`h2`)
- ✅ 说明: 支持通义千问/智谱 AI，本机安全存储 (`p`)
- ✅ 主按钮: "去 Connectors 配置" 红色 (`btn-primary`)
- ✅ 底部提示: 💡通义千问 / 🔷智谱AI / 👉本地安全存储 (`empty-hint`)

### 交互

- ✅ 输入框禁用 (`disabled`)
- ✅ 占位符: "请先配置 Key..."
- ✅ 发送按钮禁用 (`disabled`)
- ✅ 按钮点击跳转 Connectors (`onNavigateToConnectors`)

### 代码位置

- `ChatStage.tsx`: 行 302-341
- `ChatStage.css`: 行 199-243

---

## Chat 失败态 (草图 20) ✅

### 布局

- ✅ 独立红框错误卡片 (`error-card`)
- ✅ 插入消息流中 (不是全局横幅)

### Header 区

- ✅ ⚠️ 图标 (`error-icon`)
- ✅ 标题: "未配置模型 Key" (`error-title`)
- ✅ 401 badge 红色 (`error-code`)
- ✅ 红色背景 (`error-header`)

### Body 区

- ✅ 错误说明文案 (`error-body p`)
- ✅ 内容: "发送失败：Gateway 无法认证。请前往 Connectors..."
- ✅ 明确说明不会生成助手回复

### 按钮

- ✅ "去配置" 主按钮蓝色 (`btn-goto-config`)
- ✅ "重试" 次按钮白色 (`btn-retry`)
- ✅ 按钮点击跳转/重试功能

### 代码位置

- `ChatStage.tsx`: 行 370-393
- `ChatStage.css`: 行 244-311

---

## 架构验证 ✅

### Key 存储

- ✅ Connectors: `invoke('save_provider_key')` / `invoke('get_provider_key')`
- ✅ ChatStage: `invoke('get_provider_key')`
- ✅ 无 localStorage 使用 (仅文案引用)
- ✅ Tauri 加密文件 `keys.dat` mode 600

### API 路径

- ✅ Desktop → API: `fetch('http://localhost:3000/v1/chat')`
- ✅ Header: `X-OpenStaff-Provider-Key`
- ✅ API → Gateway: 在 `services/api/src/chat.rs`
- ✅ 无直连 Gateway/厂商

### 错误处理

- ✅ 无 Key 抛出 `401:未配置 Key`
- ✅ 显示红框错误卡 (不是静默成功)
- ✅ 明确 401/403 错误类型

---

## 测试状态 ✅

- ✅ TypeScript check passed
- ✅ ESLint passed
- ✅ Rust check passed
- ✅ 无 localStorage 扫描通过

---

**结论**: 所有要求已完全实现，完全对齐草图 19 和 20
