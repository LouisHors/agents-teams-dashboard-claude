import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { TeamConfig, Message, Task, FileChangeEvent } from './types';

const TEAMS_DIR = path.join(process.env.HOME || '~', '.claude', 'teams');
const TASKS_DIR = path.join(process.env.HOME || '~', '.claude', 'tasks');

/**
 * 文件监控服务
 * 监控 ~/.claude/teams/ 目录下的 config.json 和 inbox 文件变化
 * 监控 ~/.claude/tasks/ 目录下的任务文件变化
 */
export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private teamsCache: Map<string, TeamConfig> = new Map();
  private messagesCache: Map<string, Message[]> = new Map();
  private tasksCache: Map<string, Map<string, Task>> = new Map(); // teamName -> (taskId -> Task)

  constructor() {
    super();
  }

  /**
   * 启动文件监控
   */
  start(): void {
    const watchPaths = [
      path.join(TEAMS_DIR, '*', 'config.json'),
      path.join(TEAMS_DIR, '*', 'inboxes', '*.json'),
      path.join(TASKS_DIR, '*', '*.json'),
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: false,
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    console.log(`[Watcher] 开始监控: ${TEAMS_DIR}, ${TASKS_DIR}`);
  }

  /**
   * 停止文件监控
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[Watcher] 已停止');
    }
  }

  /**
   * 处理文件变化
   */
  private handleFileChange(event: string, filePath: string): void {
    const relativePath = path.relative(TEAMS_DIR, filePath);
    const parts = relativePath.split(path.sep);

    if (parts.length < 2) return;

    const teamName = parts[0];
    const fileName = parts[parts.length - 1];

    // 判断文件类型
    if (fileName === 'config.json') {
      this.handleConfigChange(event, teamName, filePath);
    } else if (parts.includes('inboxes') && fileName.endsWith('.json')) {
      const memberName = fileName.replace('.json', '');
      this.handleInboxChange(event, teamName, memberName, filePath);
    } else if (this.isTaskFile(filePath)) {
      this.handleTaskChange(event, teamName, filePath);
    }
  }

  /**
   * 检查是否为任务文件
   */
  private isTaskFile(filePath: string): boolean {
    const relativePath = path.relative(TASKS_DIR, filePath);
    const parts = relativePath.split(path.sep);
    return parts.length === 2 && parts[1].endsWith('.json');
  }

  /**
   * 处理配置文件变化
   */
  private handleConfigChange(event: string, teamName: string, filePath: string): void {
    if (event === 'unlink') {
      this.teamsCache.delete(teamName);
      this.emit('team:deleted', { teamName });
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: TeamConfig = JSON.parse(content);
      this.teamsCache.set(teamName, config);
      this.emit('team:updated', config);
    } catch (error) {
      console.error(`[Watcher] 解析配置失败 ${filePath}:`, error);
    }
  }

  /**
   * 处理 inbox 文件变化
   */
  private handleInboxChange(event: string, teamName: string, memberName: string, filePath: string): void {
    if (event === 'unlink') {
      const cacheKey = `${teamName}/${memberName}`;
      this.messagesCache.delete(cacheKey);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const messages: Message[] = JSON.parse(content);
      const cacheKey = `${teamName}/${memberName}`;

      // 检查是否有新消息
      const oldMessages = this.messagesCache.get(cacheKey) || [];
      const newMessages = messages.filter(
        (msg) => !oldMessages.some((old) => old.timestamp === msg.timestamp && old.from === msg.from)
      );

      this.messagesCache.set(cacheKey, messages);

      // 只发送新增的消息
      for (const message of newMessages) {
        this.emit('message:received', {
          teamName,
          memberName,
          message,
        });
      }
    } catch (error) {
      console.error(`[Watcher] 解析 inbox 失败 ${filePath}:`, error);
    }
  }

  /**
   * 处理任务文件变化
   */
  private handleTaskChange(event: string, teamName: string, filePath: string): void {
    const taskId = path.basename(filePath, '.json');

    if (event === 'unlink') {
      const teamTasks = this.tasksCache.get(teamName);
      if (teamTasks) {
        teamTasks.delete(taskId);
        this.emit('task:deleted', { teamName, taskId });
      }
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const task: Task = JSON.parse(content);

      // 确保 task.id 与文件名一致
      task.id = taskId;

      // 获取或创建该团队的任务缓存
      let teamTasks = this.tasksCache.get(teamName);
      if (!teamTasks) {
        teamTasks = new Map();
        this.tasksCache.set(teamName, teamTasks);
      }

      // 检查是新增还是更新
      const isNewTask = !teamTasks.has(taskId);
      teamTasks.set(taskId, task);

      // 发送事件
      if (isNewTask) {
        this.emit('task:created', { teamName, task });
      } else {
        this.emit('task:updated', { teamName, task });
      }
    } catch (error) {
      console.error(`[Watcher] 解析任务文件失败 ${filePath}:`, error);
    }
  }

  /**
   * 获取所有团队
   */
  getAllTeams(): TeamConfig[] {
    return Array.from(this.teamsCache.values());
  }

  /**
   * 获取指定团队
   */
  getTeam(teamName: string): TeamConfig | undefined {
    return this.teamsCache.get(teamName);
  }

  /**
   * 获取团队成员
   */
  getTeamMembers(teamName: string): Member[] {
    const team = this.teamsCache.get(teamName);
    return team?.members || [];
  }

  /**
   * 获取成员消息
   */
  getMemberMessages(teamName: string, memberName: string): Message[] {
    const cacheKey = `${teamName}/${memberName}`;
    return this.messagesCache.get(cacheKey) || [];
  }

  /**
   * 获取团队的所有任务
   */
  getTeamTasks(teamName: string): Task[] {
    const teamTasks = this.tasksCache.get(teamName);
    return teamTasks ? Array.from(teamTasks.values()) : [];
  }

  /**
   * 获取单个任务
   */
  getTask(teamName: string, taskId: string): Task | undefined {
    const teamTasks = this.tasksCache.get(teamName);
    return teamTasks?.get(taskId);
  }

  /**
   * 加载所有现有数据
   */
  async loadAllData(): Promise<void> {
    try {
      const teams = await fs.promises.readdir(TEAMS_DIR, { withFileTypes: true });

      for (const team of teams) {
        if (!team.isDirectory()) continue;

        const teamName = team.name;
        const configPath = path.join(TEAMS_DIR, teamName, 'config.json');
        const inboxDir = path.join(TEAMS_DIR, teamName, 'inboxes');

        // 加载配置
        try {
          const configContent = await fs.promises.readFile(configPath, 'utf-8');
          const config: TeamConfig = JSON.parse(configContent);
          // 使用 config.name（原始团队名）作为 key，而不是目录名
          this.teamsCache.set(config.name, config);
        } catch (e) {
          // 忽略不存在的配置
        }

        // 加载消息（需要先获取配置中的原始团队名）
        try {
          const configContent = await fs.promises.readFile(configPath, 'utf-8');
          const config: TeamConfig = JSON.parse(configContent);
          const inboxFiles = await fs.promises.readdir(inboxDir);
          for (const file of inboxFiles) {
            if (!file.endsWith('.json')) continue;
            const memberName = file.replace('.json', '');
            const inboxPath = path.join(inboxDir, file);
            const content = await fs.promises.readFile(inboxPath, 'utf-8');
            const messages: Message[] = JSON.parse(content);
            // 使用原始团队名作为 key
            this.messagesCache.set(`${config.name}/${memberName}`, messages);
          }
        } catch (e) {
          // 忽略不存在的 inbox 目录或配置
        }
      }

      console.log(`[Watcher] 已加载 ${this.teamsCache.size} 个团队`);

      // 加载所有任务
      await this.loadAllTasks();
    } catch (error) {
      console.error('[Watcher] 加载数据失败:', error);
    }
  }

  /**
   * 加载所有任务数据
   */
  private async loadAllTasks(): Promise<void> {
    try {
      const taskTeams = await fs.promises.readdir(TASKS_DIR, { withFileTypes: true });

      for (const teamDir of taskTeams) {
        if (!teamDir.isDirectory()) continue;

        const teamName = teamDir.name;
        const taskDir = path.join(TASKS_DIR, teamName);

        try {
          const taskFiles = await fs.promises.readdir(taskDir);
          const teamTasks = new Map<string, Task>();

          for (const file of taskFiles) {
            if (!file.endsWith('.json')) continue;
            const taskId = file.replace('.json', '');
            const taskPath = path.join(taskDir, file);

            try {
              const content = await fs.promises.readFile(taskPath, 'utf-8');
              const task: Task = JSON.parse(content);
              task.id = taskId;
              teamTasks.set(taskId, task);
            } catch (e) {
              console.error(`[Watcher] 加载任务失败 ${taskPath}:`, e);
            }
          }

          if (teamTasks.size > 0) {
            this.tasksCache.set(teamName, teamTasks);
            console.log(`[Watcher] 已加载团队 "${teamName}" 的 ${teamTasks.size} 个任务`);
          }
        } catch (e) {
          // 忽略不存在的任务目录
        }
      }

      console.log(`[Watcher] 已加载 ${this.tasksCache.size} 个团队的任务`);
    } catch (error) {
      // 任务目录可能不存在，忽略错误
      console.log('[Watcher] 任务目录不存在或无法访问');
    }
  }
}

// 导出单例
import type { Member } from './types';
export const fileWatcher = new FileWatcher();
