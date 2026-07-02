// ─── routes/couponRoutes.js ───────────────────────────────────────────────────
// M2 Owned

const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  validateCoupon,
  listCoupons,
  createCoupon,
  toggleCoupon,
} = require('../controllers/couponController');

// User route — validate coupon (requires auth to prevent abuse)
router.post('/validate', protect, validateCoupon);

// Admin routes
router.get('/',           protect, requireAdmin, listCoupons);
router.post('/',          protect, requireAdmin, createCoupon);
router.patch('/:id/toggle', protect, requireAdmin, toggleCoupon);

module.exports = router;
