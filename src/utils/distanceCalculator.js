/**
 * Distance Calculator Utility
 * Sử dụng GraphHopper API (nếu có) hoặc công thức Haversine để tính khoảng cách
 * 
 * @module utils/distanceCalculator
 */

import graphHopperService from './graphHopperService.js';

// Bán kính Trái Đất (km)
const EARTH_RADIUS_KM = 6371;

// Hệ số điều chỉnh đường đi thực tế (đường chim bay * 1.3 ≈ đường đi thực tế)
const ROAD_FACTOR = 1.3;

/**
 * Chuyển đổi độ sang radian
 * @param {number} degrees - Góc tính bằng độ
 * @returns {number} Góc tính bằng radian
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Tính khoảng cách giữa 2 điểm GPS bằng công thức Haversine
 * Công thức này tính khoảng cách đường chim bay trên bề mặt cầu
 * 
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách (km), làm tròn 2 chữ số thập phân
 * 
 * @example
 * // Khoảng cách từ Hà Nội đến Hồ Chí Minh
 * const distance = calculateHaversineDistance(21.0285, 105.8542, 10.8231, 106.6297);
 * // => ~1138 km
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    // Validate inputs
    if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
        return null;
    }

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;

    // Làm tròn 2 chữ số thập phân
    return Math.round(distance * 100) / 100;
};

/**
 * Tính khoảng cách đường đi ước tính (không phải đường chim bay)
 * Nhân với hệ số ROAD_FACTOR để ước tính đường đi thực tế
 * 
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách ước tính (km)
 */
export const calculateRoadDistance = (lat1, lon1, lat2, lon2) => {
    const straightDistance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    if (straightDistance === null) return null;

    return Math.round(straightDistance * ROAD_FACTOR * 100) / 100;
};

/**
 * Tính khoảng cách thực tế sử dụng GraphHopper API
 * Fallback về Haversine nếu API không khả dụng
 * 
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @param {string} vehicle - Phương tiện: 'car', 'bike', 'foot' (default: 'car')
 * @returns {Object} {distanceKm, timeMinutes, timeText, source: 'graphhopper'|'haversine'}
 */
export const calculateRealDistance = async (lat1, lon1, lat2, lon2, vehicle = 'car') => {
    // Thử sử dụng GraphHopper API trước
    const graphHopperResult = await graphHopperService.calculateRoute(lat1, lon1, lat2, lon2, vehicle);
    
    if (graphHopperResult) {
        return {
            distanceKm: graphHopperResult.distanceKm,
            distanceText: graphHopperResult.distanceText,
            timeMinutes: graphHopperResult.timeMinutes,
            timeText: graphHopperResult.timeText,
            source: 'graphhopper'
        };
    }

    // Fallback về Haversine với road factor
    const haversineDistance = calculateRoadDistance(lat1, lon1, lat2, lon2);
    
    // Ước tính thời gian: 40km/h trung bình trong thành phố
    const estimatedTimeMinutes = haversineDistance ? Math.round(haversineDistance / 40 * 60) : null;

    return {
        distanceKm: haversineDistance,
        distanceText: haversineDistance ? `${haversineDistance} km` : 'N/A',
        timeMinutes: estimatedTimeMinutes,
        timeText: estimatedTimeMinutes ? formatTimeText(estimatedTimeMinutes) : 'N/A',
        source: 'haversine'
    };
};

/**
 * Kiểm tra tọa độ GPS có hợp lệ không
 * Latitude: -90 đến 90
 * Longitude: -180 đến 180
 * 
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {boolean} true nếu hợp lệ
 */
