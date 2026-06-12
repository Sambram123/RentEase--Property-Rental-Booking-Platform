import mongoose from 'mongoose';

// ─── Unavailable range sub-document ──────────────────────────────────────────
const unavailableRangeSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    reason:    { type: String, trim: true, default: 'Blocked by owner' },
  },
  { _id: true }
);

// ─── Main Availability schema ─────────────────────────────────────────────────
const availabilitySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Availability must belong to a property'],
      unique: true,          // one availability doc per property
    },

    // Array of individual blocked dates (ISO date strings stored as Date)
    blockedDates: {
      type: [Date],
      default: [],
    },

    // Array of blocked ranges
    unavailableRanges: {
      type: [unavailableRangeSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: property has unique:true which auto-creates the index
availabilitySchema.index({ blockedDates: 1 });
availabilitySchema.index({ 'unavailableRanges.startDate': 1, 'unavailableRanges.endDate': 1 });

// ─── Instance method: check if a date is blocked ──────────────────────────────
availabilitySchema.methods.isDateBlocked = function (date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Check individual blocked dates
  const inBlockedDates = this.blockedDates.some((bd) => {
    const bdd = new Date(bd);
    bdd.setHours(0, 0, 0, 0);
    return bdd.getTime() === d.getTime();
  });
  if (inBlockedDates) return true;

  // Check unavailable ranges
  return this.unavailableRanges.some((range) => {
    const start = new Date(range.startDate);
    const end   = new Date(range.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });
};

// ─── Instance method: check if a date range overlaps blocked periods ──────────
availabilitySchema.methods.isRangeBlocked = function (checkIn, checkOut) {
  const start = new Date(checkIn);
  const end   = new Date(checkOut);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Check individual blocked dates within the range
  const hasBlockedDate = this.blockedDates.some((bd) => {
    const d = new Date(bd);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  });
  if (hasBlockedDate) return true;

  // Check overlapping ranges
  return this.unavailableRanges.some((range) => {
    const rs = new Date(range.startDate);
    const re = new Date(range.endDate);
    rs.setHours(0, 0, 0, 0);
    re.setHours(23, 59, 59, 999);
    // Overlap condition
    return rs <= end && re >= start;
  });
};

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
