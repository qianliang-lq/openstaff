# 安装指南 / Installation Guide

[中文](#中文) | [English](#english)

---

## 中文

### 系统要求

- **Rust**: stable (通过 `rust-toolchain.toml` 自动管理)
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **just**: (可选但推荐) https://github.com/casey/just

### 平台特定依赖

#### Linux

Tauri 需要以下系统库：

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev
```

**Fedora:**
```bash
sudo dnf install -y \
  gtk3-devel \
  webkit2gtk4.1-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  openssl-devel
```

**Arch Linux:**
```bash
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  base-devel \
  gtk3 \
  libappindicator-gtk3 \
  librsvg
```

#### macOS

```bash
# 安装 Xcode 命令行工具
xcode-select --install

# 安装 Homebrew (如果尚未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Windows

1. 安装 [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 安装 [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows 11 已预装)

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# 2. 安装 Rust (如果尚未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 4. 安装 just (可选但推荐)
cargo install just

# 5. 安装所有依赖
just install
# 或手动执行
cargo fetch
pnpm install
```

### 验证安装

```bash
# 检查 Rust 工作区
just check
# 或 cargo check --workspace

# 运行测试
just test
# 或 cargo test --workspace
```

### 常见问题

#### Q: `cargo check --workspace` 失败，提示找不到 `gdk-3.0`

A: 这是 Tauri 需要的系统库。请按照上述"平台特定依赖"部分安装相应的系统包。

#### Q: 是否可以只开发后端服务，不安装 GTK？

A: 可以。使用以下命令只检查/编译后端服务：

```bash
cargo check -p openstaff-protocol -p openstaff-runtime-agent \
  -p openstaff-api -p openstaff-gateway -p openstaff-scheduler
```

#### Q: pnpm 安装失败

A: 确保 Node.js 版本 >= 18，并清理缓存：

```bash
pnpm store prune
pnpm install --force
```

---

## English

### System Requirements

- **Rust**: stable (auto-managed via `rust-toolchain.toml`)
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **just**: (optional but recommended) https://github.com/casey/just

### Platform-Specific Dependencies

#### Linux

Tauri requires the following system libraries:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev
```

**Fedora:**
```bash
sudo dnf install -y \
  gtk3-devel \
  webkit2gtk4.1-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  openssl-devel
```

**Arch Linux:**
```bash
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  base-devel \
  gtk3 \
  libappindicator-gtk3 \
  librsvg
```

#### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Windows

1. Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 11)

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/qianliang-lq/openstaff.git
cd openstaff

# 2. Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Install pnpm (if not already installed)
npm install -g pnpm

# 4. Install just (optional but recommended)
cargo install just

# 5. Install all dependencies
just install
# Or manually
cargo fetch
pnpm install
```

### Verify Installation

```bash
# Check Rust workspace
just check
# Or cargo check --workspace

# Run tests
just test
# Or cargo test --workspace
```

### Troubleshooting

#### Q: `cargo check --workspace` fails with `gdk-3.0` not found

A: These are system libraries required by Tauri. Please install the appropriate packages following the "Platform-Specific Dependencies" section above.

#### Q: Can I develop backend services only without installing GTK?

A: Yes. Use the following command to check/compile only backend services:

```bash
cargo check -p openstaff-protocol -p openstaff-runtime-agent \
  -p openstaff-api -p openstaff-gateway -p openstaff-scheduler
```

#### Q: pnpm install fails

A: Ensure Node.js version >= 18, and clean cache:

```bash
pnpm store prune
pnpm install --force
```

---

**License**: Apache-2.0
