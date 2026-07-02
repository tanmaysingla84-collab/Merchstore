import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const useSocket = (orderId, onStatusUpdate) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    setIsConnected(true);
    
    // Simulate incoming WebSocket events from backend using a local interval
    // This allows the user to see the status bar updating live in front of their eyes!
    const statuses = ['Placed', 'Packed', 'Shipped', 'Delivered'];
    
    const interval = setInterval(() => {
      // Get current order from localstorage to find its current status index
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIdx = orders.findIndex(o => o._id === orderId);
      
      if (orderIdx > -1) {
        const order = orders[orderIdx];
        const currentStatusIdx = statuses.indexOf(order.status);
        
        if (currentStatusIdx < statuses.length - 1) {
          const nextStatus = statuses[currentStatusIdx + 1];
          order.status = nextStatus;
          orders[orderIdx] = order;
          localStorage.setItem('orders', JSON.stringify(orders));
          
          // Emit socket-like callback
          onStatusUpdate({
            orderId,
            status: nextStatus,
            timestamp: new Date().toISOString()
          });

          toast.success(`Order status updated to: ${nextStatus}!`, {
            icon: '📦',
            duration: 4000
          });
        } else {
          clearInterval(interval);
        }
      }
    }, 15000); // Progresses every 15 seconds for rapid testing demonstration

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [orderId]);

  return { isConnected };
};
