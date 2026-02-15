export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deleted';

export interface Task {
  id: string;
  subject: string;
  description: string;
  activeForm?: string;
  status: TaskStatus;
  owner?: string;
  blocks: string[];
  blockedBy: string[];
  metadata?: Record<string, unknown>;
}

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

// 团队列表项
export interface Team {
  name: string;
  description: string;
  createdAt: number;
  leadAgentId: string;
  memberCount: number;
}

// 消息类型
export interface Message {
  from: string;
  text: string;
  timestamp: string;
  color?: string;
  read?: boolean;
}

// Socket.io 事件
export interface ServerToClientEvents {
  'team:updated': (team: TeamConfig) => void;
  'message:received': (data: { teamName: string; memberName: string; message: Message }) => void;
  'teams:initial': (teams: TeamConfig[]) => void;
  'task:created': (data: { teamName: string; task: Task }) => void;
  'task:updated': (data: { teamName: string; task: Task }) => void;
  'task:deleted': (data: { teamName: string; taskId: string }) => void;
  'tasks:initial': (data: { teamName: string; tasks: Task[] }) => void;
}

export interface ClientToServerEvents {
  'subscribe:team': (teamName: string) => void;
  'subscribe:member': (data: { teamName: string; memberName: string }) => void;
  'subscribe:tasks': (teamName: string) => void;
}
