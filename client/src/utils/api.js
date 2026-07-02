import axios from 'axios';

// Base Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// MOCK DATA INITIALIZATION FOR LOCALSTORAGE
const INITIAL_PRODUCTS = [
  {
    _id: 'prod_1',
    name: 'GU Elite Varsity Hoodie',
    description: 'Wrap yourself in pride with the premium Geeta University Varsity Hoodie. Crafted from ultra-soft 400 GSM heavyweight cotton-fleece, it features a warm double-lined hood, metallic aglets, and the iconic GU crest beautifully embroidered in metallic gold thread on the chest.',
    category: 'hoodies',
    price: 1499,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 24 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 0 } // Out of stock to test UI
    ],
    averageRating: 4.8,
    ratingsCount: 42,
    colors: ['Maroon', 'Slate'],
    isFeatured: true,
  },
  {
    _id: 'prod_2',
    name: 'GU Heritage Cotton Tee',
    description: 'A classic daily essential. Made from 100% long-staple combed cotton (180 GSM) for supreme breathability. Features a vintage-inspired Geeta University print in crack-resistant varsity styling across the chest.',
    category: 'tshirts',
    price: 599,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'S', stock: 30 },
      { size: 'M', stock: 45 },
      { size: 'L', stock: 35 },
      { size: 'XL', stock: 20 }
    ],
    averageRating: 4.5,
    ratingsCount: 128,
    colors: ['Maroon', 'White', 'Black'],
    isFeatured: true,
  },
  {
    _id: 'prod_3',
    name: 'GU Signature Crewneck',
    description: 'Modern, minimalist, and comfortable. This fleece crewneck features a drop-shoulder cut, ribbed hem and cuffs, and a subtle debossed tonal GU logo on the center front. Perfect for layering on chilly campus mornings.',
    category: 'sweatshirts',
    price: 1299,
    images: [
      'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'M', stock: 12 },
      { size: 'L', stock: 18 },
      { size: 'XL', stock: 8 }
    ],
    averageRating: 4.7,
    ratingsCount: 19,
    colors: ['Slate Grey', 'Navy'],
    isFeatured: false,
  },
  {
    _id: 'prod_4',
    name: 'GU Athletics Curved Cap',
    description: 'Finish your look with the GU Athletics Cap. Designed with a curved visor, 6-panel structured crown, breathable brass eyelets, and an adjustable premium leather strap with a branded buckle. Embroidered GU monogram.',
    category: 'accessories',
    price: 399,
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'One Size', stock: 50 }
    ],
    averageRating: 4.2,
    ratingsCount: 37,
    colors: ['Maroon', 'Black'],
    isFeatured: true,
  },
  {
    _id: 'prod_5',
    name: 'GU Premium Matte Ceramic Mug',
    description: 'Start your lectures right. This 350ml mug features a sleek matte maroon glaze finish with a debossed gold university seal. Designed with a comfortable double-finger handle and heavy ceramic insulation to keep your coffee hot.',
    category: 'accessories',
    price: 299,
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'One Size', stock: 65 }
    ],
    averageRating: 4.6,
    ratingsCount: 56,
    colors: ['Maroon'],
    isFeatured: false,
  },
  {
    _id: 'prod_6',
    name: 'GU Executive Leather Journal',
    description: 'An elegant companion for your lectures and thoughts. Bound in genuine full-grain leather, featuring a debossed Geeta University logo, 160 pages of ink-proof 100 GSM cream lined paper, a silk ribbon marker, and an elastic closure.',
    category: 'accessories',
    price: 499,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'Standard', stock: 40 }
    ],
    averageRating: 4.9,
    ratingsCount: 22,
    colors: ['Brown Leather', 'Black Leather'],
    isFeatured: false,
  },
  {
    _id: 'prod_7',
    name: 'GU Hydro Stainless Flask',
    description: 'Stay hydrated with a premium double-wall vacuum insulated water flask. Keeps beverages cold for 24 hours or hot for 12. Constructed from food-grade 18/8 stainless steel, featuring a sweat-proof matte powder coat and leak-proof flex cap.',
    category: 'accessories',
    price: 799,
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'One Size', stock: 5 } // Low stock alert simulation!
    ],
    averageRating: 4.4,
    ratingsCount: 15,
    colors: ['Matte Black', 'Silver'],
    isFeatured: true,
  },
  {
    _id: 'prod_8',
    name: 'GU Commuter Tech Pack',
    description: 'The ultimate campus backpack. Features a padded laptop sleeve fits up to 16", integrated external USB charging port, hidden anti-theft compartments, water-resistant ballistic nylon exterior, and ergonomic mesh shoulder straps.',
    category: 'accessories',
    price: 2199,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'
    ],
    sizes: [
      { size: 'Standard', stock: 12 }
    ],
    averageRating: 4.7,
    ratingsCount: 31,
    colors: ['Carbon Black', 'Steel Grey'],
    isFeatured: true,
  }
];

