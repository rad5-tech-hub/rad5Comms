// src/context/WebSocketContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Message {
  // Define your message type according to your data structure
  id: string;
  sender: { id: string; name: string; avatar?: string };
  text: string;
  time: string;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  tempId?: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

export const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const socket = useMemo(() => {
    if (!token) return null;
    return io(API_BASE_URL, {
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

    socket.on('online_users', (users: string[]) => {
      setOnlineUsers(users);
    });

    // Centralized event listeners for message status
    socket.on('messageSent', (message: Message) => {
      window.dispatchEvent(new CustomEvent('message-status-update', { detail: { messageId: message.id, status: 'sent', tempId: message.tempId } }));
    });
    
    socket.on('messageDelivered', (data: { messageId: string, recipientId: string }) => {
        window.dispatchEvent(new CustomEvent('message-status-update', { detail: { messageId: data.messageId, status: 'delivered' } }));
    });
    
    socket.on('messageRead', (data: { messageId: string, readerId: string }) => {
        window.dispatchEvent(new CustomEvent('message-status-update', { detail: { messageId: data.messageId, status: 'read' } }));
    });


    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('online_users');
      socket.off('messageSent');
      socket.off('messageDelivered');
      socket.off('messageRead');
      socket.disconnect();
    };
  }, [socket]);

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    onlineUsers,
  }), [socket, isConnected, onlineUsers]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
