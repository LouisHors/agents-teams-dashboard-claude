# Team Monitor - Distribution Guide

## 分发方案概述

为了让其他人能轻松使用 Team Monitor，我们提供了多种分发方式：

```
┌─────────────────────────────────────────────────────────────┐
│                    Distribution Options                     │
├─────────────────────────────────────────────────────────────┤
│  1. npm install -g team-monitor-cli    (推荐，最简单)       │
│  2. npm install team-monitor-cli       (项目级安装)         │
│  3. Git Clone + Setup                  (开发者)             │
│  4. Homebrew (macOS)                   (macOS 用户友好)     │
│  5. Single Binary (pkg)                (无 Node 依赖)       │
└─────────────────────────────────────────────────────────────┘
```

## 方案 1: npm 全局安装（推荐）

### 用户使用

```bash
npm install -g team-monitor-cli

# 启动监控
team-monitor
# 或短别名
tm

# 在 Claude Code 中
/team-monitor
```

### 发布步骤

```bash
cd packages/team-monitor-cli

# 1. 登录 npm
npm login

# 2. 发布
npm publish

# 3. 验证
npm view team-monitor-cli
```

## 方案 2: npm 本地安装

### 用户使用

```bash
npm install team-monitor-cli
npx team-monitor
```

## 方案 3: Git Clone

### 用户使用

```bash
git clone https://github.com/yourusername/team-monitor-cli.git
cd team-monitor-cli
npm install
npm link  # 创建全局命令
```

## 方案 4: Homebrew (macOS)

### 创建 Formula

```ruby
# team-monitor-cli.rb
class TeamMonitorCli < Formula
  desc "Real-time dashboard for monitoring Claude Code agent teams"
  homepage "https://github.com/yourusername/team-monitor-cli"
  url "https://github.com/yourusername/team-monitor-cli/archive/v1.0.0.tar.gz"
  sha256 "YOUR_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/team-monitor", "--version"
  end
end
```

### 用户使用

```bash
brew tap yourusername/team-monitor
brew install team-monitor-cli

team-monitor
```

## 方案 5: 单文件可执行程序

使用 `pkg` 打包成独立可执行文件：

```bash
npm install -g pkg

# 打包
cd packages/team-monitor-cli
pkg . --targets node18-macos-x64,node18-linux-x64,node18-win-x64

# 分发
# team-monitor-macos
# team-monitor-linux
# team-monitor-win.exe
```

## 当前 npm 包结构

```
packages/team-monitor-cli/
├── bin/
│   └── team-monitor.js          # CLI 入口
├── lib/
│   ├── monitor.js               # 核心监控类
│   └── doctor.js                # 系统检查
├── scripts/
│   └── postinstall.js           # 安装后设置
├── server/                      # Express 后端
│   ├── src/
│   └── package.json
├── client/                      # React 前端
│   ├── src/
│   └── package.json
├── package.json                 # npm 配置
├── README.md                    # 文档
├── LICENSE                      # MIT 许可证
└── test-local.sh                # 本地测试脚本
```

## 特性

- ✅ 自动安装依赖
- ✅ 自动设置 Claude Skill
- ✅ 跨平台支持 (macOS/Linux/Windows)
- ✅ 智能端口检测
- ✅ 后台运行支持
- ✅ 日志管理
- ✅ 系统检查 (doctor)

## 命令行界面

```bash
Usage: team-monitor [command] [options]

Commands:
  start [options]    Start the monitor (default)
  stop               Stop the monitor
  restart            Restart the monitor
  status             Check monitor status
  logs [options]     Show logs
  doctor             Check system requirements

Options:
  -p, --port <port>      Backend port (default: 3001)
  -c, --client <port>    Frontend port (default: 5173)
  -d, --detach           Run in background
  -v, --verbose          Verbose output
  -h, --help             Display help

Aliases:
  team-monitor, tm
```

## 下一步

1. **注册 npm 账号** (如果没有)
   ```bash
   npm adduser
   ```

2. **发布到 npm**
   ```bash
   cd packages/team-monitor-cli
   npm publish
   ```

3. **创建 GitHub 仓库**
   - 上传代码
   - 创建 Release
   - 添加文档

4. **推广**
   - 分享到社交媒体
   - 提交到 awesome-claude-code 列表
   - 写博客文章

## 注意事项

- 确保 `package.json` 中的版本号正确
- 发布前运行本地测试: `./test-local.sh`
- 首次发布使用 `npm publish --access public`
- 后续更新使用 `npm version patch/minor/major` + `npm publish`
