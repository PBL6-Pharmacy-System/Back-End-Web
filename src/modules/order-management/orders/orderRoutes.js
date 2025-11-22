import express from 'express';
import * as orderController from './orderController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

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
 * Accessible by: Admin, Staff, or the customer who owns the order
 */
router.get(
  '/orders/:id',
  authenticateToken,
  validateId(),
  orderController.getOrderById
);

/**
 * GET /api/customers/:customerId/orders
 * Get all orders of a specific customer
 * Accessible by: Admin, Staff, or the customer themselves
 */
router.get(
  '/customers/:customerId/orders',
  authenticateToken,
  validateId('customerId'),
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
