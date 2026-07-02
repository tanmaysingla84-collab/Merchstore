// ─── tests/coupon.test.js ─────────────────────────────────────────────────────

jest.mock('../models/Coupon');

const { validateCoupon } = require('../controllers/couponController');
const Coupon = require('../models/Coupon');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockUser = { _id: 'user1', name: 'Test' };

describe('CouponController — validateCoupon', () => {

  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for non-existent coupon', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue(null);

    const req = { user: mockUser, body: { code: 'FAKE', cartTotal: 500 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toMatch(/invalid coupon/i);
  });

  it('returns 400 for expired coupon', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue({
      code:        'OLD10',
      discountPct: 10,
      expiresAt:   new Date('2000-01-01'),
      usedCount:   0,
      usageLimit:  100,
    });

    const req = { user: mockUser, body: { code: 'OLD10', cartTotal: 500 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('COUPON_EXPIRED');
  });

  it('returns 400 when usageLimit is exhausted', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue({
      code:        'MAX100',
      discountPct: 15,
      expiresAt:   new Date(Date.now() + 86400000),
      usedCount:   100,
      usageLimit:  100,
    });

    const req = { user: mockUser, body: { code: 'MAX100', cartTotal: 500 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('COUPON_EXHAUSTED');
  });

  it('returns 400 when cartTotal is below minOrderAmt', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue({
      code:        'MIN500',
      discountPct: 20,
      expiresAt:   new Date(Date.now() + 86400000),
      usedCount:   0,
      usageLimit:  50,
      minOrderAmt: 500,
    });

    const req = { user: mockUser, body: { code: 'MIN500', cartTotal: 200 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('MIN_ORDER_NOT_MET');
  });

  it('returns correct discountAmount for valid coupon', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue({
      code:          'SAVE25',
      discountPct:   25,
      expiresAt:     new Date(Date.now() + 86400000),
      usedCount:     5,
      usageLimit:    100,
      minOrderAmt:   0,
      maxDiscountAmt: null,
      description:   'Save 25% on all orders',
    });

    const req = { user: mockUser, body: { code: 'SAVE25', cartTotal: 1000 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const json = res.json.mock.calls[0][0];
    expect(json.success).toBe(true);
    expect(json.data.discountAmount).toBe(250);
    expect(json.data.remainingUses).toBe(95);
  });

  it('caps discount at maxDiscountAmt', async () => {
    Coupon.findOne = jest.fn().mockResolvedValue({
      code:          'CAPPED',
      discountPct:   50,
      expiresAt:     new Date(Date.now() + 86400000),
      usedCount:     0,
      usageLimit:    100,
      minOrderAmt:   0,
      maxDiscountAmt: 100, // cap at ₹100 even though 50% of 1000 = 500
      description:   '',
    });

    const req = { user: mockUser, body: { code: 'CAPPED', cartTotal: 1000 } };
    const res = mockRes();

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.discountAmount).toBe(100); // capped
  });
});
