import express from 'express';
import * as paymentController from './paymentController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

/**
 * POST /api/payments
 * Create a new payment for an order
 * Access: Admin, Staff, or Customer who owns the order
 * Body: {
 *   orderId: number,
 *   paymentMethod: string,
 *   amount: number,
 *   transactionId: string (optional)
 * }
 */
router.post(
  '/payments',
  authenticateToken,
  paymentController.createPayment
);

/**
 * GET /api/payments/statistics
 * Get payment statistics
 * Access: Admin only
 * Query params: startDate, endDate, paymentMethod
 */
router.get(
  '/payments/statistics',
  authenticateToken,
  authorizeAdmin,
  paymentController.getPaymentStatistics
);

/**
 * GET /api/payments/:id
 * Get payment details by ID
 * Access: Admin, Staff, or Customer who owns the order
 */
router.get(
  '/payments/:id',
  authenticateToken,
  validateId(),
  paymentController.getPaymentById
);

/**
 * GET /api/orders/:orderId/payments
 * Get all payments for a specific order
 * Access: Admin, Staff, or Customer who owns the order
 */
router.get(
  '/orders/:orderId/payments',
  authenticateToken,
  validateId('orderId'),
  paymentController.getOrderPayments
);

/**
 * PUT /api/payments/:id/status
 * Update payment status
 * Access: Admin, Staff only
 * Body: { status: string }
 */
router.put(
  '/payments/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  paymentController.updatePaymentStatus
);

/**
 * POST /api/payments/:id/process-cod
 * Process COD payment (confirm after delivery)
 * Access: Admin, Staff only
 */
router.post(
  '/payments/:id/process-cod',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  paymentController.processCODPayment
);

export default router;
