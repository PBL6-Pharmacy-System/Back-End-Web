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

// GET /api/customers/:customerId/shipping-addresses
router.get('/customers/:customerId/shipping-addresses', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.getCustomerAddresses);

// GET /api/customers/:customerId/shipping-addresses/default
router.get('/customers/:customerId/shipping-addresses/default', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.getDefaultAddress);

// GET /api/shipping-addresses/:id
router.get('/shipping-addresses/:id', authenticateToken, validateId(), shippingAddressController.getAddressById);

// POST /api/customers/:customerId/shipping-addresses
router.post('/customers/:customerId/shipping-addresses', authenticateToken, validateId('customerId'), validateCustomerOwnership, shippingAddressController.createAddress);

// PUT /api/shipping-addresses/:id
router.put('/shipping-addresses/:id', authenticateToken, validateId(), shippingAddressController.updateAddress);

// DELETE /api/shipping-addresses/:id
router.delete('/shipping-addresses/:id', authenticateToken, validateId(), shippingAddressController.deleteAddress);

// PUT /api/shipping-addresses/:id/set-default
router.put('/shipping-addresses/:id/set-default', authenticateToken, validateId(), shippingAddressController.setDefaultAddress);

export default router;
