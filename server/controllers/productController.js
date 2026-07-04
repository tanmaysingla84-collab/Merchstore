// ─── controllers/productController.js ─────────────────────────────────────────
// M1 Owned — Product Management (Public listing/filtering & Admin CRUD with Cloudinary)

const Product        = require('../models/Product');
const Review         = require('../models/Review');
const { deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/products
 * Query parameters: category, minPrice, maxPrice, size, search, sort, page, limit
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    size,
    search,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const pageNum  = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 12, 100);
  const skip     = (pageNum - 1) * limitNum;

  // Build filter object (only fetch active products by default for public)
  const filter = {};
  if (req.query.includeInactive !== 'true') {
    filter.isActive = true;
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Filter by size and ensure that size is in stock
  if (size) {
    filter.sizes = {
      $elemMatch: {
        size:  size.toUpperCase(),
        stock: { $gt: 0 },
      },
    };
  }

  // Text search on name, description, tags
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort options
  let sortCriteria = { createdAt: -1 }; // default newest
  if (sort) {
    switch (sort) {
      case 'price-asc':
        sortCriteria = { price: 1 };
        break;
      case 'price-desc':
        sortCriteria = { price: -1 };
        break;
      case 'popular':
        sortCriteria = { totalRatings: -1, averageRating: -1 };
        break;
      case 'newest':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }
  }

  // Run queries
  const query = Product.find(filter);

  // If text search, project text score and sort by it if requested
  if (search && !sort) {
    query.select({ score: { $meta: 'textScore' } });
    sortCriteria = { score: { $meta: 'textScore' } };
  }

  const [products, total] = await Promise.all([
    query.sort(sortCriteria).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data:    products,
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

/**
 * GET /api/products/:id
 * Retrieve a single product by ID populated with reviews
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id).lean();
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Dynamically fetch and embed reviews for this product
  const reviews = await Review.find({ productId: id })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      ...product,
      reviews,
    },
  });
});

/**
 * POST /api/admin/products
 * Create a new product (Admin Only, Multi-part Form)
 */
const createProduct = asyncHandler(async (req, res) => {
  // req.files is populated by multer upload middleware
  const imageUrls = req.files ? req.files.map(file => file.path) : [];

  const {
    name,
    description,
    category,
    price,
    comparePrice,
    sizes,
    tags,
    isFeatured,
    isActive,
  } = req.body;

  const product = await Product.create({
    name,
    description,
    category,
    price,
    comparePrice,
    sizes, // already parsed/validated by productValidator preprocess
    tags,  // already parsed/validated by productValidator preprocess
    isFeatured,
    isActive,
    images: imageUrls,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data:    product,
  });
});

/**
 * PUT /api/admin/products/:id
 * Update an existing product (Admin Only, Multi-part Form)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const {
    name,
    description,
    category,
    price,
    comparePrice,
    sizes,
    tags,
    isFeatured,
    isActive,
    removedImages, // array of image URLs to delete from Cloudinary
  } = req.body;

  // 1. Delete removed images from Cloudinary and filter them out
  if (removedImages) {
    const imagesToDelete = Array.isArray(removedImages) ? removedImages : [removedImages];
    for (const url of imagesToDelete) {
      await deleteFromCloudinary(url);
      product.images = product.images.filter(img => img !== url);
    }
  }

  // 2. Add new images if uploaded
  if (req.files && req.files.length > 0) {
    const newImageUrls = req.files.map(file => file.path);
    product.images = [...product.images, ...newImageUrls];
  }

  // 3. Update text/numeric fields
  if (name !== undefined)         product.name = name;
  if (description !== undefined)  product.description = description;
  if (category !== undefined)     product.category = category;
  if (price !== undefined)        product.price = price;
  if (comparePrice !== undefined) product.comparePrice = comparePrice;
  if (sizes !== undefined)        product.sizes = sizes;
  if (tags !== undefined)         product.tags = tags;
  if (isFeatured !== undefined)   product.isFeatured = isFeatured;
  if (isActive !== undefined)     product.isActive = isActive;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data:    product,
  });
});

/**
 * DELETE /api/admin/products/:id
 * Soft delete or hard delete a product
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hardDelete } = req.query; // optional query param for permanent deletion

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (hardDelete === 'true') {
    // Delete all associated images from Cloudinary first
    for (const url of product.images) {
      await deleteFromCloudinary(url);
    }
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product permanently deleted',
    });
  } else {
    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deactivated (soft-deleted)',
      data:    { id: product._id, isActive: product.isActive },
    });
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
