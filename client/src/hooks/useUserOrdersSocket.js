import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useUserOrdersSocket = (orderIds = [], onStatusUpdate) => {
  const callbackRef = useRef(onStatusUpdate);
  callbackRef.current = onStatusUpdate;

  const orderKey = orderIds.filter(Boolean).join(',');

  useEffect(() => {
    if (!orderKey) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    const ids = orderKey.split(',');

    socket.on('connect', () => {
      ids.forEach((orderId) => socket.emit('JOIN_ORDER', { orderId }));
    });

    socket.on('ORDER_STATUS_UPDATED', (payload) => {
      if (ids.includes(payload.orderId)) {
        callbackRef.current(payload);
      }
    });

    return () => {
      ids.forEach((orderId) => socket.emit('LEAVE_ORDER', { orderId }));
      socket.disconnect();
    };
  }, [orderKey]);
};
