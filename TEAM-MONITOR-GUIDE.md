# Agent Teams Monitor - 使用指南

## 简介

Agent Teams Monitor 是一个实时监控 Agent Teams 通信的 Web 仪表盘。现在你可以将它作为 Skill 在任何项目中使用！

## 安装方式

### 方式一：全局安装（推荐）

在任意位置运行：

```bash
cd /Users/liuhao/CodeForPerson/agent-teams-dashboard
./install-skill.sh global
```

这将使 `/team-monitor` 命令在所有 Claude Code 会话中可用。

### 方式二：项目级安装

在你的项目根目录运行：

```bash
/path/to/agent-teams-dashboard/install-skill.sh project
```

### 方式三：直接复制

将 `agent-teams-monitor/` 目录复制到你的项目中：

```bash
cp -r /Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor ./
```

## 使用方法

### 使用 Claude Code 命令

```
/team-monitor        # 启动监控面板
/team-monitor stop   # 停止服务
/team-monitor status # 查看状态
/team-monitor logs   # 查看日志
```

### 使用命令行脚本

```bash
# 如果在 agent-teams-dashboard 目录
./team-monitor

# 如果在其他项目（且复制了 agent-teams-monitor 目录）
/path/to/agent-teams-dashboard/team-monitor
```

## 项目结构检测

启动脚本会按以下顺序查找 monitor 项目：

1. `./agent-teams-monitor`（当前目录）
2. 脚本所在目录
3. `~/CodeForPerson/agent-teams-dashboard/agent-teams-monitor`（默认位置）

## 配置文件

你可以创建 `team-monitor-config.json` 来自定义配置：

```json
{
  "server": {
    "port": 3001,
    "logPath": "/tmp/team-monitor-backend.log"
  },
  "client": {
    "port": 5173,
    "logPath": "/tmp/team-monitor-frontend.log"
  }
}
```

## API 端点

启动后，以下端点可用：

- `GET /api/teams` - 获取所有团队
- `GET /api/teams/:name/members` - 获取团队成员
- `GET /api/teams/:name/messages/:member` - 获取成员消息
- WebSocket: `ws://localhost:3001` - 实时更新

## 故障排除

### 端口被占用

```bash
# 检查占用端口的进程
lsof -ti:3001
lsof -ti:5173

# 停止服务
./team-monitor stop
```

### 查看日志

```bash
./team-monitor logs

# 或手动查看
tail -f /tmp/team-monitor-backend.log
tail -f /tmp/team-monitor-frontend.log
```

### 依赖安装失败

```bash
cd agent-teams-monitor/server
npm install

cd agent-teams-monitor/client
npm install
```

## 自定义开发

### 修改前端

编辑 `agent-teams-monitor/client/src/components/` 下的组件。

### 修改后端

编辑 `agent-teams-monitor/server/src/` 下的文件。

### 添加新功能

1. 后端：在 `server/src/routes/` 添加新路由
2. 前端：在 `client/src/components/` 添加新组件
3. 更新 `SKILL.md` 文档

## 目录说明

```
agent-teams-dashboard/
├── agent-teams-monitor/          # 核心监控应用
│   ├── server/                   # Express + Socket.io 后端
│   └── client/                   # React + Tailwind 前端
├── .claude/
│   ├── skills/team-monitor/      # Skill 定义
│   └── commands/                 # Claude 命令配置
├── team-monitor                  # 启动脚本
├── install-skill.sh              # 安装脚本
└── TEAM-MONITOR-GUIDE.md         # 本指南
```

## 技术栈

- **后端**: Express.js, Socket.io, chokidar, TypeScript
- **前端**: React 18, TypeScript, Vite, Tailwind CSS
- **通信**: WebSocket 实时推送
- **监控**: 文件系统监听 (~/.claude/teams/)

## 许可证

MIT License - 自由使用和修改。
