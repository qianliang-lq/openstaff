# §20 ECS 部署指南

**Instance**: `i-2ze1za33mqt5bpnakx2y`  
**PUBLIC_API_BASE**: `http://123.57.167.155/openstaff`  
**DB Path**: `/opt/openstaff/data/openstaff.db`  
**Tip**: `4b02a5e` (or later)

⚠️ **Cloud agent 无法 SSH ECS — 本文档供用户/运维在 ECS 本机执行**

---

## 1. 拉取最新代码

```bash
cd /opt/openstaff  # 或您的仓库路径
git fetch origin
git checkout main
git pull origin main

# 验证 tip
git log --oneline -1
```

---

## 2. 配置环境变量 (如未设置)

```bash
# systemd 配置文件: /etc/systemd/system/openstaff-api.service
# 确保包含正确的 DATABASE_URL (相对路径或绝对路径)
Environment="OPENSTAFF_DATABASE_URL=./data/openstaff.db"
# 或绝对路径
Environment="OPENSTAFF_DATABASE_URL=/opt/openstaff/data/openstaff.db"

# 注意：URL 会自动追加 ?mode=rwc，无需手动添加
```

---

## 3. 重启 API 服务

### 如果使用 systemd (四件套)

```bash
sudo systemctl daemon-reload  # 如果修改了 service 文件
sudo systemctl restart openstaff-api
sudo systemctl status openstaff-api

# 查看日志
sudo journalctl -u openstaff-api -f
```

### 如果使用 Docker Compose

```bash
cd deploy/compose
docker-compose -f docker-compose.prod.yml pull api
docker-compose -f docker-compose.prod.yml up -d --no-deps api

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f api
```

---

## 4. 验证部署

### 4.1 Health Check

```bash
curl http://localhost:3000/health
```

**预期输出**:
```json
{"status":"ok","service":"api"}
```

### 4.2 数据库文件

```bash
ls -lh /opt/openstaff/data/openstaff.db
```

应显示文件存在。如首次运行，API 会自动创建表结构。

### 4.3 Agents Endpoint (空列表)

```bash
curl http://localhost:3000/v1/agents
```

**预期输出** (首次):
```json
[]
```

### 4.4 创建测试 Agent

```bash
curl -X POST http://localhost:3000/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试数字员工",
    "template_id": "pm",
    "duty": "产品经理职责测试"
  }'
```

**预期输出** (包含 id, created_at 等):
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "测试数字员工",
  "template_id": "pm",
  "duty": "产品经理职责测试",
  "account_id": null,
  "status": "idle",
  "created_at": "2026-09-30T04:30:00Z",
  "updated_at": "2026-09-30T04:30:00Z"
}
```

### 4.5 验证创建成功

```bash
curl http://localhost:3000/v1/agents
```

应返回包含刚创建的 agent 的数组。

### 4.6 Messages Endpoint (空列表)

```bash
# 使用上一步返回的 agent id
AGENT_ID="<上面返回的 id>"
curl "http://localhost:3000/v1/agents/$AGENT_ID/messages"
```

**预期输出**:
```json
[]
```

### 4.7 Connector Meta (空列表)

```bash
curl http://localhost:3000/v1/connectors/meta
```

**预期输出**:
```json
[]
```

---

## 5. 公网访问验证 (如已配置 PUBLIC_API_BASE)

从外部访问（替换为实际公网地址）:

```bash
curl http://123.57.167.155/openstaff/health
curl http://123.57.167.155/openstaff/v1/agents
```

---

## 6. 故障排查

### 6.1 API 服务无响应

```bash
# systemd
sudo systemctl status openstaff-api
sudo journalctl -u openstaff-api -n 50

# Docker
docker ps | grep openstaff-api
docker logs openstaff-api --tail 50
```

### 6.2 数据库权限问题

```bash
ls -l /opt/openstaff/data/
# 确保 API 进程用户有写权限

# 如需修复权限 (systemd)
sudo chown openstaff:openstaff /opt/openstaff/data/openstaff.db

# Docker 容器内部
docker exec openstaff-api ls -l /data/
```

### 6.3 重置数据库 (谨慎!)

```bash
# 备份旧数据
cp /opt/openstaff/data/openstaff.db /opt/openstaff/data/openstaff.db.backup

# 删除数据库
rm /opt/openstaff/data/openstaff.db

# 重启 API (会自动重建表)
sudo systemctl restart openstaff-api
# 或
docker-compose restart api
```

---

## 7. Desktop 客户端配置

桌面应用需要配置 `PUBLIC_API_BASE`:

### Tauri / Vite 环境变量

创建 `/workspace/apps/desktop/.env.local`:

```bash
PUBLIC_API_BASE=http://123.57.167.155/openstaff
```

或编译时注入:

```bash
cd apps/desktop
PUBLIC_API_BASE=http://123.57.167.155/openstaff pnpm build
```

---

## 8. 关键安全检查

### 8.1 Connector Meta 不含 Key 明文

```bash
curl http://localhost:3000/v1/connectors/meta
```

响应中 **绝对不应包含** `api_key`, `secret`, `token` 等字段。  
只应有 `provider`, `configured`, `last_checked_at`, `account_label`。

### 8.2 API 日志不含 Key 明文

```bash
sudo journalctl -u openstaff-api -n 100 | grep -i "key"
# 或
docker logs openstaff-api | grep -i "key"
```

不应看到完整的 API Key 字符串（如 `sk-xxx`）。

---

## 9. 环境变量一览

API 服务需要的环境变量:

```bash
# 必需 (支持相对路径或绝对路径)
# 相对路径 (推荐 - 相对于 WorkingDirectory)
OPENSTAFF_DATABASE_URL=./data/openstaff.db

# 绝对路径
OPENSTAFF_DATABASE_URL=/opt/openstaff/data/openstaff.db

# 可选 (默认值)
PORT=3000
GATEWAY_URL=http://localhost:3001
RUST_LOG=info
```

**注意**: URL 格式支持：
- `./data/openstaff.db` - 相对路径
- `/opt/openstaff/data/openstaff.db` - 绝对路径
- `sqlite:./data/openstaff.db` - 带 scheme 相对路径
- `sqlite:///opt/openstaff/data/openstaff.db` - 带 scheme 绝对路径（三斜杠）

所有格式会自动追加 `?mode=rwc`（如未提供 query 参数），确保数据库文件不存在时自动创建。

---

## 附录: systemd Unit 文件示例

`/etc/systemd/system/openstaff-api.service`:

```ini
[Unit]
Description=OpenStaff API Service
After=network.target

[Service]
Type=simple
User=openstaff
WorkingDirectory=/opt/openstaff
Environment="OPENSTAFF_DATABASE_URL=./data/openstaff.db"
Environment="GATEWAY_URL=http://localhost:3001"
Environment="PORT=3000"
Environment="RUST_LOG=info"
ExecStart=/opt/openstaff/target/release/openstaff-api
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

重载配置:

```bash
sudo systemctl daemon-reload
sudo systemctl enable openstaff-api
sudo systemctl restart openstaff-api
```

---

**完成**. 如有问题请检查日志并参考「故障排查」章节。
