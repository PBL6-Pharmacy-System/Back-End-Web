/**
 * Inventory Reservation Cleanup Job
 * 
 * ✅ FIX ISSUE #3: Dọn dẹp các inventory reservation đã hết hạn
 * Chạy định kỳ mỗi 5 phút để giải phóng hàng đã được giữ chỗ
 * nhưng không hoàn tất checkout
 */

import cron from 'node-cron';
import prisma from '../config/db.js';

/**
 * Dọn dẹp các reservation đã hết hạn
 * - Chuyển status từ 'active' sang 'expired'
 * - Log số lượng reservation đã được dọn dẹp
 */
const cleanupExpiredReservations = async () => {
    try {
        const now = new Date();

        // Tìm và update các reservation đã hết hạn
        const result = await prisma.inventoryReservation.updateMany({
            where: {
                status: 'active',
                expires_at: { lt: now }
            },
            data: {
                status: 'expired',
                updated_at: now
            }
        });

        if (result.count > 0) {
            console.log(`[ReservationCleanup] ${now.toISOString()} - Cleaned up ${result.count} expired reservations`);

            // Log chi tiết để debug nếu cần
            const expiredReservations = await prisma.inventoryReservation.findMany({
                where: {
                    status: 'expired',
                    updated_at: { gte: new Date(now.getTime() - 60000) } // Updated trong 1 phút qua
                },
                select: {
                    id: true,
                    order_id: true,
                    product_id: true,
                    quantity: true,
                    expires_at: true
                },
                take: 10
            });

            if (expiredReservations.length > 0) {
                console.log(`[ReservationCleanup] Sample expired reservations:`,
                    expiredReservations.map(r => `Order #${r.order_id}, Product #${r.product_id}, Qty: ${r.quantity}`)
                );
            }
        }

        return result.count;
    } catch (error) {
        // ✅ Handle database connection errors gracefully
        if (error.code === 'P1001' || error.code === 'P1002') {
            console.warn('[ReservationCleanup] Database connection timeout, will retry next cycle');
            return 0;
        }
        console.error('[ReservationCleanup] Error cleaning up expired reservations:', error.message || error);
        throw error;
    }
};

/**
 * Lấy thống kê reservation hiện tại
 */
const getReservationStats = async () => {
    try {
        const stats = await prisma.inventoryReservation.groupBy({
            by: ['status'],
            _count: true
        });

        const statsMap = {};
        stats.forEach(s => {
            statsMap[s.status] = s._count;
        });

        return {
            active: statsMap.active || 0,
            completed: statsMap.completed || 0,
            cancelled: statsMap.cancelled || 0,
            expired: statsMap.expired || 0
        };
    } catch (error) {
        // ✅ Handle database connection errors gracefully
        if (error.code === 'P1001' || error.code === 'P1002') {
            console.warn('[ReservationCleanup] Database connection timeout while getting stats');
            return null;
        }
        console.error('[ReservationCleanup] Error getting stats:', error.message || error);
        return null;
    }
};

// Cron schedule: every 5 minutes
const CRON_SCHEDULE = '*/5 * * * *';

/**
 * Khởi động cron job - chạy mỗi 5 phút
 */
export const startReservationCleanupJob = () => {
    cron.schedule(CRON_SCHEDULE, async () => {
        console.log('[ReservationCleanup] Running scheduled cleanup...');

        try {
            const cleanedCount = await cleanupExpiredReservations();

            // Log stats mỗi giờ (khi phút = 0)
            const currentMinute = new Date().getMinutes();
            if (currentMinute < 5) {
                const stats = await getReservationStats();
                if (stats) {
                    console.log('[ReservationCleanup] Hourly stats:', stats);
                }
            }
        } catch (error) {
            // ✅ Handle database connection errors gracefully
            if (error.code === 'P1001' || error.code === 'P1002') {
                console.warn('[ReservationCleanup] Database connection timeout, will retry next cycle');
            } else {
                console.error('[ReservationCleanup] Scheduled cleanup failed:', error.message || error);
            }
        }
    });

    console.log('[ReservationCleanup] Cron job scheduled - runs every 5 minutes');
};

/**
 * Chạy cleanup thủ công (có thể gọi từ API admin)
 */
export const runManualCleanup = async () => {
    console.log('[ReservationCleanup] Running manual cleanup...');
    const count = await cleanupExpiredReservations();
    const stats = await getReservationStats();

    return {
        cleanedCount: count,
        stats
    };
};

export default {
    startReservationCleanupJob,
    runManualCleanup,
    cleanupExpiredReservations,
    getReservationStats
};
