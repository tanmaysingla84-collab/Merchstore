// ─── tests/cart.test.js ───────────────────────────────────────────────────────
// Unit tests for cartController — Jest ≥ 70% coverage

const {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  clearCartByUserId,
} = require('../controllers/cartController');

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock('../models/Cart');
jest.mock('../models/Product');

const Cart    = require('../models/Cart');
const Product = require('../models/Product');

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = (res) => jest.fn().mockImplementation((err) => {
  if (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

const mockUser = { _id: 'user123', name: 'Test User', role: 'student' };

// ─────────────────────────────────────────────────────────────────────────────
describe('CartController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCart ────────────────────────────────────────────────────────────────
  describe('GET /api/cart — getCart', () => {

    it('returns empty cart when no cart exists', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { user: mockUser };
      const res = mockRes();
      const next = mockNext(res);

      await getCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ items: [], subtotal: 0 }),
        })
      );
    });

    it('returns enriched cart items with stock info', async () => {
      const mockProduct = {
        _id:           'prod1',
        name:          'GU T-Shirt',
        price:         499,
        images:        ['https://cloudinary.com/img.jpg'],
        sizes:         [{ size: 'M', stock: 10 }],
        isActive:      true,
        averageRating: 4.5,
      };

      const mockCartDoc = {
        userId: 'user123',
        items: [
          { _id: 'item1', productId: mockProduct, qty: 2, size: 'M' },
        ],
      };

      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCartDoc),
      });

      const req = { user: mockUser };
      const res = mockRes();
      const next = mockNext(res);

      await getCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].name).toBe('GU T-Shirt');
      expect(json.data.items[0].isAvailable).toBe(true);
      expect(json.data.subtotal).toBe(998);
    });

    it('filters out inactive products from cart response', async () => {
      const inactiveProduct = { _id: 'prod2', name: 'Old Hoodie', isActive: false, sizes: [], images: [] };
      const mockCartDoc = {
        items: [{ _id: 'item2', productId: inactiveProduct, qty: 1, size: 'L' }],
      };

      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCartDoc),
      });

      const req = { user: mockUser };
      const res = mockRes();
      const next = mockNext(res);

      await getCart(req, res, next);

      const json = res.json.mock.calls[0][0];
      expect(json.data.items).toHaveLength(0);
    });
  });

  // ── addToCart ──────────────────────────────────────────────────────────────
  describe('POST /api/cart/add — addToCart', () => {

    const mockProductActive = {
      _id:      'prod1',
      name:     'GU Hoodie',
      isActive: true,
      sizes:    [{ size: 'L', stock: 5 }],
      select:   jest.fn(),
    };

    it('creates new cart and adds item when cart does not exist', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProductActive),
      });

      Cart.findOne = jest.fn().mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(true);
      Cart.mockImplementation(() => ({
        userId: 'user123',
        items:  [],
        save:   saveMock,
      }));

      const req = { user: mockUser, body: { productId: 'prod1', qty: 2, size: 'L' } };
      const res = mockRes();
      const next = mockNext(res);

      await addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    it('returns 404 when product does not exist', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { user: mockUser, body: { productId: 'nonexistent', qty: 1, size: 'S' } };
      const res = mockRes();
      const next = mockNext(res);

      await addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when size is not available', async () => {
      const productNoSize = { ...mockProductActive, sizes: [{ size: 'XL', stock: 5 }] };
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(productNoSize),
      });

      const req = { user: mockUser, body: { productId: 'prod1', qty: 1, size: 'S' } };
      const res = mockRes();
      const next = mockNext(res);

      await addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/size/i);
    });

    it('returns 400 when requested qty exceeds stock', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProductActive),
      });

      const req = { user: mockUser, body: { productId: 'prod1', qty: 99, size: 'L' } };
      const res = mockRes();
      const next = mockNext(res);

      await addToCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toMatch(/insufficient stock/i);
    });
  });

  // ── clearCart / clearCartByUserId ──────────────────────────────────────────
  describe('DELETE /api/cart/clear — clearCart', () => {

    it('clears cart and returns success', async () => {
      Cart.findOneAndUpdate = jest.fn().mockResolvedValue({ items: [] });

      const req = { user: mockUser };
      const res = mockRes();
      const next = mockNext(res);

      await clearCart(req, res, next);

      expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        expect.objectContaining({ $set: { items: [], couponCode: null } }),
        expect.anything()
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('clearCartByUserId (internal helper)', () => {
    it('calls findOneAndUpdate with correct params', async () => {
      Cart.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await clearCartByUserId('user123');

      expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        { $set: { items: [], couponCode: null } }
      );
    });
  });
});
