import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    firebaseUid: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['tenant', 'landlord', 'admin'], default: 'tenant' },
    phone: { type: String, default: '' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
