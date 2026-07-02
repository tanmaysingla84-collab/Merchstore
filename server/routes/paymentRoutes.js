// ─── routes/paymentRoutes.js ──────────────────────────────────────────────────
// M2 Owned — Stripe webhook (no JSON body parsing — raw buffer required)

const router = require('express').Router();
const { stripeWebhook } = require('../controllers/paymentController');

/**
 * POST /api/payment/webhook
 *
 * ⚠️ express.raw() is applied ONLY to this route in server.js (before express.json()).
 *    This route is registered with the raw body parser so Stripe signature verification works.
 *    Do NOT add protect middleware — Stripe webhook has no JWT.
 */
router.post('/webhook', stripeWebhook);

module.exports = router;
