/**
 * Shipping Address Service
 * Service quản lý địa chỉ giao hàng
 * 
 * @module modules/shipping-management/shipping-addresses/shippingAddressService
 */

import prisma from '../../../config/db.js';
import { geocodeAddress } from '../../../utils/distanceCalculator.js';

/**
 * Tự động geocode địa chỉ để lấy tọa độ GPS
 */
const autoGeocodeAddress = async (addressData) => {
    const { address_line, ward, district, city } = addressData;

    // Tạo địa chỉ đầy đủ để geocode
    const fullAddress = [
        address_line,
        ward,
        district,
        city,
        'Vietnam'
    ].filter(Boolean).join(', ');

    if (!fullAddress || fullAddress === 'Vietnam') {
        return { latitude: null, longitude: null };
    }

    try {
        const geocoded = await geocodeAddress(fullAddress);
        if (geocoded) {
            return {
                latitude: geocoded.lat,
                longitude: geocoded.lng
            };
        }
    } catch (error) {
        console.warn('Auto geocode failed:', error.message);
    }

    return { latitude: null, longitude: null };
};

export const getCustomerAddresses = async (customerId) => {
    try {
        const customer = await prisma.customers.findUnique({ where: { id: Number(customerId) } });
        if (!customer) {
            return { success: false, status: 404, error: 'Không tìm thấy khách hàng' };
        }

        const addresses = await prisma.shippingaddresses.findMany({
            where: { customer_id: Number(customerId) },
            include: { cities: true },
            orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }]
        });

        return { success: true, data: addresses };
    } catch (error) {
        throw error;
    }
};

export const getAddressById = async (addressId) => {
    try {
        const address = await prisma.shippingaddresses.findUnique({
            where: { id: Number(addressId) },
            include: {
                customers: { select: { id: true } },
                cities: true
            }
        });

        if (!address) {
            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ' };
        }

        return { success: true, data: address };
    } catch (error) {
        throw error;
    }
};

export const createAddress = async (customerId, addressData) => {
    try {
        const {
            recipient_name, recipient_phone, address_line, ward, district, city,
            state, postal_code, country = 'Vietnam', is_default = false,
            latitude, longitude, city_id
        } = addressData;

        // Validation cơ bản
        if (!address_line) {
            return { success: false, status: 400, error: 'Địa chỉ (address_line) là bắt buộc' };
        }

        if (!recipient_name || !recipient_phone) {
            return { success: false, status: 400, error: 'Tên và số điện thoại người nhận là bắt buộc' };
        }

        // Validate số điện thoại (Việt Nam)
        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
        if (!phoneRegex.test(recipient_phone.replace(/\s/g, ''))) {
            return { success: false, status: 400, error: 'Số điện thoại không hợp lệ' };
        }

        const customer = await prisma.customers.findUnique({ where: { id: Number(customerId) } });
        if (!customer) {
            return { success: false, status: 404, error: 'Không tìm thấy khách hàng' };
        }

        // Nếu set default, unset các địa chỉ default khác
        if (is_default) {
            await prisma.shippingaddresses.updateMany({
                where: { customer_id: Number(customerId), is_default: true },
                data: { is_default: false }
            });
        }

        const existingAddresses = await prisma.shippingaddresses.count({
            where: { customer_id: Number(customerId) }
        });

        const shouldBeDefault = existingAddresses === 0 || is_default;

        // Auto geocode nếu không có tọa độ
        let finalLatitude = latitude;
        let finalLongitude = longitude;

        if (!latitude || !longitude) {
            const geocoded = await autoGeocodeAddress({
                address_line, ward, district, city
            });
            finalLatitude = geocoded.latitude;
            finalLongitude = geocoded.longitude;
        }

        const address = await prisma.shippingaddresses.create({
            data: {
                customer_id: Number(customerId),
                recipient_name,
                recipient_phone,
                address_line,
                ward,      // NEW
                district,  // NEW
                city,
                city_id: city_id ? Number(city_id) : null,
                state,
                postal_code,
                country,
                is_default: shouldBeDefault,
                latitude: finalLatitude,
                longitude: finalLongitude,
                created_at: new Date(),
                updated_at: new Date()
            },
            include: { cities: true }
        });

        return {
            success: true,
            data: address,
            message: 'Thêm địa chỉ giao hàng thành công',
            geocoded: !!(finalLatitude && finalLongitude)
        };
    } catch (error) {
        throw error;
    }
};

