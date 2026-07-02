const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get revenue stats grouped by week or month
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period } = req.query; // 'weekly' or 'monthly'
    let groupFormat = '%Y-%m'; // Default to monthly format YYYY-MM
    
    if (period === 'weekly') {
      groupFormat = '%Y-W%V'; // Year and week number
    }

    const revenueData = await Order.aggregate([
      // Only count paid orders
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          period: '$_id',
          revenue: 1,
          orderCount: 1,
          avgOrderValue: { $round: [{ $divide: ['$revenue', '$orderCount'] }, 2] },
          _id: 0
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.status(200).json({ success: true, data: revenueData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top selling products by quantity
// @route   GET /api/admin/analytics/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          qtySold: { $sum: '$items.qty' },
          totalSales: { $sum: { $multiply: ['$items.qty', '$items.price'] } }
        }
      },
      { $sort: { qtySold: -1 } },
      { $limit: limit },
      {
        $project: {
          productId: '$_id',
          name: 1,
          qtySold: 1,
          totalSales: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({ success: true, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get summary statistics (revenue, total orders, users count)
// @route   GET /api/admin/analytics/summary
// @access  Private/Admin
const getSummaryStats = async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

    // Total orders count
    const totalOrders = await Order.countDocuments({});

    // Total revenue from paid orders
    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRevenueAnalytics,
  getTopProducts,
  getSummaryStats
};
