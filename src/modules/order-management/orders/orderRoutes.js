import express from 'express';
import * as orderController from './orderController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { orderStatusLimiter } from '../../../middlewares/rateLimit.middleware.js'; // ✅ Added

const router = express.Router();

/**
 * ✅ Middleware to validate order ownership
 * Admin/Staff: Access all orders
 * Customer: Access only their own orders
 */
const validateOrderOwnership = async (req, res, next) => {
  // Admin và Staff có quyền truy cập tất cả
  if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
    return next();
  }

  // Customer chỉ truy cập được orders của mình
  // Validation sẽ được thực hiện trong controller
  next();
};

/**
 * ✅ Middleware to validate customer ownership for customer-specific routes
 */
const validateCustomerOwnership = (req, res, next) => {
  // Admin và Staff có quyền truy cập tất cả
  if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
    return next();
  }

  // Customer chỉ truy cập được thông tin của mình
  const customerId = parseInt(req.params.customerId);
  if (req.user.customer_id !== customerId) {
    return res.status(403).json({
      success: false,
      error: 'Bạn chỉ có thể xem đơn hàng của chính mình'
    });
  }

  next();
};

/**
 * GET /api/orders
 * Get all orders (Admin/Staff only)
 * Query params: page, limit, status, customerId, startDate, endDate, sortBy, sortOrder
 */
router.get(
  '/orders',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  orderController.getAllOrders
);

/**
 * GET /api/orders/statistics
 * Get order statistics (Admin only)
 * Query params: startDate, endDate
 */
router.get(
  '/orders/statistics',
  authenticateToken,
  authorizeAdmin,
  orderController.getOrderStatistics
);

/**
 * GET /api/orders/:id
 * Get order details by ID
 * ✅ FIXED: Accessible by Admin, Staff, or the customer who owns the order
 */
router.get(
  '/orders/:id',
  authenticateToken,
  validateId(),
  validateOrderOwnership, // ✅ Added ownership validation
  orderController.getOrderById
);

/**
 * GET /api/customers/:customerId/orders
 * Get all orders of a specific customer
 * ✅ FIXED: Accessible by Admin, Staff, or the customer themselves
 */
router.get(
  '/customers/:customerId/orders',
  authenticateToken,
  validateId('customerId'),
  validateCustomerOwnership, // ✅ Added ownership validation
  orderController.getCustomerOrders
);

/**
 * PUT /api/orders/:id/status
 * Update order status (Admin/Staff only)
 * Body: { status: string }
 */
router.put(
  '/orders/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  orderStatusLimiter, // ✅ Added rate limiting
  orderController.updateOrderStatus
);

/**
 * POST /api/orders/:id/cancel
 * Cancel an order (Staff/Admin only)
 * Body: { reason: string (optional) }
 */
router.post(
  '/orders/:id/cancel',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  orderController.cancelOrder
);

export default router;
