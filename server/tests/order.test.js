// ─── tests/order.test.js ──────────────────────────────────────────────────────
// Integration tests for orderController — Mock Stripe + Mock DB Transactions

jest.mock('../models/Cart');
jest.mock('../models/Order');
jest.mock('../models/Coupon');
jest.mock('../models/Product');
jest.mock('../services/stripeService');
jest.mock('../services/inventoryService');
jest.mock('../socket/orderSocket');
jest.mock('../controllers/cartController', () => ({
  clearCartByUserId: jest.fn().mockResolvedValue(undefined),
}));

const {
  createOrder,
  getUserOrders,
  getSingleOrder,
  updateOrderStatus,
} = require('../controllers/orderController');

const Cart      = require('../models/Cart');
const Order     = require('../models/Order');
const Coupon    = require('../models/Coupon');
const mongoose  = require('mongoose');
const stripeService    = require('../services/stripeService');
const inventoryService = require('../services/inventoryService');
const { emitOrderStatusUpdate } = require('../socket/orderSocket');

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const USER_OID  = new mongoose.Types.ObjectId();
const ADMIN_OID = new mongoose.Types.ObjectId();

const mockUser = { _id: USER_OID,  name: 'Test User',  role: 'student' };
const mockAdmin = { _id: ADMIN_OID, name: 'Admin User', role: 'admin' };

const PROD_OID = new mongoose.Types.ObjectId();

const sampleProduct = {
  _id:      PROD_OID,
  name:     'GU T-Shirt',
  price:    499,
  images:   ['https://cloudinary.com/img.jpg'],
  isActive: true,
  sizes:    [{ size: 'M', stock: 10 }],
};

const sampleCartItem = {
  productId: sampleProduct,
  qty:       2,
  size:      'M',
};

const sampleAddress = {
  fullName: 'John Doe',
  phone:    '9876543210',
  street:   '123 Main Street',
  city:     'Rohtak',
  state:    'Haryana',
  pincode:  '124001',
};

