/**
 * Agent Teams 监控系统类型定义
 */

// 成员类型
export interface Member {
  agentId: string;
  name: string;
  agentType: string;
  model: string;
  joinedAt: number;
  tmuxPaneId?: string;
  cwd?: string;
  subscriptions: string[];
  prompt?: string;
  color?: string;
  planModeRequired?: boolean;
  backendType?: string;
}

// 团队配置
export interface TeamConfig {
  name: string;
  description: string;
  createdAt: number;
  leadAgentId: string;
  leadSessionId: string;
  members: Member[];
}

// 消息类型
export interface Message {
  from: string;
  text: string;
  timestamp: string;
  color?: string;
  read?: boolean;
}

// 团队信息（API返回）
export interface Team {
  name: string;
  description: string;
  createdAt: number;
  leadAgentId: string;
  memberCount: number;
}

// WebSocket 事件类型
export interface ServerToClientEvents {
  'team:updated': (team: TeamConfig) => void;
  'message:received': (data: { teamName: string; memberName: string; message: Message }) => void;
  'teams:initial': (teams: TeamConfig[]) => void;
}

export interface ClientToServerEvents {
  'subscribe:team': (teamName: string) => void;
  'subscribe:member': (data: { teamName: string; memberName: string }) => void;
}

// 文件变更事件
export interface FileChangeEvent {
  type: 'config' | 'inbox';
  teamName: string;
  memberName?: string;
  path: string;
}
