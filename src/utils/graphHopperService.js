/**
 * GraphHopper API Service
 * Tích hợp GraphHopper API để tính khoảng cách, geocoding và routing
 * API Docs: https://docs.graphhopper.com/
 * 
 * @module utils/graphHopperService
 */

import axios from 'axios';

// GraphHopper API Configuration
const GRAPHHOPPER_API_KEY = process.env.GRAPHHOPPER_API_KEY || '';
const GRAPHHOPPER_BASE_URL = 'https://graphhopper.com/api/1';

// Cache để lưu kết quả (giảm số lần gọi API)
const geocodeCache = new Map();
const routeCache = new Map();

// Cache expiry time (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Tạo cache key cho geocoding
 */
const createGeocodeKey = (query) => `geo_${query.toLowerCase().trim()}`;

/**
 * Tạo cache key cho routing
 */
const createRouteKey = (lat1, lon1, lat2, lon2) => 
    `route_${lat1}_${lon1}_${lat2}_${lon2}`;

/**
 * Kiểm tra cache có hết hạn chưa
 */
const isCacheValid = (cachedItem) => {
    if (!cachedItem) return false;
    return Date.now() - cachedItem.timestamp < CACHE_TTL;
};

/**
 * Geocoding - Chuyển đổi địa chỉ thành tọa độ GPS
 * 
 * @param {string} address - Địa chỉ cần geocode
 * @param {string} locale - Ngôn ngữ (default: 'vi')
 * @returns {Object|null} {lat, lng, displayName, country, city, street, postcode}
 * 
 * @example
 * const result = await geocodeAddress('123 Nguyễn Huệ, Quận 1, TP.HCM');
 * // => {lat: 10.7731, lng: 106.7030, displayName: '...', ...}
 */
export const geocodeAddress = async (address, locale = 'vi') => {
    if (!address || !GRAPHHOPPER_API_KEY) {
        console.warn('GraphHopper: Missing address or API key');
        return null;
    }

    // Check cache
    const cacheKey = createGeocodeKey(address);
    const cached = geocodeCache.get(cacheKey);
    if (isCacheValid(cached)) {
        return cached.data;
    }

    try {
        const response = await axios.get(`${GRAPHHOPPER_BASE_URL}/geocode`, {
            params: {
                q: address,
                locale: locale,
                limit: 1,
                key: GRAPHHOPPER_API_KEY
            },
            timeout: 10000
        });

        if (response.data.hits && response.data.hits.length > 0) {
            const hit = response.data.hits[0];
            const result = {
                lat: hit.point.lat,
                lng: hit.point.lng,
                displayName: hit.name,
                country: hit.country,
                city: hit.city,
                state: hit.state,
                street: hit.street,
                housenumber: hit.housenumber,
                postcode: hit.postcode,
                osm_id: hit.osm_id,
                osm_type: hit.osm_type
            };

            // Save to cache
            geocodeCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        }

        return null;
    } catch (error) {
        console.error('GraphHopper Geocode Error:', error.message);
        return null;
    }
};

/**
 * Reverse Geocoding - Chuyển đổi tọa độ GPS thành địa chỉ
 * 
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @param {string} locale - Ngôn ngữ (default: 'vi')
 * @returns {Object|null} Thông tin địa chỉ
 */
export const reverseGeocode = async (lat, lng, locale = 'vi') => {
    if (!lat || !lng || !GRAPHHOPPER_API_KEY) {
        return null;
    }

    const cacheKey = createGeocodeKey(`${lat},${lng}`);
    const cached = geocodeCache.get(cacheKey);
    if (isCacheValid(cached)) {
        return cached.data;
    }

    try {
        const response = await axios.get(`${GRAPHHOPPER_BASE_URL}/geocode`, {
            params: {
                point: `${lat},${lng}`,
                reverse: true,
                locale: locale,
                limit: 1,
                key: GRAPHHOPPER_API_KEY
            },
            timeout: 10000
        });

        if (response.data.hits && response.data.hits.length > 0) {
            const hit = response.data.hits[0];
            const result = {
                lat: hit.point.lat,
                lng: hit.point.lng,
                displayName: hit.name,
                country: hit.country,
                city: hit.city,
                state: hit.state,
                street: hit.street,
                housenumber: hit.housenumber,
                postcode: hit.postcode,
                formattedAddress: formatAddress(hit)
            };

            geocodeCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        }

        return null;
    } catch (error) {
        console.error('GraphHopper Reverse Geocode Error:', error.message);
        return null;
    }
};

