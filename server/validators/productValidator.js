// ─── validators/productValidator.js ───────────────────────────────────────────
// M1 Owned — Zod Validation Schemas for Products (with multipart form parsing)

const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

const sizeStockSchema = z.object({
  size:  z.string().min(1, 'Size is required'),
  stock: z.number({ coerce: true }).int().min(0, 'Stock cannot be negative'),
  sku:   z.string().optional().default(''),
});

// Preprocessors to handle stringified inputs from multipart/form-data
const sizesPreprocess = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return val;
    }
  }
  return val;
}, z.array(sizeStockSchema).min(1, 'At least one size with stock must be provided'));

const tagsPreprocess = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return val.split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return val;
}, z.array(z.string()));

const createProductSchema = z.object({
  name:         z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  description:  z.string().min(10, 'Description must be at least 10 characters'),
  category:     z.string().min(2, 'Category is required').trim(),
  price:        z.number({ coerce: true }).min(0, 'Price must be positive'),
  comparePrice: z.number({ coerce: true }).min(0, 'Compare price must be positive').optional(),
  sizes:        sizesPreprocess,
  tags:         tagsPreprocess.optional().default([]),
  isFeatured:   z.boolean({ coerce: true }).optional().default(false),
  isActive:     z.boolean({ coerce: true }).optional().default(true),
});

const updateProductSchema = z.object({
  name:         z.string().min(2).max(100).trim().optional(),
  description:  z.string().min(10).optional(),
  category:     z.string().min(2).trim().optional(),
  price:        z.number({ coerce: true }).min(0).optional(),
  comparePrice: z.number({ coerce: true }).min(0).optional(),
  sizes:        sizesPreprocess.optional(),
  tags:         tagsPreprocess.optional(),
  isFeatured:   z.boolean({ coerce: true }).optional(),
  isActive:     z.boolean({ coerce: true }).optional(),
  removedImages: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (_) {
        return [val];
      }
    }
    return val;
  }, z.array(z.string())).optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  objectIdSchema,
};
