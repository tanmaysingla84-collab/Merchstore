// ─── tests/payment.test.js ────────────────────────────────────────────────────
// Tests for stripeWebhook handler and stripeService

jest.mock('../models/Order');
jest.mock('../services/stripeService');
jest.mock('../services/inventoryService');
jest.mock('../socket/orderSocket');

const { stripeWebhook } = require('../controllers/paymentController');
const Order             = require('../models/Order');
const stripeService     = require('../services/stripeService');
const { emitPaymentConfirmed, emitPaymentFailed } = require('../socket/orderSocket');
const inventoryService  = require('../services/inventoryService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('PaymentController — Stripe Webhook', () => {

  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = { headers: {}, body: Buffer.from('{}') };
    const res = mockRes();

    await stripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/stripe-signature/i);
  });

  it('returns 400 when webhook signature verification fails', async () => {
    stripeService.constructWebhookEvent.mockImplementation(() => {
      throw new Error('Signature mismatch');
    });

    const req = { headers: { 'stripe-signature': 'bad_sig' }, body: Buffer.from('{}') };
    const res = mockRes();

    await stripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('marks order as paid on payment_intent.succeeded', async () => {
    const mockPaymentIntent = {
      id:   'pi_test123',
      type: 'payment_intent.succeeded',
    };

    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: mockPaymentIntent },
    });

    const mockOrderDoc = {
      _id:           'order789',
      paymentStatus: 'pending',
      status:        'placed',
      statusHistory: [],
      save:          jest.fn().mockResolvedValue(true),
    };

    Order.findOne = jest.fn().mockResolvedValue(mockOrderDoc);

    const req = {
      headers: { 'stripe-signature': 'valid_sig' },
      body:    Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })),
    };
    const res = mockRes();

    await stripeWebhook(req, res);

    expect(mockOrderDoc.paymentStatus).toBe('paid');
    expect(mockOrderDoc.save).toHaveBeenCalledTimes(1);
    expect(emitPaymentConfirmed).toHaveBeenCalledWith('order789', 'pi_test123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toEqual({ received: true });
  });

  it('does not double-update an already-paid order (idempotency)', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_already_paid' } },
    });

    const alreadyPaidOrder = {
      _id:           'order999',
      paymentStatus: 'paid', // already paid
      save:          jest.fn(),
    };

    Order.findOne = jest.fn().mockResolvedValue(alreadyPaidOrder);

    const req = {
      headers: { 'stripe-signature': 'valid_sig' },
      body:    Buffer.from('{}'),
    };
    const res = mockRes();

    await stripeWebhook(req, res);

    // Should NOT call save again
    expect(alreadyPaidOrder.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancels order and restores stock on payment failure', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed123',
          last_payment_error: { message: 'Insufficient funds' },
        },
      },
    });

    const failedOrder = {
      _id:           'order_fail',
      paymentStatus: 'pending',
      status:        'placed',
      statusHistory: [],
      items: [{ productId: 'prod1', qty: 2, size: 'M' }],
      save:  jest.fn().mockResolvedValue(true),
    };

    Order.findOne = jest.fn().mockResolvedValue(failedOrder);
    inventoryService.restoreStock.mockResolvedValue({});

    const req = {
      headers: { 'stripe-signature': 'valid_sig' },
      body:    Buffer.from('{}'),
    };
    const res = mockRes();

    await stripeWebhook(req, res);

    expect(failedOrder.paymentStatus).toBe('failed');
    expect(failedOrder.status).toBe('cancelled');
    expect(inventoryService.restoreStock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'prod1', qty: 2, size: 'M' }),
      ])
    );
    expect(emitPaymentFailed).toHaveBeenCalledWith('order_fail', 'Insufficient funds');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 200 for unhandled event types gracefully', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: {} },
    });

    const req = { headers: { 'stripe-signature': 'valid_sig' }, body: Buffer.from('{}') };
    const res = mockRes();

    await stripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toEqual({ received: true });
  });
});

// ── stripeService unit tests ──────────────────────────────────────────────────
describe('stripeService', () => {

  beforeEach(() => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
  });

  it('is importable and exports expected functions', () => {
    const svc = require('../services/stripeService');
    expect(typeof svc.createPaymentIntent).toBe('function');
    expect(typeof svc.constructWebhookEvent).toBe('function');
    expect(typeof svc.createRefund).toBe('function');
  });
});
