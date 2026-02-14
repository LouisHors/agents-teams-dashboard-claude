# Agent Teams Monitor - 实现指南

## 项目概述
基于验证过的文件系统通信机制，实现一个实时监控 Agent Teams 日志文件的 Web 应用。

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Teams Monitor                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     WebSocket      ┌──────────────────┐   │
│  │   React UI   │ ◄────────────────► │   Express API    │   │
│  │  (三栏布局)   │                    │  + Socket.io     │   │
│  └──────────────┘                    └────────┬─────────┘   │
│                                               │              │
│                                        ┌──────┴──────┐       │
│                                        │  File Watcher │       │
│                                        │  (chokidar)   │       │
│                                        └──────┬──────┘       │
│                    ┌──────────────────────────┼──────────┐   │
│                    ▼                          ▼          ▼   │
│              ~/.claude/               ~/.claude/    实时推送  │
│              teams/                   tasks/         到前端   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈
- **后端**: Express + Socket.io + chokidar + TypeScript
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **状态管理**: Zustand

---

## 目录结构

```
agent-teams-monitor/
├── server/                          # 后端服务
│   ├── src/
│   │   ├── index.ts                 # 入口文件
│   │   ├── watcher.ts               # 文件监控服务
│   │   ├── socket.ts                # WebSocket 服务
│   │   ├── types.ts                 # TypeScript 类型定义
│   │   └── routes/
│   │       ├── teams.ts             # Teams API
│   │       └── tasks.ts             # Tasks API
│   ├── package.json
│   └── tsconfig.json
│
└── client/                          # 前端应用
    ├── src/
    │   ├── main.tsx                 # 入口文件
    │   ├── App.tsx                  # 主组件
    │   ├── components/
    │   │   ├── Layout.tsx           # 三栏布局
    │   │   ├── TeamList.tsx         # 团队列表
    │   │   ├── MemberList.tsx       # 成员列表
    │   │   ├── MessagePanel.tsx     # 消息面板
    │   │   ├── MessageItem.tsx      # 消息项
    │   │   └── StatusBar.tsx        # 状态栏
    │   ├── hooks/
    │   │   ├── useSocket.ts         # WebSocket Hook
    │   │   ├── useTeams.ts          # Teams 数据 Hook
    │   │   └── useMessages.ts       # Messages 数据 Hook
    │   ├── lib/
    │   │   └── utils.ts             # 工具函数
    │   └── index.css                # 全局样式
    ├── components/ui/               # shadcn/ui 组件
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 后端实现步骤

### 1. 初始化项目

```bash
cd agent-teams-monitor/server
npm init -y
npm install express socket.io chokidar cors
npm install -D typescript @types/express @types/node @types/cors ts-node nodemon
npx tsc --init
```

### 2. tsconfig.json 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. 核心文件实现

#### src/types.ts
```typescript
export interface Team {
  name: string;
  description?: string;
  leadAgentId: string;
  members: Member[];
  createdAt?: number;
}

export interface Member {
  agentId: string;
  name: string;
  agentType: string;
  model?: string;
  color?: string;
  joinedAt?: number;
  backendType?: string;
}

export interface Message {
  from: string;
  text: string;
  summary?: string;
  timestamp: string;
  color?: string;
  read: boolean;
}

export interface Task {
  id: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  blocks: string[];
  blockedBy: string[];
}
```

#### src/watcher.ts
```typescript
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { Server } from 'socket.io';

const CLAUDE_DIR = path.join(process.env.HOME || '~', '.claude');
const TEAMS_DIR = path.join(CLAUDE_DIR, 'teams');
const TASKS_DIR = path.join(CLAUDE_DIR, 'tasks');

export class FileWatcher {
  private io: Server;
  private watchers: chokidar.FSWatcher[] = [];

  constructor(io: Server) {
    this.io = io;
  }

  async start() {
    // 监控 teams 目录
    const teamsWatcher = chokidar.watch(path.join(TEAMS_DIR, '*/**/*.json'), {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: false,
    });

    teamsWatcher
      .on('add', (filePath) => this.handleTeamFileChange(filePath, 'add'))
      .on('change', (filePath) => this.handleTeamFileChange(filePath, 'change'))
      .on('unlink', (filePath) => this.handleTeamFileChange(filePath, 'unlink'));

    this.watchers.push(teamsWatcher);

    console.log(`[Watcher] Watching ${TEAMS_DIR}`);
  }

  private async handleTeamFileChange(filePath: string, event: string) {
    console.log(`[Watcher] ${event}: ${filePath}`);

    try {
      if (filePath.includes('config.json')) {
        // 团队配置变化
        const content = await fs.readFile(filePath, 'utf-8');
        const team = JSON.parse(content);
        this.io.emit('team:updated', { team, event });
      } else if (filePath.includes('inboxes/')) {
        // 消息变化
        const memberName = path.basename(filePath, '.json');
        const content = await fs.readFile(filePath, 'utf-8');
        const messages = JSON.parse(content);
        this.io.emit('message:received', { member: memberName, messages, event });
      }
    } catch (error) {
      console.error('[Watcher] Error processing file:', error);
    }
  }

