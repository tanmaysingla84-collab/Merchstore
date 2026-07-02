// ─── controllers/cartController.js ───────────────────────────────────────────
// M2 Owned — Cart CRUD: add, update, remove, get, clear

const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate stock availability for a single item.
 * Throws a descriptive error if insufficient.
 */
const validateStock = async (productId, size, qty) => {
  const product = await Product.findById(productId).select('name sizes isActive');

  if (!product || !product.isActive) {
    const err = new Error('Product not found or is no longer available');
    err.statusCode = 404;
    throw err;
  }

  const sizeEntry = product.sizes.find(s => s.size === size);

  if (!sizeEntry) {
    const err = new Error(`Size '${size}' is not available for "${product.name}"`);
    err.statusCode = 400;
    throw err;
  }

  if (sizeEntry.stock < qty) {
    const err = new Error(
      `Insufficient stock for "${product.name}" (${size}): ` +
      `requested ${qty}, only ${sizeEntry.stock} available`
    );
    err.statusCode = 400;
    throw err;
  }

  return product;
};

// ─── GET /api/cart ────────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate({
    path:   'items.productId',
    select: 'name price images sizes isActive averageRating',
  });

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      data: { items: [], itemCount: 0, subtotal: 0 },
    });
  }

  // Filter out inactive products and enrich items
  const enrichedItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.productId;

    if (!product || !product.isActive) continue; // skip stale refs

    const sizeEntry = product.sizes.find(s => s.size === item.size);
    const itemTotal = product.price * item.qty;
    subtotal += itemTotal;

    enrichedItems.push({
      _id:         item._id,
      productId:   product._id,
      name:        product.name,
      price:       product.price,
      image:       product.images?.[0] || '',
      size:        item.size,
      qty:         item.qty,
      stock:       sizeEntry?.stock ?? 0,
      isAvailable: (sizeEntry?.stock ?? 0) >= item.qty,
      itemTotal,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      items:     enrichedItems,
      itemCount: enrichedItems.reduce((s, i) => s + i.qty, 0),
      subtotal:  parseFloat(subtotal.toFixed(2)),
    },
  });
});

// ─── POST /api/cart/add ───────────────────────────────────────────────────────
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty, size } = req.body;

  // Validate stock
  await validateStock(productId, size, qty);

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [] });
  }

  // Check if same product+size already exists
  const existingIdx = cart.items.findIndex(
    i => i.productId.toString() === productId && i.size === size
  );

  if (existingIdx > -1) {
    // Add quantities
    const newQty = cart.items[existingIdx].qty + qty;
    await validateStock(productId, size, newQty); // re-validate with combined qty
    cart.items[existingIdx].qty = newQty;
  } else {
    cart.items.push({ productId, qty, size });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data:    { itemCount: cart.items.reduce((s, i) => s + i.qty, 0) },
  });
});

// ─── PUT /api/cart/update ─────────────────────────────────────────────────────
const updateCart = asyncHandler(async (req, res) => {
  const { productId, qty, size } = req.body;

  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    const err = new Error('Cart not found');
    err.statusCode = 404;
    throw err;
  }

  // Find the item — match by productId (and current size if provided)
  const itemIdx = cart.items.findIndex(
    i => i.productId.toString() === productId
  );

  if (itemIdx === -1) {
    const err = new Error('Item not found in cart');
    err.statusCode = 404;
    throw err;
  }

  const targetSize = size || cart.items[itemIdx].size;
  const targetQty  = qty  ?? cart.items[itemIdx].qty;

  // Validate stock with new values
  await validateStock(productId, targetSize, targetQty);

  cart.items[itemIdx].size = targetSize;
  cart.items[itemIdx].qty  = targetQty;

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data:    { itemCount: cart.items.reduce((s, i) => s + i.qty, 0) },
  });
});

// ─── DELETE /api/cart/remove/:productId ──────────────────────────────────────
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { size }      = req.query; // optional — remove specific size variant

  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    const err = new Error('Cart not found');
    err.statusCode = 404;
    throw err;
  }

  const before = cart.items.length;

  cart.items = cart.items.filter(item => {
    if (item.productId.toString() !== productId) return true; // keep
    if (size && item.size !== size)               return true; // keep other sizes
    return false; // remove
  });

  if (cart.items.length === before) {
    const err = new Error('Item not found in cart');
    err.statusCode = 404;
    throw err;
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data:    { itemCount: cart.items.reduce((s, i) => s + i.qty, 0) },
  });
});

// ─── DELETE /api/cart/clear ───────────────────────────────────────────────────
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items: [], couponCode: null } },
    { upsert: false }
  );

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
  });
});

/**
 * Internal helper — clear cart by userId without HTTP response.
 * Called by orderController after order creation.
 */
const clearCartByUserId = async (userId) => {
  await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [], couponCode: null } }
  );
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  clearCartByUserId,
};
