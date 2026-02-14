# My Project with Team Monitor

这是一个展示如何在项目中使用 Agent Teams Monitor 的示例。

## 安装

### 方法 1：使用全局安装的 Skill

如果你已经全局安装了 skill：

```bash
# 在任意 Claude Code 会话中
/team-monitor
```

### 方法 2：复制 monitor 到项目中

```bash
# 复制 monitor 到你的项目
cp -r /Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor ./

# 使用启动脚本
/Users/liuhao/CodeForPerson/agent-teams-dashboard/team-monitor start
```

### 方法 3：创建符号链接

```bash
# 创建符号链接（推荐，节省空间）
ln -s /Users/liuhao/CodeForPerson/agent-teams-dashboard/agent-teams-monitor ./agent-teams-monitor

# 然后使用启动脚本
./agent-teams-monitor/../team-monitor start
```

## 使用

启动后访问 http://localhost:5173 查看监控面板。

## 开发

当你在这个项目中创建 agent-teams 时，监控面板会自动显示它们的活动。
