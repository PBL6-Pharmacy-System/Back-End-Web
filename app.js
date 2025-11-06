import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import './src/jobs/flashsaleJob.js';

// Middlewares
import { errorHandler, notFound } from './src/middlewares/errorHandler.middleware.js';
import { apiLimiter } from './src/middlewares/rateLimit.middleware.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import branchInventoryRoutes from './src/routes/branchInventoryRoutes.js';
import branchRoutes from './src/routes/branchRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
// import orderRoutes from './src/routes/orderRoutes.js';
import flashsaleRoutes from './src/routes/flashsaleRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import productUnitRoutes from './src/routes/productUnitRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import voucherRoutes from './src/routes/voucherRoutes.js';

const app = express();

// Global middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', userRoutes);
// app.use('/api', orderRoutes);
app.use('/api', categoryRoutes);
app.use('/api', supplierRoutes);
app.use('/api', voucherRoutes);
app.use('/api', notificationRoutes);
app.use('/api', customerRoutes);
app.use('/api', reviewRoutes);
app.use('/api', branchRoutes);
app.use('/api', branchInventoryRoutes);
app.use('/api', productUnitRoutes);
app.use('/api', cartRoutes);
app.use('/api', flashsaleRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PBL6 Pharmacy API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// 404 handler - phải đặt sau tất cả routes
app.use(notFound);

// Error handler - phải đặt cuối cùng
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
});
