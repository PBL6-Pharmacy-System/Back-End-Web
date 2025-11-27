/**
 * Shipment Routes
 * API endpoints quản lý vận chuyển đơn hàng
 * 
 * @module modules/shipping-management/shipments/shipmentRoutes
 */

import express from 'express';
import * as shipmentController from './shipmentController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// POST /api/shipments - Tạo vận chuyển (Admin/Staff)
router.post('/shipments', authenticateToken, authorizeRoles('admin', 'staff'), shipmentController.createShipment);

// GET /api/shipments/statistics - Thống kê vận chuyển (Admin)
router.get('/shipments/statistics', authenticateToken, authorizeAdmin, shipmentController.getShipmentStatistics);

// GET /api/shipments/track/:trackingNumber - Tra cứu vận đơn (Public)
router.get('/shipments/track/:trackingNumber', shipmentController.trackShipment);

// GET /api/shipments - Danh sách vận chuyển (Admin/Staff)
router.get('/shipments', authenticateToken, authorizeRoles('admin', 'staff'), shipmentController.getAllShipments);

// GET /api/shipments/:id - Chi tiết vận chuyển
router.get('/shipments/:id', authenticateToken, validateId(), shipmentController.getShipmentById);

// GET /api/orders/:orderId/shipments - Vận chuyển của đơn hàng
router.get('/orders/:orderId/shipments', authenticateToken, validateId('orderId'), shipmentController.getOrderShipments);

// PUT /api/shipments/:id/status - Cập nhật trạng thái (Admin/Staff)
router.put('/shipments/:id/status', authenticateToken, authorizeRoles('admin', 'staff'), validateId(), shipmentController.updateShipmentStatus);

export default router;
