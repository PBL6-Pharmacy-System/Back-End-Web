import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import './src/jobs/flashsaleJob.js';

// Middlewares
import { errorHandler, notFound } from './src/middlewares/errorHandler.middleware.js';
import { apiLimiter } from './src/middlewares/rateLimit.middleware.js';

// Auth
import authRoutes from './src/modules/auth/authRoutes.js';

// User Management
import customerRoutes from './src/modules/user-management/customers/customerRoutes.js';
import userRoutes from './src/modules/user-management/users/userRoutes.js';

// Product Management
import categoryRoutes from './src/modules/product-management/categories/categoryRoutes.js';
import productUnitRoutes from './src/modules/product-management/product-units/productUnitRoutes.js';
import productRoutes from './src/modules/product-management/products/productRoutes.js';
import supplierRoutes from './src/modules/product-management/suppliers/supplierRoutes.js';

// Inventory Management
import branchInventoryRoutes from './src/modules/inventory-management/branch-inventory/branchInventoryRoutes.js';
import branchRoutes from './src/modules/inventory-management/branches/branchRoutes.js';

// Order Management
import cartRoutes from './src/modules/order-management/cart/cartRoutes.js';
// import orderRoutes from './src/modules/order-management/orders/orderRoutes.js';

// Promotion Management
import flashsaleRoutes from './src/modules/promotion-management/flashsales/flashsaleRoutes.js';
import voucherRoutes from './src/modules/promotion-management/vouchers/voucherRoutes.js';

// Review Management
import reviewRoutes from './src/modules/review-management/reviews/reviewRoutes.js';

// Notification Management
import notificationRoutes from './src/modules/notification-management/notifications/notificationRoutes.js';

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
// Auth routes
app.use('/api', authRoutes);

// User management
app.use('/api', userRoutes);
app.use('/api', customerRoutes);

// Product management
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productUnitRoutes);
app.use('/api', supplierRoutes);

// Inventory management
app.use('/api', branchRoutes);
app.use('/api', branchInventoryRoutes);

// Order management
app.use('/api', cartRoutes);
// app.use('/api', orderRoutes);

// Promotion management
app.use('/api', voucherRoutes);
app.use('/api', flashsaleRoutes);

// Review management
app.use('/api', reviewRoutes);

// Notification management
app.use('/api', notificationRoutes);

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
