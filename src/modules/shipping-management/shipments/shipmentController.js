/**
 * Shipment Controller
 * Controller quản lý vận chuyển đơn hàng
 * 
 * @module modules/shipping-management/shipments/shipmentController
 */

import * as shipmentService from './shipmentService.js';
import prisma from '../../../config/db.js';

export const createShipment = async (req, res, next) => {
    try {
        const result = await shipmentService.createShipment(req.body);
        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getShipmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await shipmentService.getShipmentById(id);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }

        // Kiểm tra ownership nếu là customer
        if (req.user.role_name === 'customer') {
            if (!result.data.orders || result.data.orders.customer_id !== req.user.customer_id) {
                return res.status(403).json({ success: false, error: 'Bạn không có quyền xem thông tin vận chuyển này' });
            }
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getAllShipments = async (req, res, next) => {
    try {
        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
            branchId: req.query.branchId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const result = await shipmentService.getAllShipments(filters);
        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getOrderShipments = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        
        // ✅ FIX: Kiểm tra ownership nếu là customer
        if (req.user.role_name === 'customer') {
            const order = await prisma.orders.findUnique({
                where: { id: Number(orderId) },
                select: { customer_id: true }
            });
            
            if (!order) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
            }
            
            if (order.customer_id !== req.user.customer_id) {
                return res.status(403).json({ success: false, error: 'Bạn không có quyền xem thông tin vận chuyển của đơn hàng này' });
            }
        }
        
        const result = await shipmentService.getOrderShipments(orderId);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const trackShipment = async (req, res, next) => {
    try {
        const { trackingNumber } = req.params;
        const result = await shipmentService.trackShipment(trackingNumber);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateShipmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.userId;

        if (!status) {
            return res.status(400).json({ success: false, error: 'Trạng thái vận chuyển là bắt buộc' });
        }

        const result = await shipmentService.updateShipmentStatus(id, status, userId);
        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getShipmentStatistics = async (req, res, next) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            branchId: req.query.branchId
        };

        const result = await shipmentService.getShipmentStatistics(filters);
        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};
