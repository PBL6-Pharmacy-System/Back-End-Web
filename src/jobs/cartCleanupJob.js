/**
 * Cart Cleanup Job
 * 
 * Dọn dẹp cart cũ/abandoned - Chạy hàng ngày lúc 2:00 AM
 * 
 * Chức năng:
 * - Xóa cart không hoạt động quá CART_EXPIRATION_DAYS ngày (mặc định 30)
 * - Thống kê abandoned carts
 * - Hỗ trợ chạy manual hoặc scheduled
 */

import cron from 'node-cron';
import prisma from '../config/db.js';
import { ORDER_STATUS, CART_LIMITS } from '../utils/constants.js';

// Configuration - Lấy từ constants để đồng bộ
const CART_EXPIRY_DAYS = CART_LIMITS.CART_EXPIRATION_DAYS || 30;
const CLEANUP_BATCH_SIZE = 100; // Xử lý 100 cart mỗi batch để tránh memory issues

/**
 * Xóa các cart cũ không hoạt động
 * - Cart có status = 'cart' (chưa checkout)
 * - Không có update trong X ngày
 * 
 * @param {number} expiryDays - Số ngày để xác định cart hết hạn
 * @param {boolean} useBatchDelete - true: xóa batch (nhanh), false: xóa từng cái (safe)
 */
export const cleanupAbandonedCarts = async (expiryDays = CART_EXPIRY_DAYS, useBatchDelete = true) => {
    const startTime = Date.now();
    let totalDeleted = 0;
    let totalItemsDeleted = 0;

    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - expiryDays);

        console.log(`[CartCleanup] Starting cleanup for carts older than ${expiryDays} days (before ${expiryDate.toISOString()})`);

        // Tìm tất cả abandoned carts
        const abandonedCarts = await prisma.orders.findMany({
            where: {
                status: ORDER_STATUS.CART,
                OR: [
                    { updated_at: { lt: expiryDate } },
                    {
                        updated_at: null,
                        order_date: { lt: expiryDate }
                    }
                ]
            },
            select: {
                id: true,
                customer_id: true,
                order_date: true,
                updated_at: true,
                _count: {
                    select: { orderitems: true }
                }
            },
            take: CLEANUP_BATCH_SIZE
        });

        if (abandonedCarts.length === 0) {
            console.log(`[CartCleanup] No abandoned carts found`);
            return {
                success: true,
                deletedCarts: 0,
                deletedItems: 0,
                duration: Date.now() - startTime
            };
        }

        console.log(`[CartCleanup] Found ${abandonedCarts.length} abandoned carts to clean up`);

        if (useBatchDelete) {
            // Batch delete - Nhanh hơn cho số lượng lớn
            const cartIds = abandonedCarts.map(cart => cart.id);

            const result = await prisma.$transaction(async (tx) => {
                // Xóa tất cả items trong expired carts
                const deletedItems = await tx.orderitems.deleteMany({
                    where: {
                        order_id: { in: cartIds }
                    }
                });

                // Xóa expired carts
                const deletedCarts = await tx.orders.deleteMany({
                    where: {
                        id: { in: cartIds }
                    }
                });

                return {
                    carts: deletedCarts.count,
                    items: deletedItems.count
                };
            });

            totalDeleted = result.carts;
            totalItemsDeleted = result.items;
        } else {
            // Từng cart một - An toàn hơn, có thể continue nếu lỗi 1 cart
            for (const cart of abandonedCarts) {
                try {
                    const result = await prisma.$transaction(async (tx) => {
                        const deletedItems = await tx.orderitems.deleteMany({
                            where: { order_id: cart.id }
                        });

                        await tx.orders.delete({
                            where: { id: cart.id }
                        });

                        return deletedItems.count;
                    });

                    totalDeleted++;
                    totalItemsDeleted += result;
                } catch (error) {
                    console.error(`[CartCleanup] Failed to delete cart #${cart.id}:`, error.message);
                    // Continue with next cart
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[CartCleanup] Completed. Deleted ${totalDeleted} carts, ${totalItemsDeleted} items in ${duration}ms`);

        return {
            success: true,
            deletedCarts: totalDeleted,
            deletedItems: totalItemsDeleted,
            duration
        };
    } catch (error) {
        console.error('[CartCleanup] Error:', error);
        return {
            success: false,
            error: error.message,
            deletedCarts: totalDeleted,
            deletedItems: totalItemsDeleted,
            duration: Date.now() - startTime
        };
    }
};

/**
 * Lấy thống kê về abandoned carts
 */
export const getAbandonedCartStats = async (days = CART_EXPIRY_DAYS) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const [totalCarts, oldCarts] = await Promise.all([
            // Tổng số cart hiện tại
            prisma.orders.count({
                where: { status: ORDER_STATUS.CART }
            }),

            // Cart cũ hơn X ngày
            prisma.orders.count({
                where: {
                    status: ORDER_STATUS.CART,
                    OR: [
                        { updated_at: { lt: cutoffDate } },
                        { updated_at: null, order_date: { lt: cutoffDate } }
                    ]
                }
            })
        ]);

        return {
            success: true,
            data: {
                totalActiveCarts: totalCarts,
                abandonedCarts: oldCarts,
                abandonedPercentage: totalCarts > 0
                    ? ((oldCarts / totalCarts) * 100).toFixed(2) + '%'
                    : '0%',
                expiryDays: days
            }
        };
    } catch (error) {
        console.error('[CartCleanup] Stats error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Chạy cleanup job thủ công (cho testing hoặc admin trigger)
 */
export const runCleanupNow = async () => {
    console.log('[CartCleanup] Manual cleanup triggered...');
    return await cleanupAbandonedCarts();
};

// ============================================================
// SCHEDULED JOB - Sử dụng node-cron
// ============================================================

// Chạy hàng ngày lúc 2:00 AM
const cronJob = cron.schedule('0 2 * * *', async () => {
    console.log('[CartCleanup] Starting scheduled cleanup job...');
    await cleanupAbandonedCarts();
}, {
    scheduled: false // Không tự động start, cần gọi startCartCleanupJob()
});

let isJobRunning = false;

/**
 * Khởi động scheduled job
 */
export const startCartCleanupJob = () => {
    if (isJobRunning) {
        console.log('[CartCleanup] Job already running');
        return;
    }

    cronJob.start();
    isJobRunning = true;
    console.log(`[CartCleanup] Job started - runs daily at 2:00 AM (expiry: ${CART_EXPIRY_DAYS} days)`);

    // Chạy ngay lần đầu sau 1 phút (để server khởi động xong)
    setTimeout(async () => {
        console.log('[CartCleanup] Running initial cleanup...');
        await cleanupAbandonedCarts();
    }, 60 * 1000);
};

/**
 * Dừng scheduled job
 */
export const stopCartCleanupJob = () => {
    if (isJobRunning) {
        cronJob.stop();
        isJobRunning = false;
        console.log('[CartCleanup] Job stopped');
    }
};

export default {
    cleanupAbandonedCarts,
    getAbandonedCartStats,
    runCleanupNow,
    startCartCleanupJob,
    stopCartCleanupJob
};
