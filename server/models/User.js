import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['tenant', 'landlord', 'admin'], default: 'tenant' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
