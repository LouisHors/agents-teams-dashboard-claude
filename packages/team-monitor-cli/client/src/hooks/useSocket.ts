import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types';

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

interface UseSocketReturn extends SocketState {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  reconnect: () => void;
  subscribeToTeam: (teamName: string) => void;
  subscribeToMember: (teamName: string, memberName: string) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<SocketState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const subscribeToTeam = useCallback((teamName: string) => {
    socketRef.current?.emit('subscribe:team', teamName);
  }, []);

  const subscribeToMember = useCallback((teamName: string, memberName: string) => {
    socketRef.current?.emit('subscribe:member', { teamName, memberName });
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    updateState({ connecting: true, error: null });

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      updateState({ connected: true, connecting: false, error: null });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      updateState({ connected: false });
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
      updateState({
        connected: false,
        connecting: false,
        error: err.message,
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket.io as any).on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      updateState({ connected: true, connecting: false, error: null });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket.io as any).on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Socket reconnection attempt:', attemptNumber);
      updateState({ connecting: true });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket.io as any).on('reconnect_error', (err: Error) => {
      console.error('Socket reconnection error:', err.message);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket.io as any).on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      updateState({
        connected: false,
        connecting: false,
        error: 'Reconnection failed',
      });
    });

    socketRef.current = socket;
  }, [updateState]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return {
    socket: socketRef.current,
    ...state,
    reconnect,
    subscribeToTeam,
    subscribeToMember,
  };
}
