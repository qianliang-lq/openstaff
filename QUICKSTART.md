# OpenStaff BYOK Chat - Quickstart Guide

> 3 步配置真实 LLM 聊天（正确架构版本）

---

## 🏗️ Architecture (FROZEN)

```
Desktop (Tauri)
  ↓ reads encrypted key from app data dir
  ↓ POST /v1/chat + X-OpenStaff-Provider-Key header
API Service (localhost:3000)
  ↓ forwards with Authorization: Bearer token
  ↓ logs metadata only (no key, no body)
Gateway Service (localhost:3001)
  ↓ uses X-OpenStaff-Provider-Key header
  ↓ calls vendor API (Qwen/GLM)
Vendor (DashScope / Zhipu)
```

**Key Points:**
- ✅ Desktop → API → Gateway → Vendor (NOT Desktop → Gateway)
- ✅ Keys stored in encrypted file (app data dir, mode 600)
- ✅ Header-based key passing (X-OpenStaff-Provider-Key)
- ✅ Gateway audits metadata only (no keys, no full messages)

---

## 📋 Prerequisites

1. **Get API Key** (choose one):
   - **Qwen**: https://dashscope.console.aliyun.com/
   - **GLM**: https://open.bigmodel.cn/

2. **System requirements**:
   - Rust stable
   - Node.js >= 18
   - pnpm >= 8

See [INSTALL.md](INSTALL.md) for detailed setup.

---

## 🚀 Quick Start

### Step 1: Install & Start Services

```bash
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# Install dependencies
just install

# Start all services
just dev-up
```

Wait for all services to start:
- API Service: http://localhost:3000 ✓
- Gateway Service: http://localhost:3001 ✓
- Scheduler Service: http://localhost:3002 ✓
- Runtime Service: http://localhost:3003 ✓
- Desktop App: http://localhost:5173 ✓

### Step 2: Configure API Key (Tauri Secure Storage)

1. Open http://localhost:5173 in browser
2. Click **Settings** tab
3. Select Provider: **Qwen** or **GLM**
4. Enter your **API Key**
5. (Optional) Custom Model: `qwen-turbo` or `glm-4-flash`
6. Click **保存配置** (Save)

✅ Key is encrypted and stored in:
- **Linux**: `~/.local/share/OpenStaff/keys.dat`
- **macOS**: `~/Library/Application Support/OpenStaff/keys.dat`
- **Windows**: `%APPDATA%\OpenStaff\keys.dat`

File permissions: **600** (owner read/write only)

### Step 3: Chat with Real LLM

1. Return to **Chat** tab
2. Type a message: `你好，请自我介绍`
3. Press **Enter** or click **发送**
4. Receive real AI response from Qwen/GLM

---

## 🔐 Security Features

### Key Storage
- ✅ **Encrypted file** in app data directory (MVP)
- ✅ **Mode 600** permissions (Unix)
- ✅ **NOT localStorage** (XSS-safe)
- ✅ **Never in git** (gitignored)
- ✅ **Never logged** (audit logs metadata only)

### API Path
- ✅ Desktop **cannot** call Gateway directly
- ✅ API enforces service token authentication
- ✅ Keys passed via header (not body)
- ✅ API logs metadata only (no key, no full messages)

### Gateway Audit
Logs only:
- Timestamp
- Request ID
- Provider & Model
- Status & Latency
- Token usage (prompt_tokens, completion_tokens)

**Never logs**:
- API keys
- Full message content
- User identifiable content

---

## 📝 Example Request Flow

```bash
# 1. Desktop reads key from encrypted file
$ cat ~/.local/share/OpenStaff/keys.dat
# (base64 encoded JSON)

# 2. Desktop → API
POST http://localhost:3000/v1/chat
X-OpenStaff-Provider-Key: sk-xxx
Content-Type: application/json

{
  "provider": "qwen",
  "messages": [
    {"role": "system", "content": "你是助手"},
    {"role": "user", "content": "你好"}
  ],
  "stream": false
}

# 3. API → Gateway
POST http://localhost:3001/v1/chat
Authorization: Bearer dev-token
X-OpenStaff-Provider-Key: sk-xxx
Content-Type: application/json

{...}  # Same body

# 4. Gateway → Qwen
POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "model": "qwen-turbo",
  "messages": [...]
}

# 5. Response back through chain
{
  "id": "chat_abc123",
  "provider": "qwen",
  "model": "qwen-turbo",
  "message": {
    "role": "assistant",
    "content": "你好！我是通义千问..."
  },
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8
  }
}
```

---

## 🧪 Verification

### Check Services
```bash
just health
```

Expected output:
```json
{"status":"ok","service":"api"}
{"status":"ok","service":"gateway"}
{"status":"ok","service":"scheduler"}
{"status":"ok","service":"runtime"}
```

### Check Key Storage
```bash
# Unix/Linux/macOS
ls -l ~/.local/share/OpenStaff/  # or ~/Library/Application Support/OpenStaff/
# Should show: -rw------- (600) keys.dat

# Windows
dir %APPDATA%\OpenStaff\
```

### Check Audit Logs
```bash
# Gateway logs (no keys, no full messages)
grep "Chat request" logs/gateway.log

# Should see:
# provider=qwen model=qwen-turbo message_count=2
# NOT: api_key=xxx, content="..."
```

---

## 🛠️ Troubleshooting

### Q: "API key required" error?

A: Configure key in Settings first. The key must be saved before chatting.

### Q: Settings not saving?

A: Check Desktop app has write permissions to app data directory:
```bash
# Unix/Linux/macOS
mkdir -p ~/.local/share/OpenStaff  # or ~/Library/Application Support/OpenStaff
chmod 700 ~/.local/share/OpenStaff

# Windows - ensure %APPDATA%\OpenStaff exists
```

### Q: Can I use environment variable for demo?

A: Yes, Gateway falls back to `OPENSTAFF_LLM_API_KEY` if no header key:
```bash
export OPENSTAFF_LLM_API_KEY="sk-your-key"
just dev-up
```

But header key (from Settings) takes precedence.

### Q: How to clear saved keys?

A: Click **清除密钥** (Clear Key) button in Settings, or:
```bash
rm ~/.local/share/OpenStaff/keys.dat
```

---

## 📚 Related Docs

- [Installation Guide](INSTALL.md) - Full setup instructions
- [Architecture Cut](uploads/10-byok-chat-cut.md) - Official architecture spec
- [Agent Development](AGENTS.md) - Building agents & skills

---

## ✅ Acceptance Criteria

Per `10-byok-chat-cut.md`:

1. ✅ Settings can save/clear Qwen & GLM keys
2. ✅ Keys persist across restarts (encrypted file)
3. ✅ Keys NEVER in git/logs
4. ✅ Chat sends message → API → Gateway → real response
5. ✅ No key → clear 401/403 error (not silent success)
6. ✅ Gateway audit has no key, no full prompt body

---

**Git SHA**: `46aa1d3` (latest on main)  
**Status**: ✅ Correct Architecture Implemented  
**License**: Apache-2.0
