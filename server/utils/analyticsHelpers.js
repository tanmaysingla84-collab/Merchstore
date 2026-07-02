// ─── utils/analyticsHelpers.js ────────────────────────────────────────────────
// M2 Owned — Reusable MongoDB aggregation pipeline builders for analytics

/**
 * Build a date range filter for MongoDB queries.
 * @param {string} [startDate] - ISO date string
 * @param {string} [endDate]   - ISO date string
 * @param {string} [period]    - 'week' | 'month' | 'quarter' | 'year' (relative)
 */
const buildDateRangeFilter = (startDate, endDate, period) => {
  if (startDate || endDate) {
    const filter = {};
    if (startDate) filter.$gte = new Date(startDate);
    if (endDate)   filter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    return filter;
  }

  const now  = new Date();
  const from = new Date(now);

  switch (period) {
    case 'week':
      from.setDate(now.getDate() - 7);
      break;
    case 'month':
      from.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      from.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      from.setFullYear(now.getFullYear() - 1);
      break;
    default:
      from.setMonth(now.getMonth() - 1); // default: last 30 days
  }

  return { $gte: from, $lte: now };
};

/**
 * Build aggregation pipeline to group revenue by time period.
 * @param {'day'|'week'|'month'} groupBy
 * @param {Object} dateFilter   - MongoDB date filter for createdAt
 */
const buildRevenuePipeline = (dateFilter, groupBy = 'month') => {
  const dateGroupExpr = {
    day: {
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' },
    },
    week: {
      $dateToString: {
        format: '%Y-W%V',
        date:   '$createdAt',
        timezone: 'Asia/Kolkata',
      },
    },
    month: {
      $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' },
    },
  }[groupBy] || {
    $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' },
  };

  return [
    // Stage 1: Filter by date range and only paid orders
    {
      $match: {
        createdAt:     { ...dateFilter },
        paymentStatus: 'paid',
      },
    },
    // Stage 2: Group by period
    {
      $group: {
        _id:           dateGroupExpr,
        revenue:       { $sum: '$finalAmount' },
        orderCount:    { $sum: 1 },
        avgOrderValue: { $avg: '$finalAmount' },
        totalDiscount: { $sum: '$discountAmount' },
      },
    },
    // Stage 3: Rename _id to period
    {
      $project: {
        _id:           0,
        period:        '$_id',
        revenue:       { $round: ['$revenue', 2] },
        orderCount:    1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        totalDiscount: { $round: ['$totalDiscount', 2] },
      },
    },
    // Stage 4: Sort chronologically
    { $sort: { period: 1 } },
  ];
};

/**
 * Build aggregation pipeline to find top-selling products.
 * @param {number} limit   - Number of top products to return (default 10)
 * @param {Object} [dateFilter] - Optional date filter for order items
 */
const buildTopProductsPipeline = (limit = 10, dateFilter = null) => {
  const matchStage = {
    $match: {
      paymentStatus: 'paid',
      ...(dateFilter ? { createdAt: { ...dateFilter } } : {}),
    },
  };

  return [
    matchStage,
    // Unwind items array to get one document per item
    { $unwind: '$items' },
    // Group by productId
    {
      $group: {
        _id:         '$items.productId',
        productName: { $first: '$items.name' },
        productImage:{ $first: '$items.image' },
        totalQtySold:{ $sum: '$items.qty' },
        totalRevenue:{ $sum: { $multiply: ['$items.price', '$items.qty'] } },
        orderCount:  { $sum: 1 },
      },
    },
    // Sort by qty sold descending
    { $sort: { totalQtySold: -1 } },
    { $limit: limit },
    // Lookup product details
    {
      $lookup: {
        from:         'products',
        localField:   '_id',
        foreignField: '_id',
        as:           'productDetails',
        pipeline:     [{ $project: { name: 1, images: { $slice: ['$images', 1] }, category: 1, price: 1 } }],
      },
    },
    {
      $project: {
        _id:          0,
        productId:    '$_id',
        productName:  1,
        category:     { $arrayElemAt: ['$productDetails.category', 0] },
        image:        { $arrayElemAt: [{ $arrayElemAt: ['$productDetails.images', 0] }, 0] },
        totalQtySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        orderCount:   1,
      },
    },
  ];
};

/**
 * Format currency to INR string
 */
const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

/**
 * Calculate percentage change between two values
 */
const percentChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

module.exports = {
  buildDateRangeFilter,
  buildRevenuePipeline,
  buildTopProductsPipeline,
  formatINR,
  percentChange,
};
