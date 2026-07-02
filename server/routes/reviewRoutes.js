// ─── routes/reviewRoutes.js ───────────────────────────────────────────────────
// M2 Owned

const router   = require('express').Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validate  = require('../middleware/validate');
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { createReviewSchema, reviewsQuerySchema } = require('../validators/reviewValidator');

// GET is public (optionalAuth attaches user if logged in, for future "did you like this?" feature)
router.get(
  '/:productId',
  optionalAuth,
  validate(reviewsQuerySchema, 'query'),
  getProductReviews
);

// POST, PUT, DELETE require authentication
router.post('/:productId', protect, validate(createReviewSchema), createReview);
router.put('/:reviewId/edit', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
