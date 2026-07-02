// ─── middleware/rateLimiter.js ─────────────────────────────────────────────────
// Owned by M1 — M2 uses orderRateLimiter for order creation

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global rate limiter
 * - Development : 2000 req / 15 min (loose — avoids blocking hot-reload / browser tabs)
 * - Production  : 100  req / 15 min (env-configurable)
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:      isDev ? 2000 : (parseInt(process.env.RATE_LIMIT_MAX, 10) || 100),
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => isDev && process.env.SKIP_RATE_LIMIT === 'true',
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Auth rate limiter: stricter for login/register to prevent brute-force
 * - Development : 100 req / 15 min (loose — allows rapid testing)
 * - Production  : 10  req / 15 min
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,   // Successful logins don't count toward limit
  message: {
    success: false,
    message: 'Too many auth attempts, please wait 15 minutes.',
  },
});

/**
 * Order rate limiter: 10 req / min per user (M2 — prevents order spamming)
 * Uses user ID from req.user if available, falls back to IP
 */
const orderLimiter = rateLimit({
  windowMs: parseInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  max:      isDev ? 100 : (parseInt(process.env.ORDER_RATE_LIMIT_MAX, 10) || 10),
  keyGenerator: (req, res) => req.user?._id?.toString() || ipKeyGenerator(req, res),
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many order requests. Limit: 10 per minute per user.',
  },
});

module.exports = { globalLimiter, authLimiter, orderLimiter };
