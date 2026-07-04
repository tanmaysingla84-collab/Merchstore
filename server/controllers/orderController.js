const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { createPaymentIntent } = require('../services/stripeService');
const { emitOrderStatusUpdate } = require('../socket/orderSocket');

// @desc    Create a new order
// @route   POST /api/orders/create
// @access  Private
const createOrder = async (req, res) => {
  // Try using MongoDB transaction if replica set is available, else fallback to standard updates
  const session = await mongoose.startSession().catch(() => null);
  if (session) session.startTransaction();

  try {
    const { address, paymentMethod, couponCode, upiTxnId } = req.body;

    if (!address || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Address and Payment Method are required' });
    }

    if (paymentMethod === 'upi') {
      if (!upiTxnId) {
        return res.status(400).json({ success: false, message: 'UPI Transaction ID is required' });
      }
      if (!/^\d{12}$/.test(upiTxnId)) {
        return res.status(400).json({ success: false, message: 'UPI Transaction ID must be exactly 12 digits' });
      }
    }

    // 1. Get user cart
    const cart = await Cart.findOne({ userId: req.user._id }).session(session ? session : null);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // 2. Validate items and stock, build order items array, calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session ? session : null);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Check stock for the specific size
      const sizeObj = product.sizes.find(s => s.size === item.size);
      if (!sizeObj || sizeObj.stock < item.qty) {
        throw new Error(`Insufficient stock for product ${product.name} in size ${item.size}`);
      }

      subtotal += product.price * item.qty;
      orderItems.push({
        productId: product._id,
        name: product.name,
        qty: item.qty,
        size: item.size,
        price: product.price
      });
    }

    // 3. Handle Coupon validation and application
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode }).session(session ? session : null);
      if (coupon) {
        // Double check validity
        const now = new Date();
        if (coupon.expiresAt > now && coupon.usedCount < coupon.usageLimit) {
          discount = Math.round(subtotal * (coupon.discountPct / 100));
        } else {
          console.warn(`Coupon ${couponCode} is expired or limit exceeded.`);
        }
      }
    }

    // 4. Calculate final totals (Delivery fee is free above ₹1000, else ₹60)
    const deliveryFee = subtotal > 1000 ? 0 : 60;
    const totalAmount = subtotal + deliveryFee - discount;

    // 5. Decrement stock atomically
    for (const item of cart.items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, 'sizes.size': item.size, 'sizes.stock': { $gte: item.qty } },
        { $inc: { 'sizes.$.stock': -item.qty } },
        { session: session ? session : null }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error(`Stock decrement failed for one of your items. Product stock might have changed.`);
      }
    }

    // 6. Update coupon usage
    if (coupon && discount > 0) {
      await Coupon.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } },
        { session: session ? session : null }
      );
    }

    // 7. Payment intent configuration
    let stripePaymentIntentId = null;
    let clientSecret = null;
    let initialPaymentStatus = 'pending';

    if (paymentMethod === 'stripe') {
      const paymentIntent = await createPaymentIntent(totalAmount, {
        userId: req.user._id.toString(),
        couponCode: couponCode || ''
      });
      stripePaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    }

    // 8. Create Order
    const order = new Order({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: 'Placed',
      address,
      stripePaymentIntentId,
      upiTxnId
    });

    await order.save({ session: session ? session : null });

    // 9. Clear User's Cart
    cart.items = [];
    await cart.save({ session: session ? session : null });

    // Commit Transaction if active
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Response structure
    const responsePayload = {
      success: true,
      message: 'Order created successfully',
      order
    };

    if (clientSecret) {
      responsePayload.clientSecret = clientSecret;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    // Abort Transaction if active
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/single/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: User can only view their own order unless they are an admin
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin
// @access  Private/Admin
const getAdminOrders = async (req, res) => {
  try {
    const { status, paymentMethod } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    
    // Auto update paymentStatus to paid if delivered or COD delivered
    if (status === 'Delivered') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Trigger Real-time WebSocket update
    emitOrderStatusUpdate(order._id.toString(), status);

    res.status(200).json({ success: true, order, message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus
};
