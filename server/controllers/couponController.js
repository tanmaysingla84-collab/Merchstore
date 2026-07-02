// ─── controllers/couponController.js ─────────────────────────────────────────
// M2 Owned — Coupon validation API

const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/coupons/validate
 * Validates a coupon code against the given cart total.
 * Does NOT increment usedCount here — that happens atomically during order creation.
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({
    code:     code.trim().toUpperCase(),
    isActive: true,
  });

  // ── Checks ────────────────────────────────────────────────────────────────

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code' });
  }

  if (coupon.expiresAt <= new Date()) {
    return res.status(400).json({
      success: false,
      message: 'This coupon has expired',
      code:    'COUPON_EXPIRED',
    });
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'This coupon has reached its usage limit',
      code:    'COUPON_EXHAUSTED',
    });
  }

  if (cartTotal !== undefined && cartTotal < coupon.minOrderAmt) {
    return res.status(400).json({
      success: false,
      message: `Minimum cart value of ₹${coupon.minOrderAmt} required for this coupon`,
      code:    'MIN_ORDER_NOT_MET',
      minOrderAmt: coupon.minOrderAmt,
    });
  }

  // ── Calculate discount ────────────────────────────────────────────────────
  let discountAmount = 0;

  if (cartTotal !== undefined) {
    discountAmount = parseFloat(((cartTotal * coupon.discountPct) / 100).toFixed(2));
    if (coupon.maxDiscountAmt && discountAmount > coupon.maxDiscountAmt) {
      discountAmount = coupon.maxDiscountAmt;
    }
  }

  const remainingUses = coupon.usageLimit - coupon.usedCount;
  const expiresInMs   = new Date(coupon.expiresAt) - new Date();
  const expiresInDays = Math.ceil(expiresInMs / (1000 * 60 * 60 * 24));

  res.status(200).json({
    success: true,
    message: 'Coupon is valid ✅',
    data: {
      code:            coupon.code,
      discountPct:     coupon.discountPct,
      discountAmount:  discountAmount,
      maxDiscountAmt:  coupon.maxDiscountAmt,
      minOrderAmt:     coupon.minOrderAmt,
      description:     coupon.description,
      expiresAt:       coupon.expiresAt,
      expiresInDays:   expiresInDays > 0 ? expiresInDays : 0,
      remainingUses,
    },
  });
});

/**
 * GET /api/admin/coupons — List all coupons (admin only)
 */
const listCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const pageNum  = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip     = (pageNum - 1) * limitNum;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Coupon.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data:    coupons,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

/**
 * POST /api/admin/coupons — Create coupon (admin only)
 */
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountPct, expiresAt, usageLimit, minOrderAmt, maxDiscountAmt, description } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Coupon code already exists' });
  }

  const coupon = await Coupon.create({
    code:          code.toUpperCase(),
    discountPct,
    expiresAt:     new Date(expiresAt),
    usageLimit:    usageLimit || 100,
    minOrderAmt:   minOrderAmt || 0,
    maxDiscountAmt: maxDiscountAmt || null,
    description:   description || '',
    createdBy:     req.user._id,
  });

  res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
});

/**
 * PATCH /api/admin/coupons/:id — Toggle active state (admin only)
 */
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }
  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.status(200).json({
    success: true,
    message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`,
    data:    { isActive: coupon.isActive },
  });
});

module.exports = { validateCoupon, listCoupons, createCoupon, toggleCoupon };
