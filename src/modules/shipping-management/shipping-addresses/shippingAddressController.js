/**
 * Shipping Address Controller
 * Controller quản lý địa chỉ giao hàng
 * 
 * @module modules/shipping-management/shipping-addresses/shippingAddressController
 */

import * as shippingAddressService from './shippingAddressService.js';

export const getCustomerAddresses = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        const result = await shippingAddressService.getCustomerAddresses(customerId);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getDefaultAddress = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        const result = await shippingAddressService.getDefaultAddress(customerId);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getAddressById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await shippingAddressService.getAddressById(id);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }

        // Kiểm tra ownership nếu là customer
        if (req.user.role_name === 'customer') {
            if (result.data.customer_id !== req.user.customer_id) {
                return res.status(403).json({ success: false, error: 'Bạn không có quyền xem địa chỉ này' });
            }
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const createAddress = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        const result = await shippingAddressService.createAddress(customerId, req.body);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Kiểm tra ownership nếu là customer
        if (req.user.role_name === 'customer') {
            const addressResult = await shippingAddressService.getAddressById(id);
            if (addressResult.success && addressResult.data.customer_id !== req.user.customer_id) {
                return res.status(403).json({ success: false, error: 'Bạn không có quyền cập nhật địa chỉ này' });
            }
        }

        const result = await shippingAddressService.updateAddress(id, req.body);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Kiểm tra ownership nếu là customer
        if (req.user.role_name === 'customer') {
            const addressResult = await shippingAddressService.getAddressById(id);
            if (addressResult.success && addressResult.data.customer_id !== req.user.customer_id) {
                return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa địa chỉ này' });
            }
        }

        const result = await shippingAddressService.deleteAddress(id);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const setDefaultAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // ✅ FIX: Lấy customerId từ token thay vì body để tránh lỗ hổng bảo mật
        let customerId;
        
        if (req.user.role_name === 'customer') {
            // Customer chỉ có thể set default cho địa chỉ của mình
            customerId = req.user.customer_id;
        } else {
            // Admin/Staff có thể chỉ định customerId từ body
            customerId = req.body.customerId || req.body.customer_id;
            if (!customerId) {
                return res.status(400).json({ success: false, error: 'Thiếu customer_id' });
            }
        }

        // Kiểm tra địa chỉ có thuộc về customer không
        const addressResult = await shippingAddressService.getAddressById(id);
        if (!addressResult.success) {
            return res.status(addressResult.status || 404).json({ success: false, error: addressResult.error });
        }
        
        if (addressResult.data.customer_id !== Number(customerId)) {
            return res.status(403).json({ success: false, error: 'Địa chỉ không thuộc về khách hàng này' });
        }

        const result = await shippingAddressService.setDefaultAddress(id, customerId);

        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, error: result.error });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};
