// ─── controllers/orderController.js ──────────────────────────────────────────
// M2 Owned — Order creation (Stripe + COD), listing, admin management

const mongoose = require('mongoose');
const Order    = require('../models/Order');
const Cart     = require('../models/Cart');
const User     = require('../models/User');
const Coupon   = require('../models/Coupon');
const { asyncHandler }       = require('../middleware/errorHandler');
const { clearCartByUserId }  = require('./cartController');
const { createPaymentIntent } = require('../services/stripeService');
const { checkStockAvailability, decrementStock } = require('../services/inventoryService');
const { emitOrderStatusUpdate } = require('../socket/orderSocket');

// ─── POST /api/orders/create ──────────────────────────────────────────────────
const resolveOrderAddress = (savedAddress, user) => {
  let fullName = savedAddress.fullName || user.name;
  let phone = savedAddress.phone || user.phone;
  let street = savedAddress.street;

  if (!savedAddress.fullName && street?.includes(' (Ph: ')) {
    const parts = street.split(', ');
    const namePhonePart = parts.pop();
    street = parts.join(', ');
    const namePhoneMatch = namePhonePart.match(/(.+) \(Ph: (.+)\)/);
    if (namePhoneMatch) {
      fullName = namePhoneMatch[1];
      phone = namePhoneMatch[2];
    }
  }

  return {
    fullName: fullName || user.name || 'Customer',
    phone:    phone || '0000000000',
    street,
    city:     savedAddress.city,
    state:    savedAddress.state,
    pincode:  savedAddress.pincode,
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const { address, addressId, paymentMethod, couponCode } = req.body;
  const userId = req.user._id;

  let resolvedAddress = address;

  if (addressId) {
    const user = await User.findById(userId).select('name phone addresses');
    const savedAddress = user?.addresses?.id(addressId);

    if (!savedAddress) {
      return res.status(400).json({
        success: false,
        message: 'Selected shipping address was not found',
      });
    }

    resolvedAddress = resolveOrderAddress(savedAddress, user);
  }

  if (!resolvedAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required',
    });
  }

  // ── 1. Fetch cart ────────────────────────────────────────────────────────
  const cart = await Cart.findOne({ userId }).populate({
    path:   'items.productId',
    select: 'name price images sizes isActive',
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty. Add items before placing an order.',
    });
  }

  // ── 2. Build order items & validate active products ──────────────────────
  const orderItems = cart.items.map(item => {
    const product = item.productId;
    if (!product || !product.isActive) {
      const err = new Error(`Product "${product?.name || item.productId}" is no longer available`);
      err.statusCode = 400;
      throw err;
    }
    return {
      productId: product._id,
      name:      product.name,
      image:     product.images?.[0] || '',
      qty:       item.qty,
      size:      item.size,
      price:     product.price,
    };
  });

  // ── 3. Check stock (pre-transaction check for fast fail) ─────────────────
  const stockCheck = await checkStockAvailability(
    orderItems.map(i => ({ productId: i.productId, qty: i.qty, size: i.size }))
  );

  if (!stockCheck.ok) {
    return res.status(400).json({
      success:      false,
      message:      'Some items are out of stock',
      outOfStock:   stockCheck.insufficient,
    });
  }

  // ── 4. Calculate totals ──────────────────────────────────────────────────
  const totalAmount = parseFloat(
    orderItems.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)
  );

  // ── 5. Apply coupon (if provided) ────────────────────────────────────────
  let discountAmount = 0;
  let appliedCoupon  = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }
    if (coupon.expiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (totalAmount < coupon.minOrderAmt) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmt}`,
      });
    }

    discountAmount = parseFloat(((totalAmount * coupon.discountPct) / 100).toFixed(2));
    if (coupon.maxDiscountAmt && discountAmount > coupon.maxDiscountAmt) {
      discountAmount = coupon.maxDiscountAmt;
    }
    appliedCoupon = coupon;
  }

  const finalAmount = parseFloat((totalAmount - discountAmount).toFixed(2));

  // ── 6. Build idempotency key ─────────────────────────────────────────────
  const idempotencyKey = `order_${userId}_${Date.now()}`;

  // ── 7. Start MongoDB transaction for atomic stock decrement ──────────────
  const session = await mongoose.startSession();

  try {
    let savedOrder = null;
    let stripeClientSecret = null;

    await session.withTransaction(async () => {
      // Decrement stock atomically
      await decrementStock(
        orderItems.map(i => ({ productId: i.productId, qty: i.qty, size: i.size })),
        session
      );

      // Build order document
      const orderData = {
        userId,
        items:          orderItems,
        totalAmount,
        discountAmount,
        finalAmount,
        couponCode:     couponCode?.toUpperCase() || null,
        paymentMethod,
        paymentStatus:  'pending',
        address:        resolvedAddress,
        stripeIdempotencyKey: paymentMethod === 'stripe' ? idempotencyKey : null,
        upiTxnId:       paymentMethod === 'upi' ? req.body.upiTxnId : null,
        statusHistory:  [{ status: 'placed', timestamp: new Date(), note: 'Order placed' }],
      };

      // ── 8. Stripe path: create Payment Intent ────────────────────────────
      if (paymentMethod === 'stripe') {
        const { clientSecret, paymentIntentId } = await createPaymentIntent(
          finalAmount,
          idempotencyKey,
          { userId: userId.toString(), couponCode: couponCode || '' }
        );

        orderData.stripePaymentIntentId = paymentIntentId;
        stripeClientSecret = clientSecret;

        const [order] = await Order.create([orderData], { session });
        savedOrder = order;

        // Atomically increment coupon usedCount
        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(
            appliedCoupon._id,
            { $inc: { usedCount: 1 } },
            { session }
          );
        }

        // Clear cart
        await clearCartByUserId(userId);
      }

      // ── 9. COD path: create order immediately ─────────────────────────────
      if (paymentMethod === 'cod') {
        const [order] = await Order.create([orderData], { session });
        savedOrder = order;

        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(
            appliedCoupon._id,
            { $inc: { usedCount: 1 } },
            { session }
          );
        }

        await clearCartByUserId(userId);
      }

      // ── 10. UPI path: create order immediately ────────────────────────────
      if (paymentMethod === 'upi') {
        const [order] = await Order.create([orderData], { session });
        savedOrder = order;

        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(
            appliedCoupon._id,
            { $inc: { usedCount: 1 } },
            { session }
          );
        }

        await clearCartByUserId(userId);
      }
    });

    if (paymentMethod === 'stripe' && savedOrder) {
      return res.status(201).json({
        success: true,
        message: 'Order initiated — complete payment',
        order:       savedOrder,
        data: {
          order:            savedOrder,
          orderId:          savedOrder._id,
          clientSecret:     stripeClientSecret,
          finalAmount:      savedOrder.finalAmount,
          paymentIntentId:  savedOrder.stripePaymentIntentId,
        },
      });
    }

    // COD response (outside transaction block)
    if (paymentMethod === 'cod' && savedOrder) {
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully (Cash on Delivery)',
        order:       savedOrder,
        data: {
          order:       savedOrder,
          orderId:     savedOrder._id,
          finalAmount: savedOrder.finalAmount,
          status:      savedOrder.status,
        },
      });
    }

    // UPI response (outside transaction block)
    if (paymentMethod === 'upi' && savedOrder) {
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully (UPI Payment)',
        order:       savedOrder,
        data: {
          order:       savedOrder,
          orderId:     savedOrder._id,
          finalAmount: savedOrder.finalAmount,
          status:      savedOrder.status,
        },
      });
    }
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
});

// ─── GET /api/orders/:userId ──────────────────────────────────────────────────
const getUserOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page  = parseInt(req.query.page, 10)  || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip  = (page - 1) * limit;

  // Users can only access their own orders (admins can access any)
  if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const [orders, total] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-statusHistory -stripeIdempotencyKey')
      .lean(),
    Order.countDocuments({ userId }),
  ]);

  res.status(200).json({
    success: true,
    data:    orders,
    pagination: {
      total,
      page,
      limit,
      pages:   Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// ─── GET /api/orders/single/:orderId ─────────────────────────────────────────
const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('userId', 'name email phone')
    .lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Authorization: owner or admin
  if (
    req.user.role !== 'admin' &&
    order.userId._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  res.status(200).json({ success: true, data: order });
});

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
const adminGetOrders = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20,
    status, paymentMethod,
    startDate, endDate,
    search,
  } = req.query;

  const pageNum  = parseInt(page, 10)  || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip     = (pageNum - 1) * limitNum;

  const filter = {};

  if (status)        filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  // Search by orderId or user name (via aggregation)
  let query = Order.find(filter);

  if (search) {
    // Try ObjectId search first
    if (/^[a-f\d]{24}$/i.test(search)) {
      filter._id = search;
    }
    query = Order.find(filter);
  }

  const [orders, total] = await Promise.all([
    query
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data:    orders,
    pagination: {
      total,
      page:    pageNum,
      limit:   limitNum,
      pages:   Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  });
});

// ─── PUT /api/admin/orders/:id/status ────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '' } = req.body;
  const { id }                = req.params;

  const order = await Order.findById(id).populate('userId', 'name email');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Business logic: can't update a delivered or cancelled order
  if (['delivered', 'cancelled'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot update an order with status '${order.status}'`,
    });
  }

  const previousStatus = order.status;
  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note:      note || `Status updated from '${previousStatus}' to '${status}'`,
    updatedBy: req.user._id,
  });

  await order.save();

  // Emit real-time WebSocket event
  emitOrderStatusUpdate(order._id.toString(), status, {
    note,
    updatedBy: req.user.name,
    previousStatus,
  });

  res.status(200).json({
    success: true,
    message: `Order status updated to '${status}'`,
    data: {
      orderId:  order._id,
      status:   order.status,
      history:  order.statusHistory,
    },
  });
});

// ─── PUT /api/admin/orders/:id/payment-status ─────────────────────────────────
const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const { id }            = req.params;

  const order = await Order.findById(id).populate('userId', 'name email');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const previousPaymentStatus = order.paymentStatus;
  order.paymentStatus = paymentStatus;

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: `Payment status updated from '${previousPaymentStatus}' to '${paymentStatus}'`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: `Payment status updated to '${paymentStatus}'`,
    data: {
      orderId:       order._id,
      paymentStatus: order.paymentStatus,
      status:        order.status,
      history:       order.statusHistory,
    },
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getSingleOrder,
  adminGetOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
};
