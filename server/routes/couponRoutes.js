const express = require('express');
const router = express.Router();
const { validateCoupon, createCoupon } = require('../controllers/couponController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.post('/validate', protect, validateCoupon);
router.post('/', protect, requireAdmin, createCoupon); // Admin helper to seed coupons

module.exports = router;
