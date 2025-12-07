/**
 * PayOS Service
 * Service xử lý thanh toán qua PayOS
 */

import prisma from '../../../../../config/db.js';
import { ORDER_STATUS } from '../../../../../utils/constants.js';
import { PAYOS_CONFIG, isPayOSConfigured } from './payosConfig.js';
import { createPayOSChecksum, formatPayOSAmount, generateOrderCode, verifyPayOSWebhook } from './payosUtils.js';

/**
 * Tạo link thanh toán PayOS
 * @param {number} orderId - ID đơn hàng
 * @param {Object} req - Express request object
 * @returns {Object} Payment URL và thông tin
 */
export const createPayOSPaymentUrl = async (orderId, req) => {
    try {
        if (!isPayOSConfigured()) {
            return {
                success: false,
                status: 500,
                error: 'PayOS chưa được cấu hình. Vui lòng liên hệ admin.'
            };
        }

        const order = await prisma.orders.findUnique({
            where: { id: Number(orderId) },
            include: {
                customers: {
                    include: {
                        users: {
                            select: { id: true, email: true, full_name: true, phone: true }
                        }
                    }
                },
                orderitems: {
                    include: {
                        products: {
                            select: { id: true, name: true }
                        }
                    }
                },
                payments: {
                    select: { payment_method: true },
                    take: 1
                }
            }
        });

        if (!order) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy đơn hàng'
            };
        }

        // Check payment method
        const orderPaymentMethod = order.payments?.[0]?.payment_method;
        if (orderPaymentMethod && orderPaymentMethod !== 'payos') {
            return {
                success: false,
                status: 400,
                error: `Đơn hàng này sử dụng phương thức thanh toán ${orderPaymentMethod.toUpperCase()}, không thể thanh toán bằng PayOS`
            };
        }

        // Generate unique order code
        const orderCode = generateOrderCode(order.id);
        const amount = formatPayOSAmount(order.final_amount);

        // Prepare items for PayOS
        const items = order.orderitems.map(item => ({
            name: item.products?.name || `Sản phẩm #${item.product_id}`,
            quantity: item.quantity,
            price: Math.round(Number(item.price))
        }));

        // Create payment request data
        const paymentData = {
            orderCode: orderCode,
            amount: amount,
            description: `Đơn hàng #${order.id}`,
            items: items,
            returnUrl: PAYOS_CONFIG.returnUrl,
            cancelUrl: PAYOS_CONFIG.cancelUrl,
            buyerName: order.customers?.users?.full_name || 'Khách hàng',
            buyerEmail: order.customers?.users?.email || '',
            buyerPhone: order.customers?.users?.phone || '',
            expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // Hết hạn sau 30 phút
        };

        // Create checksum
        const checksumData = {
            amount: paymentData.amount,
            cancelUrl: paymentData.cancelUrl,
            description: paymentData.description,
            orderCode: paymentData.orderCode,
            returnUrl: paymentData.returnUrl
        };
        const signature = createPayOSChecksum(checksumData, PAYOS_CONFIG.checksumKey);

        // Call PayOS API
        const response = await fetch(`${PAYOS_CONFIG.baseUrl}/v2/payment-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': PAYOS_CONFIG.clientId,
                'x-api-key': PAYOS_CONFIG.apiKey
            },
            body: JSON.stringify({
                ...paymentData,
                signature
            })
        });

        const result = await response.json();

        if (result.code !== '00' && result.code !== 0) {
            console.error('PayOS create payment error:', result);
            return {
                success: false,
                status: 400,
                error: result.desc || 'Không thể tạo link thanh toán PayOS'
            };
        }

        // Save orderCode to payment record for later verification
        await prisma.payments.updateMany({
            where: { order_id: order.id },
            data: {
                transaction_id: String(orderCode),
                updated_at: new Date()
            }
        });

        return {
            success: true,
            data: {
                paymentUrl: result.data.checkoutUrl,
                orderId: order.id,
                orderCode: orderCode,
                amount: amount,
                qrCode: result.data.qrCode
            }
        };
    } catch (error) {
        console.error('PayOS create payment URL error:', error);
        throw error;
    }
};

/**
 * Xử lý callback từ PayOS (khi user redirect về)
 * @param {Object} query - Query params từ callback URL
 * @returns {Object}
 */
export const handlePayOSCallback = async (query) => {
    try {
        const { code, id, cancel, status, orderCode } = query;

        if (cancel === 'true' || status === 'CANCELLED') {
            return {
                success: false,
                status: 400,
                error: 'Thanh toán đã bị hủy',
                orderCode
            };
        }

        if (code !== '00' && status !== 'PAID') {
            return {
                success: false,
                status: 400,
                error: 'Thanh toán thất bại',
                orderCode
            };
        }

        // Tìm payment theo transaction_id (orderCode)
        const payment = await prisma.payments.findFirst({
            where: { transaction_id: String(orderCode) },
            include: { orders: true }
        });

        if (!payment) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy thông tin thanh toán',
                orderCode
            };
        }

        // Cập nhật payment status
        await prisma.$transaction(async (tx) => {
            await tx.payments.update({
                where: { id: payment.id },
                data: {
                    status: 'completed',
                    paid_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Cập nhật order status nếu đang pending
            if (payment.orders.status === ORDER_STATUS.PENDING) {
                await tx.orders.update({
                    where: { id: payment.orders.id },
                    data: {
                        status: ORDER_STATUS.CONFIRMED,
                        updated_at: new Date()
                    }
                });

                // Tạo status history
                await tx.order_status_history.create({
                    data: {
                        order_id: payment.orders.id,
                        status: ORDER_STATUS.CONFIRMED,
                        note: 'Đã thanh toán qua PayOS'
                    }
                });
            }
        });

        return {
            success: true,
            message: 'Thanh toán thành công',
            orderId: payment.order_id,
            orderCode
        };
    } catch (error) {
        console.error('PayOS callback error:', error);
        throw error;
    }
};

/**
 * Xử lý webhook từ PayOS (server-to-server notification)
 * @param {Object} webhookData - Dữ liệu webhook từ PayOS
 * @param {string} signature - Chữ ký từ header
 * @returns {Object}
 */
export const handlePayOSWebhook = async (webhookData, signature) => {
    try {
        // Verify signature
        if (!verifyPayOSWebhook(webhookData, signature, PAYOS_CONFIG.checksumKey)) {
            console.error('PayOS webhook: Invalid signature');
            return {
                success: false,
                status: 400,
                error: 'Chữ ký không hợp lệ'
            };
        }

        const data = webhookData.data || webhookData;
        const { orderCode, code, desc, paymentLinkId } = data;

        // Tìm payment
        const payment = await prisma.payments.findFirst({
            where: { transaction_id: String(orderCode) },
            include: { orders: true }
        });

        if (!payment) {
            console.error(`PayOS webhook: Payment not found for orderCode ${orderCode}`);
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy thông tin thanh toán'
            };
        }

        // Xử lý theo trạng thái
        if (code === '00' || webhookData.success === true) {
            // Thanh toán thành công
            await prisma.$transaction(async (tx) => {
                await tx.payments.update({
                    where: { id: payment.id },
                    data: {
                        status: 'completed',
                        paid_at: new Date(),
                        updated_at: new Date()
                    }
                });

                // Tự động cập nhật order status
                if (payment.orders.status === ORDER_STATUS.PENDING) {
                    await tx.orders.update({
                        where: { id: payment.orders.id },
                        data: {
                            status: ORDER_STATUS.CONFIRMED,
                            updated_at: new Date()
                        }
                    });

                    await tx.order_status_history.create({
                        data: {
                            order_id: payment.orders.id,
                            status: ORDER_STATUS.CONFIRMED,
                            note: 'Thanh toán PayOS thành công (webhook)'
                        }
                    });
                }
            });

            console.log(`PayOS webhook: Payment ${orderCode} completed successfully`);
            return {
                success: true,
                message: 'Đã cập nhật thanh toán thành công'
            };
        } else {
            // Thanh toán thất bại hoặc bị hủy
            await prisma.payments.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    updated_at: new Date()
                }
            });

            console.log(`PayOS webhook: Payment ${orderCode} failed - ${desc}`);
            return {
                success: true,
                message: 'Đã cập nhật trạng thái thanh toán thất bại'
            };
        }
    } catch (error) {
        console.error('PayOS webhook error:', error);
        throw error;
    }
};

/**
 * Kiểm tra trạng thái thanh toán từ PayOS
 * @param {string} orderCode - Mã đơn hàng PayOS
 * @returns {Object}
 */
export const checkPayOSPaymentStatus = async (orderCode) => {
    try {
        if (!isPayOSConfigured()) {
            return {
                success: false,
                status: 500,
                error: 'PayOS chưa được cấu hình'
            };
        }

        const response = await fetch(`${PAYOS_CONFIG.baseUrl}/v2/payment-requests/${orderCode}`, {
            method: 'GET',
            headers: {
                'x-client-id': PAYOS_CONFIG.clientId,
                'x-api-key': PAYOS_CONFIG.apiKey
            }
        });

        const result = await response.json();

        if (result.code !== '00' && result.code !== 0) {
            return {
                success: false,
                status: 400,
                error: result.desc || 'Không thể kiểm tra trạng thái thanh toán'
            };
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('PayOS check payment status error:', error);
        throw error;
    }
};