// Shared mock session — passes through fn() so controllers can return responses
const mockSession = {
  withTransaction: jest.fn(async (fn) => { await fn(); }),
  endSession:      jest.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderController', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    inventoryService.checkStockAvailability.mockResolvedValue({ ok: true, insufficient: [] });
    inventoryService.decrementStock.mockResolvedValue({ modifiedCount: 1 });

    // Fresh session mock each test
    mockSession.withTransaction.mockImplementation(async (fn) => { await fn(); });
    mockSession.endSession.mockReset();
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
  });

  // ── createOrder ────────────────────────────────────────────────────────────
  describe('POST /api/orders/create', () => {

    it('returns 400 when cart is empty', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      Coupon.findOne = jest.fn().mockResolvedValue(null);

      const req = { user: mockUser, body: { address: sampleAddress, paymentMethod: 'cod' } };
      const res = mockRes();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/cart is empty/i);
    });

    it('returns 400 when stock is insufficient', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });
      Coupon.findOne = jest.fn().mockResolvedValue(null);

      inventoryService.checkStockAvailability.mockResolvedValue({
        ok: false,
        insufficient: [{ name: 'GU T-Shirt', size: 'M', requested: 2, available: 1 }],
      });

      const req = { user: mockUser, body: { address: sampleAddress, paymentMethod: 'cod' } };
      const res = mockRes();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/out of stock/i);
    });

    it('creates COD order successfully', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });

      const mockOrderDoc = {
        _id:         new mongoose.Types.ObjectId(),
        finalAmount: 998,
        status:      'placed',
      };

      Order.create = jest.fn().mockResolvedValue([mockOrderDoc]);
      Coupon.findOne = jest.fn().mockResolvedValue(null); // no coupon

      const req = {
        user: mockUser,
        body: { address: sampleAddress, paymentMethod: 'cod' },
      };
      const res = mockRes();

      await createOrder(req, res);

      expect(Order.create).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json.mock.calls[0][0].message).toMatch(/cash on delivery/i);
    });

    it('creates Stripe order and returns clientSecret', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });

      stripeService.createPaymentIntent.mockResolvedValue({
        clientSecret:    'pi_test_secret',
        paymentIntentId: 'pi_test123',
      });

      const mockOrderDoc = {
        _id:         new mongoose.Types.ObjectId(),
        finalAmount: 998,
        status:      'placed',
      };

      Order.create = jest.fn().mockResolvedValue([mockOrderDoc]);
      Coupon.findOne = jest.fn().mockResolvedValue(null);

      const req = {
        user: mockUser,
        body: { address: sampleAddress, paymentMethod: 'stripe' },
      };
      const res = mockRes();

      await createOrder(req, res);

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        998,
        expect.any(String),
        expect.any(Object)
      );

      expect(res.status).toHaveBeenCalledWith(201);
      const json = res.json.mock.calls[0][0];
      expect(json.data.clientSecret).toBe('pi_test_secret');
    });

    it('applies coupon discount correctly', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });

      const mockCoupon = {
        _id:          new mongoose.Types.ObjectId(),
        code:         'SAVE20',
        discountPct:  20,
        expiresAt:    new Date(Date.now() + 86400000),
        usedCount:    0,
        usageLimit:   100,
        minOrderAmt:  0,
        maxDiscountAmt: null,
        isActive:     true,
      };

      Coupon.findOne = jest.fn().mockResolvedValue(mockCoupon);
      Coupon.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const mockOrderDoc = {
        _id:            new mongoose.Types.ObjectId(),
        finalAmount:    798.4,
        discountAmount: 199.6,
        status:         'placed',
      };

      Order.create = jest.fn().mockResolvedValue([mockOrderDoc]);

      const req = {
        user: mockUser,
        body: { address: sampleAddress, paymentMethod: 'cod', couponCode: 'SAVE20' },
      };
      const res = mockRes();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      // Coupon usedCount should be incremented
      expect(Coupon.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCoupon._id,
        { $inc: { usedCount: 1 } },
        expect.anything()
      );
    });

    it('rejects expired coupon', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });

      const expiredCoupon = {
        code:        'EXPIRED',
        discountPct: 10,
        expiresAt:   new Date('2000-01-01'), // expired
        usedCount:   0,
        usageLimit:  100,
        isActive:    true,
      };

      Coupon.findOne = jest.fn().mockResolvedValue(expiredCoupon);

      const req = {
        user: mockUser,
        body: { address: sampleAddress, paymentMethod: 'cod', couponCode: 'EXPIRED' },
      };
      const res = mockRes();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/expired/i);
    });

    it('rejects exhausted coupon', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ items: [sampleCartItem] }),
      });

      const exhaustedCoupon = {
        code:        'MAXED',
        discountPct: 10,
        expiresAt:   new Date(Date.now() + 86400000),
        usedCount:   100,
        usageLimit:  100,
        isActive:    true,
      };

      Coupon.findOne = jest.fn().mockResolvedValue(exhaustedCoupon);

      const req = {
        user: mockUser,
        body: { address: sampleAddress, paymentMethod: 'cod', couponCode: 'MAXED' },
      };
      const res = mockRes();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/usage limit/i);
    });
  });

  // ── getUserOrders ──────────────────────────────────────────────────────────
  describe('GET /api/orders/:userId', () => {

    it('returns user orders with pagination', async () => {
      const mockOrders = [
        { _id: new mongoose.Types.ObjectId(), status: 'placed',     finalAmount: 499 },
        { _id: new mongoose.Types.ObjectId(), status: 'delivered',  finalAmount: 999 },
      ];

      Order.find = jest.fn().mockReturnValue({
        sort:   jest.fn().mockReturnThis(),
        skip:   jest.fn().mockReturnThis(),
        limit:  jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue(mockOrders),
      });
      Order.countDocuments = jest.fn().mockResolvedValue(2);

      const userId = mockUser._id.toString();
      const req    = { user: mockUser, params: { userId }, query: {} };
      const res    = mockRes();

      await getUserOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.data).toHaveLength(2);
      expect(json.pagination.total).toBe(2);
    });

    it('forbids accessing another user\'s orders', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const req = {
        user:   mockUser,
        params: { userId: otherUserId },
        query:  {},
      };
      const res = mockRes();

      await getUserOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows admin to access any user\'s orders', async () => {
      Order.find = jest.fn().mockReturnValue({
        sort:   jest.fn().mockReturnThis(),
        skip:   jest.fn().mockReturnThis(),
        limit:  jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue([]),
      });
      Order.countDocuments = jest.fn().mockResolvedValue(0);

      const anyUserId = new mongoose.Types.ObjectId().toString();
      const req = {
        user:   mockAdmin,
        params: { userId: anyUserId },
        query:  {},
      };
      const res = mockRes();

      await getUserOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── updateOrderStatus ──────────────────────────────────────────────────────
  describe('PUT /api/admin/orders/:id/status', () => {

    it('updates order status and emits WebSocket event', async () => {
      const orderOid = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id:    orderOid,
        status: 'placed',
        userId: { _id: USER_OID, name: 'Test User', email: 'test@test.com' },
        statusHistory: [],
        save:   jest.fn().mockResolvedValue(true),
      };

      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder),
      });

      const req = {
        user:   mockAdmin,
        params: { id: orderOid.toString() },
        body:   { status: 'packed', note: 'Packed and ready' },
      };
      const res = mockRes();

      await updateOrderStatus(req, res);

      expect(mockOrder.save).toHaveBeenCalledTimes(1);
      expect(emitOrderStatusUpdate).toHaveBeenCalledWith(
        orderOid.toString(),
        'packed',
        expect.objectContaining({ note: 'Packed and ready' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('blocks updating a delivered order', async () => {
      const deliveredOrder = {
        _id:    new mongoose.Types.ObjectId(),
        status: 'delivered',
        userId: { _id: USER_OID, name: 'Test' },
        statusHistory: [],
      };

      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(deliveredOrder),
      });

      const req = {
        user:   mockAdmin,
        params: { id: 'order456' },
        body:   { status: 'placed' },
      };
      const res = mockRes();

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/delivered/i);
    });

    it('returns 404 for non-existent order', async () => {
      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = {
        user:   mockAdmin,
        params: { id: 'nonexistent' },
        body:   { status: 'packed' },
      };
      const res = mockRes();

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
