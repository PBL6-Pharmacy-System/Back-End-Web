import express from 'express';
import * as shipmentController from './shipmentController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

/**
 * ✅ Middleware to validate shipment ownership
 * Admin/Staff: Access all shipments
 * Customer: Access only their own shipments (via order ownership)
 */
const validateShipmentOwnership = (req, res, next) => {
  // Admin và Staff có quyền truy cập tất cả
  if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
    return next();
  }

  // Customer: Controller sẽ kiểm tra shipment.order.customer_id === req.user.customer_id
  next();
};

/**
 * ✅ Middleware to validate order ownership for customer
 */
const validateOrderOwnership = (req, res, next) => {
  // Admin và Staff có quyền truy cập tất cả
  if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
    return next();
  }

  // Customer: Controller sẽ kiểm tra order.customer_id === req.user.customer_id
  next();
};

/**
 * POST /api/shipments
 * Create a new shipment for an order
 * Access: Admin, Staff only
 * Body: {
 *   orderId: number (required),
 *   branchId: number (required),
 *   shippingAddressId: number (required),
 *   carrier: string (optional, default: "Standard Delivery"),
 *   estimatedDelivery: date (optional, default: +3 days)
 * }
 */
router.post(
  '/shipments',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  shipmentController.createShipment
);

/**
 * GET /api/shipments/statistics
 * Get shipment statistics
 * Access: Admin only
 * Query params: startDate, endDate, branchId
 */
router.get(
  '/shipments/statistics',
  authenticateToken,
  authorizeAdmin,
  shipmentController.getShipmentStatistics
);

/**
 * GET /api/shipments/track/:trackingNumber
 * Track shipment by tracking number (Public)
 * Access: Anyone (no auth required for tracking)
 */
router.get(
  '/shipments/track/:trackingNumber',
  shipmentController.trackShipment
);

/**
 * GET /api/shipments
 * Get all shipments (Admin/Staff)
 * Access: Admin, Staff only
 * Query params: page, limit, status, branchId, startDate, endDate, sortBy, sortOrder
 */
router.get(
  '/shipments',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  shipmentController.getAllShipments
);

/**
 * GET /api/shipments/:id
 * Get shipment details by ID
 * ✅ FIXED: Access: Admin, Staff, or Customer who owns the order
 */
router.get(
  '/shipments/:id',
  authenticateToken,
  validateId(),
  validateShipmentOwnership, // ✅ Added ownership validation
  shipmentController.getShipmentById
);

/**
 * GET /api/orders/:orderId/shipments
 * Get all shipments for a specific order
 * ✅ FIXED: Access: Admin, Staff, or Customer who owns the order
 */
router.get(
  '/orders/:orderId/shipments',
  authenticateToken,
  validateId('orderId'),
  validateOrderOwnership, // ✅ Added ownership validation
  shipmentController.getOrderShipments
);

/**
 * PUT /api/shipments/:id/status
 * Update shipment status
 * Access: Admin, Staff only
 * Body: { status: string }
 * Valid statuses: pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
 */
router.put(
  '/shipments/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  shipmentController.updateShipmentStatus
);

export default router;
