// ─── models/Coupon.js ─────────────────────────────────────────────────────────
// Schema owned by M1 — M2 validates and increments usedCount

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, index: true },
  discountPct:  { type: Number, required: true, min: 1, max: 100 },  // e.g. 20 = 20%
  maxDiscountAmt: { type: Number, default: null },   // cap on discount value (null = no cap)
  minOrderAmt:  { type: Number, default: 0 },        // minimum cart value to use coupon
  expiresAt:    { type: Date, required: true },
  usageLimit:   { type: Number, default: 100 },      // total allowed uses
  usedCount:    { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  description:  { type: String, default: '' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual: is coupon currently valid
couponSchema.virtual('isValid').get(function () {
  return (
    this.isActive &&
    this.expiresAt > new Date() &&
    this.usedCount < this.usageLimit
  );
});

module.exports = mongoose.model('Coupon', couponSchema);
