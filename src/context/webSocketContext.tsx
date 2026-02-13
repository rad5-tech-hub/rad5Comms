// src/context/WebSocketContext.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { WebSocketContext } from './ws';

const API_BASE_URL = import.meta.env.VITE_API_WEBHOOK_URL || 'http://localhost:3000';

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const socket = useMemo(() => {
    if (!token) return null;
    return io(  API_BASE_URL, {
      path: '/ws',
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ['websocket'],
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      toast.success('Connected to real-time chat');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        toast.error('Disconnected from chat. Please log in again.');
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        toast.warning('Network issue detected. Please check your connection.');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      if (err.message.includes('401') || err.message.includes('403')) {
        toast.error('Authentication failed. Logging out...');
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      toast.error(err.message || 'Chat error occurred');
    });

    socket.on('user_presence', (data: { userId: string; status: string }) => {
      setOnlineUsers((prev) => {
        const set = new Set(prev);
        if (data.status === 'online') {
          set.add(data.userId);
        } else {
          set.delete(data.userId);
        }
        return Array.from(set);
      });
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </WebSocketContext.Provider>
  );
};
