import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import teamsRouter from './routes/teams';
import { fileWatcher } from './watcher';
import type { ServerToClientEvents, ClientToServerEvents } from './types';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 创建 Express 应用
const app = express();
const httpServer = createServer(app);

// 配置 CORS
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

// API 路由
app.use('/api/teams', teamsRouter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 创建 Socket.io 服务器
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`[Socket] 客户端连接: ${socket.id}`);

  // 发送初始数据
  const teams = fileWatcher.getAllTeams();
  socket.emit('teams:initial', teams);

  // 订阅团队更新
  socket.on('subscribe:team', (teamName) => {
    console.log(`[Socket] ${socket.id} 订阅团队: ${teamName}`);
    socket.join(`team:${teamName}`);
  });

  // 订阅成员消息
  socket.on('subscribe:member', (data) => {
    console.log(`[Socket] ${socket.id} 订阅成员: ${data.teamName}/${data.memberName}`);
    socket.join(`member:${data.teamName}:${data.memberName}`);
  });

  // 订阅团队任务
  socket.on('subscribe:tasks', (teamName) => {
    console.log(`[Socket] ${socket.id} 订阅任务: ${teamName}`);
    socket.join(`tasks:${teamName}`);
    // 发送当前任务列表
    const tasks = fileWatcher.getTeamTasks(teamName);
    socket.emit('tasks:initial', { teamName, tasks });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] 客户端断开: ${socket.id}`);
  });
});

// 文件变化事件转发到 WebSocket
fileWatcher.on('team:updated', (team) => {
  console.log(`[Watcher] 团队更新: ${team.name}`);
  io.emit('team:updated', team);
  io.to(`team:${team.name}`).emit('team:updated', team);
});

fileWatcher.on('message:received', (data) => {
  console.log(`[Watcher] 新消息: ${data.teamName}/${data.memberName}`);
  io.emit('message:received', data);
  io.to(`team:${data.teamName}`).emit('message:received', data);
  io.to(`member:${data.teamName}:${data.memberName}`).emit('message:received', data);
});

// 任务事件转发到 WebSocket
fileWatcher.on('task:created', (data) => {
  console.log(`[Watcher] 新任务: ${data.teamName}/${data.task.id}`);
  io.emit('task:created', data);
  io.to(`team:${data.teamName}`).emit('task:created', data);
  io.to(`tasks:${data.teamName}`).emit('task:created', data);
});

fileWatcher.on('task:updated', (data) => {
  console.log(`[Watcher] 任务更新: ${data.teamName}/${data.task.id}`);
  io.emit('task:updated', data);
  io.to(`team:${data.teamName}`).emit('task:updated', data);
  io.to(`tasks:${data.teamName}`).emit('task:updated', data);
});

fileWatcher.on('task:deleted', (data) => {
  console.log(`[Watcher] 任务删除: ${data.teamName}/${data.taskId}`);
  io.emit('task:deleted', data);
  io.to(`team:${data.teamName}`).emit('task:deleted', data);
  io.to(`tasks:${data.teamName}`).emit('task:deleted', data);
});

// 启动服务器
async function startServer() {
  // 先加载所有数据
  await fileWatcher.loadAllData();

  // 启动文件监控
  fileWatcher.start();

  // 启动 HTTP 服务器
  httpServer.listen(PORT, () => {
    console.log(`[Server] Agent Teams 监控服务器运行在端口 ${PORT}`);
    console.log(`[Server] API: http://localhost:${PORT}/api`);
    console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
    console.log(`[Server] CORS: ${CORS_ORIGIN}`);
  });
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[Server] 正在关闭...');
  fileWatcher.stop();
  httpServer.close(() => {
    console.log('[Server] 已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Server] 正在关闭...');
  fileWatcher.stop();
  httpServer.close(() => {
    console.log('[Server] 已关闭');
    process.exit(0);
  });
});

// 启动
startServer().catch((error) => {
  console.error('[Server] 启动失败:', error);
  process.exit(1);
});