/**
 * Format địa chỉ từ kết quả geocode
 */
const formatAddress = (hit) => {
    const parts = [];
    if (hit.housenumber) parts.push(hit.housenumber);
    if (hit.street) parts.push(hit.street);
    if (hit.city) parts.push(hit.city);
    if (hit.state) parts.push(hit.state);
    if (hit.country) parts.push(hit.country);
    return parts.join(', ');
};

/**
 * Tính khoảng cách và thời gian di chuyển giữa 2 điểm
 * Sử dụng GraphHopper Routing API
 * 
 * @param {number} fromLat - Vĩ độ điểm xuất phát
 * @param {number} fromLng - Kinh độ điểm xuất phát
 * @param {number} toLat - Vĩ độ điểm đích
 * @param {number} toLng - Kinh độ điểm đích
 * @param {string} vehicle - Phương tiện: 'car', 'bike', 'foot' (default: 'car')
 * @returns {Object|null} {distance, distanceKm, time, timeMinutes, timeText}
 * 
 * @example
 * const result = await calculateRoute(10.762622, 106.660172, 10.823099, 106.629664);
 * // => {distanceKm: 8.5, timeMinutes: 25, timeText: '25 phút', ...}
 */
export const calculateRoute = async (fromLat, fromLng, toLat, toLng, vehicle = 'car') => {
    if (!GRAPHHOPPER_API_KEY) {
        console.warn('GraphHopper: Missing API key, falling back to Haversine');
        return null;
    }

    // Validate coordinates
    if (!isValidCoordinate(fromLat, fromLng) || !isValidCoordinate(toLat, toLng)) {
        return null;
    }

    // Check cache
    const cacheKey = createRouteKey(fromLat, fromLng, toLat, toLng);
    const cached = routeCache.get(cacheKey);
    if (isCacheValid(cached)) {
        return cached.data;
    }

    try {
        const response = await axios.get(`${GRAPHHOPPER_BASE_URL}/route`, {
            params: {
                point: [`${fromLat},${fromLng}`, `${toLat},${toLng}`],
                vehicle: vehicle,
                locale: 'vi',
                calc_points: false, // Không cần polyline để giảm response size
                instructions: false,
                key: GRAPHHOPPER_API_KEY
            },
            timeout: 15000
        });

        if (response.data.paths && response.data.paths.length > 0) {
            const path = response.data.paths[0];
            const distanceKm = Math.round(path.distance / 10) / 100; // Convert m to km, round 2 decimals
            const timeMinutes = Math.round(path.time / 60000); // Convert ms to minutes

            const result = {
                distance: path.distance, // meters
                distanceKm: distanceKm,
                distanceText: formatDistanceText(distanceKm),
                time: path.time, // milliseconds
                timeMinutes: timeMinutes,
                timeText: formatTimeText(timeMinutes),
                vehicle: vehicle
            };

            // Save to cache
            routeCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        }

        return null;
    } catch (error) {
        console.error('GraphHopper Route Error:', error.message);
        return null;
    }
};

/**
 * Tính khoảng cách từ 1 điểm đến nhiều điểm (Matrix API)
 * Hiệu quả hơn khi cần tính nhiều khoảng cách
 * 
 * @param {Object} origin - Điểm xuất phát {lat, lng}
 * @param {Array} destinations - Mảng các điểm đích [{lat, lng, ...otherData}]
 * @param {string} vehicle - Phương tiện (default: 'car')
 * @returns {Array} Mảng destinations với thêm distance và time
 */
