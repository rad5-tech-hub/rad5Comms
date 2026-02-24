import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_API_WEBHOOK_URL;

export interface WebSocketContextType {
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

let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;
let isConnecting = false;

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connectSocket = () => {
      const token = localStorage.getItem('token');

      if (isConnecting) return;

      // Reuse existing connected socket for same token
      if (globalSocket && globalSocketToken === token && globalSocket.connected) {
        console.log('🔌 Reusing existing WebSocket connection, id:', globalSocket.id);
        if (mountedRef.current) {
          setSocketState(globalSocket);
          setIsConnected(true);
        }
        return;
      }

      // Disconnect existing socket if token changed or disconnected
      if (globalSocket) {
        globalSocket.removeAllListeners();
        globalSocket.disconnect();
        globalSocket = null;
        globalSocketToken = null;
      }

      if (!token) {
        if (mountedRef.current) {
          setSocketState(null);
          setIsConnected(false);
          setOnlineUsers([]);
        }
        return;
      }

      console.log('🔌 Creating WebSocket connection to', WS_BASE_URL);
      isConnecting = true;

      const newSocket = io(WS_BASE_URL, {
        path: '/ws',
        query: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('🔌 WebSocket connected, id:', newSocket.id, '| transport:', newSocket.io.engine?.transport?.name);
        isConnecting = false;
        if (mountedRef.current) {
          setIsConnected(true);
          setSocketState(newSocket); // ← set AFTER connected, not before
        }
      });

      newSocket.onAny((eventName: string, ...args: unknown[]) => {
        console.log(`📨 [socket event] ${eventName}:`, ...args);
      });

      newSocket.on('connect_error', (err) => {
        console.error('🔌 WebSocket connection error:', err.message);
        isConnecting = false;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        if (mountedRef.current) setIsConnected(false);
      });

      newSocket.on('online_users', (users: string[]) => {
        if (mountedRef.current) setOnlineUsers(users);
      });

      newSocket.on('user_presence', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
        if (!mountedRef.current) return;
        setOnlineUsers((prev) => {
          if (status === 'online' && !prev.includes(userId)) return [...prev, userId];
          if (status === 'offline') return prev.filter((id) => id !== userId);
          return prev;
        });
      });

      newSocket.on('unread_update', ({ type, dmId, senderId }: { type: string; dmId?: string; senderId?: string }) => {
        window.dispatchEvent(
          new CustomEvent('unread-update', { detail: { type, dmId, senderId } })
        );
      });

      globalSocket = newSocket;
      globalSocketToken = token;
      // NOTE: do NOT setSocketState here — wait for 'connect' event above
    };

    connectSocket();

    const onAuthChange = () => connectSocket();
    window.addEventListener('auth-change', onAuthChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('auth-change', onAuthChange);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: socketState, isConnected, onlineUsers }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);