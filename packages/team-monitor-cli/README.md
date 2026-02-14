# Team Monitor CLI

A real-time dashboard for monitoring Claude Code Agent Teams communication.

## Features

- 🔴 **Real-time Monitoring**: WebSocket-powered live updates
- 📁 **File System Watch**: Auto-detects changes in `~/.claude/teams/`
- 🎨 **Three-Panel Layout**: Teams → Members → Messages
- 📊 **Protocol Messages**: JSON-formatted with syntax highlighting
- 🌙 **Dark Theme**: Zinc color palette, easy on the eyes
- 🚀 **One Command**: Simple CLI interface

## Installation

### Global Installation (Recommended)

```bash
npm install -g team-monitor-cli
```

This will:
- Install the `team-monitor` and `tm` commands globally
- Make dashboard available at http://localhost:5173

For Claude Code skill, copy the skill file manually:
```bash
cp -r node_modules/team-monitor-cli/scripts/skill ~/.claude/skills/team-monitor
```

### Local Installation

```bash
npm install team-monitor-cli
npx team-monitor
```

## Quick Start

```bash
# Start the monitor
team-monitor

# Or use the short alias
tm

# In Claude Code
/team-monitor
```

Then open http://localhost:5173

## Commands

```bash
team-monitor start      # Start monitor (default)
team-monitor stop       # Stop monitor
team-monitor restart    # Restart monitor
team-monitor status     # Check status
team-monitor logs       # Show logs
team-monitor doctor     # Check system requirements
```

## Options

```bash
-p, --port <port>       Backend port (default: 3001)
-c, --client <port>     Frontend port (default: 5173)
-d, --detach           Run in background
-v, --verbose          Verbose output
-h, --help             Show help
```

## Examples

```bash
# Start with custom ports
team-monitor -p 8080 -c 3000

# Check status
team-monitor status

# View logs
team-monitor logs

# Follow logs (like tail -f)
team-monitor logs -f

# Stop services
team-monitor stop
```

## System Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **OS**: macOS, Linux, Windows
- **Ports**: 3001 (backend), 5173 (frontend) - configurable

Run `team-monitor doctor` to check your system.

## API

When running, the following endpoints are available:

- `GET /api/teams` - List all teams
- `GET /api/teams/:name/members` - Get team members
- `GET /api/teams/:name/messages/:member` - Get member messages
- `WS /` - WebSocket for real-time updates

## Claude Code Integration

After installation, you can use in Claude Code:

```
/team-monitor           # Start monitor
/team-monitor stop      # Stop monitor
/team-monitor status    # Check status
```

## Troubleshooting

### Port already in use

```bash
# Check what's using the port
lsof -ti:3001

# Use different ports
team-monitor -p 8080 -c 3000
```

### Permission denied

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use npx
npx team-monitor
```

### Logs location

```bash
# View logs
team-monitor logs

# Or manually
cat /tmp/team-monitor/backend.log
cat /tmp/team-monitor/frontend.log
```

## Development

```bash
git clone https://github.com/LouisHors/agents-teams-dashboard-claude.git
cd agent-teams-dashboard/packages/team-monitor-cli
npm install
npm link  # For local testing
```

## License

MIT

## Contributing

Pull requests welcome!

## Support

- GitHub Issues: https://github.com/LouisHors/agents-teams-dashboard-claude/issues
- Discussions: https://github.com/LouisHors/agents-teams-dashboard-claude/discussions
