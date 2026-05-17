import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    pricePerMonth: { type: Number, required: true, min: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', propertySchema);

export default Property;
