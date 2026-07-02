// ─── services/stripeService.js ────────────────────────────────────────────────
// M2 Owned — Stripe Payment Intent creation with idempotency keys
// Wraps Stripe SDK to keep controllers clean and testable

const Stripe = require('stripe');

let stripeInstance = null;

/**
 * Lazy-initialize Stripe to allow mocking in tests or if key is a placeholder
 */
const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('<key>')) {
      console.warn('⚠️ MOCK STRIPE: Using mock stripe instance due to missing or placeholder STRIPE_SECRET_KEY');
      stripeInstance = {
        paymentIntents: {
          create: async (params, options) => ({
            client_secret: `pi_mock_secret_${Date.now()}`,
            id: `pi_mock_${Date.now()}`
          }),
          retrieve: async (id) => ({ id, status: 'succeeded' })
        },
        refunds: {
          create: async () => ({ status: 'succeeded' })
        }
      };
      return stripeInstance;
    }
    
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
};

/**
 * Create a Stripe Payment Intent
 * @param {number} amountInRupees  - Amount in INR (will be converted to paise)
 * @param {string} idempotencyKey  - Unique key to prevent duplicate charges
 * @param {Object} metadata        - Arbitrary metadata attached to intent
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 */
const createPaymentIntent = async (amountInRupees, idempotencyKey, metadata = {}) => {
  const stripe = getStripe();

  const amountInPaise = Math.round(amountInRupees * 100);

  if (amountInPaise < 50) {
    throw new Error('Minimum Stripe charge is ₹0.50');
  }

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount:   amountInPaise,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        server: 'merchstore',
      },
    },
    {
      idempotencyKey,
    }
  );

  return {
    clientSecret:    paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

/**
 * Verify Stripe webhook signature and parse event
 * @param {Buffer}  rawBody   - Raw request body (must be Buffer, not parsed JSON)
 * @param {string}  signature - value of 'stripe-signature' header
 * @returns {import('stripe').Stripe.Event}
 */
const constructWebhookEvent = (rawBody, signature) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

/**
 * Retrieve a Payment Intent by ID (used for admin verification)
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Issue a full or partial refund
 */
const createRefund = async (paymentIntentId, amountInRupees = null) => {
  const stripe = getStripe();
  const params = { payment_intent: paymentIntentId };
  if (amountInRupees !== null) {
    params.amount = Math.round(amountInRupees * 100);
  }
  return stripe.refunds.create(params);
};

// For testing: allow resetting the instance
const _resetForTest = () => { stripeInstance = null; };

module.exports = {
  createPaymentIntent,
  constructWebhookEvent,
  retrievePaymentIntent,
  createRefund,
  _resetForTest,
};
