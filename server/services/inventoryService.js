// ─── services/inventoryService.js ─────────────────────────────────────────────
// M2 Owned — Inventory management: stock checks, decrements, low-stock queries

const mongoose = require('mongoose');
const Product  = require('../models/Product');

/**
 * Check if sufficient stock exists for each cart item.
 * @param {Array<{productId: string, qty: number, size: string}>} items
 * @returns {Promise<{ok: boolean, insufficient: Array}>}
 */
const checkStockAvailability = async (items) => {
  const insufficient = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).select('name sizes isActive');

    if (!product || !product.isActive) {
      insufficient.push({
        productId: item.productId,
        name:      product?.name || 'Unknown Product',
        issue:     'Product not found or inactive',
      });
      continue;
    }

    const sizeEntry = product.sizes.find(s => s.size === item.size);

    if (!sizeEntry) {
      insufficient.push({
        productId: item.productId,
        name:      product.name,
        size:      item.size,
        issue:     `Size '${item.size}' not available`,
      });
      continue;
    }

    if (sizeEntry.stock < item.qty) {
      insufficient.push({
        productId:   item.productId,
        name:        product.name,
        size:        item.size,
        requested:   item.qty,
        available:   sizeEntry.stock,
        issue:       `Insufficient stock: requested ${item.qty}, only ${sizeEntry.stock} available`,
      });
    }
  }

  return { ok: insufficient.length === 0, insufficient };
};

/**
 * Atomically decrement stock for multiple items within a MongoDB session.
 * Must be called inside a transaction (session provided).
 *
 * @param {Array<{productId: string, qty: number, size: string}>} items
 * @param {mongoose.ClientSession} session
 */
const decrementStock = async (items, session) => {
  const ops = items.map(item => ({
    updateOne: {
      filter: {
        _id: item.productId,
        'sizes.size':  item.size,
        'sizes.stock': { $gte: item.qty }, // safety check — abort if stock went down
      },
      update: {
        $inc: { 'sizes.$.stock': -item.qty },
      },
    },
  }));

  const result = await Product.bulkWrite(ops, { session });

  // Verify all items were updated
  if (result.modifiedCount !== items.length) {
    throw new Error(
      `Stock decrement failed for ${items.length - result.modifiedCount} item(s). ` +
      'Stock may have changed — please refresh your cart.'
    );
  }

  return result;
};

/**
 * Restore stock (for cancelled orders or failed payments)
 * @param {Array<{productId: string, qty: number, size: string}>} items
 * @param {mongoose.ClientSession} [session]
 */
const restoreStock = async (items, session = null) => {
  const ops = items.map(item => ({
    updateOne: {
      filter: { _id: item.productId, 'sizes.size': item.size },
      update: { $inc: { 'sizes.$.stock': item.qty } },
    },
  }));

  const options = session ? { session } : {};
  return Product.bulkWrite(ops, options);
};

/**
 * Find all products (and their sizes) with stock below threshold.
 * @param {number} threshold  - Default: LOW_STOCK_THRESHOLD env var or 10
 * @returns {Promise<Array<{name, sku, size, stock}>>}
 */
const getLowStockItems = async (threshold = null) => {
  const limit = threshold ?? parseInt(process.env.LOW_STOCK_THRESHOLD, 10) ?? 10;

  const products = await Product.find(
    {
      isActive:   true,
      'sizes.stock': { $lt: limit },
    },
    { name: 1, sizes: 1 }
  ).lean();

  const lowStockItems = [];

  for (const product of products) {
    for (const sizeEntry of product.sizes) {
      if (sizeEntry.stock < limit) {
        lowStockItems.push({
          productId: product._id,
          name:      product.name,
          sku:       sizeEntry.sku || `${product._id}-${sizeEntry.size}`,
          size:      sizeEntry.size,
          stock:     sizeEntry.stock,
        });
      }
    }
  }

  return lowStockItems;
};

module.exports = {
  checkStockAvailability,
  decrementStock,
  restoreStock,
  getLowStockItems,
};
