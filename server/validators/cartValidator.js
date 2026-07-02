// ─── validators/cartValidator.js ──────────────────────────────────────────────
// M2 Owned — Zod schemas for Cart API inputs

const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid product ID');

/**
 * POST /api/cart/add
 */
const addToCartSchema = z.object({
  productId: objectIdSchema,
  qty:       z.number({ coerce: true }).int().min(1, 'Quantity must be at least 1').max(50, 'Max 50 items per product'),
  size:      z.string().min(1, 'Size is required').max(10, 'Invalid size'),
});

/**
 * PUT /api/cart/update
 */
const updateCartSchema = z.object({
  productId: objectIdSchema,
  qty:       z.number({ coerce: true }).int().min(1, 'Quantity must be at least 1').max(50).optional(),
  size:      z.string().min(1).max(10).optional(),
}).refine(data => data.qty !== undefined || data.size !== undefined, {
  message: 'At least one of qty or size must be provided',
});

/**
 * DELETE /api/cart/remove/:productId — params validation
 */
const removeCartParamsSchema = z.object({
  productId: objectIdSchema,
  size:      z.string().min(1).max(10).optional(),
});

module.exports = {
  addToCartSchema,
  updateCartSchema,
  removeCartParamsSchema,
};
