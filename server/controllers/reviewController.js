// ─── controllers/reviewController.js ─────────────────────────────────────────
// M2 Owned — Review creation, listing, and Product.averageRating recalculation

const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Recalculate and update Product.averageRating using aggregation pipeline.
 * Called after any review create/update/delete.
 */
const recalculateRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id:          '$productId',
        averageRating: { $avg: '$rating' },
        totalRatings:  { $sum: 1 },
      },
    },
  ]);

  const avg   = result[0]?.averageRating ?? 0;
  const total = result[0]?.totalRatings  ?? 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: parseFloat(avg.toFixed(1)),
    totalRatings:  total,
  });

  return { averageRating: parseFloat(avg.toFixed(1)), totalRatings: total };
};

// ─── POST /api/reviews/:productId ─────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment, title } = req.body;
  const userId = req.user._id;

  // Validate product exists
  const product = await Product.findById(productId).select('name isActive');
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check for existing review (one per user per product — enforced by unique index too)
  const existing = await Review.findOne({ userId, productId });
  if (existing) {
    return res.status(409).json({
      success:  false,
      message:  'You have already reviewed this product. Edit your existing review.',
      reviewId: existing._id,
    });
  }

  // Check if user is a verified purchaser
  const hasPurchased = await Order.exists({
    userId,
    paymentStatus: 'paid',
    'items.productId': new mongoose.Types.ObjectId(productId),
  });

  const review = await Review.create({
    userId,
    productId,
    rating,
    comment,
    title: title || '',
    isVerifiedPurchase: !!hasPurchased,
  });

  // Recalculate average
  const { averageRating, totalRatings } = await recalculateRating(productId);

  // Populate user info for response
  await review.populate('userId', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: {
      review,
      productStats: { averageRating, totalRatings },
    },
  });
});

// ─── GET /api/reviews/:productId ──────────────────────────────────────────────
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page    = parseInt(req.query.page, 10)  || 1;
  const limit   = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const sortBy  = req.query.sortBy || 'newest';
  const skip    = (page - 1) * limit;

  const sortOptions = {
    newest:  { createdAt: -1 },
    oldest:  { createdAt:  1 },
    highest: { rating: -1, createdAt: -1 },
    lowest:  { rating:  1, createdAt: -1 },
    helpful: { likes: -1, createdAt: -1 },
  };

  const sort = sortOptions[sortBy] || sortOptions.newest;

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .populate('userId', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId }),
  ]);

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const ratingMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach(d => { ratingMap[d._id] = d.count; });

  res.status(200).json({
    success: true,
    data:    reviews,
    meta: {
      total,
      page,
      limit,
      pages:       Math.ceil(total / limit),
      hasNext:     page < Math.ceil(total / limit),
      sortBy,
      distribution: ratingMap,
    },
  });
});

// ─── PUT /api/reviews/:reviewId — Edit own review ────────────────────────────
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, title } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your review' });
  }

  if (rating  !== undefined) review.rating  = rating;
  if (comment !== undefined) review.comment = comment;
  if (title   !== undefined) review.title   = title;

  await review.save();

  const { averageRating, totalRatings } = await recalculateRating(review.productId);

  res.status(200).json({
    success: true,
    message: 'Review updated',
    data:    { review, productStats: { averageRating, totalRatings } },
  });
});

// ─── DELETE /api/reviews/:reviewId — Delete own review ───────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  // Owner or admin can delete
  if (
    review.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(req.params.reviewId);

  const { averageRating, totalRatings } = await recalculateRating(productId);

  res.status(200).json({
    success: true,
    message: 'Review deleted',
    data:    { productStats: { averageRating, totalRatings } },
  });
});

module.exports = { createReview, getProductReviews, updateReview, deleteReview };
