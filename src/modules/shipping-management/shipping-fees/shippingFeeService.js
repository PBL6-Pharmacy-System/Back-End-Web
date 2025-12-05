/**
 * Shipping Fee Service
 * Service tính phí vận chuyển và quản lý shipping zones
 * Tích hợp GraphHopper API để tính khoảng cách chính xác
 * 
 * @module modules/shipping-management/shipping-fees/shippingFeeService
 */

import prisma from '../../../config/db.js';
import {
    calculateRoadDistance,
    calculateRealDistance,
    isValidCoordinate,
    calculateDistancesToMany,
    findNearest,
    formatDistance,
    geocodeAddress,
    reverseGeocode
} from '../../../utils/distanceCalculator.js';

/**
 * Lấy tất cả shipping zones đang active
 */
export const getAllShippingZones = async () => {
    try {
        const zones = await prisma.shipping_zones.findMany({
            where: { is_active: true },
            orderBy: { min_distance: 'asc' }
        });

        return {
            success: true,
            data: zones.map(zone => ({
                ...zone,
                base_fee: Number(zone.base_fee),
                fee_per_km: zone.fee_per_km ? Number(zone.fee_per_km) : null,
                min_order_free: zone.min_order_free ? Number(zone.min_order_free) : null,
                min_distance: Number(zone.min_distance),
                max_distance: Number(zone.max_distance)
            }))
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Tìm shipping zone phù hợp với khoảng cách
 */
export const findShippingZone = async (distance) => {
    try {
        const zone = await prisma.shipping_zones.findFirst({
            where: {
                is_active: true,
                min_distance: { lte: distance },
                max_distance: { gte: distance }
            }
        });

        if (!zone) return null;

        return {
            ...zone,
            base_fee: Number(zone.base_fee),
            fee_per_km: zone.fee_per_km ? Number(zone.fee_per_km) : null,
            min_order_free: zone.min_order_free ? Number(zone.min_order_free) : null
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Tính phí vận chuyển dựa trên khoảng cách và giá trị đơn hàng
 */
export const calculateShippingFee = async (distance, orderTotal = 0) => {
    try {
        const zone = await findShippingZone(distance);

        if (!zone) {
            // Kiểm tra nếu khoảng cách quá xa (> max distance của zone cao nhất)
            const maxZone = await prisma.shipping_zones.findFirst({
                where: { is_active: true },
                orderBy: { max_distance: 'desc' }
            });

            const defaultFee = 50000;
            const estimatedDays = 7;

            // Nếu quá xa, tính phí dựa trên khoảng cách
            let fee = defaultFee;
            if (maxZone && distance > Number(maxZone.max_distance)) {
                const extraKm = distance - Number(maxZone.max_distance);
                fee = defaultFee + (extraKm * 50); // 50đ/km cho vùng không xác định
            }

            return {
                fee: Math.round(fee),
                originalFee: Math.round(fee),
                estimatedDays: estimatedDays,
                zoneName: 'Vùng xa (mặc định)',
                distance: formatDistance(distance),
                distanceKm: distance,
                freeShipping: false,
                message: 'Khu vực chưa được cấu hình, áp dụng phí mặc định'
            };
        }

        const isFreeShipping = zone.min_order_free && orderTotal >= zone.min_order_free;
        let fee = Number(zone.base_fee);

        // FIX: Tính phí theo km cho phần khoảng cách vượt quá min_distance của zone
        // Ví dụ: Zone Ngoại thành (10-30km), base_fee=25000, fee_per_km=500
        // Nếu distance=20km => extraKm = 20-10 = 10km => fee = 25000 + 10*500 = 30000
        if (zone.fee_per_km && distance > Number(zone.min_distance)) {
            const extraKm = distance - Number(zone.min_distance);
            fee += extraKm * Number(zone.fee_per_km);
        }

        fee = Math.round(fee);

        return {
            fee: isFreeShipping ? 0 : fee,
            originalFee: fee,
            estimatedDays: zone.estimated_days,
            zoneName: zone.name,
            zoneId: zone.id,
            distance: formatDistance(distance),
            distanceKm: distance,
            freeShipping: isFreeShipping,
            minOrderFree: zone.min_order_free,
            freeShippingThreshold: zone.min_order_free, // Thêm field rõ ràng hơn
            message: isFreeShipping
                ? `Miễn phí vận chuyển cho đơn từ ${zone.min_order_free.toLocaleString('vi-VN')}đ`
                : zone.min_order_free
                    ? `Miễn phí ship khi đơn hàng từ ${zone.min_order_free.toLocaleString('vi-VN')}đ`
                    : null
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Ước tính phí ship từ địa chỉ giao hàng đến chi nhánh gần nhất
 * Sử dụng GraphHopper API để tính khoảng cách thực tế
 */
export const estimateShippingFromAddress = async (shippingAddressId, orderTotal = 0) => {
    try {
        const shippingAddress = await prisma.shippingaddresses.findUnique({
            where: { id: Number(shippingAddressId) },
            include: { cities: true }
        });

        if (!shippingAddress) {
            return { success: false, error: 'Không tìm thấy địa chỉ giao hàng' };
        }

        let customerLat = shippingAddress.latitude;
        let customerLon = shippingAddress.longitude;

        // Nếu không có tọa độ, thử geocode từ địa chỉ
        if (!isValidCoordinate(customerLat, customerLon)) {
            const fullAddress = [
                shippingAddress.address_line,
                shippingAddress.ward,
                shippingAddress.district,
                shippingAddress.cities?.name || shippingAddress.city,
                'Vietnam'
            ].filter(Boolean).join(', ');

            const geocoded = await geocodeAddress(fullAddress);
            if (geocoded) {
                customerLat = geocoded.lat;
                customerLon = geocoded.lng;
            } else if (shippingAddress.cities) {
                // Fallback về tọa độ thành phố
                customerLat = shippingAddress.cities.latitude;
                customerLon = shippingAddress.cities.longitude;
            }
        }

        if (!isValidCoordinate(customerLat, customerLon)) {
            return {
                success: false,
                error: 'Không thể xác định vị trí địa chỉ giao hàng. Vui lòng cập nhật tọa độ.',
                requiresCoordinates: true
            };
        }

        const branches = await prisma.branches.findMany({
            where: {
                is_active: true,
                latitude: { not: null },
                longitude: { not: null }
            },
            include: { cities: true }
        });

        if (branches.length === 0) {
            return { success: false, error: 'Không có chi nhánh nào được cấu hình tọa độ' };
        }

        // Sử dụng GraphHopper để tính khoảng cách thực tế
        const branchesWithDistance = await calculateDistancesToMany(
            { latitude: Number(customerLat), longitude: Number(customerLon) },
            branches.map(b => ({
                id: b.id,
                name: b.name,
                address: b.address,
                city: b.cities?.name || b.city,
                latitude: Number(b.latitude),
                longitude: Number(b.longitude)
            })),
            true // useGraphHopper
        );

        const nearestBranch = branchesWithDistance[0];

        if (!nearestBranch || nearestBranch.distanceKm === null) {
            return { success: false, error: 'Không thể tính khoảng cách đến chi nhánh' };
        }

        const shippingFee = await calculateShippingFee(nearestBranch.distanceKm, orderTotal);

        return {
            success: true,
            data: {
                shippingAddress: {
                    id: shippingAddress.id,
                    addressLine: shippingAddress.address_line,
                    city: shippingAddress.cities?.name || shippingAddress.city,
                    coordinates: { latitude: Number(customerLat), longitude: Number(customerLon) }
                },
                nearestBranch: {
                    id: nearestBranch.id,
                    name: nearestBranch.name,
                    address: nearestBranch.address,
                    city: nearestBranch.city,
                    distance: nearestBranch.distanceText,
                    estimatedTime: nearestBranch.timeText
                },
                shipping: shippingFee,
                calculationSource: nearestBranch.source, // 'graphhopper' hoặc 'haversine'
                alternativeBranches: branchesWithDistance.slice(1, 4).map(b => ({
                    id: b.id,
                    name: b.name,
                    distance: b.distanceText,
                    estimatedTime: b.timeText
                }))
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Ước tính phí ship từ tọa độ GPS
 * Sử dụng GraphHopper API để tính khoảng cách thực tế
 */
export const estimateShippingFromCoordinates = async (latitude, longitude, orderTotal = 0) => {
    try {
        if (!isValidCoordinate(latitude, longitude)) {
            return { success: false, error: 'Tọa độ không hợp lệ' };
        }

        const branches = await prisma.branches.findMany({
            where: {
                is_active: true,
                latitude: { not: null },
                longitude: { not: null }
            },
            include: { cities: true }
        });

        if (branches.length === 0) {
            return { success: false, error: 'Không có chi nhánh nào được cấu hình tọa độ' };
        }

        // Sử dụng GraphHopper để tính khoảng cách thực tế
        const branchesWithDistance = await calculateDistancesToMany(
            { latitude: Number(latitude), longitude: Number(longitude) },
            branches.map(b => ({
                id: b.id,
                name: b.name,
                address: b.address,
                city: b.cities?.name || b.city,
                latitude: Number(b.latitude),
                longitude: Number(b.longitude)
            })),
            true // useGraphHopper
        );

        const nearestBranch = branchesWithDistance[0];

        if (!nearestBranch || nearestBranch.distanceKm === null) {
            return { success: false, error: 'Không thể tính khoảng cách' };
        }

        const shippingFee = await calculateShippingFee(nearestBranch.distanceKm, orderTotal);

        // Lấy địa chỉ từ tọa độ (reverse geocode)
        const addressInfo = await reverseGeocode(latitude, longitude);

        return {
            success: true,
            data: {
                location: {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    address: addressInfo?.formattedAddress || null,
                    city: addressInfo?.city || null
                },
                nearestBranch: {
                    id: nearestBranch.id,
                    name: nearestBranch.name,
                    address: nearestBranch.address,
                    city: nearestBranch.city,
                    distance: nearestBranch.distanceText,
                    estimatedTime: nearestBranch.timeText
                },
                shipping: shippingFee,
                calculationSource: nearestBranch.source
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Tìm chi nhánh gần nhất có đủ hàng cho sản phẩm
 * Sử dụng GraphHopper API để tính khoảng cách thực tế
 */
export const findNearestBranchWithStock = async (productId, quantity, latitude, longitude) => {
    try {
        if (!isValidCoordinate(latitude, longitude)) {
            return { success: false, error: 'Tọa độ không hợp lệ' };
        }

        const branchesWithStock = await prisma.branchinventory.findMany({
            where: {
                product_id: Number(productId),
                stock: { gte: Number(quantity) },
                branches: {
                    is_active: true,
                    latitude: { not: null },
                    longitude: { not: null }
                }
            },
            include: {
                branches: { include: { cities: true } }
            }
        });

        if (branchesWithStock.length === 0) {
            return { success: false, error: 'Không có chi nhánh nào có đủ hàng' };
        }

        // Sử dụng GraphHopper để tính khoảng cách thực tế
        const branchesWithDistance = await calculateDistancesToMany(
            { latitude: Number(latitude), longitude: Number(longitude) },
            branchesWithStock.map(inv => ({
                id: inv.branches.id,
                name: inv.branches.name,
                address: inv.branches.address,
                city: inv.branches.cities?.name || inv.branches.city,
                latitude: Number(inv.branches.latitude),
                longitude: Number(inv.branches.longitude),
                stock: inv.stock
            })),
            true // useGraphHopper
        );

        return {
            success: true,
            data: {
                branch: {
                    ...branchesWithDistance[0],
                    estimatedTime: branchesWithDistance[0]?.timeText
                },
                alternativeBranches: branchesWithDistance.slice(1, 3).map(b => ({
                    ...b,
                    estimatedTime: b.timeText
                })),
                calculationSource: branchesWithDistance[0]?.source
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Geocode địa chỉ thành tọa độ GPS
 * Sử dụng GraphHopper Geocoding API
 */
export const geocodeShippingAddress = async (address) => {
    try {
        if (!address) {
            return { success: false, error: 'Địa chỉ không được để trống' };
        }

        const result = await geocodeAddress(address);

        if (!result) {
            return {
                success: false,
                error: 'Không thể tìm thấy tọa độ cho địa chỉ này',
                suggestion: 'Vui lòng thử địa chỉ chi tiết hơn hoặc thêm tên thành phố'
            };
        }

        return {
            success: true,
            data: {
                latitude: result.lat,
                longitude: result.lng,
                displayName: result.displayName,
                city: result.city,
                state: result.state,
                country: result.country,
                street: result.street,
                housenumber: result.housenumber,
                postcode: result.postcode
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Reverse geocode - Lấy địa chỉ từ tọa độ GPS
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
        if (!isValidCoordinate(latitude, longitude)) {
            return { success: false, error: 'Tọa độ không hợp lệ' };
        }

        const result = await reverseGeocode(latitude, longitude);

        if (!result) {
            return {
                success: false,
                error: 'Không thể tìm thấy địa chỉ cho tọa độ này'
            };
        }

        return {
            success: true,
            data: {
                formattedAddress: result.formattedAddress,
                displayName: result.displayName,
                city: result.city,
                state: result.state,
                country: result.country,
                street: result.street,
                housenumber: result.housenumber,
                postcode: result.postcode
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Tính khoảng cách và thời gian di chuyển giữa 2 điểm
 */
export const calculateDistanceBetweenPoints = async (fromLat, fromLng, toLat, toLng) => {
    try {
        if (!isValidCoordinate(fromLat, fromLng) || !isValidCoordinate(toLat, toLng)) {
            return { success: false, error: 'Tọa độ không hợp lệ' };
        }

        const result = await calculateRealDistance(fromLat, fromLng, toLat, toLng);

        return {
            success: true,
            data: {
                distanceKm: result.distanceKm,
                distanceText: result.distanceText,
                timeMinutes: result.timeMinutes,
                timeText: result.timeText,
                calculationSource: result.source
            }
        };
    } catch (error) {
        throw error;
    }
};

// ===============================================
// ADMIN FUNCTIONS
// ===============================================

export const createShippingZone = async (data) => {
    try {
        const zone = await prisma.shipping_zones.create({
            data: {
                name: data.name,
                min_distance: data.minDistance,
                max_distance: data.maxDistance,
                base_fee: data.baseFee,
                fee_per_km: data.feePerKm || null,
                min_order_free: data.minOrderFree || null,
                estimated_days: data.estimatedDays || 1,
                is_active: data.isActive !== false
            }
        });
        return { success: true, data: zone };
    } catch (error) {
        throw error;
    }
};

export const updateShippingZone = async (id, data) => {
    try {
        const zone = await prisma.shipping_zones.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                min_distance: data.minDistance,
                max_distance: data.maxDistance,
                base_fee: data.baseFee,
                fee_per_km: data.feePerKm,
                min_order_free: data.minOrderFree,
                estimated_days: data.estimatedDays,
                is_active: data.isActive,
                updated_at: new Date()
            }
        });
        return { success: true, data: zone };
    } catch (error) {
        if (error.code === 'P2025') {
            return { success: false, error: 'Không tìm thấy shipping zone' };
        }
        throw error;
    }
};

export const deleteShippingZone = async (id) => {
    try {
        await prisma.shipping_zones.delete({ where: { id: Number(id) } });
        return { success: true, message: 'Đã xóa shipping zone' };
    } catch (error) {
        if (error.code === 'P2025') {
            return { success: false, error: 'Không tìm thấy shipping zone' };
        }
        throw error;
    }
};

export default {
    getAllShippingZones,
    findShippingZone,
    calculateShippingFee,
    estimateShippingFromAddress,
    estimateShippingFromCoordinates,
    findNearestBranchWithStock,
    geocodeShippingAddress,
    getAddressFromCoordinates,
    calculateDistanceBetweenPoints,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone
};
