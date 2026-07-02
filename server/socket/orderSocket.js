// ─── socket/orderSocket.js ────────────────────────────────────────────────────
// M2 Owned — Socket.io initialization and order tracking event system

const { Server } = require('socket.io');

let io = null;

// Event names (constants for consistency with frontend)
const EVENTS = {
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  PAYMENT_CONFIRMED:    'PAYMENT_CONFIRMED',
  PAYMENT_FAILED:       'PAYMENT_FAILED',
  ORDER_CANCELLED:      'ORDER_CANCELLED',
  JOINED_ORDER_ROOM:    'JOINED_ORDER_ROOM',
  ERROR:                'SOCKET_ERROR',
};

/**
 * Initialize Socket.io on the HTTP server.
 * Called once in server.js after httpServer is created.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
    transports:   ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Join order room ──────────────────────────────────────────────────────
    // Client emits: socket.emit('JOIN_ORDER', { orderId })
    socket.on('JOIN_ORDER', ({ orderId } = {}) => {
      if (!orderId || typeof orderId !== 'string') {
        socket.emit(EVENTS.ERROR, { message: 'Invalid orderId' });
        return;
      }

      const room = `order:${orderId}`;
      socket.join(room);
      socket.emit(EVENTS.JOINED_ORDER_ROOM, { orderId, room });
      console.log(`📦 Socket ${socket.id} joined room: ${room}`);
    });

    // ── Leave order room ─────────────────────────────────────────────────────
    socket.on('LEAVE_ORDER', ({ orderId } = {}) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`📦 Socket ${socket.id} left room: order:${orderId}`);
      }
    });

    // ── Admin room: admins join to receive all order events ──────────────────
    socket.on('JOIN_ADMIN', ({ token } = {}) => {
      // In production, verify the token here
      // For now, trust the connection (auth is at HTTP level)
      socket.join('admin:orders');
      console.log(`👑 Admin socket ${socket.id} joined admin:orders room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} — ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`⚠️ Socket error on ${socket.id}:`, err.message);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

// ──────────────────────────────────────────────────────────────────────────────
// Emit helpers — called from controllers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Emit ORDER_STATUS_UPDATED to the specific order's room
 * @param {string} orderId
 * @param {string} status
 * @param {Object} [extra]  - additional payload (e.g. note, updatedBy name)
 */
const emitOrderStatusUpdate = (orderId, status, extra = {}) => {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized — cannot emit ORDER_STATUS_UPDATED');
    return;
  }

  const payload = {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  io.to(`order:${orderId}`).emit(EVENTS.ORDER_STATUS_UPDATED, payload);
  io.to('admin:orders').emit(EVENTS.ORDER_STATUS_UPDATED, payload);  // also notify admin room

  console.log(`📡 Emitted ORDER_STATUS_UPDATED → room order:${orderId}`, payload);
};

/**
 * Emit PAYMENT_CONFIRMED when Stripe webhook confirms payment
 */
const emitPaymentConfirmed = (orderId, paymentIntentId) => {
  if (!io) return;

  const payload = {
    orderId,
    paymentIntentId,
    timestamp: new Date().toISOString(),
  };

  io.to(`order:${orderId}`).emit(EVENTS.PAYMENT_CONFIRMED, payload);
  console.log(`💳 Emitted PAYMENT_CONFIRMED → room order:${orderId}`);
};

/**
 * Emit PAYMENT_FAILED
 */
const emitPaymentFailed = (orderId, reason = '') => {
  if (!io) return;

  io.to(`order:${orderId}`).emit(EVENTS.PAYMENT_FAILED, {
    orderId,
    reason,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get the initialized io instance (for custom emissions)
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
  return io;
};

module.exports = {
  initSocket,
  getIO,
  emitOrderStatusUpdate,
  emitPaymentConfirmed,
  emitPaymentFailed,
  EVENTS,
};
