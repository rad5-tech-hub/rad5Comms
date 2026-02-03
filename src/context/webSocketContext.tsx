// src/context/WebSocketContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ['websocket'],
    });

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

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};