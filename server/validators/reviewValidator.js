// ─── validators/reviewValidator.js ────────────────────────────────────────────
// M2 Owned — Zod schemas for Review API inputs

const { z } = require('zod');

/**
 * POST /api/reviews/:productId
 */
const createReviewSchema = z.object({
  rating:  z.number({ coerce: true }).int().min(1, 'Rating must be between 1-5').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long (max 1000 chars)'),
  title:   z.string().max(200).optional(),
});

/**
 * GET /api/reviews/:productId — query params
 */
const reviewsQuerySchema = z.object({
  page:     z.string().optional().transform(v => parseInt(v, 10) || 1),
  limit:    z.string().optional().transform(v => Math.min(parseInt(v, 10) || 10, 50)),
  sortBy:   z.enum(['newest', 'highest', 'lowest', 'helpful']).optional().default('newest'),
});

module.exports = { createReviewSchema, reviewsQuerySchema };
