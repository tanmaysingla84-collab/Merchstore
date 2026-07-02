// ─── routes/orderRoutes.js ────────────────────────────────────────────────────
// M2 Owned

const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { orderLimiter }          = require('../middleware/rateLimiter');
const validate                  = require('../middleware/validate');
const {
  createOrder,
  getUserOrders,
  getSingleOrder,
  adminGetOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  adminOrdersQuerySchema,
} = require('../validators/orderValidator');

// ── User routes ───────────────────────────────────────────────────────────────
// IMPORTANT: /single/:orderId must come BEFORE /:userId to avoid route collision
router.get('/single/:orderId', protect, getSingleOrder);

router.post(
  '/create',
  protect,
  orderLimiter,                     // 10 req/min per user
  validate(createOrderSchema),
  createOrder
);

router.get('/:userId', protect, getUserOrders);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(
  '/admin/all',
  protect,
  requireAdmin,
  validate(adminOrdersQuerySchema, 'query'),
  adminGetOrders
);

router.put(
  '/admin/:id/status',
  protect,
  requireAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

module.exports = router;
