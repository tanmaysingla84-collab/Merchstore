import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export const useSocket = (orderId, onStatusUpdate) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Connect to the socket server
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log(`🔌 Connected to socket server: ${socket.id}`);
      // Join the order room
      socket.emit('JOIN_ORDER', { orderId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from socket server');
    });

    // Listen to status updates from backend
    socket.on('ORDER_STATUS_UPDATED', (payload) => {
      console.log('📡 Received ORDER_STATUS_UPDATED:', payload);
      if (payload.orderId === orderId) {
        onStatusUpdate(payload);
        toast.success(`Order status updated to: ${payload.status}!`, {
          icon: '📦',
          duration: 4000
        });
      }
    });

    return () => {
      socket.emit('LEAVE_ORDER', { orderId });
      socket.disconnect();
      setIsConnected(false);
    };
  }, [orderId, onStatusUpdate]);

  return { isConnected };
};
