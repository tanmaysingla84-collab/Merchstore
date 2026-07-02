const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  images: [{ type: String }], // Cloudinary URLs
  sizes: [sizeSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual totalStock calculating the sum of stock across all sizes
productSchema.virtual('totalStock').get(function() {
  if (!this.sizes || this.sizes.length === 0) return 0;
  return this.sizes.reduce((acc, curr) => acc + curr.stock, 0);
});

module.exports = mongoose.model('Product', productSchema);
