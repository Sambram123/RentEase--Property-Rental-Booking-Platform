/**
 * RentEase — Production Seed Utility
 *
 * Creates an admin user and optional sample property in MongoDB Atlas.
 * Run once after first deployment:
 *   node server/utils/seedDb.js
 *
 * Reads MONGO_URI from server/.env automatically.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Inline minimal models (avoids full import chain) ──────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'tenant' },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Config ─────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease-dev';

const ADMIN = {
  name: 'RentEase Admin',
  email: 'admin@rentease.com',
  password: 'Admin@123!',
  role: 'admin',
  isVerified: true,
};

const DEMO_TENANT = {
  name: 'Demo Tenant',
  email: 'tenant@rentease.com',
  password: 'Tenant@123!',
  role: 'tenant',
  isVerified: true,
};

const DEMO_OWNER = {
  name: 'Demo Owner',
  email: 'owner@rentease.com',
  password: 'Owner@123!',
  role: 'owner',
  isVerified: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────
const hashPassword = async (plain) => bcrypt.hash(plain, 12);

const upsertUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`  ⚠️  User already exists: ${data.email}`);
    return existing;
  }
  const hashed = await hashPassword(data.password);
  const user = await User.create({ ...data, password: hashed });
  console.log(`  ✅ Created ${data.role}: ${data.email}`);
  return user;
};

// ── Main ───────────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱 RentEase Seed Utility\n');
  console.log(`📡 Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':***@')}\n`);

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ MongoDB connected\n');

  console.log('👤 Seeding users...');
  await upsertUser(ADMIN);
  await upsertUser(DEMO_TENANT);
  await upsertUser(DEMO_OWNER);

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Demo credentials:');
  console.log(`   Admin:  admin@rentease.com  /  Admin@123!`);
  console.log(`   Tenant: tenant@rentease.com /  Tenant@123!`);
  console.log(`   Owner:  owner@rentease.com  /  Owner@123!\n`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
