/**
 * RentEase — Demo Data Seeder
 *
 * Seeds realistic demo properties, bookings, and reviews for portfolio showcase.
 * Run AFTER seedDb.js (which creates the demo user accounts).
 *
 * Usage:
 *   node server/utils/seedDemoData.js
 *
 * Requirements:
 *   - server/.env must have a valid MONGO_URI
 *   - Demo users must already exist (run seedDb.js first)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Resolve .env path ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease-dev';

// ── Inline minimal schemas (avoids circular import chain) ────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'tenant' },
  isVerified: { type: Boolean, default: true },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const propertySchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    type: String,
    price: Number,
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      zipCode: String,
    },
    city: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    bedrooms: Number,
    bathrooms: Number,
    amenities: [String],
    images: [String],
    availability: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    cancellationPolicy: { type: String, default: 'moderate' },
  },
  { timestamps: true }
);
propertySchema.pre('save', function (next) {
  if (this.address && this.address.city) this.city = this.address.city;
  next();
});
const Property =
  mongoose.models.Property || mongoose.model('Property', propertySchema);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    checkInDate: Date,
    checkOutDate: Date,
    totalAmount: Number,
    advancePaid: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    cancellationStatus: { type: String, default: 'none' },
  },
  { timestamps: true }
);
const Booking =
  mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    rating: Number,
    comment: String,
  },
  { timestamps: true }
);
const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

// ── Demo property data ───────────────────────────────────────────────────────
const DEMO_PROPERTIES = [
  {
    title: 'Luxury Sea-View Villa in Goa',
    description:
      'Stunning villa with panoramic Arabian Sea views, private pool, and lush tropical garden. Perfect for a premium holiday experience in North Goa. The villa features spacious bedrooms, a fully equipped kitchen, outdoor dining area, and direct beach access.',
    type: 'villa',
    price: 8500,
    address: {
      street: '42 Calangute Beach Road',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      zipCode: '403516',
    },
    location: { type: 'Point', coordinates: [73.7541, 15.5523] },
    bedrooms: 4,
    bathrooms: 3,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'pool', 'security', 'garden'],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    ],
    rating: 4.8,
    reviewsCount: 24,
    viewCount: 312,
    cancellationPolicy: 'moderate',
  },
  {
    title: 'Modern Studio Apartment in Bandra',
    description:
      'Chic, fully furnished studio apartment in the heart of Bandra West, Mumbai. Walking distance to Linking Road, cafes, and the promenade. High-speed WiFi, air conditioning, and 24/7 security. Ideal for working professionals and digital nomads.',
    type: 'studio',
    price: 2200,
    address: {
      street: '15 Pali Hill Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400050',
    },
    location: { type: 'Point', coordinates: [72.8362, 19.0596] },
    bedrooms: 0,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'security', 'lift'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80',
    ],
    rating: 4.5,
    reviewsCount: 18,
    viewCount: 245,
    cancellationPolicy: 'flexible',
  },
  {
    title: '3BHK Family Apartment in Koramangala',
    description:
      'Spacious 3-bedroom apartment in Koramangala, Bangalore\'s tech hub. Fully furnished with modular kitchen, dedicated workspace, and covered parking. Located near major IT parks, malls, and excellent restaurants. Ideal for families or small teams.',
    type: 'apartment',
    price: 3800,
    address: {
      street: '8th Block, 80 Feet Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560095',
    },
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'gym', 'security', 'lift', 'power_backup'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
    rating: 4.6,
    reviewsCount: 31,
    viewCount: 428,
    cancellationPolicy: 'moderate',
  },
  {
    title: 'Heritage Haveli Suite in Jaipur Old City',
    description:
      'Experience royalty in this beautifully restored 18th-century haveli in the Pink City. Ornate architecture, rooftop terrace with Hawa Mahal views, and authentic Rajasthani décor. Walking distance to major heritage sites and bazaars.',
    type: 'house',
    price: 4200,
    address: {
      street: 'Near Hawa Mahal, Old City',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      zipCode: '302002',
    },
    location: { type: 'Point', coordinates: [75.8267, 26.9239] },
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'furnished', 'ac', 'security'],
    images: [
      'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    ],
    rating: 4.9,
    reviewsCount: 42,
    viewCount: 567,
    cancellationPolicy: 'strict',
  },
  {
    title: 'Cosy 2BHK Flat in Hauz Khas Village',
    description:
      'Vibrant 2-bedroom apartment steps away from Hauz Khas Lake and its thriving arts, cafe, and nightlife scene. The flat features a large balcony, wooden flooring, and modern interiors. Perfect for explorers and creative professionals in Delhi.',
    type: 'apartment',
    price: 2800,
    address: {
      street: '12 Hauz Khas Village',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      zipCode: '110016',
    },
    location: { type: 'Point', coordinates: [77.1954, 28.5494] },
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'security', 'parking'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1560185127-6a6b73d45f0c?w=800&q=80',
      'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800&q=80',
    ],
    rating: 4.3,
    reviewsCount: 15,
    viewCount: 203,
    cancellationPolicy: 'flexible',
  },
  {
    title: 'Premium PG in Whitefield IT Park',
    description:
      'Modern premium paying guest accommodation within walking distance of major Whitefield IT parks. Fully air-conditioned rooms with attached bathrooms, high-speed internet, 24/7 power backup, gym access, and healthy meal options available.',
    type: 'pg',
    price: 950,
    address: {
      street: 'EPIP Zone, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560066',
    },
    location: { type: 'Point', coordinates: [77.7480, 12.9698] },
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'gym', 'security', 'power_backup'],
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800&q=80',
    ],
    rating: 4.1,
    reviewsCount: 27,
    viewCount: 389,
    cancellationPolicy: 'moderate',
  },
  {
    title: 'Beachfront Cottage in Kovalam',
    description:
      'Charming thatched-roof cottage right on Kovalam Beach, Kerala. Wake up to ocean sounds, enjoy fresh seafood, and explore nearby Vizhinjam lighthouse. The cottage comes with a private sit-out area, hammock, and stunning sunset views over the Arabian Sea.',
    type: 'house',
    price: 3100,
    address: {
      street: 'Light House Road, Kovalam',
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      country: 'India',
      zipCode: '695527',
    },
    location: { type: 'Point', coordinates: [76.9824, 8.3988] },
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'garden'],
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80',
    ],
    rating: 4.7,
    reviewsCount: 19,
    viewCount: 278,
    cancellationPolicy: 'flexible',
  },
  {
    title: 'Commercial Office Space in BKC',
    description:
      'Plug-and-play commercial office space in Bandra Kurla Complex, Mumbai\'s premier business district. Furnished workstations for 10-20 people, conference room, high-speed leased line internet, pantry, 24/7 access with biometric security.',
    type: 'commercial',
    price: 15000,
    address: {
      street: 'G Block, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400051',
    },
    location: { type: 'Point', coordinates: [72.8656, 19.0596] },
    bedrooms: 0,
    bathrooms: 2,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'gym', 'security', 'lift', 'power_backup'],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80',
    ],
    rating: 4.4,
    reviewsCount: 8,
    viewCount: 156,
    cancellationPolicy: 'strict',
  },
];

// ── Demo reviews ─────────────────────────────────────────────────────────────
const DEMO_REVIEWS = [
  {
    propertyIndex: 0,
    rating: 5,
    comment:
      'Absolutely stunning villa! The sea view from the pool was breathtaking. The host was incredibly responsive and helpful. Will definitely return next year.',
  },
  {
    propertyIndex: 0,
    rating: 5,
    comment:
      'Perfect location, immaculate property. Everything was exactly as described. The private pool made our anniversary unforgettable.',
  },
  {
    propertyIndex: 1,
    rating: 4,
    comment:
      'Great studio for a work trip. Super clean, fast WiFi, and the location in Bandra is unbeatable. The AC was a lifesaver in Mumbai heat!',
  },
  {
    propertyIndex: 2,
    rating: 5,
    comment:
      'Best apartment we\'ve stayed in Bangalore. The gym and covered parking are excellent perks. The owner was very helpful with local recommendations.',
  },
  {
    propertyIndex: 3,
    rating: 5,
    comment:
      'The heritage haveli exceeded all expectations. Waking up to the rooftop view of Hawa Mahal is a magical experience. The décor is stunning and authentic.',
  },
  {
    propertyIndex: 4,
    rating: 4,
    comment:
      'Amazing neighbourhood! The balcony view of Hauz Khas Lake is gorgeous. Great access to restaurants and galleries. Highly recommended for creative types.',
  },
  {
    propertyIndex: 6,
    rating: 5,
    comment:
      'Woke up to the sound of waves every morning! The cottage is simple but absolutely perfect. Fresh seafood stalls right outside. Pure bliss.',
  },
];

// ── Main seeder ───────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱 RentEase Demo Data Seeder\n');
  console.log(`📡 Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':***@')}\n`);

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ MongoDB connected\n');

  // ── Find demo users ──────────────────────────────────────────────────────
  const owner = await User.findOne({ email: 'owner@rentease.com' });
  const tenant = await User.findOne({ email: 'tenant@rentease.com' });

  if (!owner || !tenant) {
    console.error(
      '❌ Demo users not found. Run seedDb.js first:\n   node server/utils/seedDb.js'
    );
    process.exit(1);
  }
  console.log(`  ✅ Found owner: ${owner.email}`);
  console.log(`  ✅ Found tenant: ${tenant.email}\n`);

  // ── Seed properties ──────────────────────────────────────────────────────
  console.log('🏠 Seeding demo properties...');
  const createdProperties = [];

  for (const propData of DEMO_PROPERTIES) {
    const existing = await Property.findOne({ title: propData.title });
    if (existing) {
      console.log(`  ⚠️  Already exists: "${propData.title}"`);
      createdProperties.push(existing);
      continue;
    }
    const prop = await Property.create({ ...propData, owner: owner._id });
    createdProperties.push(prop);
    console.log(`  ✅ Created: "${prop.title}" (${prop.type}, ₹${prop.price}/mo)`);
  }

  // ── Seed bookings ────────────────────────────────────────────────────────
  console.log('\n📅 Seeding demo bookings...');

  const today = new Date();
  const bookingData = [
    {
      propertyIndex: 0,
      checkInOffset: 10,
      checkOutOffset: 17,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    },
    {
      propertyIndex: 1,
      checkInOffset: -30,
      checkOutOffset: -23,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
    },
    {
      propertyIndex: 2,
      checkInOffset: 25,
      checkOutOffset: 55,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    },
    {
      propertyIndex: 3,
      checkInOffset: -15,
      checkOutOffset: -8,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
    },
    {
      propertyIndex: 4,
      checkInOffset: 5,
      checkOutOffset: 12,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    },
  ];

  for (const bd of bookingData) {
    const prop = createdProperties[bd.propertyIndex];
    if (!prop) continue;
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + bd.checkInOffset);
    const checkOut = new Date(today);
    checkOut.setDate(today.getDate() + bd.checkOutOffset);
    const nights = Math.max(
      1,
      Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    );
    const totalAmount = prop.price * nights;

    const existing = await Booking.findOne({
      user: tenant._id,
      property: prop._id,
      checkInDate: checkIn,
    });
    if (existing) {
      console.log(`  ⚠️  Booking already exists for "${prop.title}"`);
      continue;
    }
    await Booking.create({
      user: tenant._id,
      property: prop._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmount,
      advancePaid: bd.paymentStatus === 'paid' ? totalAmount : 0,
      bookingStatus: bd.bookingStatus,
      paymentStatus: bd.paymentStatus,
    });
    console.log(
      `  ✅ Booking: "${prop.title}" — ${bd.bookingStatus} (${nights} nights, ₹${totalAmount})`
    );
  }

  // ── Seed reviews ─────────────────────────────────────────────────────────
  console.log('\n⭐ Seeding demo reviews...');

  for (const rd of DEMO_REVIEWS) {
    const prop = createdProperties[rd.propertyIndex];
    if (!prop) continue;
    const existing = await Review.findOne({ user: tenant._id, property: prop._id });
    if (existing) {
      console.log(`  ⚠️  Review already exists for "${prop.title}"`);
      continue;
    }
    await Review.create({
      user: tenant._id,
      property: prop._id,
      rating: rd.rating,
      comment: rd.comment,
    });
    // Update property rating manually (since post-save hook uses dynamic import)
    const stats = await Review.aggregate([
      { $match: { property: prop._id } },
      { $group: { _id: '$property', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Property.findByIdAndUpdate(prop._id, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewsCount: stats[0].count,
      });
    }
    console.log(`  ✅ Review (${rd.rating}★): "${prop.title}"`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Demo data seed complete!\n');
  console.log('📋 Summary:');
  console.log(`   Properties: ${createdProperties.length} listings`);
  console.log(`   Bookings:   ${bookingData.length} records`);
  console.log(`   Reviews:    ${DEMO_REVIEWS.length} reviews`);
  console.log('\n🔐 Demo Login Credentials:');
  console.log('   Owner:  owner@rentease.com  / Owner@123!');
  console.log('   Tenant: tenant@rentease.com / Tenant@123!');
  console.log('   Admin:  admin@rentease.com  / Admin@123!\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Demo seed failed:', err.message);
  process.exit(1);
});
