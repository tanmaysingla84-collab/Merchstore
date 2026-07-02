// ─── models/Product.js ────────────────────────────────────────────────────────
// Schema owned by M1 — M2 reads stock fields and updates averageRating

const mongoose = require('mongoose');

const sizeStockSchema = new mongoose.Schema({
  size:  { type: String, required: true },   // e.g. 'S', 'M', 'L', 'XL', 'XXL'
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku:   { type: String, default: '' },       // M2 uses this in low-stock email
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  category:      { type: String, required: true, index: true },
  price:         { type: Number, required: true, min: 0 },
  comparePrice:  { type: Number, min: 0 },   // original price for discount display
  images:        [{ type: String }],           // Cloudinary URLs
  sizes:         [sizeStockSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:  { type: Number, default: 0 },
  tags:          [{ type: String }],
  isActive:      { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual: total stock across all sizes
productSchema.virtual('totalStock').get(function () {
  return this.sizes.reduce((sum, s) => sum + s.stock, 0);
});

// Virtual: is any size in stock
productSchema.virtual('inStock').get(function () {
  return this.sizes.some(s => s.stock > 0);
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