export const calculateDistanceMatrix = async (origin, destinations, vehicle = 'car') => {
    if (!GRAPHHOPPER_API_KEY || !destinations || destinations.length === 0) {
        return destinations;
    }

    if (!isValidCoordinate(origin.lat, origin.lng)) {
        return destinations.map(d => ({ ...d, distance: null, time: null }));
    }

    try {
        // GraphHopper Matrix API sử dụng POST
        const fromPoints = [[origin.lng, origin.lat]]; // [lng, lat] format
        const toPoints = destinations
            .filter(d => isValidCoordinate(d.lat, d.lng))
            .map(d => [d.lng, d.lat]);

        if (toPoints.length === 0) {
            return destinations.map(d => ({ ...d, distance: null, time: null }));
        }

        const response = await axios.post(
            `${GRAPHHOPPER_BASE_URL}/matrix`,
            {
                from_points: fromPoints,
                to_points: toPoints,
                vehicle: vehicle,
                out_arrays: ['distances', 'times']
            },
            {
                params: { key: GRAPHHOPPER_API_KEY },
                timeout: 20000
            }
        );

        const { distances, times } = response.data;

        // Map results back to destinations
        let validIndex = 0;
        return destinations.map(dest => {
            if (!isValidCoordinate(dest.lat, dest.lng)) {
                return { ...dest, distanceKm: null, timeMinutes: null };
            }

            const distanceMeters = distances[0][validIndex];
            const timeMs = times[0][validIndex];
            validIndex++;

            const distanceKm = Math.round(distanceMeters / 10) / 100;
            const timeMinutes = Math.round(timeMs / 60000);

            return {
                ...dest,
                distance: distanceMeters,
                distanceKm: distanceKm,
                distanceText: formatDistanceText(distanceKm),
                time: timeMs,
                timeMinutes: timeMinutes,
                timeText: formatTimeText(timeMinutes)
            };
        });
    } catch (error) {
        console.error('GraphHopper Matrix Error:', error.message);
        // Fallback: return destinations without distance
        return destinations.map(d => ({ ...d, distanceKm: null, timeMinutes: null }));
    }
};

/**
 * Tìm điểm gần nhất từ danh sách sử dụng GraphHopper
 * 
 * @param {Object} origin - Điểm xuất phát {lat, lng}
 * @param {Array} destinations - Mảng các điểm đích
 * @param {string} vehicle - Phương tiện (default: 'car')
 * @returns {Object|null} Điểm gần nhất với distance và time
 */
export const findNearestPoint = async (origin, destinations, vehicle = 'car') => {
    const withDistances = await calculateDistanceMatrix(origin, destinations, vehicle);
    
    // Filter out invalid and sort by distance
    const valid = withDistances
        .filter(d => d.distanceKm !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    return valid.length > 0 ? valid[0] : null;
};

/**
 * Kiểm tra tọa độ hợp lệ
 */
const isValidCoordinate = (lat, lng) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
        return false;
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
        return false;
    }
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

/**
 * Format khoảng cách để hiển thị
 */
const formatDistanceText = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return 'N/A';
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
};

/**
 * Format thời gian để hiển thị
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
 * Xóa cache (dùng khi cần refresh data)
 */
export const clearCache = () => {
    geocodeCache.clear();
    routeCache.clear();
};

/**
 * Lấy thông tin về API usage
 */
export const getApiStatus = () => {
    return {
        hasApiKey: !!GRAPHHOPPER_API_KEY,
        geocodeCacheSize: geocodeCache.size,
        routeCacheSize: routeCache.size
    };
};

export default {
    geocodeAddress,
    reverseGeocode,
    calculateRoute,
    calculateDistanceMatrix,
    findNearestPoint,
    clearCache,
    getApiStatus,
    isValidCoordinate: isValidCoordinate
};
