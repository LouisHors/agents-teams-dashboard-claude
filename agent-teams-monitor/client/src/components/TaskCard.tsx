import { useState } from 'react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 截取描述摘要（前 80 字符）
  const descriptionSummary = task.description
    ? task.description.slice(0, 80) + (task.description.length > 80 ? '...' : '')
    : '';

  // 状态颜色映射
  const statusColors = {
    pending: 'border-amber-500/50 bg-amber-500/5',
    in_progress: 'border-cyan-500/50 bg-cyan-500/5',
    completed: 'border-emerald-500/50 bg-emerald-500/5',
    deleted: 'border-zinc-600/50 bg-zinc-800/50 opacity-50',
  };

  // 状态标签
  const statusLabels = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    deleted: '已删除',
  };

  // 检查是否被阻塞
  const isBlocked = task.blockedBy && task.blockedBy.length > 0;
  // 检查是否阻塞其他任务
  const isBlocking = task.blocks && task.blocks.length > 0;

  return (
    <div
      className={`
        relative p-3 rounded-lg border cursor-pointer
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${statusColors[task.status] || statusColors.pending}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 标题 */}
      <h4 className="font-medium text-zinc-200 text-sm mb-1 pr-6">
        {task.subject}
      </h4>

      {/* 描述摘要（仅在未展开时显示） */}
      {!isExpanded && descriptionSummary && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
          {descriptionSummary}
        </p>
      )}

      {/* 展开内容 */}
      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {task.description && (
            <p className="text-xs text-zinc-400 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {task.activeForm && (
            <p className="text-xs text-cyan-400">
              <span className="text-zinc-600">当前活动: </span>
              {task.activeForm}
            </p>
          )}

          {/* 依赖关系 */}
          {(isBlocked || isBlocking) && (
            <div className="pt-2 border-t border-zinc-700/50 space-y-1">
              {isBlocked && (
                <p className="text-xs text-red-400">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    被阻塞: {task.blockedBy.join(', ')}
                  </span>
                </p>
              )}
              {isBlocking && (
                <p className="text-xs text-amber-400">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    阻塞: {task.blocks.join(', ')}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* 元数据 */}
          {task.metadata && Object.keys(task.metadata).length > 0 && (
            <div className="pt-2 border-t border-zinc-700/50">
              <p className="text-xs text-zinc-600">元数据:</p>
              <pre className="text-xs text-zinc-500 mt-1 overflow-x-auto">
                {JSON.stringify(task.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 底部信息栏 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-700/30">
        <div className="flex items-center gap-2">
          {/* 负责人 */}
          {task.owner && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              @{task.owner}
            </span>
          )}

          {/* 状态标签 */}
          <span className="text-xs text-zinc-500">
            {statusLabels[task.status]}
          </span>
        </div>

        {/* 依赖指示器 */}
        <div className="flex items-center gap-1">
          {isBlocked && (
            <span className="text-red-500" title="被阻塞">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {isBlocking && (
            <span className="text-amber-500" title="阻塞其他任务">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* 展开/收起指示器 */}
      <div className="absolute top-2 right-2 text-zinc-600">
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
