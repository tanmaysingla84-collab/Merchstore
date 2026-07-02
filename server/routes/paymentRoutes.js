const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/paymentController');

// Webhook endpoint (doesn't use JSON parse middleware directly in router, handled by server.js route-specific raw body parser)
router.post('/webhook', handleStripeWebhook);

module.exports = router;
