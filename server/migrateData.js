// ─── migrateData.js ────────────────────────────────────────────────────────
// Migration utility script to merge data from 'test' DB to 'merchstore' DB
// Run via: node migrateData.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is missing from your .env file!');
  process.exit(1);
}

async function migrate() {
  // Strip target database name to build connections for both 'test' and 'merchstore'
  const baseUri = uri.endsWith('/') ? uri.slice(0, -1) : uri.split('/merchstore')[0];
  const testUri = `${baseUri}/test`;
  const merchUri = uri.includes('/merchstore') ? uri : `${baseUri}/merchstore`;

  console.log(`Connecting to:`);
  console.log(` - Source DB (test): ${testUri}`);
  console.log(` - Destination DB (merchstore): ${merchUri}\n`);

  const connTest = await mongoose.createConnection(testUri).asPromise();
  const connMerch = await mongoose.createConnection(merchUri).asPromise();
  console.log('✅ Connected to MongoDB databases successfully!');

  const collections = ['users', 'products', 'orders', 'carts', 'coupons', 'reviews'];

  for (const colName of collections) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Migrating collection: "${colName}"`);
    
    const testCol = connTest.collection(colName);
    const merchCol = connMerch.collection(colName);

    const docs = await testCol.find({}).toArray();
    console.log(`Found ${docs.length} documents in source ("test").`);

    if (docs.length === 0) {
      console.log(`Skipping empty collection.`);
      continue;
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const doc of docs) {
      // Look up document by _id in destination collection first
      const existing = await merchCol.findOne({ _id: doc._id });
      if (!existing) {
        try {
          await merchCol.insertOne(doc);
          insertedCount++;
        } catch (insertErr) {
          // Check for duplicate key error (E11000) on unique indexes (like email or coupon code)
          if (insertErr.code === 11000) {
            skippedCount++;
          } else {
            throw insertErr;
          }
        }
      } else {
        skippedCount++;
      }
    }
    console.log(`Done: Inserted ${insertedCount} new docs, skipped ${skippedCount} duplicate(s)/existing key conflicts.`);
  }

  console.log('\n==================================================');
  console.log('🎉 Data migration and merging completed successfully!');
  console.log('==================================================\n');
  
  await connTest.close();
  await connMerch.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed with error:', err);
  process.exit(1);
});
