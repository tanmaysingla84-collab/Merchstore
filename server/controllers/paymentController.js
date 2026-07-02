// ─── controllers/paymentController.js ────────────────────────────────────────
// M2 Owned — Stripe webhook handler

const Order = require('../models/Order');
const { constructWebhookEvent } = require('../services/stripeService');
const { emitPaymentConfirmed, emitPaymentFailed } = require('../socket/orderSocket');
const { restoreStock } = require('../services/inventoryService');

/**
 * POST /api/payment/webhook
 *
 * ⚠️ IMPORTANT: This route must use express.raw() body parser — NOT express.json().
 *    The raw buffer is required for Stripe signature verification.
 *    Configured in server.js before the global json parser.
 */
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
  }

  let event;

  try {
    event = constructWebhookEvent(req.body, sig); // req.body is a Buffer here
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  // ── Handle events ──────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Payment succeeded ──────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!order) {
          console.warn(`⚠️ No order found for paymentIntent: ${paymentIntent.id}`);
          break;
        }

        if (order.paymentStatus === 'paid') {
          console.log(`ℹ️ Order ${order._id} already marked paid — skipping duplicate webhook`);
          break;
        }

        order.paymentStatus = 'paid';
        order.statusHistory.push({
          status:    order.status,
          timestamp: new Date(),
          note:      `Payment confirmed via Stripe (ID: ${paymentIntent.id})`,
        });
        await order.save();

        // Emit real-time event to frontend
        emitPaymentConfirmed(order._id.toString(), paymentIntent.id);

        console.log(`✅ Payment confirmed for order: ${order._id}`);
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!order) break;

        const failureReason = paymentIntent.last_payment_error?.message || 'Payment declined';

        order.paymentStatus = 'failed';
        order.status        = 'cancelled';
        order.statusHistory.push({
          status:    'cancelled',
          timestamp: new Date(),
          note:      `Payment failed: ${failureReason}`,
        });
        await order.save();

        // Restore stock for failed payment
        await restoreStock(
          order.items.map(i => ({
            productId: i.productId,
            qty:       i.qty,
            size:      i.size,
          }))
        );

        emitPaymentFailed(order._id.toString(), failureReason);

        console.log(`❌ Payment failed for order: ${order._id} — ${failureReason}`);
        break;
      }

      // ── Refund created ─────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object;
        const order  = await Order.findOne({
          stripePaymentIntentId: charge.payment_intent,
        });

        if (order) {
          order.paymentStatus = 'refunded';
          order.statusHistory.push({
            status:    order.status,
            timestamp: new Date(),
            note:      `Refund issued: ₹${(charge.amount_refunded / 100).toFixed(2)}`,
          });
          await order.save();
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error('❌ Error processing webhook event:', err.message);
    // Still return 200 to prevent Stripe from retrying
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
};

module.exports = { stripeWebhook };
