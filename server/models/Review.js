// ─── models/Review.js ─────────────────────────────────────────────────────────
// Schema owned by M1 — M2 creates reviews and updates Product.averageRating

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  productId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
    index:    true,
  },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000, trim: true },
  title:   { type: String, maxlength: 200, trim: true, default: '' },
  images:  [{ type: String }],         // optional review images (Cloudinary URLs)
  likes:   { type: Number, default: 0 },
  isVerifiedPurchase: { type: Boolean, default: false },  // set true if user ordered this product
}, { timestamps: true });

// One review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
