import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },

    avatar: {
      type: String,
      default: '',
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },

    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      default: '',
    },

    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
      default: '',
    },

    avatarSeed: {
      type: String,
      default: '',
    },

    avatarStyle: {
      type: String,
      enum: {
        values: ['avataaars', 'adventurer', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'notionists', 'pixel-art'],
        message: '{VALUE} is not a valid avatar style',
      },
      default: 'avataaars',
    },

    preferences: {
      bookingNotifications: { type: Boolean, default: true },
      paymentNotifications: { type: Boolean, default: true },
      reviewNotifications: { type: Boolean, default: true },
      marketingNotifications: { type: Boolean, default: false },
    },

    role: {
      type: String,
      enum: {
        values: ['tenant', 'owner', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'tenant',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    }],

    // ── Personalization / recommendation fields ─────────────────────
    recentlyViewed: [
      {
        property:  { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
        viewedAt:  { type: Date, default: Date.now },
      },
    ],

    preferredCities: [{ type: String, trim: true }],

    preferredPropertyTypes: [
      {
        type: String,
        enum: ['apartment', 'house', 'villa', 'studio', 'pg', 'commercial'],
      },
    ],

    searchHistory: [
      {
        query:      { type: String, trim: true },
        filters:    { type: mongoose.Schema.Types.Mixed, default: {} },
        searchedAt: { type: Date, default: Date.now },
      },
    ],

    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ role: 1, createdAt: -1 });                // admin user listing
userSchema.index({ lastSeen: -1 });                          // activity tracking


// ─── Pre-save hook: hash password before storing ─────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare passwords ──────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── toJSON: strip password even when select:false is bypassed ───────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
