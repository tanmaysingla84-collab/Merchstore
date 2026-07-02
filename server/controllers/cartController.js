const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Populate product details
    const populatedCart = await Cart.findOne({ userId: req.user._id })
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name price images sizes averageRating'
      });

    // Format the items to match the frontend expectations: { productId, qty, size, product }
    const formattedItems = populatedCart.items.map(item => {
      // Handle cases where the product might have been deleted from DB
      return {
        productId: item.productId ? item.productId._id : null,
        qty: item.qty,
        size: item.size,
        product: item.productId ? {
          _id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          images: item.productId.images,
          sizes: item.productId.sizes,
          averageRating: item.productId.averageRating
        } : null
      };
    }).filter(item => item.product !== null); // Filter out deleted products

    res.status(200).json({ success: true, cart: formattedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, qty, size } = req.body;
    const quantity = parseInt(qty) || 1;

    if (!productId || !size) {
      return res.status(400).json({ success: false, message: 'Product ID and Size are required' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate size and stock availability
    const sizeObj = product.sizes.find(s => s.size === size);
    if (!sizeObj) {
      return res.status(400).json({ success: false, message: `Size '${size}' is not available for this product` });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Find if item already exists in cart with same product AND size
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.size === size
    );

    let newQty = quantity;
    if (existingItemIndex > -1) {
      newQty = cart.items[existingItemIndex].qty + quantity;
    }

    // Check if new quantity exceeds stock
    if (newQty > sizeObj.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${sizeObj.stock} items are available in size ${size}.`
      });
    }

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].qty = newQty;
    } else {
      // Push new item
      cart.items.push({ productId, qty: quantity, size });
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quantity of an item in cart
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { productId, qty, size } = req.body;
    const quantity = parseInt(qty);

    if (!productId || isNaN(quantity) || quantity < 1 || !size) {
      return res.status(400).json({ success: false, message: 'Invalid product details or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate size and stock
    const sizeObj = product.sizes.find(s => s.size === size);
    if (!sizeObj) {
      return res.status(400).json({ success: false, message: `Size '${size}' is not available` });
    }

    if (quantity > sizeObj.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${sizeObj.stock} items available in size ${size}.`
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].qty = quantity;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart quantity updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    // Note: Since size isn't passed in path, if the user has multiple sizes of the same product, we can either:
    // 1) Read size from query parameter (if available)
    // 2) Remove all items with that productId. 
    // Let's check query parameter `size` first, fallback to removing all sizes of this product.
    const { size } = req.query;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    if (size) {
      cart.items = cart.items.filter(
        item => !(item.productId.toString() === productId && item.size === size)
      );
    } else {
      cart.items = cart.items.filter(
        item => item.productId.toString() !== productId
      );
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
