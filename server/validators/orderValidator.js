// ─── validators/orderValidator.js ─────────────────────────────────────────────
// M2 Owned — Zod schemas for Order API inputs

const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone:    z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number (10 digits starting with 6-9)'),
  street:   z.string().min(5, 'Street address too short').max(200),
  city:     z.string().min(2).max(100),
  state:    z.string().min(2).max(100),
  pincode:  z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

/**
 * POST /api/orders/create
 */
const createOrderSchema = z.object({
  address:       addressSchema.optional(),
  paymentMethod: z.enum(['stripe', 'cod'], {
    errorMap: () => ({ message: "paymentMethod must be 'stripe' or 'cod'" }),
  }),
  couponCode:    z.string().min(2).max(50).optional().nullable(),
  // Frontend may pass saved addressId to look up instead of full address
  addressId:     objectIdSchema.optional(),
}).refine(
  (data) => data.address || data.addressId,
  { message: 'Either address object or addressId must be provided', path: ['address'] }
);

/**
 * PUT /api/admin/orders/:id/status
 */
const updateOrderStatusSchema = z.object({
  status: z.enum(['placed', 'packed', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  note: z.string().max(500).optional(),
});

/**
 * GET /api/admin/orders — query params
 */
const adminOrdersQuerySchema = z.object({
  page:          z.string().optional().transform(v => parseInt(v, 10) || 1),
  limit:         z.string().optional().transform(v => Math.min(parseInt(v, 10) || 20, 100)),
  status:        z.enum(['placed', 'packed', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentMethod: z.enum(['stripe', 'cod']).optional(),
  startDate:     z.string().optional(),
  endDate:       z.string().optional(),
  search:        z.string().max(100).optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  adminOrdersQuerySchema,
};
