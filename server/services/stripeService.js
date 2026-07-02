const stripe = require('stripe');

let stripeInstance;
if (process.env.STRIPE_SECRET_KEY) {
  stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Warning: STRIPE_SECRET_KEY is not defined. Stripe payments will run in mock mode.');
}

const createPaymentIntent = async (amountInINR, metadata = {}) => {
  try {
    // If stripe is not initialized, return a mock intent clientSecret
    if (!stripeInstance) {
      console.log(`Mocking Stripe Payment Intent creation for amount: ₹${amountInINR}`);
      return {
        id: 'mock_pi_' + Math.random().toString(36).substr(2, 9),
        client_secret: 'mock_src_' + Math.random().toString(36).substr(2, 15)
      };
    }

    // Stripe amount is in cents, so multiply by 100 for INR (as Stripe supports INR in cents)
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amountInINR * 100),
      currency: 'inr',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error(`Stripe Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  getStripeInstance: () => stripeInstance
};
