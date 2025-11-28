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

        // ✅ FIX: Validate input
        const distanceNum = Number(distance);
        if (isNaN(distanceNum) || distanceNum < 0 || distanceNum > 10000) {
            return res.status(400).json({ success: false, error: 'Khoảng cách không hợp lệ (0-10000 km)' });
        }

        const orderTotalNum = Number(orderTotal) || 0;
        if (orderTotalNum < 0) {
            return res.status(400).json({ success: false, error: 'Giá trị đơn hàng không hợp lệ' });
        }

        const result = await shippingFeeService.calculateShippingFee(distanceNum, orderTotalNum);

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

        // ✅ FIX: Validate & sanitize address input
        const sanitizedAddress = String(address).trim();
        if (sanitizedAddress.length < 5 || sanitizedAddress.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Địa chỉ phải từ 5-500 ký tự'
            });
        }

        const result = await shippingFeeService.geocodeShippingAddress(sanitizedAddress);

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

        // ✅ FIX: Validate coordinates
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                error: 'Tọa độ phải là số'
            });
        }

        // Vietnam bounding box approximately: 8.2-23.4 lat, 102.1-109.5 lng
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                error: 'Tọa độ không hợp lệ'
            });
        }

        const result = await shippingFeeService.getAddressFromCoordinates(lat, lng);

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

        // ✅ FIX: Validate all coordinates
        const coords = [
            { name: 'fromLat', value: Number(fromLat) },
            { name: 'fromLng', value: Number(fromLng) },
            { name: 'toLat', value: Number(toLat) },
            { name: 'toLng', value: Number(toLng) }
        ];

        for (const coord of coords) {
            if (isNaN(coord.value)) {
                return res.status(400).json({
                    success: false,
                    error: `${coord.name} phải là số`
                });
            }
        }

        const fLat = coords[0].value;
        const fLng = coords[1].value;
        const tLat = coords[2].value;
        const tLng = coords[3].value;

        if (fLat < -90 || fLat > 90 || tLat < -90 || tLat > 90 ||
            fLng < -180 || fLng > 180 || tLng < -180 || tLng > 180) {
            return res.status(400).json({
                success: false,
                error: 'Tọa độ không hợp lệ'
            });
        }

        const result = await shippingFeeService.calculateDistanceBetweenPoints(fLat, fLng, tLat, tLng);

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