  stop() {
    this.watchers.forEach(w => w.close());
  }
}
```

#### src/routes/teams.ts
```typescript
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const TEAMS_DIR = path.join(process.env.HOME || '~', '.claude', 'teams');

// GET /api/teams - 获取所有团队
router.get('/', async (req, res) => {
  try {
    const teams: any[] = [];
    const entries = await fs.readdir(TEAMS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = path.join(TEAMS_DIR, entry.name, 'config.json');
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          const team = JSON.parse(content);
          teams.push(team);
        } catch (e) {
          // 忽略无法读取的团队
        }
      }
    }

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read teams' });
  }
});

// GET /api/teams/:name/members
router.get('/:name/members', async (req, res) => {
  try {
    const teamName = req.params.name;
    const configPath = path.join(TEAMS_DIR, teamName, 'config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    const team = JSON.parse(content);
    res.json(team.members || []);
  } catch (error) {
    res.status(404).json({ error: 'Team not found' });
  }
});

// GET /api/teams/:name/messages/:member
router.get('/:name/messages/:member', async (req, res) => {
  try {
    const { name, member } = req.params;
    const inboxPath = path.join(TEAMS_DIR, name, 'inboxes', `${member}.json`);
    const content = await fs.readFile(inboxPath, 'utf-8');
    const messages = JSON.parse(content);
    res.json(messages);
  } catch (error) {
    res.status(404).json({ error: 'Messages not found' });
  }
});

export default router;
```

#### src/index.ts
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { FileWatcher } from './watcher';
import teamsRouter from './routes/teams';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/teams', teamsRouter);

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

// 启动文件监控
const watcher = new FileWatcher(io);
watcher.start();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
```

### 4. package.json scripts

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 前端实现步骤

### 1. 初始化项目

```bash
cd agent-teams-monitor/client
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install socket.io-client zustand
npm install -D @types/node
```

### 2. 配置 Tailwind CSS

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
        },
      },
    },
  },
  plugins: [],
}
```

#### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-zinc-950 text-zinc-50;
    font-family: 'Inter', sans-serif;
  }
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 3px;
}
```

### 3. 核心组件实现

#### src/hooks/useSocket.ts
```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, connected };
}
```

#### src/hooks/useTeams.ts
```typescript
import { useState, useEffect } from 'react';

export interface Team {
  name: string;
  description?: string;
  leadAgentId: string;
  members: Member[];
}

export interface Member {
  agentId: string;
  name: string;
  agentType: string;
  color?: string;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  return { teams, loading, refetch: fetchTeams };
}
```

#### src/components/TeamList.tsx
```typescript
import { Team } from '../hooks/useTeams';

interface TeamListProps {
  teams: Team[];
  selectedTeam: string | null;
  onSelectTeam: (name: string) => void;
}

export function TeamList({ teams, selectedTeam, onSelectTeam }: TeamListProps) {
  return (
    <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Teams
        </h2>
        <input
          type="text"
          placeholder="Search teams..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {teams.map((team) => (
          <div
            key={team.name}
            onClick={() => onSelectTeam(team.name)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg cursor-pointer transition-colors ${
              selectedTeam === team.name
                ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                : 'hover:bg-zinc-800/50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              selectedTeam === team.name ? 'bg-cyan-500' : 'bg-emerald-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {team.name}
              </p>
              <p className="text-xs text-zinc-500">
                {team.members?.length || 0} members
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
```

#### src/App.tsx
```typescript
import { useState } from 'react';
import { TeamList } from './components/TeamList';
import { MemberList } from './components/MemberList';
import { MessagePanel } from './components/MessagePanel';
import { StatusBar } from './components/StatusBar';
import { useTeams } from './hooks/useTeams';
import { useSocket } from './hooks/useSocket';

function App() {
  const { teams } = useTeams();
  const { connected } = useSocket();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const currentTeam = teams.find(t => t.name === selectedTeam);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Agent Teams Monitor</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full border ${
            connected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <TeamList
          teams={teams}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
        />

        {currentTeam && (
          <MemberList
            team={currentTeam}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
          />
        )}

        {selectedMember && (
          <MessagePanel
            teamName={selectedTeam!}
            memberName={selectedMember}
          />
        )}
      </div>

      <StatusBar connected={connected} />
    </div>
  );
}

export default App;
```

---

## 启动步骤

### 1. 启动后端
```bash
cd agent-teams-monitor/server
npm install
npm run dev
```

### 2. 启动前端
```bash
cd agent-teams-monitor/client
npm install
npm run dev
```

### 3. 访问应用
打开浏览器访问 http://localhost:5173

---

## 扩展功能建议

1. **消息过滤器** - 按消息类型（普通/协议）过滤
2. **实时图表** - 显示消息数量随时间变化
3. **团队成员状态** - 在线/离线/空闲状态指示
4. **任务看板** - 可视化任务状态
5. **日志导出** - 导出消息历史为 JSON/CSV
