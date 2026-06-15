import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Saved search must belong to a user'],
    },

    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Search name cannot exceed 100 characters'],
      default: 'Saved Search',
    },

    filters: {
      q:         { type: String, trim: true, default: '' },
      city:      { type: String, trim: true, default: '' },
      type:      { type: String, trim: true, default: '' },
      minPrice:  { type: Number, default: null },
      maxPrice:  { type: Number, default: null },
      bedrooms:  { type: Number, default: null },
      bathrooms: { type: Number, default: null },
      amenities: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

savedSearchSchema.index({ user: 1, createdAt: -1 });

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);

export default SavedSearch;
