// ─── config/db.js ─────────────────────────────────────────────────────────────
// MongoDB connection via Mongoose
// Owned by M1; M2 imports and uses this indirectly via models

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB Atlas.
 * Safe to call multiple times — skips if already connected.
 */
const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // mongoose 7+ removed deprecated options; keep clean
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB disconnected on app termination');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
