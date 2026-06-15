import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import adminRoutes from './adminRoutes.js';
import messageRoutes from './messageRoutes.js';
import testRoutes from './testRoutes.js';
import availabilityRoutes from './availabilityRoutes.js';
import refundRoutes from './refundRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import searchRoutes from './searchRoutes.js';

const registerRoutes = (app) => {
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'RentEase API running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/refunds', refundRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/searches', searchRoutes);
  app.use('/api/test', testRoutes);
};

export default registerRoutes;
