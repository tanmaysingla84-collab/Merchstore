const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join order tracking room
    socket.on('join_order_room', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined room order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emits an event to a specific order room
const emitOrderStatusUpdate = (orderId, status) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`order:${orderId}`).emit('ORDER_STATUS_UPDATED', {
      orderId,
      status,
      timestamp: new Date()
    });
    console.log(`WebSocket event ORDER_STATUS_UPDATED emitted for order ${orderId} with status ${status}`);
  } catch (error) {
    console.error(`WebSocket emit error: ${error.message}`);
  }
};

const emitPaymentConfirmed = (orderId) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`order:${orderId}`).emit('PAYMENT_CONFIRMED', {
      orderId,
      timestamp: new Date()
    });
    console.log(`WebSocket event PAYMENT_CONFIRMED emitted for order ${orderId}`);
  } catch (error) {
    console.error(`WebSocket emit error: ${error.message}`);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitOrderStatusUpdate,
  emitPaymentConfirmed
};