const INITIAL_COUPONS = [
  { code: 'WELCOME10', discountPct: 10, expiresAt: '2027-12-31', usageLimit: 100, usedCount: 15 },
  { code: 'GUFEST20', discountPct: 20, expiresAt: '2027-12-31', usageLimit: 50, usedCount: 5 },
  { code: 'GU30', discountPct: 30, expiresAt: '2027-12-31', usageLimit: 10, usedCount: 1 }
];

const INITIAL_REVIEWS = {
  'prod_1': [
    { userId: 'u_1', userName: 'Aman Sharma', rating: 5, comment: 'Incredibly warm and heavy-duty. The gold embroidery is very high quality!', createdAt: '2026-06-15T08:30:00Z' },
    { userId: 'u_2', userName: 'Priya Verma', rating: 4, comment: 'Very soft, but size runs slightly large. I suggest sizing down.', createdAt: '2026-06-10T14:15:00Z' }
  ],
  'prod_2': [
    { userId: 'u_3', userName: 'Rohan Gupta', rating: 5, comment: 'Super comfortable for daily wear. Will buy another one in white!', createdAt: '2026-06-25T11:20:00Z' }
  ]
};

// HELPER FOR INITIALIZATION
const initStorage = () => {
  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('coupons')) {
    localStorage.setItem('coupons', JSON.stringify(INITIAL_COUPONS));
  }
  if (!localStorage.getItem('reviews')) {
    localStorage.setItem('reviews', JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('users')) {
    // Mock default user
    localStorage.setItem('users', JSON.stringify([
      {
        _id: 'user_default',
        name: 'GU Student',
        email: 'student@geeta.ac.in',
        password: 'password123',
        role: 'student',
        addresses: [
          { _id: 'addr_1', street: 'Room 304, Hostel A, Geeta University Campus', city: 'Panipat', state: 'Haryana', pincode: '132145', isDefault: true }
        ]
      }
    ]));
  }
};
initStorage();

// SIMULATE NETWORK DELAY AND RESOLVE
const simulateRequest = (handler, delay = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = handler();
        if (result.error) {
          reject({
            response: {
              status: result.status || 400,
              data: { success: false, message: result.error }
            }
          });
        } else {
          resolve({
            status: result.status || 200,
            data: { success: true, ...result.data }
          });
        }
      } catch (err) {
        reject({
          response: {
            status: 500,
            data: { success: false, message: 'Server Internal Error' }
          }
        });
      }
    }, delay);
  });
};

// INTERCEPT AXIOS CLIENT CALLS TO HANDLE FRONTEND INTERACTIVELY WITHOUT A BACKEND
const useMock = false; // Toggle this if actual server is deployed

