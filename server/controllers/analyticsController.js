// ─── controllers/analyticsController.js ──────────────────────────────────────
// M2 Owned — Admin analytics: revenue, top products, summary dashboard

const mongoose = require('mongoose');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Product  = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  buildDateRangeFilter,
  buildRevenuePipeline,
  buildTopProductsPipeline,
  percentChange,
} = require('../utils/analyticsHelpers');

// ─── GET /api/admin/analytics/revenue ────────────────────────────────────────
/**
 * Revenue grouped by day/week/month.
 * Query params: period (week|month|quarter|year), groupBy (day|week|month),
 *               startDate, endDate
 */
const getRevenue = asyncHandler(async (req, res) => {
  const { period = 'month', groupBy = 'month', startDate, endDate } = req.query;

  const dateFilter  = buildDateRangeFilter(startDate, endDate, period);
  const pipeline    = buildRevenuePipeline(dateFilter, groupBy);
  const revenueData = await Order.aggregate(pipeline);

  // Comparison: same period in prior window
  const windowMs       = new Date() - new Date(dateFilter.$gte);
  const prevDateFilter = {
    $gte: new Date(new Date(dateFilter.$gte) - windowMs),
    $lte: new Date(dateFilter.$gte),
  };
  const prevPipeline    = buildRevenuePipeline(prevDateFilter, groupBy);
  const prevRevenueData = await Order.aggregate(prevPipeline);

  const currentTotal  = revenueData.reduce((s, r) => s + r.revenue, 0);
  const prevTotal     = prevRevenueData.reduce((s, r) => s + r.revenue, 0);
  const currentOrders = revenueData.reduce((s, r) => s + r.orderCount, 0);
  const prevOrders    = prevRevenueData.reduce((s, r) => s + r.orderCount, 0);

  res.status(200).json({
    success: true,
    data: {
      periods:     revenueData,
      summary: {
        totalRevenue:    parseFloat(currentTotal.toFixed(2)),
        totalOrders:     currentOrders,
        avgOrderValue:   currentOrders > 0 ? parseFloat((currentTotal / currentOrders).toFixed(2)) : 0,
        revenueChange:   percentChange(currentTotal, prevTotal),
        ordersChange:    percentChange(currentOrders, prevOrders),
      },
      comparison: {
        current:  { revenue: currentTotal, orders: currentOrders },
        previous: { revenue: prevTotal,    orders: prevOrders },
      },
    },
  });
});

// ─── GET /api/admin/analytics/top-products ────────────────────────────────────
/**
 * Top selling products by quantity sold.
 * Query params: limit (default 10), period, startDate, endDate
 */
const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10, period, startDate, endDate } = req.query;
  const topN = Math.min(parseInt(limit, 10) || 10, 50);

  const dateFilter = (startDate || endDate || period)
    ? buildDateRangeFilter(startDate, endDate, period)
    : null;

  const pipeline   = buildTopProductsPipeline(topN, dateFilter);
  const topProducts = await Order.aggregate(pipeline);

  res.status(200).json({
    success: true,
    data:    topProducts,
    meta: {
      count:  topProducts.length,
      period: period || 'all-time',
    },
  });
});

// ─── GET /api/admin/analytics/summary ────────────────────────────────────────
/**
 * Quick dashboard summary stats:
 * total revenue, total orders, total users, active products, pending orders.
 */
const getSummary = asyncHandler(async (req, res) => {
  const now       = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    lastMonthOrders,
    pendingOrders,
    totalUsers,
    newUsersThisMonth,
    activeProducts,
  ] = await Promise.all([
    // All-time revenue (paid only)
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]),
    // This month revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]),
    // Last month revenue (for comparison)
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]),
    // Total orders
    Order.countDocuments(),
    // This month orders
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    // Last month orders
    Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    // Pending orders (not yet delivered or cancelled)
    Order.countDocuments({ status: { $in: ['placed', 'packed', 'shipped'] } }),
    // Total users
    User.countDocuments({ isActive: true }),
    // New users this month
    User.countDocuments({ isActive: true, createdAt: { $gte: startOfMonth } }),
    // Active products
    Product.countDocuments({ isActive: true }),
  ]);

  const curRevenue     = totalRevenue[0]?.total ?? 0;
  const curMonthRev    = monthRevenue[0]?.total ?? 0;
  const lastMonthRev   = lastMonthRevenue[0]?.total ?? 0;

  res.status(200).json({
    success: true,
    data: {
      revenue: {
        allTime:      parseFloat(curRevenue.toFixed(2)),
        thisMonth:    parseFloat(curMonthRev.toFixed(2)),
        lastMonth:    parseFloat(lastMonthRev.toFixed(2)),
        monthlyChange: percentChange(curMonthRev, lastMonthRev),
      },
      orders: {
        total:         totalOrders,
        thisMonth:     monthOrders,
        lastMonth:     lastMonthOrders,
        pending:       pendingOrders,
        monthlyChange: percentChange(monthOrders, lastMonthOrders),
      },
      users: {
        total:     totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      products: {
        active: activeProducts,
      },
      generatedAt: now.toISOString(),
    },
  });
});

// ─── GET /api/admin/analytics/orders-by-status ───────────────────────────────
/**
 * Order distribution by status (for pie/donut chart)
 */
const getOrdersByStatus = asyncHandler(async (req, res) => {
  const distribution = await Order.aggregate([
    {
      $group: {
        _id:   '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$finalAmount', 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: distribution.map(d => ({
      status:   d._id,
      count:    d.count,
      revenue:  parseFloat(d.totalRevenue.toFixed(2)),
    })),
  });
});

module.exports = { getRevenue, getTopProducts, getSummary, getOrdersByStatus };
