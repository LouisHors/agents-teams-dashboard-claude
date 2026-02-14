import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { TeamConfig, Message, FileChangeEvent } from './types';

const TEAMS_DIR = path.join(process.env.HOME || '~', '.claude', 'teams');

/**
 * 文件监控服务
 * 监控 ~/.claude/teams/ 目录下的 config.json 和 inbox 文件变化
 */
export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private teamsCache: Map<string, TeamConfig> = new Map();
  private messagesCache: Map<string, Message[]> = new Map();

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

    console.log(`[Watcher] 开始监控: ${TEAMS_DIR}`);
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

    // 判断是 config 还是 inbox
    if (fileName === 'config.json') {
      this.handleConfigChange(event, teamName, filePath);
    } else if (parts.includes('inboxes') && fileName.endsWith('.json')) {
      const memberName = fileName.replace('.json', '');
      this.handleInboxChange(event, teamName, memberName, filePath);
    }
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
    } catch (error) {
      console.error('[Watcher] 加载数据失败:', error);
    }
  }
}

// 导出单例
import type { Member } from './types';
export const fileWatcher = new FileWatcher();
