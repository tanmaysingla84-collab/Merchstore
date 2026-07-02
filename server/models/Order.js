// ─── models/Order.js ──────────────────────────────────────────────────────────
// Schema owned by M1 — M2 creates, reads, and updates orders

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      { type: String, required: true },
  image:     { type: String, default: '' },
  qty:       { type: Number, required: true, min: 1 },
  size:      { type: String, required: true },
  price:     { type: Number, required: true },
}, { _id: false });

const addressSnapshotSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
}, { _id: false });

const ORDER_STATUS = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = ['stripe', 'cod'];

const orderSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  items:          [orderItemSchema],
  totalAmount:    { type: Number, required: true, min: 0 },
  discountAmount: { type: Number, default: 0 },        // coupon discount applied
  finalAmount:    { type: Number, required: true },    // totalAmount - discountAmount
  couponCode:     { type: String, default: null },

  paymentMethod:         { type: String, enum: PAYMENT_METHODS, required: true },
  paymentStatus:         { type: String, enum: PAYMENT_STATUS, default: 'pending' },
  stripePaymentIntentId: { type: String, default: null, sparse: true },
  stripeIdempotencyKey:  { type: String, default: null },

  status:  { type: String, enum: ORDER_STATUS, default: 'placed' },
  address: { type: addressSnapshotSchema, required: true },

  // Status history for timeline
  statusHistory: [{
    status:    { type: String, enum: ORDER_STATUS },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true });

// Index for admin filtering
orderSchema.index({ status: 1, paymentMethod: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
