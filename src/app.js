console.log('🔥 APP MODULE LOADED');

import cors from 'cors';
import 'dotenv/config';
import express from 'express';

// =======================
// Middlewares
// =======================
import { errorHandler, notFound } from './middlewares/errorHandler.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

// =======================
// ENV validation (chỉ check cái bắt buộc)
// =======================
const requiredEnvVars = ['JWT_SECRET'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// =======================
// Routes import
// =======================

// Auth
import authRoutes from './modules/auth/authRoutes.js';

// User Management
import adminRoutes from './modules/user-management/admin/adminRoutes.js';
import customerRoutes from './modules/user-management/customers/customerRoutes.js';
import staffRoutes from './modules/user-management/staff/staffRoutes.js';
import userRoutes from './modules/user-management/users/userRoutes.js';

// Product Management
import categoryRoutes from './modules/product-management/categories/categoryRoutes.js';
import productUnitRoutes from './modules/product-management/product-units/productUnitRoutes.js';
import productRoutes from './modules/product-management/products/productRoutes.js';
import supplierRoutes from './modules/product-management/suppliers/supplierRoutes.js';

// Inventory Management
import branchInventoryRoutes from './modules/inventory-management/branch-inventory/branchInventoryRoutes.js';
import branchRoutes from './modules/inventory-management/branches/branchRoutes.js';
import inventoryTransferRoutes from './modules/inventory-management/inventory-transfer/inventoryTransferRoutes.js';
import productBatchRoutes from './modules/inventory-management/product-batch/productBatchRoutes.js';
import stockOperationsRoutes from './modules/inventory-management/stock-operations/stockOperationsRoutes.js';
import stockTakeRoutes from './modules/inventory-management/stock-take/stockTakeRoutes.js';
import supplierOrderRoutes from './modules/inventory-management/supplier-order/supplierOrderRoutes.js';

// Order Management
import cartRoutes from './modules/order-management/cart/cartRoutes.js';
import orderRoutes from './modules/order-management/orders/orderRoutes.js';
import momoRoutes from './modules/order-management/payments/gateways/momo/momoRoutes.js';
import payosRoutes from './modules/order-management/payments/gateways/payos/payosRoutes.js';
import paypalRoutes from './modules/order-management/payments/gateways/paypal/paypalRoutes.js';
import vnpayRoutes from './modules/order-management/payments/gateways/vnpay/vnpayRoutes.js';
import paymentRoutes from './modules/order-management/payments/paymentRoutes.js';

// Shipping Management
import shipmentRoutes from './modules/shipping-management/shipments/shipmentRoutes.js';
import shippingAddressRoutes from './modules/shipping-management/shipping-addresses/shippingAddressRoutes.js';
import shippingFeeRoutes from './modules/shipping-management/shipping-fees/shippingFeeRoutes.js';

// Promotion Management
import flashsaleRoutes from './modules/promotion-management/flashsales/flashsaleRoutes.js';
import voucherRoutes from './modules/promotion-management/vouchers/voucherRoutes.js';

// Review Management
import reviewRoutes from './modules/review-management/reviews/reviewRoutes.js';

// Notification Management
import notificationRoutes from './modules/notification-management/notifications/notificationRoutes.js';

// Medical Management
import prescriptionRoutes from './modules/medical/prescriptions/prescriptionRoutes.js';

// Statistics
import businessStatisticsRoutes from './modules/statistics/business/businessStatisticsRoutes.js';
import inventoryStatisticsRoutes from './modules/statistics/inventory/inventoryStatisticsRoutes.js';

// Admin Dashboard
import dashboardRoutes from './modules/admin-dashboard/dashboardRoutes.js';

// Location
import citiesRoutes from './modules/location/cities/citiesRoutes.js';

// =======================
// App init
// =======================
const app = express();

// =======================
// Global middlewares
// =======================
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limit toàn API
app.use('/api', apiLimiter);

// =======================
// Health check (Azure + chấm bài)
// =======================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'PBL6 Pharmacy API',
    time: new Date().toISOString()
  });
});

// =======================
// API Routes
// =======================

// Promotion (ưu tiên sớm)
app.use('/api', voucherRoutes);
app.use('/api', flashsaleRoutes);

// Auth
app.use('/api', authRoutes);

// User
app.use('/api', userRoutes);
app.use('/api', customerRoutes);
app.use('/api', staffRoutes);
app.use('/api', adminRoutes);

// Review (phải trước product)
app.use('/api', reviewRoutes);

// Product
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productUnitRoutes);
app.use('/api', supplierRoutes);

// Inventory
app.use('/api', branchRoutes);
app.use('/api', branchInventoryRoutes);
app.use('/api', inventoryTransferRoutes);
app.use('/api', productBatchRoutes);
app.use('/api', stockTakeRoutes);
app.use('/api', stockOperationsRoutes);
app.use('/api/supplier-orders', supplierOrderRoutes);

// Order
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api/payments/momo', momoRoutes);
app.use('/api/payments/payos', payosRoutes);
app.use('/api/payments/paypal', paypalRoutes);
app.use('/api/payments/vnpay', vnpayRoutes);

// Shipping
app.use('/api/shipping', shippingFeeRoutes);
app.use('/api', shipmentRoutes);
app.use('/api', shippingAddressRoutes);

// Notification
app.use('/api', notificationRoutes);

// Medical
app.use('/api', prescriptionRoutes);

// Statistics
app.use('/api', inventoryStatisticsRoutes);
app.use('/api', businessStatisticsRoutes);

// Dashboard
app.use('/api/admin/dashboard', dashboardRoutes);

// Location
app.use('/api/cities', citiesRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'PBL6 Pharmacy API',
    version: '1.0.0'
  });
});

// =======================
// Error handling
// =======================
app.use(notFound);
app.use(errorHandler);

export default app;
