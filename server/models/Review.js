import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Review must reference a property'],
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── One review per user per property ────────────────────────────────────────
reviewSchema.index({ user: 1, property: 1 }, { unique: true });
reviewSchema.index({ property: 1 });

// ─── Static: update property rating after a review is saved ──────────────────
reviewSchema.statics.updatePropertyRating = async function (propertyId) {
  const stats = await this.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: '$property',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const { default: Property } = await import('./Property.js');
    await Property.findByIdAndUpdate(propertyId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewsCount: stats[0].count,
    });
  }
};

// ─── Auto-update rating on save ───────────────────────────────────────────────
reviewSchema.post('save', function () {
  this.constructor.updatePropertyRating(this.property);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
