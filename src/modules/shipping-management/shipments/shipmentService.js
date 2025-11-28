/**
 * Shipment Service
 * Service quản lý vận chuyển đơn hàng
 * 
 * @module modules/shipping-management/shipments/shipmentService
 */

import prisma from '../../../config/db.js';
import { ORDER_STATUS, SHIPMENT_STATUS } from '../../../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Định nghĩa các transition hợp lệ cho shipment status
 * Key: status hiện tại
 * Value: array các status có thể chuyển đến
 */
const VALID_STATUS_TRANSITIONS = {
    [SHIPMENT_STATUS.PENDING]: [SHIPMENT_STATUS.PICKED_UP, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.PICKED_UP]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.OUT_FOR_DELIVERY, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.DELIVERED]: [SHIPMENT_STATUS.RETURNED], // Chỉ có thể return sau khi delivered
    [SHIPMENT_STATUS.FAILED]: [SHIPMENT_STATUS.PENDING, SHIPMENT_STATUS.RETURNED], // Có thể thử lại hoặc return
    [SHIPMENT_STATUS.RETURNED]: [] // Trạng thái cuối, không thể chuyển đi đâu
};

/**
 * Kiểm tra xem transition có hợp lệ không
 */
const isValidTransition = (currentStatus, newStatus) => {
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validNextStatuses) return false;
    return validNextStatuses.includes(newStatus);
};

/**
 * Lấy message lỗi transition không hợp lệ
 */
const getInvalidTransitionMessage = (currentStatus, newStatus) => {
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (validNextStatuses.length === 0) {
        return `Không thể thay đổi trạng thái từ "${currentStatus}" - đây là trạng thái cuối cùng`;
    }
    return `Không thể chuyển từ "${currentStatus}" sang "${newStatus}". Các trạng thái hợp lệ: ${validNextStatuses.join(', ')}`;
};

/**
 * ✅ FIX ISSUE #8: Generate unique tracking number với UUID
 * Sử dụng combination của prefix + timestamp + UUID để đảm bảo unique
 * @param {number} maxRetries - Số lần retry tối đa nếu trùng
 */
