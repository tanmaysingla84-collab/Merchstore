const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { orderCreationLimiter } = require('../middleware/rateLimiter');

// All order routes are protected
router.use(protect);

router.post('/create', orderCreationLimiter, createOrder);
router.get('/', getUserOrders);
router.get('/single/:id', getOrderById);

// Admin only order routes
router.get('/admin', requireAdmin, getAdminOrders);
router.put('/admin/:id/status', requireAdmin, updateOrderStatus);

module.exports = router;
