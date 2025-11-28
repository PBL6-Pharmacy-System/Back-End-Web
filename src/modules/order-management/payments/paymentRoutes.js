import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import * as paymentController from './paymentController.js';
import prisma from '../../../config/db.js';

const router = express.Router();

/**
 * ✅ Middleware to validate payment ownership
 * Admin/Staff: Access all payments
 * Customer: Access only their own payments (via order ownership)
 */
const validatePaymentOwnership = async (req, res, next) => {
  try {
    // Admin và Staff có quyền truy cập tất cả
    if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
      return next();
    }

    // Customer: Kiểm tra payment thuộc về order của họ
    const paymentId = req.params.id;
    const payment = await prisma.payments.findUnique({
      where: { id: Number(paymentId) },
      select: {
        orders: {
          select: { customer_id: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thông tin thanh toán'
      });
    }

    if (payment.orders?.customer_id !== req.user.customer_id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xem thông tin thanh toán này'
      });
    }

    next();
  } catch (error) {
    console.error('Error in validatePaymentOwnership:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi kiểm tra quyền truy cập'
    });
  }
};

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
 * ✅ FIXED: Access: Admin, Staff, or Customer who owns the order
 */
router.get(
  '/payments/:id',
  authenticateToken,
  validateId(),
  validatePaymentOwnership, // ✅ Added ownership validation
  paymentController.getPaymentById
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
