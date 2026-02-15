import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Socket } from 'socket.io-client';
import type { Task, ServerToClientEvents, ClientToServerEvents } from '../types';

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  groupedTasks: {
    pending: Task[];
    in_progress: Task[];
    completed: Task[];
  };
}

export function useTasks(
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null,
  teamName: string | null
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 按状态分组任务
  const groupedTasks = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'pending'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      completed: tasks.filter((t) => t.status === 'completed'),
    };
  }, [tasks]);

  // 处理任务创建
  const handleTaskCreated = useCallback(
    (data: { teamName: string; task: Task }) => {
      if (data.teamName !== teamName) return;
      setTasks((prev) => {
        // 避免重复添加
        if (prev.some((t) => t.id === data.task.id)) {
          return prev;
        }
        return [...prev, data.task];
      });
    },
    [teamName]
  );

  // 处理任务更新
  const handleTaskUpdated = useCallback(
    (data: { teamName: string; task: Task }) => {
      if (data.teamName !== teamName) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? data.task : t))
      );
    },
    [teamName]
  );

  // 处理任务删除
  const handleTaskDeleted = useCallback(
    (data: { teamName: string; taskId: string }) => {
      if (data.teamName !== teamName) return;
      setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
    },
    [teamName]
  );

  // 处理初始任务列表
  const handleTasksInitial = useCallback(
    (data: { teamName: string; tasks: Task[] }) => {
      if (data.teamName !== teamName) return;
      setTasks(data.tasks);
      setIsLoading(false);
    },
    [teamName]
  );

  useEffect(() => {
    if (!socket || !teamName) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 订阅任务更新
    socket.emit('subscribe:tasks', teamName);

    // 监听任务事件
    socket.on('tasks:initial', handleTasksInitial);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('tasks:initial', handleTasksInitial);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [
    socket,
    teamName,
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
    handleTasksInitial,
  ]);

  return { tasks, isLoading, groupedTasks };
}
