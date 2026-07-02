// ─── server/seed.js ─────────────────────────────────────────────────────────────
// Database Seeding Script to populate MongoDB Atlas with initial data

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const path     = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const User    = require('./models/User');
const Product = require('./models/Product');
const Cart    = require('./models/Cart');
const Order   = require('./models/Order');
const Coupon  = require('./models/Coupon');

const seedData = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not defined in your .env file.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully!');

    // ── 1. Clear existing data ──────────────────────────────────────────────
    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    console.log('✅ Collections cleared.');

    // ── 2. Create Users ─────────────────────────────────────────────────────
    console.log('👥 Creating mock users...');
    
    // Hash password helper
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        name:     'GU Admin',
        email:    'admin@geeta.edu',
        password: 'password123',
        role:     'admin',
        avatar:   'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      },
      {
        name:     'Subham Nayak',
        email:    'subham@geeta.edu',
        password: 'password123',
        role:     'student',
        phone:    '9876543210',
        avatar:   'https://api.dicebear.com/7.x/adventurer/svg?seed=subham',
        addresses: [
          {
            fullName: 'Subham Nayak',
            phone:    '9876543210',
            street:   'GU Campus Hostel, Block C',
            city:     'Panipat',
            state:    'Haryana',
            pincode:  '132145',
            isDefault: true,
          }
        ]
      },
      {
        name:     'Tanmay Singla',
        email:    'tanmay@geeta.edu',
        password: 'password123',
        role:     'faculty',
        phone:    '9999988888',
        avatar:   'https://api.dicebear.com/7.x/adventurer/svg?seed=tanmay',
      }
    ]);

    const adminUser = users[0];
    const studentUser = users[1];
    const facultyUser = users[2];

    console.log(`✅ Users created:
      - Admin: admin@geeta.edu (password123)
      - Student: subham@geeta.edu (password123)
      - Faculty: tanmay@geeta.edu (password123)`);

    // ── 3. Create Products ──────────────────────────────────────────────────
    console.log('🛍️ Creating products catalog...');
    const products = await Product.create([
      {
        name:        'Geeta University Premium Hoodie',
        description: 'Super soft, fleece-lined premium hoodie featuring the embroidered Geeta University crest on the chest. Perfect for winter days on campus.',
        category:    'hoodies',
        price:       999,
        comparePrice: 1399,
        images: [
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'S', stock: 15, sku: 'GUH-NAVY-S' },
          { size: 'M', stock: 25, sku: 'GUH-NAVY-M' },
          { size: 'L', stock: 20, sku: 'GUH-NAVY-L' },
          { size: 'XL', stock: 8, sku: 'GUH-NAVY-XL' }
        ],
        tags:       ['hoodie', 'winter', 'clothing', 'embroidered'],
        isFeatured: true,
      },
      {
        name:        'Geeta University Classic Varsity Jacket',
        description: 'Retro-styled varsity jacket with wool body and synthetic leather sleeves. Features GU colors, chenille logo patches, and custom buttons.',
        category:    'hoodies',
        price:       1599,
        comparePrice: 2199,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'M', stock: 10, sku: 'GUVJ-RED-M' },
          { size: 'L', stock: 15, sku: 'GUVJ-RED-L' },
          { size: 'XL', stock: 5, sku: 'GUVJ-RED-XL' }
        ],
        tags:       ['varsity', 'jacket', 'clothing', 'premium'],
        isFeatured: true,
      },
      {
        name:        'Geeta University Premium T-Shirt',
        description: 'Show your university spirit with this premium-weight 100% cotton crewneck t-shirt. Features the classic Geeta University lettering across the chest in durable print.',
        category:    'tshirts',
        price:       399,
        comparePrice: 599,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'S', stock: 30, sku: 'GUT-TSHIRT-S' },
          { size: 'M', stock: 40, sku: 'GUT-TSHIRT-M' },
          { size: 'L', stock: 50, sku: 'GUT-TSHIRT-L' },
          { size: 'XL', stock: 20, sku: 'GUT-TSHIRT-XL' }
        ],
        tags:       ['tshirt', 'clothing', 'tee', 'cotton'],
        isFeatured: true,
      },
      {
        name:        'Geeta University Stainless Steel Bottle',
        description: 'Double-walled vacuum insulated stainless steel water bottle. Keeps your beverages cold for 24 hours or hot for 12 hours. Matte black finish.',
        category:    'accessories',
        price:       499,
        comparePrice: 699,
        images: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'One Size', stock: 50, sku: 'GUB-BOT-BLK' }
        ],
        tags:       ['bottle', 'insulated', 'gear', 'accessories'],
        isFeatured: false,
      },
      {
        name:        'GU Curved Visor Cap',
        description: 'Classic 6-panel structured cap with curved visor and adjustable strap. Breathable cotton twill with high-density GU logo printing.',
        category:    'accessories',
        price:       349,
        comparePrice: 499,
        images: [
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'One Size', stock: 35, sku: 'GUC-CAP-NVY' }
        ],
        tags:       ['cap', 'hat', 'accessories', 'gear'],
        isFeatured: false,
      },
      {
        name:        'Geeta University Classic Notebook',
        description: 'High-quality A5 notebook with 160 ruled pages. Features a durable hardcover with the Geeta University logo embossed in gold foil.',
        category:    'stationery',
        price:       129,
        comparePrice: 199,
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'Standard', stock: 150, sku: 'GUN-NOTEBOOK-STD' }
        ],
        tags:       ['notebook', 'stationery', 'office', 'study'],
        isFeatured: true,
      },
      {
        name:        'Geeta University Premium Gel Pen',
        description: 'Sleek retractable black gel pen with a comfortable grip. Features metallic highlights and the printed Geeta University emblem.',
        category:    'stationery',
        price:       49,
        comparePrice: 79,
        images: [
          'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'One Size', stock: 300, sku: 'GUN-PEN-GEL' }
        ],
        tags:       ['pen', 'gel pen', 'stationery', 'writing'],
        isFeatured: false,
      },
      {
        name:        'Geeta University Complete Stationery Set',
        description: 'The ultimate study bundle including 2 Geeta University notebooks, 3 premium gel pens, a branded keychain, and a sleek metal ruler in a custom GU carrying pouch.',
        category:    'stationery',
        price:       349,
        comparePrice: 499,
        images: [
          'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'Standard', stock: 80, sku: 'GUN-STATIONERY-SET' }
        ],
        tags:       ['stationery', 'set', 'notebook', 'pen', 'combo'],
        isFeatured: true,
      },
      {
        name:        'Student Notebook & Pen Combo',
        description: 'A5 size ruled notebook with 160 pages of premium 80gsm paper, alongside an elegant matte metal ballpoint pen. Printed with GU branding.',
        category:    'stationery',
        price:       199,
        comparePrice: 299,
        images: [
          'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop'
        ],
        sizes: [
          { size: 'One Size', stock: 100, sku: 'GUN-PEN-SET' }
        ],
        tags:       ['notebook', 'pen', 'stationery', 'office'],
        isFeatured: false,
      }
    ]);
    console.log(`✅ 5 Products created.`);

    // ── 4. Create Coupons ───────────────────────────────────────────────────
    console.log('🏷️ Creating promotional coupons...');
    await Coupon.create([
      {
        code:         'GU20',
        discountPct:  20,
        expiresAt:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit:   500,
        minOrderAmt:  500,
        isActive:     true,
      },
      {
        code:         'WELCOME10',
        discountPct:  10,
        expiresAt:    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        usageLimit:   1000,
        minOrderAmt:  200,
        isActive:     true,
      }
    ]);
    console.log('✅ Coupons created.');

    // ── 5. Create Cart ──────────────────────────────────────────────────────
    console.log('🛒 Creating mock shopping cart...');
    await Cart.create({
      userId: studentUser._id,
      items: [
        {
          productId: products[0]._id, // Hoodie
          qty:       1,
          size:      'M',
        },
        {
          productId: products[2]._id, // Bottle
          qty:       2,
          size:      'One Size',
        }
      ]
    });
    console.log('✅ Cart initialized for student.');

    // ── 6. Create Order History ─────────────────────────────────────────────
    console.log('📦 Creating mock order and payment records...');
    await Order.create({
      userId:      studentUser._id,
      totalAmount: 1599, // Varsity jacket price
      discountAmount: 0,
      finalAmount: 1599,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_mock_123456789',
      status:      'delivered',
      address: {
        fullName: 'Subham Nayak',
        phone:    '9876543210',
        street:   'GU Campus Hostel, Block C',
        city:     'Panipat',
        state:    'Haryana',
        pincode:  '132145',
      },
      items: [
        {
          productId: products[1]._id,
          name:      products[1].name,
          image:     products[1].images[0],
          qty:       1,
          size:      'L',
          price:     1599,
        }
      ],
      statusHistory: [
        { status: 'placed', note: 'Order successfully placed.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { status: 'packed', note: 'Items packed and checked.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { status: 'shipped', note: 'Dispatched via Campus Courier.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { status: 'delivered', note: 'Handed over to recipient.', timestamp: new Date() }
      ]
    });
    console.log('✅ Order history created.');

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
