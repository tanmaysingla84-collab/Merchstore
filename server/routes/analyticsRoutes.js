// ─── routes/analyticsRoutes.js ───────────────────────────────────────────────
// M2 Owned — All analytics routes require admin

const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getRevenue,
  getTopProducts,
  getSummary,
  getOrdersByStatus,
} = require('../controllers/analyticsController');

// All analytics routes: JWT + admin guard
router.use(protect, requireAdmin);

router.get('/revenue',         getRevenue);
router.get('/top-products',    getTopProducts);
router.get('/summary',         getSummary);
router.get('/orders-by-status', getOrdersByStatus);

module.exports = router;
