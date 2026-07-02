// ─── tests/inventoryService.test.js ───────────────────────────────────────────

jest.mock('../models/Product');

const { checkStockAvailability, getLowStockItems } = require('../services/inventoryService');
const Product = require('../models/Product');

describe('InventoryService', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── checkStockAvailability ─────────────────────────────────────────────────
  describe('checkStockAvailability', () => {

    it('returns ok:true when all items are in stock', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id:      'prod1',
          name:     'GU Cap',
          isActive: true,
          sizes:    [{ size: 'M', stock: 10 }],
        }),
      });

      const result = await checkStockAvailability([
        { productId: 'prod1', qty: 5, size: 'M' },
      ]);

      expect(result.ok).toBe(true);
      expect(result.insufficient).toHaveLength(0);
    });

    it('returns ok:false when product is inactive', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id:      'prod2',
          name:     'Old Cap',
          isActive: false,
          sizes:    [],
        }),
      });

      const result = await checkStockAvailability([
        { productId: 'prod2', qty: 1, size: 'M' },
      ]);

      expect(result.ok).toBe(false);
      expect(result.insufficient[0].issue).toMatch(/inactive/i);
    });

    it('returns ok:false when size does not exist', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id:      'prod3',
          name:     'GU Mug',
          isActive: true,
          sizes:    [{ size: 'One Size', stock: 20 }],
        }),
      });

      const result = await checkStockAvailability([
        { productId: 'prod3', qty: 1, size: 'XL' },
      ]);

      expect(result.ok).toBe(false);
      expect(result.insufficient[0].issue).toMatch(/size/i);
    });

    it('returns ok:false when requested qty exceeds stock', async () => {
      Product.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id:      'prod4',
          name:     'GU Jacket',
          isActive: true,
          sizes:    [{ size: 'L', stock: 3 }],
        }),
      });

      const result = await checkStockAvailability([
        { productId: 'prod4', qty: 10, size: 'L' },
      ]);

      expect(result.ok).toBe(false);
      expect(result.insufficient[0].available).toBe(3);
      expect(result.insufficient[0].requested).toBe(10);
    });
  });

  // ── getLowStockItems ───────────────────────────────────────────────────────
  describe('getLowStockItems', () => {

    it('returns items below threshold', async () => {
      Product.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id:   'prod5',
            name:  'GU Hoodie',
            sizes: [
              { size: 'S', stock: 2, sku: 'GUH-S' },
              { size: 'M', stock: 15, sku: 'GUH-M' }, // above threshold
            ],
          },
        ]),
      });

      const items = await getLowStockItems(10);

      expect(items).toHaveLength(1); // only 'S' size
      expect(items[0].size).toBe('S');
      expect(items[0].stock).toBe(2);
      expect(items[0].sku).toBe('GUH-S');
    });

    it('returns empty array when all products are well-stocked', async () => {
      Product.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const items = await getLowStockItems(10);
      expect(items).toHaveLength(0);
    });
  });
});
