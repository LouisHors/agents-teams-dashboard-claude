---
name: team-monitor
description: Launch Agent Teams Monitor dashboard to visualize and monitor agent teams communication in real-time. 启动 Agent Teams 监控面板，实时可视化监控 agent teams 的通信活动。
---

# Team Monitor Skill

## Purpose

启动 Agent Teams Monitor，一个实时监控 Agent Teams 通信的 Web 仪表盘。

## When to Use

- 当需要监控 agent teams 的实时活动
- 当需要查看 teams 之间的消息通信
- 当需要调试 agent teams 的行为

## Prerequisites

确保以下路径存在：
- `/Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor/server`
- `/Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor/client`

## Steps

### 1. 检查服务是否已在运行

```bash
lsof -ti:3001 2>/dev/null && echo "Backend running" || echo "Backend not running"
lsof -ti:5173 2>/dev/null && echo "Frontend running" || echo "Frontend not running"
```

### 2. 启动后端服务（如未运行）

```bash
cd /Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor/server
if ! lsof -ti:3001 >/dev/null 2>&1; then
  echo "Starting backend..."
  nohup npm run dev > /tmp/team-monitor-backend.log 2>&1 &
  sleep 3
  if lsof -ti:3001 >/dev/null 2>&1; then
    echo "✅ Backend started on http://localhost:3001"
  else
    echo "❌ Backend failed to start, check /tmp/team-monitor-backend.log"
  fi
else
  echo "✅ Backend already running on http://localhost:3001"
fi
```

### 3. 启动前端服务（如未运行）

```bash
cd /Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor/client
if ! lsof -ti:5173 >/dev/null 2>&1; then
  echo "Starting frontend..."
  nohup npm run dev > /tmp/team-monitor-frontend.log 2>&1 &
  sleep 3
  if lsof -ti:5173 >/dev/null 2>&1; then
    echo "✅ Frontend started on http://localhost:5173"
  else
    echo "❌ Frontend failed to start, check /tmp/team-monitor-frontend.log"
  fi
else
  echo "✅ Frontend already running on http://localhost:5173"
fi
```

### 4. 打开浏览器

使用 Chrome DevTools MCP 打开浏览器访问 http://localhost:5173

### 5. 输出状态信息

向用户显示：
- 后端状态：运行中/已启动 + URL
- 前端状态：运行中/已启动 + URL
- 浏览器：已打开/请手动访问
- 日志位置：/tmp/team-monitor-*.log

## Usage

用户输入 `/team-monitor` 或 `team-monitor` 时：
1. 执行上述步骤 1-5
2. 确保服务在后台运行
3. 浏览器自动打开监控页面

## Stop Command

如需停止服务：
```bash
kill $(lsof -ti:3001) 2>/dev/null && echo "Backend stopped"
kill $(lsof -ti:5173) 2>/dev/null && echo "Frontend stopped"
```
