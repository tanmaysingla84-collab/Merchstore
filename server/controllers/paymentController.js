const stripe = require('stripe');
const Order = require('../models/Order');
const { emitPaymentConfirmed } = require('../socket/orderSocket');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripeSecretKey && webhookSecret && sig) {
      const stripeInstance = stripe(stripeSecretKey);
      // Stripe requires the raw body which is attached as req.body when express.raw() is used
      event = stripeInstance.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Local testing / Mock Webhook path when credentials are not configured
      console.warn('Stripe credentials or webhook secret missing. Processing mock webhook event.');
      const parsedBody = JSON.parse(req.body.toString());
      event = {
        type: parsedBody.type || 'payment_intent.succeeded',
        data: {
          object: parsedBody.data?.object || {
            id: parsedBody.id || 'mock_pi_id'
          }
        }
      };
    }
  } catch (err) {
    console.error(`Webhook Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful! ID: ${paymentIntent.id}`);
    
    try {
      // Find order by Stripe Payment Intent ID
      const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (order) {
        order.paymentStatus = 'paid';
        await order.save();
        console.log(`Order ${order._id} payment status updated to 'paid'`);

        // Trigger real-time WebSocket update for order payment confirmed
        emitPaymentConfirmed(order._id.toString());
      } else {
        console.warn(`Order not found for Payment Intent ID: ${paymentIntent.id}`);
      }
    } catch (dbError) {
      console.error(`Database error during webhook handling: ${dbError.message}`);
      return res.status(500).json({ success: false, message: dbError.message });
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

module.exports = {
  handleStripeWebhook
};
