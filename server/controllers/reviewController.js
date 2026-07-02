const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create a product review
// @route   POST /api/reviews/:productId
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const rate = parseInt(rating);
    if (isNaN(rate) || rate < 1 || rate > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed this product, update it if they have, otherwise create new
    let review = await Review.findOne({ userId: req.user._id, productId });
    if (review) {
      review.rating = rate;
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({
        userId: req.user._id,
        productId,
        rating: rate,
        comment
      });
    }

    // Recalculate averageRating for the product using MongoDB Aggregation
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      product.averageRating = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal place
    } else {
      product.averageRating = 0;
    }
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments({ productId });
    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getProductReviews
};
