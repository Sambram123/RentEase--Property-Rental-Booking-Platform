/**
 * RentEase — Demo Data Seeder (v2)
 *
 * Seeds realistic demo properties, bookings, and reviews for portfolio showcase.
 * Compatible with the updated Property schema: images:[{url,public_id}]
 *
 * Run AFTER seedDb.js (which creates the demo user accounts):
 *   node server/utils/seedDb.js
 *   node server/utils/seedDemoData.js
 *
 * Requirements:
 *   - server/.env must have a valid MONGO_URI
 *   - Demo users must already exist (run seedDb.js first)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ── Resolve .env path ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease-dev';

// ── Inline minimal schemas (avoids circular import chain) ─────────────────────

const userSchema = new mongoose.Schema({
  name:       String,
  email:      { type: String, unique: true },
  password:   String,
  role:       { type: String, default: 'tenant' },
  isVerified: { type: Boolean, default: true },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Updated schema — images is now [{url, public_id}]
const propertySchema = new mongoose.Schema(
  {
    title:       String,
    description: String,
    type:        String,
    price:       Number,
    address: {
      street:  String,
      city:    String,
      state:   String,
      country: { type: String, default: 'India' },
      zipCode: String,
    },
    city:  String,
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    bedrooms:  Number,
    bathrooms: Number,
    amenities: [String],
    // ← updated: objects with url + public_id
    images: [
      {
        url:       { type: String, required: true },
        public_id: { type: String, default: '' },
        _id:       false,
      },
    ],
    availability:       { type: Boolean, default: true },
    owner:              { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating:             { type: Number, default: 0 },
    reviewsCount:       { type: Number, default: 0 },
    viewCount:          { type: Number, default: 0 },
    wishlistCount:      { type: Number, default: 0 },
    cancellationPolicy: { type: String, default: 'moderate' },
  },
  { timestamps: true }
);
propertySchema.pre('save', function (next) {
  if (this.address?.city) this.city = this.address.city;
  next();
});
const Property =
  mongoose.models.Property || mongoose.model('Property', propertySchema);

const bookingSchema = new mongoose.Schema(
  {
    user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    property:           { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    checkInDate:        Date,
    checkOutDate:       Date,
    totalAmount:        Number,
    advancePaid:        { type: Number, default: 0 },
    paymentStatus:      { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    bookingStatus:      { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    cancellationStatus: { type: String, default: 'none' },
  },
  { timestamps: true }
);
const Booking =
  mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const reviewSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    rating:   Number,
    comment:  String,
  },
  { timestamps: true }
);
const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

// ── Helper: convert a URL into the new image subdocument format ───────────────
const img = (url, folder = 'RentEase/Demo') => ({
  url,
  public_id: `${folder}/${url.split('/').pop().split('?')[0]}`,
});

// ── Demo property data (8 diverse listings across India) ─────────────────────
const DEMO_PROPERTIES = [
  // ── 1. Goa Villa ────────────────────────────────────────────────────────────
  {
    title: 'Luxury Sea-View Villa in Goa',
    description:
      'Stunning villa with panoramic Arabian Sea views, private pool, and lush tropical garden. Perfect for a premium holiday experience in North Goa. The villa features spacious bedrooms, a fully equipped kitchen, outdoor dining area, and direct beach access. Ideal for families and groups seeking an unforgettable coastal retreat.',
    type: 'villa',
    price: 8500,
    address: { street: '42 Calangute Beach Road', city: 'Goa', state: 'Goa', country: 'India', zipCode: '403516' },
    location: { type: 'Point', coordinates: [73.7541, 15.5523] },
    bedrooms: 4,
    bathrooms: 3,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'pool', 'security', 'garden'],
    images: [
      img('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'),
      img('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'),
      img('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'),
      img('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'),
    ],
    rating: 4.8,
    reviewsCount: 24,
    viewCount: 312,
    cancellationPolicy: 'moderate',
  },

  // ── 2. Mumbai Studio ────────────────────────────────────────────────────────
  {
    title: 'Modern Studio Apartment in Bandra West',
    description:
      'Chic, fully furnished studio apartment in the heart of Bandra West, Mumbai. Walking distance to Linking Road, cafes, and the promenade. High-speed WiFi, air conditioning, and 24/7 security. Ideal for working professionals and digital nomads who need a stylish, well-connected base in Mumbai.',
    type: 'studio',
    price: 2200,
    address: { street: '15 Pali Hill Lane', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400050' },
    location: { type: 'Point', coordinates: [72.8362, 19.0596] },
    bedrooms: 0,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'security', 'lift'],
    images: [
      img('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'),
      img('https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80'),
      img('https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80'),
    ],
    rating: 4.5,
    reviewsCount: 18,
    viewCount: 245,
    cancellationPolicy: 'flexible',
  },

  // ── 3. Bangalore Apartment ─────────────────────────────────────────────────
  {
    title: '3BHK Family Apartment in Koramangala',
    description:
      'Spacious 3-bedroom apartment in Koramangala, Bangalore\'s tech hub. Fully furnished with modular kitchen, dedicated work-from-home space, and covered parking. Located near major IT parks, top malls, and excellent restaurants. Ideal for families and small teams relocating to Bengaluru.',
    type: 'apartment',
    price: 3800,
    address: { street: '8th Block, 80 Feet Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', zipCode: '560095' },
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'gym', 'security', 'lift', 'power_backup'],
    images: [
      img('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'),
      img('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'),
      img('https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'),
      img('https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'),
    ],
    rating: 4.6,
    reviewsCount: 31,
    viewCount: 428,
    cancellationPolicy: 'moderate',
  },

  // ── 4. Jaipur Haveli ────────────────────────────────────────────────────────
  {
    title: 'Heritage Haveli Suite in Jaipur Old City',
    description:
      'Experience royalty in this beautifully restored 18th-century haveli in the Pink City. Ornate architecture, rooftop terrace with Hawa Mahal views, and authentic Rajasthani décor. Walking distance to major heritage sites and bazaars. A truly once-in-a-lifetime stay for history and culture lovers.',
    type: 'house',
    price: 4200,
    address: { street: 'Near Hawa Mahal, Old City', city: 'Jaipur', state: 'Rajasthan', country: 'India', zipCode: '302002' },
    location: { type: 'Point', coordinates: [75.8267, 26.9239] },
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'furnished', 'ac', 'security'],
    images: [
      img('https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800&q=80'),
      img('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'),
      img('https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80'),
    ],
    rating: 4.9,
    reviewsCount: 42,
    viewCount: 567,
    cancellationPolicy: 'strict',
  },

  // ── 5. Delhi Flat ───────────────────────────────────────────────────────────
  {
    title: 'Cosy 2BHK Flat Near Hauz Khas Village',
    description:
      'Vibrant 2-bedroom apartment steps away from Hauz Khas Lake and its thriving arts, café, and nightlife scene. The flat features a large balcony, wooden flooring, and modern interiors. Perfect for explorers, creatives, and professionals who want to be at the heart of New Delhi.',
    type: 'apartment',
    price: 2800,
    address: { street: '12 Hauz Khas Village', city: 'New Delhi', state: 'Delhi', country: 'India', zipCode: '110016' },
    location: { type: 'Point', coordinates: [77.1954, 28.5494] },
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'security', 'parking'],
    images: [
      img('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'),
      img('https://images.unsplash.com/photo-1560185127-6a6b73d45f0c?w=800&q=80'),
      img('https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800&q=80'),
    ],
    rating: 4.3,
    reviewsCount: 15,
    viewCount: 203,
    cancellationPolicy: 'flexible',
  },

  // ── 6. Bangalore PG ─────────────────────────────────────────────────────────
  {
    title: 'Premium PG in Whitefield IT Corridor',
    description:
      'Modern premium paying-guest accommodation within walking distance of major Whitefield IT parks. Fully air-conditioned rooms with attached bathrooms, high-speed internet, 24/7 power backup, gym access, and healthy meal options available. Perfect for tech professionals and interns.',
    type: 'pg',
    price: 950,
    address: { street: 'EPIP Zone, Whitefield', city: 'Bengaluru', state: 'Karnataka', country: 'India', zipCode: '560066' },
    location: { type: 'Point', coordinates: [77.7480, 12.9698] },
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'gym', 'security', 'power_backup'],
    images: [
      img('https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'),
      img('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'),
      img('https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800&q=80'),
    ],
    rating: 4.1,
    reviewsCount: 27,
    viewCount: 389,
    cancellationPolicy: 'moderate',
  },

  // ── 7. Kerala Cottage ───────────────────────────────────────────────────────
  {
    title: 'Beachfront Cottage at Kovalam Beach',
    description:
      'Charming thatched-roof cottage right on Kovalam Beach, Kerala. Wake up to ocean sounds, enjoy fresh seafood, and explore the nearby Vizhinjam lighthouse. The cottage comes with a private sit-out area, hammock, and stunning sunset views over the Arabian Sea. A genuine coastal escape.',
    type: 'house',
    price: 3100,
    address: { street: 'Light House Road, Kovalam', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', zipCode: '695527' },
    location: { type: 'Point', coordinates: [76.9824, 8.3988] },
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'furnished', 'ac', 'garden'],
    images: [
      img('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80'),
      img('https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800&q=80'),
      img('https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80'),
    ],
    rating: 4.7,
    reviewsCount: 19,
    viewCount: 278,
    cancellationPolicy: 'flexible',
  },

  // ── 8. Mumbai Office ────────────────────────────────────────────────────────
  {
    title: 'Plug-and-Play Office Space in BKC',
    description:
      'Ready-to-use commercial office space in Bandra Kurla Complex, Mumbai\'s premier business district. Furnished workstations for 10-20 people, a large conference room, high-speed leased line internet, pantry, and 24/7 biometric access. Ideal for startups, SMEs, and corporate teams.',
    type: 'commercial',
    price: 15000,
    address: { street: 'G Block, Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400051' },
    location: { type: 'Point', coordinates: [72.8656, 19.0596] },
    bedrooms: 0,
    bathrooms: 2,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'security', 'lift', 'power_backup'],
    images: [
      img('https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'),
      img('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80'),
      img('https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80'),
    ],
    rating: 4.4,
    reviewsCount: 8,
    viewCount: 156,
    cancellationPolicy: 'strict',
  },

  // ── 9. Hyderabad 2BHK ───────────────────────────────────────────────────────
  {
    title: 'Furnished 2BHK Apartment in HITEC City',
    description:
      'Contemporary 2-bedroom apartment in Hyderabad\'s booming HITEC City, within 5 minutes of major IT companies including Microsoft, Google, and Amazon campuses. Includes high-speed fibre internet, modular kitchen, air conditioning in all rooms, covered parking, and 24/7 power backup.',
    type: 'apartment',
    price: 2600,
    address: { street: 'Madhapur, Near HITEC City', city: 'Hyderabad', state: 'Telangana', country: 'India', zipCode: '500081' },
    location: { type: 'Point', coordinates: [78.3814, 17.4474] },
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'parking', 'furnished', 'ac', 'security', 'lift', 'power_backup'],
    images: [
      img('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'),
      img('https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80'),
      img('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'),
    ],
    rating: 4.4,
    reviewsCount: 22,
    viewCount: 310,
    cancellationPolicy: 'moderate',
  },

  // ── 10. Pune 1BHK ───────────────────────────────────────────────────────────
  {
    title: 'Compact 1BHK Flat in Viman Nagar, Pune',
    description:
      'Neat and modern 1-bedroom flat in Viman Nagar, Pune — one of the city\'s most sought-after residential areas. Close to Phoenix Mall, top restaurants, and Pune Airport. Comes with semi-furnished rooms, parking, and a nearby grocery store. Great for solo professionals and young couples.',
    type: 'apartment',
    price: 1500,
    address: { street: 'Viman Nagar Road No. 3', city: 'Pune', state: 'Maharashtra', country: 'India', zipCode: '411014' },
    location: { type: 'Point', coordinates: [73.9197, 18.5676] },
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['wifi', 'parking', 'ac', 'security'],
    images: [
      img('https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'),
      img('https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80'),
      img('https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80'),
    ],
    rating: 4.2,
    reviewsCount: 11,
    viewCount: 187,
    cancellationPolicy: 'flexible',
  },
];

// ── Demo reviews ──────────────────────────────────────────────────────────────
const DEMO_REVIEWS = [
  {
    propertyIndex: 0,
    rating: 5,
    comment: 'Absolutely stunning villa! The sea view from the pool was breathtaking. The host was incredibly responsive and helpful. Will definitely return next year.',
  },
  {
    propertyIndex: 0,
    rating: 5,
    comment: 'Perfect location, immaculate property. Everything was exactly as described. The private pool made our anniversary unforgettable.',
  },
  {
    propertyIndex: 1,
    rating: 4,
    comment: 'Great studio for a work trip. Super clean, fast WiFi, and the location in Bandra is unbeatable. The AC was a lifesaver in Mumbai heat!',
  },
  {
    propertyIndex: 2,
    rating: 5,
    comment: 'Best apartment we\'ve stayed in Bangalore. The gym and covered parking are excellent perks. The owner was very helpful with local recommendations.',
  },
  {
    propertyIndex: 3,
    rating: 5,
    comment: 'The heritage haveli exceeded all expectations. Waking up to the rooftop view of Hawa Mahal is a magical experience. The décor is stunning and authentic.',
  },
  {
    propertyIndex: 4,
    rating: 4,
    comment: 'Amazing neighbourhood! The balcony view of Hauz Khas Lake is gorgeous. Great access to restaurants and galleries. Highly recommended for creative types.',
  },
  {
    propertyIndex: 6,
    rating: 5,
    comment: 'Woke up to the sound of waves every morning! The cottage is simple but absolutely perfect. Fresh seafood stalls right outside. Pure bliss.',
  },
  {
    propertyIndex: 8,
    rating: 4,
    comment: 'Great location in HITEC City — walked to office every day. The apartment is clean, well-maintained, and the power backup is genuinely 24/7.',
  },
  {
    propertyIndex: 9,
    rating: 4,
    comment: 'Excellent value for Pune. Viman Nagar location is super convenient. Quiet building, helpful owner, and the flat was spotlessly clean on arrival.',
  },
];

// ── Main seeder ───────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱 RentEase Demo Data Seeder v2\n');
  console.log(`📡 Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':***@')}\n`);

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ MongoDB connected\n');

  // ── Find demo users ────────────────────────────────────────────────────────
  const owner  = await User.findOne({ email: 'owner@rentease.com' });
  const tenant = await User.findOne({ email: 'tenant@rentease.com' });

  if (!owner || !tenant) {
    console.error(
      '❌ Demo users not found. Run seedDb.js first:\n   node server/utils/seedDb.js'
    );
    process.exit(1);
  }
  console.log(`  ✅ Owner  : ${owner.email}`);
  console.log(`  ✅ Tenant : ${tenant.email}\n`);

  // ── Seed properties ────────────────────────────────────────────────────────
  console.log('🏠 Seeding demo properties...');
  const createdProperties = [];

  for (const propData of DEMO_PROPERTIES) {
    const existing = await Property.findOne({ title: propData.title });
    if (existing) {
      console.log(`  ⚠️  Already exists : "${propData.title}"`);
      createdProperties.push(existing);
      continue;
    }
    const prop = await Property.create({ ...propData, owner: owner._id });
    createdProperties.push(prop);
    console.log(
      `  ✅ Created : "${prop.title}" (${prop.type}, ₹${prop.price}/mo, ${prop.images.length} images)`
    );
  }

  // ── Seed bookings ──────────────────────────────────────────────────────────
  console.log('\n📅 Seeding demo bookings...');

  const today = new Date();
  const bookingData = [
    { propertyIndex: 0, checkInOffset: 10,  checkOutOffset: 17,  bookingStatus: 'confirmed', paymentStatus: 'paid' },
    { propertyIndex: 1, checkInOffset: -30, checkOutOffset: -23, bookingStatus: 'completed', paymentStatus: 'paid' },
    { propertyIndex: 2, checkInOffset: 25,  checkOutOffset: 55,  bookingStatus: 'confirmed', paymentStatus: 'paid' },
    { propertyIndex: 3, checkInOffset: -15, checkOutOffset: -8,  bookingStatus: 'completed', paymentStatus: 'paid' },
    { propertyIndex: 4, checkInOffset: 5,   checkOutOffset: 12,  bookingStatus: 'pending',   paymentStatus: 'pending' },
    { propertyIndex: 8, checkInOffset: -60, checkOutOffset: -30, bookingStatus: 'completed', paymentStatus: 'paid' },
    { propertyIndex: 9, checkInOffset: 35,  checkOutOffset: 65,  bookingStatus: 'confirmed', paymentStatus: 'paid' },
  ];

  let bookingsCreated = 0;
  for (const bd of bookingData) {
    const prop = createdProperties[bd.propertyIndex];
    if (!prop) continue;

    const checkIn  = new Date(today); checkIn.setDate(today.getDate() + bd.checkInOffset);
    const checkOut = new Date(today); checkOut.setDate(today.getDate() + bd.checkOutOffset);
    const nights      = Math.max(1, Math.round((checkOut - checkIn) / 86400000));
    const totalAmount = Math.round((prop.price / 30) * nights);
    const advancePaid = bd.paymentStatus === 'paid' ? Math.round(totalAmount * 0.3) : 0;

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
      user:               tenant._id,
      property:           prop._id,
      checkInDate:        checkIn,
      checkOutDate:       checkOut,
      totalAmount,
      advancePaid,
      bookingStatus:      bd.bookingStatus,
      paymentStatus:      bd.paymentStatus,
      cancellationStatus: 'none',
    });
    console.log(
      `  ✅ Booking : "${prop.title}" — ${bd.bookingStatus} (${nights} nights, ₹${totalAmount}, advance ₹${advancePaid})`
    );
    bookingsCreated++;
  }

  // ── Seed reviews ───────────────────────────────────────────────────────────
  console.log('\n⭐ Seeding demo reviews...');
  let reviewsCreated = 0;

  for (const rd of DEMO_REVIEWS) {
    const prop = createdProperties[rd.propertyIndex];
    if (!prop) continue;

    const existing = await Review.findOne({ user: tenant._id, property: prop._id });
    if (existing) {
      console.log(`  ⚠️  Review already exists for "${prop.title}"`);
      continue;
    }
    await Review.create({ user: tenant._id, property: prop._id, rating: rd.rating, comment: rd.comment });
    reviewsCreated++;

    // Recalculate rating from all reviews
    const [stat] = await Review.aggregate([
      { $match: { property: prop._id } },
      { $group: { _id: '$property', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stat) {
      await Property.findByIdAndUpdate(prop._id, {
        rating:       Math.round(stat.avg * 10) / 10,
        reviewsCount: stat.count,
      });
    }
    console.log(`  ✅ Review (${rd.rating}★) : "${prop.title}"`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Demo data seed complete!\n');
  console.log('📋 Summary:');
  console.log(`   Properties : ${createdProperties.length} listings`);
  console.log(`   Bookings   : ${bookingsCreated} records`);
  console.log(`   Reviews    : ${reviewsCreated} reviews`);
  console.log('\n🔐 Demo Login Credentials:');
  console.log('   Owner  : owner@rentease.com  / Owner@123!');
  console.log('   Tenant : tenant@rentease.com / Tenant@123!');
  console.log('   Admin  : admin@rentease.com  / Admin@123!\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Demo seed failed:', err.message);
  process.exit(1);
});
