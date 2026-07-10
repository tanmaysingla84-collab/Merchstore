// ─── server.js ────────────────────────────────────────────────────────────────
// Geeta University MerchStore — Main Entry Point
// M1 owns this file; M2's Socket.io is initialized here (M1 must expose httpServer)

require('dotenv').config();

const express = require('express');
const http    = require('http');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

const connectDB             = require('./config/db');
const { globalLimiter }     = require('./middleware/rateLimiter');
const passport = require('passport');
require('./config/passport');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocket }        = require('./socket/orderSocket');
const { startLowStockCron } = require('./cron/lowStockCron');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

// M2 routes
const cartRoutes      = require('./routes/cartRoutes');
const orderRoutes     = require('./routes/orderRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const couponRoutes    = require('./routes/couponRoutes');
const reviewRoutes    = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── 1. Security & CORS ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
}));

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('localhost:') ||
      origin.includes('127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── 2. Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── 3. Body Parsers ───────────────────────────────────────────────────────────
/**
 * ⚠️ STRIPE WEBHOOK — Must use raw buffer BEFORE express.json()
 *    Only applied to the /api/payment/webhook path.
 */
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Global JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── 4. Global Rate Limiter ────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Passport Initialization ──────────────────────────────────────────────────
app.use(passport.initialize());

// ── 5. Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success:     true,
    service:     'MerchStore API',
    status:      'healthy',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

// ── 6. API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth',              authRoutes);
app.use('/api/products',          productRoutes);

// M2 routes
app.use('/api/cart',               cartRoutes);
app.use('/api/orders',             orderRoutes);
app.use('/api/payment',            paymentRoutes);
app.use('/api/coupons',            couponRoutes);
app.use('/api/reviews',            reviewRoutes);
app.use('/api/admin/analytics',    analyticsRoutes);
// Admin orders are handled inside orderRoutes (/api/orders/admin/*)
app.use('/api/admin/orders', orderRoutes); // same router, different prefix

// ── 7. 404 & Error Handlers ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 8. HTTP Server + Socket.io ────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io         = initSocket(httpServer); // M2: Socket.io initialized here

// Export for use in controllers that need io (and for tests)
app.set('io', io);

// ── 9. Start Server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

const listenOnAvailablePort = (port, maxRetries = 10) => new Promise((resolve, reject) => {
  const attemptListen = (currentPort, remainingRetries) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE' && remainingRetries > 0) {
        httpServer.removeListener('listening', onListening);
        httpServer.removeListener('error', onError);

        const nextPort = currentPort + 1;
        console.warn(`⚠️ Port ${currentPort} is busy, retrying on ${nextPort}...`);
        attemptListen(nextPort, remainingRetries - 1);
        return;
      }

      reject(err);
    };

    const onListening = () => {
      httpServer.removeListener('error', onError);
      resolve(currentPort);
    };

    httpServer.once('error', onError);
    httpServer.once('listening', onListening);
    httpServer.listen(currentPort);
  };

  attemptListen(port, maxRetries);
});

const startServer = async () => {
  await connectDB();

  const activePort = await listenOnAvailablePort(PORT);

  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log(`║  🎓 MerchStore API Server                      ║`);
  console.log(`║  🚀 Running on http://localhost:${activePort}           ║`);
  console.log(`║  🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(29)}║`);
  console.log(`║  🔌 WebSocket: Active (Socket.io)              ║`);
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  // Start inventory cron (only in non-test environments)
  if (process.env.NODE_ENV !== 'test') {
    startLowStockCron();
  }
};

// Only auto-start if run directly (not imported in tests)
if (require.main === module) {
  startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, httpServer, startServer };