export const updateAddress = async (addressId, addressData) => {
    try {
        const {
            recipient_name, recipient_phone, address_line, ward, district, city,
            state, postal_code, country, is_default, latitude, longitude, city_id
        } = addressData;

        const currentAddress = await prisma.shippingaddresses.findUnique({
            where: { id: Number(addressId) }
        });

        if (!currentAddress) {
            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ' };
        }

        // Validate số điện thoại nếu có cập nhật
        if (recipient_phone) {
            const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
            if (!phoneRegex.test(recipient_phone.replace(/\s/g, ''))) {
                return { success: false, status: 400, error: 'Số điện thoại không hợp lệ' };
            }
        }

        if (is_default === true) {
            await prisma.shippingaddresses.updateMany({
                where: {
                    customer_id: currentAddress.customer_id,
                    is_default: true,
                    id: { not: Number(addressId) }
                },
                data: { is_default: false }
            });
        }

        // Kiểm tra xem địa chỉ có thay đổi không để quyết định có geocode lại không
        const addressChanged = (
            (address_line && address_line !== currentAddress.address_line) ||
            (ward && ward !== currentAddress.ward) ||
            (district && district !== currentAddress.district) ||
            (city && city !== currentAddress.city)
        );

        let finalLatitude = latitude;
        let finalLongitude = longitude;

        // Auto geocode lại nếu địa chỉ thay đổi và không có tọa độ mới
        if (addressChanged && !latitude && !longitude) {
            const geocoded = await autoGeocodeAddress({
                address_line: address_line || currentAddress.address_line,
                ward: ward || currentAddress.ward,
                district: district || currentAddress.district,
                city: city || currentAddress.city
            });
            finalLatitude = geocoded.latitude;
            finalLongitude = geocoded.longitude;
        }

        const updatedAddress = await prisma.shippingaddresses.update({
            where: { id: Number(addressId) },
            data: {
                ...(recipient_name && { recipient_name }),
                ...(recipient_phone && { recipient_phone }),
                ...(address_line && { address_line }),
                ...(ward !== undefined && { ward }),
                ...(district !== undefined && { district }),
                ...(city && { city }),
                ...(city_id !== undefined && { city_id: city_id ? Number(city_id) : null }),
                ...(state !== undefined && { state }),
                ...(postal_code !== undefined && { postal_code }),
                ...(country && { country }),
                ...(is_default !== undefined && { is_default }),
                ...(finalLatitude !== undefined && { latitude: finalLatitude }),
                ...(finalLongitude !== undefined && { longitude: finalLongitude }),
                updated_at: new Date()
            },
            include: { cities: true }
        });

        return {
            success: true,
            data: updatedAddress,
            message: 'Cập nhật địa chỉ giao hàng thành công',
            geocoded: addressChanged && !!(finalLatitude && finalLongitude)
        };
    } catch (error) {
        throw error;
    }
};

/**
 * ✅ FIX ISSUE #11: Thêm kiểm tra shipments khi xóa địa chỉ
 */
export const deleteAddress = async (addressId) => {
    try {
        const address = await prisma.shippingaddresses.findUnique({
            where: { id: Number(addressId) }
        });

        if (!address) {
            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ' };
        }

        // Kiểm tra xem địa chỉ có đang được sử dụng trong đơn hàng đang xử lý không
        const ordersUsingAddress = await prisma.orders.count({
            where: {
                shipping_address_id: Number(addressId),
                status: { notIn: ['delivered', 'cancelled', 'completed', 'returned'] }
            }
        });

        if (ordersUsingAddress > 0) {
            return {
                success: false,
                status: 400,
                error: 'Không thể xóa địa chỉ đang được sử dụng trong đơn hàng chưa hoàn thành',
                activeOrders: ordersUsingAddress
            };
        }

        // ✅ FIX ISSUE #11: Kiểm tra shipments cũng reference tới shipping_address_id
        const shipmentsUsingAddress = await prisma.shipments.count({
            where: {
                shipping_address_id: Number(addressId),
                status: { notIn: ['delivered', 'failed', 'returned'] }
            }
        });

        if (shipmentsUsingAddress > 0) {
            return {
                success: false,
                status: 400,
                error: 'Không thể xóa địa chỉ đang được sử dụng trong vận chuyển chưa hoàn thành',
                activeShipments: shipmentsUsingAddress
            };
        }

        const customerId = address.customer_id;
        const wasDefault = address.is_default;

        await prisma.shippingaddresses.delete({ where: { id: Number(addressId) } });

        // Nếu xóa địa chỉ default, set địa chỉ mới nhất làm default
        if (wasDefault) {
            const nextAddress = await prisma.shippingaddresses.findFirst({
                where: { customer_id: customerId },
                orderBy: { created_at: 'desc' }
            });

            if (nextAddress) {
                await prisma.shippingaddresses.update({
                    where: { id: nextAddress.id },
                    data: { is_default: true }
                });
            }
        }

        return { success: true, message: 'Xóa địa chỉ giao hàng thành công' };
    } catch (error) {
        throw error;
    }
};

export const setDefaultAddress = async (addressId, customerId) => {
    try {
        const address = await prisma.shippingaddresses.findUnique({
            where: { id: Number(addressId) }
        });

        if (!address) {
            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ' };
        }

        if (address.customer_id !== Number(customerId)) {
            return { success: false, status: 403, error: 'Địa chỉ không thuộc về khách hàng này' };
        }

        if (address.is_default) {
            return { success: true, data: address, message: 'Địa chỉ đã là địa chỉ mặc định' };
        }

        const [_, updatedAddress] = await prisma.$transaction([
            prisma.shippingaddresses.updateMany({
                where: { customer_id: Number(customerId), is_default: true },
                data: { is_default: false }
            }),
            prisma.shippingaddresses.update({
                where: { id: Number(addressId) },
                data: { is_default: true, updated_at: new Date() },
                include: { cities: true }
            })
        ]);

        return { success: true, data: updatedAddress, message: 'Đã đặt làm địa chỉ mặc định' };
    } catch (error) {
        throw error;
    }
};

export const getDefaultAddress = async (customerId) => {
    try {
        const address = await prisma.shippingaddresses.findFirst({
            where: { customer_id: Number(customerId), is_default: true },
            include: { cities: true }
        });

        if (!address) {
            // Fallback: lấy địa chỉ mới nhất nếu không có default
            const latestAddress = await prisma.shippingaddresses.findFirst({
                where: { customer_id: Number(customerId) },
                orderBy: { created_at: 'desc' },
                include: { cities: true }
            });

            if (latestAddress) {
                return {
                    success: true,
                    data: latestAddress,
                    message: 'Không có địa chỉ mặc định, trả về địa chỉ mới nhất'
                };
            }

            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ nào' };
        }

        return { success: true, data: address };
    } catch (error) {
        throw error;
    }
};
