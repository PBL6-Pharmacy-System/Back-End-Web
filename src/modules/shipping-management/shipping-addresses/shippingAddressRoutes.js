/**
 * Shipping Address Routes
 * API endpoints quản lý địa chỉ giao hàng
 * 
 * @module modules/shipping-management/shipping-addresses/shippingAddressRoutes
 */

import express from 'express';
import * as shippingAddressController from './shippingAddressController.js';
import { authenticateToken } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import prisma from '../../../config/db.js';

const router = express.Router();

// Middleware kiểm tra ownership cho customer
const validateCustomerOwnership = (req, res, next) => {
    if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
        return next();
    }
    const customerId = parseInt(req.params.customerId);
    if (req.user.customer_id !== customerId) {
        return res.status(403).json({ success: false, error: 'Bạn chỉ có thể truy cập địa chỉ của chính mình' });
    }
    next();
};

/**
 * ✅ Middleware kiểm tra ownership cho shipping address by ID
 * Customer chỉ có thể truy cập địa chỉ của mình
 */
const validateAddressOwnership = async (req, res, next) => {
    try {
        // Admin và Staff có quyền truy cập tất cả
        if (req.user.role_name === 'admin' || req.user.role_name === 'staff') {
            return next();
        }

        const addressId = parseInt(req.params.id);
        const address = await prisma.shipping_addresses.findUnique({
            where: { id: addressId },
            select: { customer_id: true }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy địa chỉ'
            });
        }

        if (address.customer_id !== req.user.customer_id) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể truy cập địa chỉ của chính mình'
            });
        }

        next();
    } catch (error) {
        console.error('Error in validateAddressOwnership:', error);
        return res.status(500).json({
            success: false,
            error: 'Lỗi kiểm tra quyền truy cập'
        });
    }
};

// GET /api/customers/:customerId/shipping-addresses
router.get('/customers/:customerId/shipping-addresses', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.getCustomerAddresses);

// GET /api/customers/:customerId/shipping-addresses/default
router.get('/customers/:customerId/shipping-addresses/default', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.getDefaultAddress);

// GET /api/shipping-addresses/:id - ✅ Fixed: Added ownership validation
router.get('/shipping-addresses/:id', authenticateToken, validateId(), validateAddressOwnership, shippingAddressController.getAddressById);

// POST /api/customers/:customerId/shipping-addresses
router.post('/customers/:customerId/shipping-addresses', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.createAddress);

// PUT /api/shipping-addresses/:id - ✅ Fixed: Added ownership validation
router.put('/shipping-addresses/:id', authenticateToken, validateId(), validateAddressOwnership, shippingAddressController.updateAddress);

// DELETE /api/shipping-addresses/:id - ✅ Fixed: Added ownership validation
router.delete('/shipping-addresses/:id', authenticateToken, validateId(), validateAddressOwnership, shippingAddressController.deleteAddress);

// PUT /api/shipping-addresses/:id/set-default - ✅ Fixed: Added ownership validation
router.put('/shipping-addresses/:id/set-default', authenticateToken, validateId(), validateAddressOwnership, shippingAddressController.setDefaultAddress);

export default router;
