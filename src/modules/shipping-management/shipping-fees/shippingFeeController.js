/**
 * Shipping Fee Controller
 * Xử lý các request liên quan đến tính phí vận chuyển
 * Tích hợp GraphHopper API cho geocoding và routing
 * 
 * @module modules/shipping-management/shipping-fees/shippingFeeController
 */

import * as shippingFeeService from './shippingFeeService.js';

/**
 * Lấy tất cả shipping zones
 * GET /api/shipping/zones
 */
export const getShippingZones = async (req, res) => {
    try {
        const result = await shippingFeeService.getAllShippingZones();
        res.json(result);
    } catch (error) {
        console.error('Error getting shipping zones:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách vùng vận chuyển' });
    }
};

/**
 * Ước tính phí ship từ địa chỉ giao hàng
 * POST /api/shipping/estimate
 */
export const estimateShipping = async (req, res) => {
    try {
        const { shippingAddressId, orderTotal } = req.body;

        if (!shippingAddressId) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp địa chỉ giao hàng' });
        }

        const result = await shippingFeeService.estimateShippingFromAddress(shippingAddressId, orderTotal || 0);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error estimating shipping:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi ước tính phí vận chuyển' });
    }
};

/**
 * Ước tính phí ship từ tọa độ GPS
 * POST /api/shipping/estimate-by-coordinates
 */
export const estimateShippingByCoordinates = async (req, res) => {
    try {
        const { latitude, longitude, orderTotal } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tọa độ (latitude, longitude)' });
        }

        const result = await shippingFeeService.estimateShippingFromCoordinates(
            Number(latitude), Number(longitude), orderTotal || 0
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error estimating shipping by coordinates:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi ước tính phí vận chuyển' });
    }
};

/**
 * Tìm chi nhánh gần nhất có đủ hàng
 * POST /api/shipping/nearest-branch
 */
export const findNearestBranch = async (req, res) => {
    try {
        const { productId, quantity, latitude, longitude } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp productId và quantity' });
        }

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tọa độ (latitude, longitude)' });
        }

        const result = await shippingFeeService.findNearestBranchWithStock(
            productId, quantity, Number(latitude), Number(longitude)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error finding nearest branch:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi tìm chi nhánh gần nhất' });
    }
};

/**
 * Tính phí ship nhanh (chỉ cần khoảng cách)
 * GET /api/shipping/calculate?distance=10&orderTotal=500000
 */
export const calculateFee = async (req, res) => {
    try {
        const { distance, orderTotal } = req.query;

        if (!distance) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp khoảng cách (distance)' });
        }

        const result = await shippingFeeService.calculateShippingFee(Number(distance), Number(orderTotal) || 0);

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error calculating shipping fee:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi tính phí vận chuyển' });
    }
};

/**
 * Geocode địa chỉ thành tọa độ GPS
 * POST /api/shipping/geocode
 * Body: { address: "123 Nguyễn Huệ, Quận 1, TP.HCM" }
 */
export const geocodeAddress = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vui lòng cung cấp địa chỉ (address)' 
            });
        }

        const result = await shippingFeeService.geocodeShippingAddress(address);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error geocoding address:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi chuyển đổi địa chỉ thành tọa độ' });
    }
};

/**
 * Reverse geocode - Lấy địa chỉ từ tọa độ GPS
 * POST /api/shipping/reverse-geocode
 * Body: { latitude: 10.7731, longitude: 106.7030 }
 */
export const reverseGeocode = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vui lòng cung cấp tọa độ (latitude, longitude)' 
            });
        }

        const result = await shippingFeeService.getAddressFromCoordinates(
            Number(latitude), 
            Number(longitude)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy địa chỉ từ tọa độ' });
    }
};

/**
 * Tính khoảng cách và thời gian di chuyển giữa 2 điểm
 * POST /api/shipping/distance
 * Body: { fromLat, fromLng, toLat, toLng }
 */
export const calculateDistance = async (req, res) => {
    try {
        const { fromLat, fromLng, toLat, toLng } = req.body;

        if (fromLat === undefined || fromLng === undefined || 
            toLat === undefined || toLng === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vui lòng cung cấp đầy đủ tọa độ (fromLat, fromLng, toLat, toLng)' 
            });
        }

        const result = await shippingFeeService.calculateDistanceBetweenPoints(
            Number(fromLat), Number(fromLng),
            Number(toLat), Number(toLng)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error calculating distance:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi tính khoảng cách' });
    }
};

// ===============================================
// ADMIN ENDPOINTS
// ===============================================

export const createZone = async (req, res) => {
    try {
        const { name, minDistance, maxDistance, baseFee, feePerKm, minOrderFree, estimatedDays, isActive } = req.body;

        if (!name || minDistance === undefined || maxDistance === undefined || baseFee === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng cung cấp đầy đủ thông tin: name, minDistance, maxDistance, baseFee'
            });
        }

        const result = await shippingFeeService.createShippingZone({
            name,
            minDistance: Number(minDistance),
            maxDistance: Number(maxDistance),
            baseFee: Number(baseFee),
            feePerKm: feePerKm ? Number(feePerKm) : null,
            minOrderFree: minOrderFree ? Number(minOrderFree) : null,
            estimatedDays: estimatedDays ? Number(estimatedDays) : 1,
            isActive: isActive !== false
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating shipping zone:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi tạo vùng vận chuyển' });
    }
};

export const updateZone = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await shippingFeeService.updateShippingZone(id, req.body);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating shipping zone:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật vùng vận chuyển' });
    }
};

export const deleteZone = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await shippingFeeService.deleteShippingZone(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error deleting shipping zone:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi xóa vùng vận chuyển' });
    }
};

export default {
    getShippingZones,
    estimateShipping,
    estimateShippingByCoordinates,
    findNearestBranch,
    calculateFee,
    geocodeAddress,
    reverseGeocode,
    calculateDistance,
    createZone,
    updateZone,
    deleteZone
};
