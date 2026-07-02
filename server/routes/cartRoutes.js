// ─── routes/cartRoutes.js ─────────────────────────────────────────────────────
// M2 Owned

const router  = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const validate    = require('../middleware/validate');
const {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const {
  addToCartSchema,
  updateCartSchema,
} = require('../validators/cartValidator');

// All cart routes require authentication
router.use(protect);

router.get('/',                       getCart);
router.post('/add',    validate(addToCartSchema),    addToCart);
router.put('/update',  validate(updateCartSchema),   updateCart);
router.delete('/clear',               clearCart);
router.delete('/remove/:productId',   removeFromCart);

module.exports = router;
