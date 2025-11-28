/**
 * Supplier Order Routes
 * API routes cho quản lý đơn đặt hàng nhà cung cấp
 */

import express from 'express';
import * as supplierOrderService from './supplierOrderService.js';
import { authenticate, authorize } from '../../../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/supplier-orders
 * Get all supplier orders (Admin/Staff)
 */
router.get('/', authorize(['admin', 'staff']), async (req, res, next) => {
    try {
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
router.get('/statistics', authorize(['admin']), async (req, res, next) => {
    try {
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
router.get('/:id', authorize(['admin', 'staff']), async (req, res, next) => {
    try {
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
router.post('/', authorize(['admin', 'staff']), async (req, res, next) => {
    try {
        const result = await supplierOrderService.createSupplierOrder(req.body, req.user.id);
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
router.patch('/:id/status', authorize(['admin', 'staff']), async (req, res, next) => {
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
            req.user.id,
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
router.post('/:id/receive', authorize(['admin', 'staff']), async (req, res, next) => {
    try {
        const { receivedItems } = req.body;
        const result = await supplierOrderService.receiveSupplierOrder(
            req.params.id,
            req.user.id,
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
router.post('/:id/cancel', authorize(['admin', 'staff']), async (req, res, next) => {
    try {
        const { reason } = req.body;
        const result = await supplierOrderService.cancelSupplierOrder(
            req.params.id,
            req.user.id,
            reason
        );
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
