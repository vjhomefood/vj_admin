/**
 * Seed script — creates the initial admin user in MongoDB
 * Run once: node scripts/seedAdmin.js
 *
 * Usage:
 *   MONGO_URI=<your-uri> node scripts/seedAdmin.js
 *   OR set MONGO_URI in .env and just run: node scripts/seedAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'vj@admin123';

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set. Add it to .env or pass as env variable.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected');

    const existing = await Admin.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log(`⚠️  Admin "${ADMIN_USERNAME}" already exists. Skipping seed.`);
      console.log('   To reset password, delete the admin document from MongoDB Atlas and re-run.');
      process.exit(0);
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await Admin.create({ username: ADMIN_USERNAME, password: hashed, role: 'admin' });

    console.log('');
    console.log('🎉 Admin created successfully!');
    console.log('   Username :', ADMIN_USERNAME);
    console.log('   Password :', ADMIN_PASSWORD);
    console.log('');
    console.log('⚠️  Change this password immediately after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
