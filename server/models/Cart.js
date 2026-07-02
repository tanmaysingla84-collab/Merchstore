// ─── models/Cart.js ───────────────────────────────────────────────────────────
// Schema owned by M1 — M2 performs all CRUD operations on this collection

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  qty:  { type: Number, required: true, min: 1, default: 1 },
  size: { type: String, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,   // one cart per user
    index:    true,
  },
  items:     [cartItemSchema],
  couponCode: { type: String, default: null },  // last applied coupon
}, { timestamps: true });

// Virtual: item count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, i) => sum + i.qty, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