export const isValidCoordinate = (lat, lon) => {
    if (lat === null || lat === undefined || lon === null || lon === undefined) {
        return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
        return false;
    }

    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

/**
 * Tính khoảng cách từ 1 điểm đến nhiều điểm khác
 * Ưu tiên sử dụng GraphHopper Matrix API, fallback về Haversine
 * Trả về mảng đã sắp xếp theo khoảng cách tăng dần
 * 
 * @param {Object} origin - Điểm gốc {latitude, longitude}
 * @param {Array} destinations - Mảng các điểm đích [{id, latitude, longitude, ...}]
 * @param {boolean} useGraphHopper - Có sử dụng GraphHopper không (default: true)
 * @returns {Array} Mảng destinations đã thêm distance và sắp xếp
 */
export const calculateDistancesToMany = async (origin, destinations, useGraphHopper = true) => {
    if (!isValidCoordinate(origin.latitude, origin.longitude)) {
        return destinations.map(dest => ({ ...dest, distanceKm: null, timeMinutes: null }));
    }

    // Thử sử dụng GraphHopper Matrix API
    if (useGraphHopper) {
        const graphHopperResult = await graphHopperService.calculateDistanceMatrix(
            { lat: origin.latitude, lng: origin.longitude },
            destinations.map(d => ({ 
                ...d, 
                lat: Number(d.latitude), 
                lng: Number(d.longitude) 
            }))
        );

        // Kiểm tra xem có kết quả từ GraphHopper không
        const hasGraphHopperData = graphHopperResult.some(d => d.distanceKm !== null);
        
        if (hasGraphHopperData) {
            const withDistances = graphHopperResult.map(dest => ({
                ...dest,
                distance: dest.distanceKm,
                source: 'graphhopper'
            }));

            // Sắp xếp theo khoảng cách tăng dần
            return withDistances.sort((a, b) => {
                if (a.distanceKm === null && b.distanceKm === null) return 0;
                if (a.distanceKm === null) return 1;
                if (b.distanceKm === null) return -1;
                return a.distanceKm - b.distanceKm;
            });
        }
    }

    // Fallback: Sử dụng Haversine
    const withDistances = destinations.map(dest => {
        const distance = calculateRoadDistance(
            Number(origin.latitude),
            Number(origin.longitude),
            Number(dest.latitude),
            Number(dest.longitude)
        );

        // Ước tính thời gian: 40km/h trung bình
        const timeMinutes = distance ? Math.round(distance / 40 * 60) : null;

        return {
            ...dest,
            distance,
            distanceKm: distance,
            distanceText: distance !== null ? `${distance} km` : 'N/A',
            timeMinutes,
            timeText: timeMinutes ? formatTimeText(timeMinutes) : 'N/A',
            source: 'haversine'
        };
    });

    // Sắp xếp theo khoảng cách tăng dần (null xuống cuối)
    return withDistances.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });
};

/**
 * Tìm điểm gần nhất từ danh sách
 * 
 * @param {Object} origin - Điểm gốc {latitude, longitude}
 * @param {Array} destinations - Mảng các điểm đích
 * @param {boolean} useGraphHopper - Có sử dụng GraphHopper không (default: true)
 * @returns {Object|null} Điểm gần nhất hoặc null
 */
export const findNearest = async (origin, destinations, useGraphHopper = true) => {
    const sorted = await calculateDistancesToMany(origin, destinations, useGraphHopper);
    return sorted.length > 0 && sorted[0].distanceKm !== null ? sorted[0] : null;
};

/**
 * Lọc các điểm trong bán kính cho trước
 * 
 * @param {Object} origin - Điểm gốc {latitude, longitude}
 * @param {Array} destinations - Mảng các điểm đích
 * @param {number} radiusKm - Bán kính (km)
 * @param {boolean} useGraphHopper - Có sử dụng GraphHopper không (default: true)
 * @returns {Array} Các điểm trong bán kính
 */
export const filterWithinRadius = async (origin, destinations, radiusKm, useGraphHopper = true) => {
    const withDistances = await calculateDistancesToMany(origin, destinations, useGraphHopper);
    return withDistances.filter(dest => dest.distanceKm !== null && dest.distanceKm <= radiusKm);
};

/**
 * Format khoảng cách để hiển thị
 * 
 * @param {number} distanceKm - Khoảng cách (km)
 * @returns {string} Chuỗi đã format
 */
export const formatDistance = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) {
        return 'N/A';
    }

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }

    return `${distanceKm.toFixed(2)} km`;
};

/**
 * Format thời gian để hiển thị
 * 
 * @param {number} minutes - Thời gian (phút)
 * @returns {string} Chuỗi đã format
 */
const formatTimeText = (minutes) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    if (minutes < 60) {
        return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours} giờ`;
    }
    return `${hours} giờ ${mins} phút`;
};

/**
 * Geocode địa chỉ thành tọa độ GPS
 * Sử dụng GraphHopper Geocoding API
 * 
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Object|null} {lat, lng, displayName, ...}
 */
export const geocodeAddress = async (address) => {
    return graphHopperService.geocodeAddress(address);
};

/**
 * Reverse geocode tọa độ GPS thành địa chỉ
 * 
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {Object|null} Thông tin địa chỉ
 */
export const reverseGeocode = async (lat, lng) => {
    return graphHopperService.reverseGeocode(lat, lng);
};

export default {
    calculateHaversineDistance,
    calculateRoadDistance,
    calculateRealDistance,
    isValidCoordinate,
    calculateDistancesToMany,
    findNearest,
    filterWithinRadius,
    formatDistance,
    geocodeAddress,
    reverseGeocode,
    EARTH_RADIUS_KM,
    ROAD_FACTOR
};
