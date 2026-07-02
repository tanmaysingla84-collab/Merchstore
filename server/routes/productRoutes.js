// ─── routes/productRoutes.js ──────────────────────────────────────────────────
// M1 Owned — Product Routes (Public listing and Admin product management)

const router   = require('express').Router();
const validate = require('../middleware/validate');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { upload }                = require('../utils/cloudinaryUpload');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Public routes
router.get('/',    getProducts);
router.get('/:id', getProductById);

// Admin-only CRUD routes (images are handled by upload.array)
router.post(
  '/admin',
  protect,
  requireAdmin,
  upload.array('images', 5),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/admin/:id',
  protect,
  requireAdmin,
  upload.array('images', 5),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/admin/:id',
  protect,
  requireAdmin,
  deleteProduct
);

module.exports = router;
