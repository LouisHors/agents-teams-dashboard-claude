# Agent Teams Monitor

A real-time web dashboard for monitoring Claude Code Agent Teams communication. Built with Express + React, featuring WebSocket real-time updates.

## Quick Start

### Via npm (Recommended)

```bash
# Install globally
npm install -g team-monitor-cli

# Start the monitor
team-monitor
# or use short alias
tm
```

### Via Claude Code Skill

```bash
# In Claude Code session
/team-monitor
```

Then open http://localhost:5173

## Features

- **Real-time Monitoring**: WebSocket-powered live updates
- **File System Watch**: Auto-detects changes in `~/.claude/teams/`
- **Three-Panel Layout**: Teams → Members → Messages
- **Protocol Messages**: JSON-formatted with syntax highlighting
- **Dark Theme**: Zinc color palette, easy on the eyes
- **CLI Interface**: Simple commands to start/stop/check status

## Project Structure

```
agent-teams-dashboard/
├── packages/
│   └── team-monitor-cli/         # npm package
│       ├── bin/                  # CLI entry point
│       ├── lib/                  # Core library
│       ├── server/               # Express + Socket.io backend
│       ├── client/               # React + Tailwind frontend
│       └── scripts/              # Install scripts
├── .claude/
│   └── skills/team-monitor/      # Claude Skill definition
│       └── SKILL.md
├── install-skill.sh              # Skill installer
├── team-monitor                  # Smart launcher script (legacy)
└── README.md
```

## Installation Methods

### 1. npm Global (Recommended for users)

```bash
npm install -g team-monitor-cli
```

Then use `team-monitor` or `tm` command anywhere.

### 2. Claude Code Skill

```bash
# Copy skill to your Claude Code skills directory
cp -r .claude/skills/team-monitor ~/.claude/skills/
```

Then use `/team-monitor` in any Claude Code session.

### 3. Local Development

```bash
git clone https://github.com/LouisHors/agents-teams-dashboard-claude.git
cd agent-teams-dashboard/packages/team-monitor-cli
npm install
npm link  # For local testing
```

## Commands

```bash
team-monitor start      # Start services (default)
team-monitor stop       # Stop services
team-monitor restart    # Restart services
team-monitor status     # Check status
team-monitor logs       # View logs
team-monitor doctor     # Check system requirements
```

### Options

```bash
-p, --port <port>       Backend port (default: 3001)
-c, --client <port>     Frontend port (default: 5173)
-d, --detach           Run in background
-v, --verbose          Verbose output
-h, --help             Show help
```

## API Endpoints

- `GET /api/teams` - List all teams
- `GET /api/teams/:name/members` - Get team members
- `GET /api/teams/:name/messages/:member` - Get member messages
- `WS /` - WebSocket for real-time updates

## Technical Stack

- **Backend**: Express.js, Socket.io, chokidar, TypeScript
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Communication**: WebSocket (Socket.io)
- **Monitoring**: File system watch (chokidar)

## Screenshots

The dashboard features:
- Dark theme with zinc color palette
- Three-column layout (Teams | Members | Messages)
- Real-time message updates
- Protocol message highlighting (amber JSON)
- Online status indicators

## Development

### Start Backend

```bash
cd agent-teams-monitor/server
npm install
npm run dev
```

### Start Frontend

```bash
cd agent-teams-monitor/client
npm install
npm run dev
```

## License

MIT
