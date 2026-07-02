// ─── tests/product.test.js ───────────────────────────────────────────────────
// M1 Owned — Product Controller Unit Tests (With Next assertions and clean mocking)

jest.mock('../models/Product');
jest.mock('../models/Review');
jest.mock('../utils/cloudinaryUpload');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const Product              = require('../models/Product');
const Review               = require('../models/Review');
const { deleteFromCloudinary } = require('../utils/cloudinaryUpload');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockProduct = {
  _id:          'prod123',
  name:         'GU Hoodie',
  description:  'Official Geeta University Hoodie',
  category:     'clothing',
  price:        999,
  comparePrice: 1299,
  images:       ['http://cloudinary.com/image1.jpg'],
  sizes:        [{ size: 'L', stock: 10, sku: 'GUH-L' }],
  isActive:     true,
  save:         jest.fn().mockResolvedValue(true),
};

describe('ProductController', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    // Default mock implementations to prevent leakage crashes
    Product.find = jest.fn();
    Product.findById = jest.fn();
    Product.create = jest.fn();
    Product.countDocuments = jest.fn();
    Product.findByIdAndDelete = jest.fn();
    Review.find = jest.fn();
    deleteFromCloudinary.mockReset();
  });

  // ── getProducts ────────────────────────────────────────────────────────────
  describe('GET /api/products — getProducts', () => {
    it('returns a paginated list of active products', async () => {
      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const req = { query: { page: '1', limit: '10', category: 'clothing' } };
      const res = mockRes();
      const next = jest.fn();

      await getProducts(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('getProducts error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true, category: 'clothing' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data:    expect.arrayContaining([expect.objectContaining({ name: 'GU Hoodie' })]),
          pagination: expect.objectContaining({ total: 1, page: 1, limit: 10 }),
        })
      );
    });

    it('performs text search sorting by text score when search parameter is present', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        sort:   jest.fn().mockReturnThis(),
        skip:   jest.fn().mockReturnThis(),
        limit:  jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue([mockProduct]),
      };
      Product.find.mockReturnValue(mockQueryChain);
      Product.countDocuments.mockResolvedValue(1);

      const req = { query: { search: 'hoodie' } };
      const res = mockRes();
      const next = jest.fn();

      await getProducts(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true, $text: { $search: 'hoodie' } })
      );
      expect(mockQueryChain.select).toHaveBeenCalledWith({ score: { $meta: 'textScore' } });
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' } });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── getProductById ─────────────────────────────────────────────────────────
  describe('GET /api/products/:id — getProductById', () => {
    it('returns single product details populated with reviews', async () => {
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct),
      });

      const mockReviews = [
        { _id: 'rev1', rating: 5, comment: 'Nice!' },
      ];

      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort:     jest.fn().mockReturnThis(),
        limit:    jest.fn().mockReturnThis(),
        lean:     jest.fn().mockResolvedValue(mockReviews),
      });

      const req = { params: { id: 'prod123' } };
      const res = mockRes();
      const next = jest.fn();

      await getProductById(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('getProductById error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(Product.findById).toHaveBeenCalledWith('prod123');
      expect(Review.find).toHaveBeenCalledWith({ productId: 'prod123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data:    expect.objectContaining({
            name:    'GU Hoodie',
            reviews: mockReviews,
          }),
        })
      );
    });

    it('returns 404 when product is not found', async () => {
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: 'nonexistent' } };
      const res = mockRes();
      const next = jest.fn();

      await getProductById(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── createProduct ──────────────────────────────────────────────────────────
  describe('POST /api/admin/products — createProduct', () => {
    it('creates product mapping uploaded files to images array', async () => {
      Product.create.mockResolvedValue({
        ...mockProduct,
        images: ['http://cloudinary.com/uploaded.jpg'],
      });

      const req = {
        body: {
          name:        'GU Hoodie',
          description: 'Official Geeta University Hoodie',
          category:    'clothing',
          price:       999,
          sizes:       [{ size: 'L', stock: 10 }],
        },
        files: [
          { path: 'http://cloudinary.com/uploaded.jpg' },
        ],
      };
      const res = mockRes();
      const next = jest.fn();

      await createProduct(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('createProduct error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name:   'GU Hoodie',
          images: ['http://cloudinary.com/uploaded.jpg'],
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── updateProduct ──────────────────────────────────────────────────────────
  describe('PUT /api/admin/products/:id — updateProduct', () => {
    it('updates product fields and removes/adds images', async () => {
      const mockProductDoc = {
        _id:    'prod123',
        name:   'GU Hoodie',
        images: ['http://cloudinary.com/img1.jpg', 'http://cloudinary.com/img2.jpg'],
        save:   jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockResolvedValue(mockProductDoc);
      deleteFromCloudinary.mockResolvedValue(true);

      const req = {
        params: { id: 'prod123' },
        body: {
          name:          'GU Premium Hoodie',
          removedImages: ['http://cloudinary.com/img1.jpg'],
        },
        files: [
          { path: 'http://cloudinary.com/img3.jpg' },
        ],
      };
      const res = mockRes();
      const next = jest.fn();

      await updateProduct(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('updateProduct error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).toHaveBeenCalledWith('http://cloudinary.com/img1.jpg');
      expect(mockProductDoc.images).toEqual(['http://cloudinary.com/img2.jpg', 'http://cloudinary.com/img3.jpg']);
      expect(mockProductDoc.name).toBe('GU Premium Hoodie');
      expect(mockProductDoc.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if product to update does not exist', async () => {
      Product.findById.mockResolvedValue(null);

      const req = {
        params: { id: 'nonexistent' },
        body:   { name: 'Updated Name' },
      };
      const res = mockRes();
      const next = jest.fn();

      await updateProduct(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Product not found' })
      );
    });
  });

  // ── deleteProduct ──────────────────────────────────────────────────────────
  describe('DELETE /api/admin/products/:id — deleteProduct', () => {
    it('performs soft-delete by deactivating the product', async () => {
      const mockProductDoc = {
        ...mockProduct,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById.mockResolvedValue(mockProductDoc);

      const req = { params: { id: 'prod123' }, query: {} };
      const res = mockRes();
      const next = jest.fn();

      await deleteProduct(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('deleteProduct soft error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(mockProductDoc.isActive).toBe(false);
      expect(mockProductDoc.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('performs hard-delete and clears Cloudinary assets', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndDelete.mockResolvedValue({});
      deleteFromCloudinary.mockResolvedValue(true);

      const req = { params: { id: 'prod123' }, query: { hardDelete: 'true' } };
      const res = mockRes();
      const next = jest.fn();

      await deleteProduct(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('deleteProduct hard error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).toHaveBeenCalledWith('http://cloudinary.com/image1.jpg');
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('prod123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if product to delete does not exist', async () => {
      Product.findById.mockResolvedValue(null);

      const req = { params: { id: 'nonexistent' }, query: {} };
      const res = mockRes();
      const next = jest.fn();

      await deleteProduct(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Product not found' })
      );
    });
  });
});
