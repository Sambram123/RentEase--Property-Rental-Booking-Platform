import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    pricePerMonth: { type: Number, required: true, min: 0 },
    advanceRent: { type: Number, default: 0, min: 0 },
    bedrooms: { type: Number, default: 1, min: 0 },
    bathrooms: { type: Number, default: 1, min: 0 },
    images: [{ type: String }],
    amenities: [{ type: String }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', propertySchema);

export default Property;
