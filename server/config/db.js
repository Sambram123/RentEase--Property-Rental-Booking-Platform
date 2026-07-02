import mongoose from 'mongoose';
import colors from 'colors';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease-dev';

    const options = {
      // Atlas production timeouts
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
      // Connection pool
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

export default connectDB;
