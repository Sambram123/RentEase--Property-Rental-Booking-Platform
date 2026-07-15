import mongoose from 'mongoose';

// ─── Address sub-document ────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city:   { type: String, required: [true, 'City is required'], trim: true },
    state:  { type: String, required: [true, 'State is required'], trim: true },
    country: { type: String, required: [true, 'Country is required'], trim: true, default: 'India' },
    zipCode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ─── Main Property schema ─────────────────────────────────────────────────────
const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: ['apartment', 'house', 'villa', 'studio', 'pg', 'commercial'],
        message: '{VALUE} is not a valid property type',
      },
    },

    price: {
      type: Number,
      required: [true, 'Price per month is required'],
      min: [0, 'Price cannot be negative'],
    },

    address: {
      type: addressSchema,
      required: true,
    },

    // Convenience field for quick display / search
    city: {
      type: String,
      trim: true,
    },

    // GeoJSON point — compatible with Google Maps & MongoDB geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms cannot be negative'],
    },

    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms cannot be negative'],
    },

    amenities: {
      type: [String],
      enum: {
        values: ['wifi', 'parking', 'furnished', 'ac', 'gym', 'pool', 'security', 'lift', 'power_backup', 'garden'],
        message: '{VALUE} is not a recognised amenity',
      },
      default: [],
    },

    images: {
      type: [
        {
          url:       { type: String, required: true },
          public_id: { type: String, default: '' },  // optional — legacy docs may not have this
          _id:       false,
        },
      ],
      default: [],
    },

    availability: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property must have an owner'],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    wishlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    cancellationPolicy: {
      type: String,
      enum: {
        values: ['flexible', 'moderate', 'strict'],
        message: '{VALUE} is not a valid cancellation policy',
      },
      default: 'moderate',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save: keep city field in sync with address.city ─────────────────────
propertySchema.pre('save', function (next) {
  if (this.address && this.address.city) {
    this.city = this.address.city;
  }
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Single field indexes
propertySchema.index({ city: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ availability: 1 });
propertySchema.index({ location: '2dsphere' }); // for geospatial queries

// Compound indexes for common search patterns
propertySchema.index({ availability: 1, city: 1, price: 1 });         // search by city+price
propertySchema.index({ availability: 1, type: 1, price: 1 });         // search by type+price
propertySchema.index({ availability: 1, rating: -1, reviewsCount: -1 }); // featured sort
propertySchema.index({ availability: 1, viewCount: -1 });              // trending sort
propertySchema.index({ availability: 1, wishlistCount: -1 });          // trending wishlist
propertySchema.index({ owner: 1, availability: 1, createdAt: -1 });   // owner's properties
propertySchema.index({ availability: 1, createdAt: -1 });              // newest available
propertySchema.index({ city: 1, type: 1, availability: 1 });          // recommendation engine

const Property = mongoose.model('Property', propertySchema);

export default Property;
