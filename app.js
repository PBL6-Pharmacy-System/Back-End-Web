import cors from 'cors';
import 'dotenv/config';
import express from 'express';
// Jobs - chỉ import những job cần thiết
import './src/jobs/flashsaleJob.js';
import { startPaymentExpirationJob } from './src/jobs/paymentExpirationJob.js';
import { startReservationCleanupJob } from './src/jobs/reservationCleanupJob.js';
import { startCartCleanupJob } from './src/jobs/cartCleanupJob.js';

// Middlewares
import { errorHandler, notFound } from './src/middlewares/errorHandler.middleware.js';
import { apiLimiter } from './src/middlewares/rateLimit.middleware.js';

// ✅ SECURITY: Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: ${envVar} is not defined in environment variables`);
    process.exit(1);
  }
}

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
import inventoryTransferRoutes from './src/modules/inventory-management/inventory-transfer/inventoryTransferRoutes.js';
import productBatchRoutes from './src/modules/inventory-management/product-batch/productBatchRoutes.js';
import stockTakeRoutes from './src/modules/inventory-management/stock-take/stockTakeRoutes.js';
import stockOperationsRoutes from './src/modules/inventory-management/stock-operations/stockOperationsRoutes.js';

// Order Management
import cartRoutes from './src/modules/order-management/cart/cartRoutes.js';
import orderRoutes from './src/modules/order-management/orders/orderRoutes.js';
import momoRoutes from './src/modules/order-management/payments/gateways/momo/momoRoutes.js';
import vnpayRoutes from './src/modules/order-management/payments/gateways/vnpay/vnpayRoutes.js';
import paymentRoutes from './src/modules/order-management/payments/paymentRoutes.js';

// Shipping Management
import shippingFeeRoutes from './src/modules/shipping-management/shipping-fees/shippingFeeRoutes.js';
import shipmentRoutes from './src/modules/shipping-management/shipments/shipmentRoutes.js';
import shippingAddressRoutes from './src/modules/shipping-management/shipping-addresses/shippingAddressRoutes.js';

// Promotion Management
import flashsaleRoutes from './src/modules/promotion-management/flashsales/flashsaleRoutes.js';
import voucherRoutes from './src/modules/promotion-management/vouchers/voucherRoutes.js';

// Review Management
import reviewRoutes from './src/modules/review-management/reviews/reviewRoutes.js';

// Notification Management
import notificationRoutes from './src/modules/notification-management/notifications/notificationRoutes.js';

// Medical Management
import prescriptionRoutes from './src/modules/medical/prescriptions/prescriptionRoutes.js';

// Statistics
import businessStatisticsRoutes from './src/modules/statistics/business/businessStatisticsRoutes.js';
import inventoryStatisticsRoutes from './src/modules/statistics/inventory/inventoryStatisticsRoutes.js';

// Admin Dashboard
import dashboardRoutes from './src/modules/admin-dashboard/dashboardRoutes.js';

// Staff & Admin Management (now under user-management)
import adminRoutes from './src/modules/user-management/admin/adminRoutes.js';
import staffRoutes from './src/modules/user-management/staff/staffRoutes.js';

// Location Management
import citiesRoutes from './src/modules/location/cities/citiesRoutes.js';

const app = express();

// Global middlewares
// ✅ SECURITY: Improved CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
// Promotion management routes - MUST be early to avoid middleware conflicts
app.use('/api', voucherRoutes);
app.use('/api', flashsaleRoutes);

// Auth routes
app.use('/api', authRoutes);

// User management
app.use('/api', userRoutes);
app.use('/api', customerRoutes);

// Review management - MUST be before product routes to match /products/:id/reviews
app.use('/api', reviewRoutes);

// Product management
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productUnitRoutes);
app.use('/api', supplierRoutes);

// Inventory management
app.use('/api', branchRoutes);
app.use('/api', branchInventoryRoutes);
app.use('/api', inventoryTransferRoutes);
app.use('/api', productBatchRoutes);
app.use('/api', stockTakeRoutes);
app.use('/api', stockOperationsRoutes);

// Order management
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api/payments/vnpay', vnpayRoutes);
app.use('/api/payments/momo', momoRoutes);

// Shipping management
app.use('/api/shipping', shippingFeeRoutes);
app.use('/api', shipmentRoutes);
app.use('/api', shippingAddressRoutes);

// Notification management
app.use('/api', notificationRoutes);

// Medical management
app.use('/api', prescriptionRoutes);

// Statistics
app.use('/api', inventoryStatisticsRoutes);
app.use('/api', businessStatisticsRoutes);

// Admin Dashboard
app.use('/api/admin/dashboard', dashboardRoutes);

// Staff & Admin management
app.use('/api', staffRoutes);
app.use('/api', adminRoutes);

// Location management
app.use('/api/cities', citiesRoutes);

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

  // Start background jobs
  startPaymentExpirationJob();

  // Start reservation cleanup job (mỗi 5 phút)
  startReservationCleanupJob();

  // Start cart cleanup job (chạy lúc 2:00 AM hàng ngày)
  startCartCleanupJob();
});
