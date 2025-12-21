/**
 * Supplier Order Routes
 * API routes cho quản lý đơn đặt hàng nhà cung cấp
 */

import express from 'express';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import * as supplierOrderService from './supplierOrderService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/supplier-orders
 * Get all supplier orders (Admin/Staff)
 */
router.get('/supplier-orders', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        console.log('🔵 [Route /supplier-orders] Called - Query params:', req.query);
        const result = await supplierOrderService.getAllSupplierOrders(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/supplier-orders/statistics
 * Get supplier order statistics (Admin)
 */
router.get('/supplier-orders/statistics', authorizeRoles('admin'), async (req, res, next) => {
    try {
        console.log('📊 [Route /supplier-orders/statistics] Called');
        const result = await supplierOrderService.getSupplierOrderStatistics(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/supplier-orders/:id
 * Get supplier order by ID (Admin/Staff)
 */
router.get('/supplier-orders/:id', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        console.log('🔍 [Route /supplier-orders/:id] Called - ID:', req.params.id, 'Type:', typeof req.params.id);
        const result = await supplierOrderService.getSupplierOrderById(req.params.id);
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/supplier-orders
 * Create new supplier order (Admin/Staff)
 */
router.post('/supplier-orders', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        const result = await supplierOrderService.createSupplierOrder(req.body, req.user.userId);
        res.status(result.success ? 201 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/supplier-orders/:id/status
 * Update supplier order status (Admin/Staff)
 * Body: { status: 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled', receivedItems?: [...] }
 */
router.patch('/supplier-orders/:id/status', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        const { status, receivedItems } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu trạng thái mới'
            });
        }

        const result = await supplierOrderService.updateSupplierOrderStatus(
            req.params.id,
            status,
            req.user.userId,
            receivedItems
        );
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/supplier-orders/:id/receive
 * Receive supplier order and auto-import to inventory (Admin/Staff)
 * Body: { receivedItems?: [{ product_id, received_qty }] }
 */
router.post('/supplier-orders/:id/receive', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        const { receivedItems } = req.body;
        const result = await supplierOrderService.receiveSupplierOrder(
            req.params.id,
            req.user.userId,
            receivedItems
        );
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/supplier-orders/:id/cancel
 * Cancel supplier order (Admin/Staff)
 * Body: { reason?: string }
 */
router.post('/supplier-orders/:id/cancel', authorizeRoles('admin', 'staff'), async (req, res, next) => {
    try {
        const { reason } = req.body;
        const result = await supplierOrderService.cancelSupplierOrder(
            req.params.id,
            req.user.userId,
            reason
        );
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
