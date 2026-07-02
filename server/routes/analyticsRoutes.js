const express = require('express');
const router = express.Router();
const { getRevenueAnalytics, getTopProducts, getSummaryStats } = require('../controllers/analyticsController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Protect all analytics endpoints for Admin only
router.use(protect, requireAdmin);

router.get('/revenue', getRevenueAnalytics);
router.get('/top-products', getTopProducts);
router.get('/summary', getSummaryStats);

module.exports = router;
