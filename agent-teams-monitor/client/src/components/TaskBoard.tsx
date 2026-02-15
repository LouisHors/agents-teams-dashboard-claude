import { useMemo } from 'react';
import { TaskCard } from './TaskCard';
import type { Task } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  isLoading: boolean;
}

interface Column {
  id: 'pending' | 'in_progress' | 'completed';
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: '待处理', color: 'border-amber-500/30' },
  { id: 'in_progress', title: '进行中', color: 'border-cyan-500/30' },
  { id: 'completed', title: '已完成', color: 'border-emerald-500/30' },
];

export function TaskBoard({ tasks, isLoading }: TaskBoardProps) {
  // 按状态分组任务
  const groupedTasks = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'pending'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      completed: tasks.filter((t) => t.status === 'completed'),
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-cyan-500 rounded-full animate-spin" />
          加载任务...
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
        暂无任务
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-3 min-w-[600px] p-2">
        {columns.map((column) => {
          const columnTasks = groupedTasks[column.id];

          return (
            <div
              key={column.id}
              className={`
                flex-1 flex flex-col min-w-[180px] max-w-[280px]
                bg-zinc-900/30 rounded-lg border-t-2 ${column.color}
              `}
            >
              {/* 列标题 */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                <span className="font-medium text-zinc-300 text-sm">
                  {column.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                  {columnTasks.length}
                </span>
              </div>

              {/* 任务列表 */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-xs">
                    无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