if (useMock) {
  api.interceptors.request.use((config) => {
    // Intercept requests and bypass standard HTTP calls by converting config.adapter
    config.adapter = async (config) => {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();
      const data = config.data ? JSON.parse(config.data) : null;
      
      const getLoggedUser = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === token) || null; // Using email as token for simple mock
      };

      // 1. AUTH ROUTES
      if (url.includes('/auth/register') && method === 'post') {
        return simulateRequest(() => {
          const { name, email, password } = data;
          if (!name || !email || !password) return { error: 'Please provide all fields' };
          
          // University Domain Check
          const isUniEmail = email.endsWith('@geeta.ac.in') || email.endsWith('@geetauniversity.ac.in');
          if (!isUniEmail) return { error: 'Only Geeta University emails (@geeta.ac.in / @geetauniversity.ac.in) are allowed' };

          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.find(u => u.email === email)) return { error: 'Email already registered' };

          const newUser = {
            _id: `u_${Date.now()}`,
            name,
            email,
            password, // In real backend this would be hashed
            role: 'student',
            addresses: []
          };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          
          return {
            status: 201,
            data: {
              token: email,
              user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, addresses: newUser.addresses }
            }
          };
        });
      }

      if (url.includes('/auth/login') && method === 'post') {
        return simulateRequest(() => {
          const { email, password } = data;
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          if (!user) return { error: 'Invalid credentials', status: 401 };

          return {
            data: {
              token: email,
              user: { _id: user._id, name: user.name, email: user.email, role: user.role, addresses: user.addresses }
            }
          };
        });
      }

      if (url.includes('/auth/me') && method === 'get') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Not authenticated', status: 401 };
          return {
            data: {
              user: { _id: user._id, name: user.name, email: user.email, role: user.role, addresses: user.addresses }
            }
          };
        });
      }

      // 2. PRODUCT ROUTES
      if (url.includes('/products') && method === 'get') {
        return simulateRequest(() => {
          // Parse product detail check (e.g. /products/prod_1)
          const segments = url.split('/');
          const lastSegment = segments[segments.length - 1];
          const products = JSON.parse(localStorage.getItem('products') || '[]');

          if (lastSegment && lastSegment !== 'products') {
            const product = products.find(p => p._id === lastSegment);
            if (!product) return { error: 'Product not found', status: 404 };
            return { data: { product } };
          }

          // Catalog Listing (with filtering, search, sort)
          let filtered = [...products];

          // Search via config params
          const params = config.params || {};
          
          if (params.search) {
            const query = params.search.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
          }

          if (params.category && params.category !== 'all') {
            filtered = filtered.filter(p => p.category === params.category);
          }

          if (params.size) {
            filtered = filtered.filter(p => p.sizes.some(s => s.size === params.size && s.stock > 0));
          }

          if (params.minPrice) {
            filtered = filtered.filter(p => p.price >= Number(params.minPrice));
          }

          if (params.maxPrice) {
            filtered = filtered.filter(p => p.price <= Number(params.maxPrice));
          }

          // Sorting
          if (params.sort) {
            if (params.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
            else if (params.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
            else if (params.sort === 'rating') filtered.sort((a, b) => b.averageRating - a.averageRating);
            else if (params.sort === 'newest') filtered.reverse();
          }

          return {
            data: {
              products: filtered,
              total: filtered.length
            }
          };
        });
      }

      // 3. CART ROUTES
      // Since we don't have separate Cart collection in our mock, we persist it in localstorage under 'cart_<email>'
      if (url.includes('/cart') && method === 'get') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };
          const cartKey = `cart_${user.email}`;
          const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
          
          // Populate product details
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          const populatedItems = cartItems.map(item => {
            const prod = products.find(p => p._id === item.productId);
            return {
              ...item,
              product: prod || { name: 'Unknown Product', price: 0, images: [''] }
            };
          }).filter(item => item.product !== null);

          return { data: { cart: populatedItems } };
        });
      }

      if (url.includes('/cart/add') && method === 'post') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };
          
          const { productId, qty, size } = data;
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          const product = products.find(p => p._id === productId);
          if (!product) return { error: 'Product not found', status: 404 };

          // Check stock
          const sizeObj = product.sizes.find(s => s.size === size);
          if (!sizeObj || sizeObj.stock < qty) return { error: 'Insufficient stock' };

          const cartKey = `cart_${user.email}`;
          let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
          
          // Check if item already in cart
          const existingItemIndex = cartItems.findIndex(item => item.productId === productId && item.size === size);
          if (existingItemIndex > -1) {
            cartItems[existingItemIndex].qty += qty;
          } else {
            cartItems.push({ productId, qty, size });
          }

          localStorage.setItem(cartKey, JSON.stringify(cartItems));
          return { data: { message: 'Item added to cart', cart: cartItems } };
        });
      }

      if (url.includes('/cart/update') && method === 'put') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };

          const { productId, qty, size } = data;
          const cartKey = `cart_${user.email}`;
          let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
          
          const itemIndex = cartItems.findIndex(item => item.productId === productId && item.size === size);
          if (itemIndex === -1) return { error: 'Item not found in cart', status: 404 };

          // Verify product stock
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          const product = products.find(p => p._id === productId);
          if (product) {
            const sizeObj = product.sizes.find(s => s.size === size);
            if (sizeObj && sizeObj.stock < qty) return { error: 'Requested quantity exceeds available stock' };
          }

          cartItems[itemIndex].qty = qty;
          localStorage.setItem(cartKey, JSON.stringify(cartItems));
          return { data: { message: 'Cart updated', cart: cartItems } };
        });
      }

      if (url.includes('/cart/remove') && method === 'delete') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };

          // Extract productId from URL /cart/remove/prod_1
          const parts = url.split('/');
          const productId = parts[parts.length - 1];

          const cartKey = `cart_${user.email}`;
          let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
          cartItems = cartItems.filter(item => item.productId !== productId);

          localStorage.setItem(cartKey, JSON.stringify(cartItems));
          return { data: { message: 'Item removed', cart: cartItems } };
        });
      }

      if (url.includes('/cart/clear') && method === 'delete') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };
          const cartKey = `cart_${user.email}`;
          localStorage.setItem(cartKey, JSON.stringify([]));
          return { data: { message: 'Cart cleared' } };
        });
      }

      // 4. COUPON VALIDATION
      if (url.includes('/coupons/validate') && method === 'post') {
        return simulateRequest(() => {
          const { code } = data;
          const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
          const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

          if (!coupon) return { error: 'Invalid coupon code' };
          const isExpired = new Date(coupon.expiresAt) < new Date();
          if (isExpired) return { error: 'Coupon code has expired' };
          if (coupon.usedCount >= coupon.usageLimit) return { error: 'Coupon limit reached' };

          return { data: { discountPct: coupon.discountPct } };
        });
      }

      // 5. ORDER CREATION & TRACKING
      if (url.includes('/orders/create') && method === 'post') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };

          const { address, paymentMethod, couponCode } = data;
          const cartKey = `cart_${user.email}`;
          const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
          if (cartItems.length === 0) return { error: 'Cart is empty' };

          const products = JSON.parse(localStorage.getItem('products') || '[]');
          
          // Verify & decrement stock
          const orderItems = [];
          let subtotal = 0;

          for (const item of cartItems) {
            const product = products.find(p => p._id === item.productId);
            if (!product) return { error: 'Product not found' };

            const sizeObj = product.sizes.find(s => s.size === item.size);
            if (!sizeObj || sizeObj.stock < item.qty) {
              return { error: `Product "${product.name}" (${item.size}) has insufficient stock` };
            }

            // Decrement Stock
            sizeObj.stock -= item.qty;
            subtotal += product.price * item.qty;
            orderItems.push({
              productId: product._id,
              name: product.name,
              qty: item.qty,
              size: item.size,
              price: product.price,
              image: product.images[0]
            });
          }

          // Save decremented product stock
          localStorage.setItem('products', JSON.stringify(products));

          // Calculate Discount
          let discount = 0;
          if (couponCode) {
            const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
            const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
            if (coupon) {
              discount = Math.round(subtotal * (coupon.discountPct / 100));
              coupon.usedCount += 1;
              localStorage.setItem('coupons', JSON.stringify(coupons));
            }
          }

          const totalAmount = subtotal - discount;

          // Save Order
          const orders = JSON.parse(localStorage.getItem('orders') || '[]');
          const newOrder = {
            _id: `ord_${Date.now()}`,
            userId: user._id,
            userEmail: user.email,
            items: orderItems,
            totalAmount,
            subtotal,
            discount,
            paymentMethod,
            paymentStatus: paymentMethod === 'stripe' ? 'paid' : 'pending',
            status: 'Placed',
            address,
            createdAt: new Date().toISOString()
          };
          orders.push(newOrder);
          localStorage.setItem('orders', JSON.stringify(orders));

          // Clear Cart
          localStorage.setItem(cartKey, JSON.stringify([]));

          return {
            status: 201,
            data: {
              message: 'Order created successfully',
              order: newOrder,
              clientSecret: paymentMethod === 'stripe' ? `pi_mock_${Date.now()}_secret_${Math.random()}` : null
            }
          };
        });
      }

      if (url.includes('/orders/single') && method === 'get') {
        return simulateRequest(() => {
          const parts = url.split('/');
          const orderId = parts[parts.length - 1];
          const orders = JSON.parse(localStorage.getItem('orders') || '[]');
          const order = orders.find(o => o._id === orderId);
          if (!order) return { error: 'Order not found', status: 404 };
          return { data: { order } };
        });
      }

      if (url.includes('/orders') && method === 'get') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };
          const orders = JSON.parse(localStorage.getItem('orders') || '[]');
          const userOrders = orders.filter(o => o.userEmail === user.email);
          return { data: { orders: userOrders.reverse() } };
        });
      }

      // 6. REVIEWS
      if (url.includes('/reviews') && method === 'get') {
        return simulateRequest(() => {
          const parts = url.split('/');
          const productId = parts[parts.length - 1];
          const reviewsDb = JSON.parse(localStorage.getItem('reviews') || '{}');
          const productReviews = reviewsDb[productId] || [];
          return { data: { reviews: productReviews } };
        });
      }

      if (url.includes('/reviews') && method === 'post') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Login required', status: 401 };

          const parts = url.split('/');
          const productId = parts[parts.length - 1];
          const { rating, comment } = data;

          if (!rating || !comment) return { error: 'Rating and comments are required' };

          const reviewsDb = JSON.parse(localStorage.getItem('reviews') || '{}');
          if (!reviewsDb[productId]) reviewsDb[productId] = [];
          
          const newReview = {
            userId: user._id,
            userName: user.name,
            rating,
            comment,
            createdAt: new Date().toISOString()
          };
          reviewsDb[productId].push(newReview);
          localStorage.setItem('reviews', JSON.stringify(reviewsDb));

          // Update Average Rating in Products
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          const prodIndex = products.findIndex(p => p._id === productId);
          if (prodIndex > -1) {
            const prodReviews = reviewsDb[productId];
            const sum = prodReviews.reduce((acc, curr) => acc + curr.rating, 0);
            products[prodIndex].averageRating = parseFloat((sum / prodReviews.length).toFixed(1));
            products[prodIndex].ratingsCount = prodReviews.length;
            localStorage.setItem('products', JSON.stringify(products));
          }

          return { status: 201, data: { review: newReview } };
        });
      }

      // Address Edit / Add
      if (url.includes('/auth/address') && method === 'post') {
        return simulateRequest(() => {
          const user = getLoggedUser();
          if (!user) return { error: 'Not authenticated', status: 401 };
          
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const userIdx = users.findIndex(u => u.email === user.email);
          if (userIdx === -1) return { error: 'User not found' };

          const newAddress = {
            _id: `addr_${Date.now()}`,
            street: data.street,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            isDefault: data.isDefault || false
          };

          if (newAddress.isDefault) {
            users[userIdx].addresses.forEach(a => a.isDefault = false);
          }

          users[userIdx].addresses.push(newAddress);
          localStorage.setItem('users', JSON.stringify(users));

          return { data: { addresses: users[userIdx].addresses } };
        });
      }

      return Promise.reject({
        response: { status: 404, data: { message: 'Mock API path not found' } }
      });
    };

    return config;
  });
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
