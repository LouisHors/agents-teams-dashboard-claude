# Agent Teams Monitor

A real-time web dashboard for monitoring Agent Teams communication. Built with Express + React, featuring WebSocket real-time updates.

## Quick Start

```bash
# Start the monitor
./team-monitor

# Or use Claude Code command
/team-monitor
```

Then open http://localhost:5173

## Features

- **Real-time Monitoring**: WebSocket-powered live updates
- **File System Watch**: Auto-detects changes in `~/.claude/teams/`
- **Three-Panel Layout**: Teams → Members → Messages
- **Protocol Messages**: JSON-formatted with syntax highlighting
- **Dark Theme**: Zinc color palette, easy on the eyes

## Project Structure

```
agent-teams-dashboard/
├── agent-teams-monitor/          # Core monitoring app
│   ├── server/                   # Express + Socket.io backend
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point + WebSocket
│   │   │   ├── watcher.ts       # File system watcher
│   │   │   ├── types.ts         # TypeScript types
│   │   │   └── routes/teams.ts  # REST API
│   │   └── package.json
│   └── client/                   # React + Tailwind frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── hooks/           # Custom hooks
│       │   └── App.tsx          # Main app
│       └── package.json
├── team-monitor                  # Smart launcher script
├── install-skill.sh              # Skill installer
└── .claude/
    ├── skills/team-monitor/      # Claude Skill definition
    └── commands/                 # Claude command config
```

## Usage as Skill

### Global Installation

```bash
./install-skill.sh global
```

Then use `/team-monitor` in any Claude Code session.

### Project-Level Installation

```bash
# In your project directory
/path/to/agent-teams-dashboard/install-skill.sh project
```

Or copy the monitor:

```bash
cp -r /path/to/agent-teams-dashboard/agent-teams-monitor ./
```

## Commands

```bash
./team-monitor start    # Start services (default)
./team-monitor stop     # Stop services
./team-monitor restart  # Restart services
./team-monitor status   # Check status
./team-monitor logs     # View logs
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
