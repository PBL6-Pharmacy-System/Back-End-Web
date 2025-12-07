/**
 * PayOS Routes
 * Routes cho cổng thanh toán PayOS
 */

import express from 'express';
import { validateId } from '../../../../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../../../auth/auth.middleware.js';
import * as payosController from './payosController.js';

const router = express.Router();

/**
 * POST /api/payments/payos/:orderId/create
 * Tạo link thanh toán PayOS cho đơn hàng
 * Access: Authenticated users (customer who owns order, admin, staff)
 */
router.post(
    '/:orderId/create',
    authenticateToken,
    validateId('orderId'),
    payosController.createPaymentUrl
);

/**
 * GET /api/payments/payos/callback
 * Callback URL khi user hoàn thành thanh toán (redirect từ PayOS)
 * Access: Public (PayOS redirect)
 */
router.get('/callback', payosController.handleCallback);

/**
 * GET /api/payments/payos/cancel
 * Cancel URL khi user hủy thanh toán
 * Access: Public (PayOS redirect)
 */
router.get('/cancel', payosController.handleCancel);

/**
 * POST /api/payments/payos/webhook
 * Webhook endpoint cho PayOS server-to-server notification
 * Access: Public (PayOS server)
 */
router.post('/webhook', payosController.handleWebhook);

/**
 * GET /api/payments/payos/status/:orderCode
 * Kiểm tra trạng thái thanh toán
 * Access: Authenticated users
 */
router.get(
    '/status/:orderCode',
    authenticateToken,
    payosController.checkPaymentStatus
);

export default router;
