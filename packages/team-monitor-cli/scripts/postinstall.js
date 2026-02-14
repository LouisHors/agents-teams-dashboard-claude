#!/usr/bin/env node

/**
 * Post-install script
 * Sets up Claude Code skill and command after npm install
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const chalk = {
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`
};

function main() {
  console.log(chalk.blue('\n=== Setting up Team Monitor ===\n'));

  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const skillsDir = path.join(claudeDir, 'skills', 'team-monitor');
  const commandsDir = path.join(claudeDir, 'commands');

  // Create directories
  [skillsDir, commandsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create skill definition
  const skillContent = `---
name: team-monitor
description: Launch Agent Teams Monitor dashboard. Usage: /team-monitor [start|stop|status|logs]
---

# Team Monitor

Start the Agent Teams Monitor to visualize real-time agent teams communication.

## Usage

\`\`\`
/team-monitor           # Start monitor
/team-monitor stop      # Stop monitor
/team-monitor status    # Check status
/team-monitor logs      # View logs
\`\`\`

## Features

- Real-time monitoring via WebSocket
- File system watching (~/.claude/teams/)
- Three-panel layout: Teams | Members | Messages
- Protocol message highlighting
`;

  fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), skillContent);
  console.log(chalk.green('✓'), 'Skill definition created');

  // Create command configuration
  const packageRoot = path.resolve(__dirname, '..');
  const commandContent = {
    name: 'team-monitor',
    description: '启动 Agent Teams Monitor 监控面板',
    prompt: `启动 Agent Teams Monitor。

执行以下步骤：
1. 检查服务是否已在运行
2. 如未运行，启动后端 (port 3001)
3. 如未运行，启动前端 (port 5173)
4. 打开浏览器访问 http://localhost:5173
5. 报告状态给用户`,
    type: 'local',
    cwd: packageRoot
  };

  fs.writeFileSync(
    path.join(commandsDir, 'team-monitor.json'),
    JSON.stringify(commandContent, null, 2)
  );
  console.log(chalk.green('✓'), 'Command configuration created');

  console.log('\n' + chalk.cyan('Usage:'));
  console.log('  team-monitor       # Start monitor');
  console.log('  tm                 # Short alias');
  console.log('  /team-monitor      # In Claude Code');
  console.log('');
}

main();
