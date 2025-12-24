/**
 * Shipment Routes
 * API endpoints quản lý vận chuyển đơn hàng
 * 
 * @module modules/shipping-management/shipments/shipmentRoutes
 */

import express from 'express';
import * as shipmentController from './shipmentController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import prisma from '../../../config/db.js';

const router = express.Router();

/**
 * ✅ Middleware kiểm tra ownership cho shipment
 * Customer chỉ có thể xem shipment của đơn hàng của mình
 */
const validateShipmentOwnership = async (req, res, next) => {
    try {
        // Admin và Staff có quyền truy cập tất cả
        const userRole = req.user.role_name?.toLowerCase();
        if (userRole === 'admin' || userRole === 'staff') {
            return next();
        }

        const shipmentId = parseInt(req.params.id);
        const shipment = await prisma.shipments.findUnique({
            where: { id: shipmentId },
            select: {
                orders: {
                    select: { customer_id: true }
                }
            }
        });

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy thông tin vận chuyển'
            });
        }

        if (shipment.orders?.customer_id !== req.user.customer_id) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền xem thông tin vận chuyển này'
            });
        }

        next();
    } catch (error) {
        console.error('Error in validateShipmentOwnership:', error);
        return res.status(500).json({
            success: false,
            error: 'Lỗi kiểm tra quyền truy cập'
        });
    }
};

/**
 * ✅ Middleware kiểm tra ownership cho order shipments
 */
const validateOrderShipmentOwnership = async (req, res, next) => {
    try {
        // Admin và Staff có quyền truy cập tất cả
        const userRole = req.user.role_name?.toLowerCase();
        if (userRole === 'admin' || userRole === 'staff') {
            return next();
        }

        const orderId = parseInt(req.params.orderId);
        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            select: { customer_id: true }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đơn hàng'
            });
        }

        if (order.customer_id !== req.user.customer_id) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền xem thông tin vận chuyển của đơn hàng này'
            });
        }

        next();
    } catch (error) {
        console.error('Error in validateOrderShipmentOwnership:', error);
        return res.status(500).json({
            success: false,
            error: 'Lỗi kiểm tra quyền truy cập'
        });
    }
};

// POST /api/shipments - Tạo vận chuyển (Admin/Staff)
router.post('/shipments', authenticateToken, authorizeRoles('admin', 'staff'), shipmentController.createShipment);

// GET /api/shipments/statistics - Thống kê vận chuyển (Admin)
router.get('/shipments/statistics', authenticateToken, authorizeRoles('admin', 'staff'), shipmentController.getShipmentStatistics);

// GET /api/shipments/track/:trackingNumber - Tra cứu vận đơn (Public)
router.get('/shipments/track/:trackingNumber', shipmentController.trackShipment);

// GET /api/shipments - Danh sách vận chuyển (Admin/Staff)
router.get('/shipments', authenticateToken, authorizeRoles('admin', 'staff'), shipmentController.getAllShipments);

// GET /api/shipments/:id - Chi tiết vận chuyển - ✅ Fixed: Added ownership validation
router.get('/shipments/:id', authenticateToken, validateId(), validateShipmentOwnership, shipmentController.getShipmentById);

// GET /api/orders/:orderId/shipments - Vận chuyển của đơn hàng - ✅ Fixed: Added ownership validation
router.get('/orders/:orderId/shipments', authenticateToken, validateId('orderId'), validateOrderShipmentOwnership, shipmentController.getOrderShipments);

// PUT /api/shipments/:id/status - Cập nhật trạng thái (Admin/Staff)
router.put('/shipments/:id/status', authenticateToken, authorizeRoles('admin', 'staff'), validateId(), shipmentController.updateShipmentStatus);

export default router;
