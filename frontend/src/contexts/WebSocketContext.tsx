import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Debug log to verify the API URL
console.log('VITE_API_URL from env (WebSocket):', import.meta.env.VITE_API_URL);

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false
});

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get the API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // Create socket connection with optimized settings
    const newSocket = io(apiUrl, {
      transports: ['websocket'], // Prefer websocket over polling
      reconnection: true,
      reconnectionAttempts: 5, // Reduce reconnection attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      // Add connection optimizations
      upgrade: false, // Disable upgrading from polling to websocket
      rememberUpgrade: true, // Remember the transport method
      randomizationFactor: 0, // Remove randomization for predictable behavior
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      
      // Only attempt to reconnect if the disconnection was intentional
      if (reason === 'io server disconnect') {
        // Server intentionally disconnected, don't reconnect
        console.log('Server intentionally disconnected, not reconnecting');
      } else if (reason === 'io client disconnect') {
        // Client intentionally disconnected, don't reconnect
        console.log('Client intentionally disconnected, not reconnecting');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};