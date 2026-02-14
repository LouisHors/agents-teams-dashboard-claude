#!/bin/bash

# Team Monitor Skill 安装脚本
# 允许其他项目使用 team-monitor skill

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="team-monitor"
CLAUDE_DIR="${HOME}/.claude"
SKILLS_DIR="${CLAUDE_DIR}/skills"
COMMANDS_DIR="${CLAUDE_DIR}/commands"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Team Monitor Skill Installer ===${NC}"
echo ""

# 检查参数
INSTALL_MODE="${1:-global}"

if [ "$INSTALL_MODE" = "global" ]; then
    echo "Installing in GLOBAL mode (available to all projects)..."
    TARGET_SKILL_DIR="${SKILLS_DIR}/${SKILL_NAME}"
    TARGET_CMD_DIR="${COMMANDS_DIR}"

    # 创建目录
    mkdir -p "${TARGET_SKILL_DIR}"
    mkdir -p "${TARGET_CMD_DIR}"

    # 复制 skill 文件
    cp "${SCRIPT_DIR}/.claude/skills/team-monitor/SKILL.md" "${TARGET_SKILL_DIR}/SKILL.md"

    # 创建全局命令配置
    cat > "${TARGET_CMD_DIR}/team-monitor.json" << 'EOF'
{
  "name": "team-monitor",
  "description": "启动 Agent Teams Monitor 监控面板",
  "prompt": "启动 Agent Teams Monitor 实时监控系统。\n\n步骤：\n1. 确定项目路径（当前目录或默认路径）\n2. 检查服务是否已在运行（端口 3001 和 5173）\n3. 如未运行，启动后端服务\n4. 如未运行，启动前端服务\n5. 等待服务就绪\n6. 打开浏览器访问 http://localhost:5173\n7. 向用户报告状态\n\n如果服务已在运行，直接打开浏览器并告知用户。",
  "type": "local",
  "cwd": "${HOME}/CodeForPerson/agent-teams-dashboard"
}
EOF

    echo -e "${GREEN}✓${NC} Skill installed to: ${TARGET_SKILL_DIR}"
    echo -e "${GREEN}✓${NC} Command config: ${TARGET_CMD_DIR}/team-monitor.json"

elif [ "$INSTALL_MODE" = "project" ]; then
    PROJECT_DIR="$(pwd)"
    echo "Installing in PROJECT mode for: ${PROJECT_DIR}"

    # 创建项目级 skill
    mkdir -p "${PROJECT_DIR}/.claude/skills/${SKILL_NAME}"
    mkdir -p "${PROJECT_DIR}/.claude/commands"

    # 复制 skill 文件（修改路径为相对路径）
    cat > "${PROJECT_DIR}/.claude/skills/${SKILL_NAME}/SKILL.md" << EOF
---
name: team-monitor
description: Launch Agent Teams Monitor for this project
---

# Team Monitor for $(basename "${PROJECT_DIR}")

## Project Path
${PROJECT_DIR}

## Quick Start
Run \`/team-monitor\` to start monitoring.
EOF

    # 创建项目级命令
    cat > "${PROJECT_DIR}/.claude/commands/team-monitor.json" << EOF
{
  "name": "team-monitor",
  "description": "启动 Agent Teams Monitor",
  "prompt": "启动 Agent Teams Monitor。项目路径: ${PROJECT_DIR}",
  "type": "local",
  "cwd": "${SCRIPT_DIR}"
}
EOF

    echo -e "${GREEN}✓${NC} Project skill installed to: ${PROJECT_DIR}/.claude/skills/${SKILL_NAME}"

else
    echo "Usage: $0 [global|project]"
    echo ""
    echo "Modes:"
    echo "  global  - Install for all projects (default)"
    echo "  project - Install for current project only"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Usage:"
echo "  /team-monitor        - Start monitor"
echo "  /team-monitor stop   - Stop monitor"
echo "  /team-monitor status - Check status"
echo "  /team-monitor logs   - View logs"
