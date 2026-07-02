const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  discountPct: { type: Number, required: true, min: 0, max: 100 },
  expiresAt: { type: Date, required: true },
  usageLimit: { type: Number, required: true, default: 100 },
  usedCount: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