const generateTrackingNumber = async (maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const prefix = 'VN';
        const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
        const uuid = uuidv4().split('-')[0].toUpperCase(); // First segment of UUID
        const trackingNumber = `${prefix}${timestamp}${uuid}`;

        // Check if tracking number already exists
        const existing = await prisma.shipments.findUnique({
            where: { tracking_number: trackingNumber }
        });

        if (!existing) {
            return trackingNumber;
        }

        console.warn(`[ShipmentService] Tracking number collision detected on attempt ${attempt + 1}, retrying...`);
    }

    // Fallback: Use full UUID if all retries fail
    const fallbackTracking = `VN${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
    console.warn(`[ShipmentService] Using fallback tracking number: ${fallbackTracking}`);
    return fallbackTracking;
};

/**
 * ✅ FIX ISSUE #8: Sync version - Generate tracking number không cần check DB
 * Dùng cho cases không cần async (backward compatibility)
 */
const generateTrackingNumberSync = () => {
    const prefix = 'VN';
    const timestamp = Date.now().toString(36).toUpperCase();
    const uuid = uuidv4().split('-')[0].toUpperCase();
    return `${prefix}${timestamp}${uuid}`;
};

/**
 * Create shipment for an order
 * ✅ FIX ISSUE #8: Sử dụng async generateTrackingNumber với retry
 */
export const createShipment = async (shipmentData) => {
    try {
        const {
            orderId,
            branchId,
            shippingAddressId,
            carrier = 'Standard Delivery',
            estimatedDelivery
        } = shipmentData;

        if (!orderId || !branchId || !shippingAddressId) {
            return { success: false, status: 400, error: 'Order ID, Branch ID và Shipping Address ID là bắt buộc' };
        }

        const order = await prisma.orders.findUnique({
            where: { id: Number(orderId) },
            include: { customers: { select: { id: true } } }
        });

        if (!order) {
            return { success: false, status: 404, error: 'Không tìm thấy đơn hàng' };
        }

        const validStatuses = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING];
        if (!validStatuses.includes(order.status)) {
            return { success: false, status: 400, error: 'Chỉ có thể tạo vận chuyển cho đơn hàng đã xác nhận hoặc đang xử lý' };
        }

        const branch = await prisma.branches.findUnique({ where: { id: Number(branchId) } });
        if (!branch) {
            return { success: false, status: 404, error: 'Không tìm thấy chi nhánh' };
        }

        const address = await prisma.shippingaddresses.findUnique({ where: { id: Number(shippingAddressId) } });
        if (!address) {
            return { success: false, status: 404, error: 'Không tìm thấy địa chỉ giao hàng' };
        }

        const existingShipment = await prisma.shipments.findFirst({
            where: {
                order_id: Number(orderId),
                status: { notIn: [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNED] }
            }
        });

        if (existingShipment) {
            return { success: false, status: 400, error: 'Đơn hàng đã có vận chuyển' };
        }

        // ✅ FIX #8: Sử dụng async generateTrackingNumber với retry
        const trackingNumber = await generateTrackingNumber();
        const estimatedDate = estimatedDelivery
            ? new Date(estimatedDelivery)
            : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const shipment = await prisma.shipments.create({
            data: {
                order_id: Number(orderId),
                branch_id: Number(branchId),
                shipping_address_id: Number(shippingAddressId),
                tracking_number: trackingNumber,
                carrier,
                status: SHIPMENT_STATUS.PENDING,
                estimated_delivery: estimatedDate,
                created_at: new Date(),
                updated_at: new Date()
            },
            include: {
                orders: { include: { customers: true } },
                branches: true,
                shippingaddresses: true
            }
        });

        if (order.status !== ORDER_STATUS.SHIPPING) {
            await prisma.orders.update({
                where: { id: Number(orderId) },
                data: { status: ORDER_STATUS.SHIPPING, updated_at: new Date() }
            });

            await prisma.order_status_history.create({
                data: { order_id: Number(orderId), status: ORDER_STATUS.SHIPPING, changed_at: new Date() }
            });
        }

        return { success: true, data: shipment, message: 'Tạo vận chuyển thành công' };
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('tracking_number')) {
            // ✅ FIX #8: Retry với tracking number mới nếu vẫn bị trùng
            console.error('[ShipmentService] Tracking number unique constraint violation, generating new one...');
            return await createShipment(shipmentData); // Recursive retry
        }
        throw error;
    }
};

/**
 * Get shipment by ID
 */
export const getShipmentById = async (shipmentId) => {
    try {
        const shipment = await prisma.shipments.findUnique({
            where: { id: Number(shipmentId) },
            include: {
                orders: {
                    include: {
                        customers: {
                            select: {
                                id: true,
                                users: { select: { full_name: true, email: true, phone: true } }
                            }
                        },
                        orderitems: {
                            include: {
                                products: { select: { id: true, name: true, image_url: true } }
                            }
                        }
                    }
                },
                branches: true,
                shippingaddresses: true
            }
        });

        if (!shipment) {
            return { success: false, status: 404, error: 'Không tìm thấy vận chuyển' };
        }

        return { success: true, data: shipment };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all shipments with pagination and filters
 */
export const getAllShipments = async (filters = {}) => {
    try {
        const {
            page = 1, limit = 10, status, branchId, startDate, endDate,
            sortBy = 'created_at', sortOrder = 'desc'
        } = filters;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};

        if (status) where.status = status;
        if (branchId) where.branch_id = Number(branchId);
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = new Date(startDate);
            if (endDate) where.created_at.lte = new Date(endDate);
        }

        const [shipments, total] = await Promise.all([
            prisma.shipments.findMany({
                where, skip, take,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    orders: {
                        select: {
                            id: true, status: true, total_amount: true,
                            customers: {
                                select: {
                                    id: true,
                                    users: { select: { full_name: true, phone: true } }
                                }
                            }
                        }
                    },
                    branches: { select: { id: true, name: true, address: true } },
                    shippingaddresses: true
                }
            }),
            prisma.shipments.count({ where })
        ]);

        return {
            success: true,
            data: {
                shipments,
                pagination: {
                    page: Number(page), limit: Number(limit), total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get shipments for an order
 */
export const getOrderShipments = async (orderId) => {
    try {
        const order = await prisma.orders.findUnique({ where: { id: Number(orderId) } });
        if (!order) {
            return { success: false, status: 404, error: 'Không tìm thấy đơn hàng' };
        }

        const shipments = await prisma.shipments.findMany({
            where: { order_id: Number(orderId) },
            orderBy: { created_at: 'desc' },
            include: { branches: true, shippingaddresses: true }
        });

        return { success: true, data: shipments };
    } catch (error) {
        throw error;
    }
};

/**
 * Track shipment by tracking number
 * ✅ FIX: Public API - Chỉ trả về thông tin cần thiết, ẩn thông tin nhạy cảm
 */
export const trackShipment = async (trackingNumber) => {
    try {
        const shipment = await prisma.shipments.findUnique({
            where: { tracking_number: trackingNumber },
            include: {
                orders: { select: { id: true, status: true, order_date: true } },
                branches: { select: { name: true, city: true } }, // ✅ Chỉ lấy tên và thành phố, không lấy địa chỉ chi tiết
                shippingaddresses: {
                    select: {
                        city: true,
                        district: true,
                        // ✅ KHÔNG trả về: address_line, recipient_phone, recipient_name để bảo vệ thông tin cá nhân
                    }
                }
            }
        });

        if (!shipment) {
            return { success: false, status: 404, error: 'Không tìm thấy mã vận đơn' };
        }

        // ✅ FIX: Trả về dữ liệu đã được sanitize cho public API
        return {
            success: true,
            data: {
                tracking_number: shipment.tracking_number,
                status: shipment.status,
                carrier: shipment.carrier,
                shipped_date: shipment.shipped_date,
                estimated_delivery: shipment.estimated_delivery,
                actual_delivery: shipment.actual_delivery,
                // Chỉ hiển thị thông tin cơ bản
                from_branch: shipment.branches ? {
                    name: shipment.branches.name,
                    city: shipment.branches.city
                } : null,
                destination: shipment.shippingaddresses ? {
                    city: shipment.shippingaddresses.city,
                    district: shipment.shippingaddresses.district
                } : null,
                order: shipment.orders ? {
                    id: shipment.orders.id,
                    status: shipment.orders.status
                } : null
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Update shipment status
 * ✅ FIX ISSUE #7: Thêm idempotency check - không hoàn kho nhiều lần khi RETURNED
 */
export const updateShipmentStatus = async (shipmentId, status, userId = null) => {
    try {
        const validStatuses = Object.values(SHIPMENT_STATUS);
        if (!validStatuses.includes(status)) {
            return { success: false, status: 400, error: 'Trạng thái vận chuyển không hợp lệ' };
        }

        const currentShipment = await prisma.shipments.findUnique({
            where: { id: Number(shipmentId) },
            include: {
                orders: {
                    include: {
                        orderitems: {
                            include: {
                                productunits: true
                            }
                        }
                    }
                }
            }
        });

        if (!currentShipment) {
            return { success: false, status: 404, error: 'Không tìm thấy vận chuyển' };
        }

        // Validate status transition
        if (!isValidTransition(currentShipment.status, status)) {
            return {
                success: false,
                status: 400,
                error: getInvalidTransitionMessage(currentShipment.status, status),
                currentStatus: currentShipment.status,
                requestedStatus: status,
                validTransitions: VALID_STATUS_TRANSITIONS[currentShipment.status] || []
            };
        }

        const updateData = { status, updated_at: new Date() };

        if (status === SHIPMENT_STATUS.PICKED_UP && !currentShipment.shipped_date) {
            updateData.shipped_date = new Date();
        }
        if (status === SHIPMENT_STATUS.DELIVERED) {
            updateData.actual_delivery = new Date();
        }

        const updatedShipment = await prisma.shipments.update({
            where: { id: Number(shipmentId) },
            data: updateData,
            include: { orders: true, branches: true, shippingaddresses: true }
        });

        // Cập nhật trạng thái đơn hàng tương ứng
        if (status === SHIPMENT_STATUS.DELIVERED) {
            await prisma.$transaction([
                prisma.orders.update({
                    where: { id: currentShipment.order_id },
                    data: { status: ORDER_STATUS.DELIVERED, updated_at: new Date() }
                }),
                prisma.order_status_history.create({
                    data: {
                        order_id: currentShipment.order_id,
                        status: ORDER_STATUS.DELIVERED,
                        changed_by: userId,
                        changed_at: new Date()
                    }
                })
            ]);
        }

        if (status === SHIPMENT_STATUS.FAILED) {
            await prisma.$transaction([
                prisma.orders.update({
                    where: { id: currentShipment.order_id },
                    data: { status: ORDER_STATUS.PROCESSING, updated_at: new Date() }
                }),
                prisma.order_status_history.create({
                    data: {
                        order_id: currentShipment.order_id,
                        status: ORDER_STATUS.PROCESSING,
                        changed_by: userId,
                        changed_at: new Date()
                    }
                })
            ]);
        }

        // ✅ FIX ISSUE #7: Khi RETURNED, kiểm tra idempotency trước khi hoàn kho
        if (status === SHIPMENT_STATUS.RETURNED) {
            await prisma.$transaction(async (tx) => {
                // ✅ IDEMPOTENCY CHECK: Kiểm tra xem đã có inventory log RETURN cho shipment này chưa
                const existingReturnLog = await tx.inventoryLog.findFirst({
                    where: {
                        reference_type: 'shipment_return',
                        reference_id: Number(shipmentId)
                    }
                });

                if (existingReturnLog) {
                    console.log(`[ShipmentService] Shipment #${shipmentId} already returned, skipping inventory restore`);
                    // Vẫn update order status nhưng không hoàn kho nữa
                    await tx.orders.update({
                        where: { id: currentShipment.order_id },
                        data: { status: ORDER_STATUS.RETURNED, updated_at: new Date() }
                    });
                    return; // Skip inventory restore
                }

                // Update order status
                await tx.orders.update({
                    where: { id: currentShipment.order_id },
                    data: { status: ORDER_STATUS.RETURNED, updated_at: new Date() }
                });

                await tx.order_status_history.create({
                    data: {
                        order_id: currentShipment.order_id,
                        status: ORDER_STATUS.RETURNED,
                        changed_by: userId,
                        changed_at: new Date()
                    }
                });

                // ✅ Hoàn kho về chi nhánh đã xuất hàng (branch_id của shipment)
                const branchId = currentShipment.branch_id;

                for (const item of currentShipment.orders.orderitems) {
                    const conversionFactor = item.productunits?.conversion_factor
                        ? Number(item.productunits.conversion_factor)
                        : 1;
                    const baseQuantity = item.quantity * conversionFactor;

                    // Hoàn tồn kho
                    await tx.branchinventory.updateMany({
                        where: {
                            branch_id: branchId,
                            product_id: item.product_id
                        },
                        data: {
                            stock: { increment: baseQuantity },
                            last_updated: new Date()
                        }
                    });

                    // Tạo inventory log với reference để idempotency check
                    await tx.inventoryLog.create({
                        data: {
                            branch_id: branchId,
                            product_id: item.product_id,
                            quantity: baseQuantity,
                            type: 'RETURN',
                            reference_type: 'shipment_return',
                            reference_id: Number(shipmentId), // Dùng shipmentId để check idempotency
                            note: `Hoàn kho do đơn hàng #${currentShipment.order_id} bị trả lại`,
                            created_by: userId,
                            date: new Date()
                        }
                    });
                }

                // ✅ Hoàn cả batch nếu có - hỗ trợ CẢ 2 convention
                const inventoryLogs = await tx.inventoryLog.findMany({
                    where: {
                        reference_type: 'order',
                        reference_id: currentShipment.order_id,
                        OR: [
                            // Convention cũ: type='OUT', quantity < 0
                            { type: 'OUT', quantity: { lt: 0 }, batch_id: { not: null } },
                            // Convention mới: type='EXPORT', quantity > 0
                            { type: 'EXPORT', quantity: { gt: 0 }, batch_id: { not: null } }
                        ]
                    }
                });

                for (const log of inventoryLogs) {
                    if (log.batch_id) {
                        // ✅ FIX: Xử lý cả số âm (convention cũ) và số dương (convention mới)
                        const qtyToRestore = log.quantity < 0 ? Math.abs(log.quantity) : log.quantity;
                        await tx.productBatch.update({
                            where: { id: log.batch_id },
                            data: {
                                quantity: { increment: qtyToRestore },
                                updated_at: new Date()
                            }
                        });
                    }
                }

                console.log(`[ShipmentService] Restored inventory for returned shipment #${shipmentId}, order #${currentShipment.order_id}`);
            });
        }

        return {
            success: true,
            data: updatedShipment,
            message: 'Cập nhật trạng thái vận chuyển thành công',
            previousStatus: currentShipment.status,
            newStatus: status
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get shipment statistics (Admin)
 */
export const getShipmentStatistics = async (filters = {}) => {
    try {
        const { startDate, endDate, branchId } = filters;
        const where = {};

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = new Date(startDate);
            if (endDate) where.created_at.lte = new Date(endDate);
        }
        if (branchId) where.branch_id = Number(branchId);

        const [
            totalShipments, pendingShipments, pickedUpShipments, inTransitShipments,
            outForDeliveryShipments, deliveredShipments, failedShipments, returnedShipments,
            shipmentsByBranch
        ] = await Promise.all([
            prisma.shipments.count({ where }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.PENDING } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.PICKED_UP } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.IN_TRANSIT } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.OUT_FOR_DELIVERY } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.DELIVERED } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.FAILED } }),
            prisma.shipments.count({ where: { ...where, status: SHIPMENT_STATUS.RETURNED } }),
            prisma.shipments.groupBy({ by: ['branch_id'], where, _count: true })
        ]);

        const successRate = totalShipments > 0
            ? ((deliveredShipments / totalShipments) * 100).toFixed(2)
            : 0;

        return {
            success: true,
            data: {
                totalShipments,
                shipmentsByStatus: {
                    pending: pendingShipments,
                    picked_up: pickedUpShipments,
                    in_transit: inTransitShipments,
                    out_for_delivery: outForDeliveryShipments,
                    delivered: deliveredShipments,
                    failed: failedShipments,
                    returned: returnedShipments
                },
                successRate: `${successRate}%`,
                shipmentsByBranch: shipmentsByBranch.map(sb => ({ branchId: sb.branch_id, count: sb._count }))
            }
        };
    } catch (error) {
        throw error;
    }
};
