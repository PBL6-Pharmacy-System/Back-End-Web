/**
 * Inventory Reconciliation Job
 * Kiểm tra và cảnh báo khi branchinventory.stock không khớp với SUM(productBatch.quantity)
 * 
 * Chạy hàng ngày lúc 2:00 AM
 */

import cron from 'node-cron';
import prisma from '../config/db.js';
import { inventoryLogger } from '../utils/logger.js';

const DISCREPANCY_THRESHOLD = 5; // Ngưỡng cảnh báo (số lượng lệch)

/**
 * Kiểm tra đồng bộ giữa branchinventory và productBatch
 */
const reconcileInventory = async () => {
    inventoryLogger.info('Starting inventory reconciliation check...');

    try {
        // Lấy tất cả branch inventory
        const inventories = await prisma.branchinventory.findMany({
            include: {
                branches: { select: { id: true, name: true } },
                products: { select: { id: true, name: true } }
            }
        });

        const discrepancies = [];
        let checkedCount = 0;

        for (const inventory of inventories) {
            // Tính tổng từ batches (include expired - they still have physical stock)
            const batchTotal = await prisma.productBatch.aggregate({
                where: {
                    branch_id: inventory.branch_id,
                    product_id: inventory.product_id,
                    status: { in: ['active', 'expired'] }
                },
                _sum: { quantity: true }
            });

            const batchQuantity = batchTotal._sum.quantity || 0;
            const inventoryQuantity = inventory.stock || 0;
            const difference = Math.abs(inventoryQuantity - batchQuantity);

            checkedCount++;

            // Chỉ báo cáo nếu có batch và có sự khác biệt đáng kể
            if (difference > 0) {
                // Kiểm tra xem có batch nào không
                const hasBatches = await prisma.productBatch.findFirst({
                    where: {
                        branch_id: inventory.branch_id,
                        product_id: inventory.product_id
                    }
                });

                // Chỉ cảnh báo nếu:
                // 1. Có batches và khác biệt > threshold, HOẶC
                // 2. Inventory > 0 nhưng không có batch nào
                if ((hasBatches && difference >= DISCREPANCY_THRESHOLD) ||
                    (!hasBatches && inventoryQuantity > 0)) {
                    discrepancies.push({
                        branch_id: inventory.branch_id,
                        branch_name: inventory.branches?.name || 'Unknown',
                        product_id: inventory.product_id,
                        product_name: inventory.products?.name || 'Unknown',
                        inventory_stock: inventoryQuantity,
                        batch_total: batchQuantity,
                        difference: inventoryQuantity - batchQuantity,
                        has_batches: !!hasBatches,
                        severity: difference >= DISCREPANCY_THRESHOLD * 2 ? 'HIGH' : 'MEDIUM'
                    });
                }
            }
        }

        // Log kết quả
        inventoryLogger.info(`Checked ${checkedCount} inventory records`);

        if (discrepancies.length > 0) {
            inventoryLogger.warn(`⚠️ Found ${discrepancies.length} discrepancies`);

            // Group by severity
            const highSeverity = discrepancies.filter(d => d.severity === 'HIGH');
            const mediumSeverity = discrepancies.filter(d => d.severity === 'MEDIUM');

            if (highSeverity.length > 0) {
                inventoryLogger.error(`🔴 HIGH SEVERITY (${highSeverity.length})`, {
                    discrepancies: highSeverity.map(d => ({
                        branch: `${d.branch_name} (${d.branch_id})`,
                        product: `${d.product_name} (${d.product_id})`,
                        inventory_stock: d.inventory_stock,
                        batch_total: d.batch_total,
                        difference: d.difference
                    }))
                });
            }

            if (mediumSeverity.length > 0) {
                inventoryLogger.warn(`🟡 MEDIUM SEVERITY (${mediumSeverity.length})`, {
                    discrepancies: mediumSeverity.slice(0, 10).map(d => ({
                        branch: d.branch_name,
                        product: d.product_name,
                        inventory_stock: d.inventory_stock,
                        batch_total: d.batch_total,
                        difference: d.difference
                    })),
                    hasMore: mediumSeverity.length > 10,
                    totalCount: mediumSeverity.length
                });
            }

            // TODO: Gửi notification/email cho admin nếu có HIGH severity
            // await sendAdminAlert(discrepancies);

            return {
                success: true,
                checked: checkedCount,
                discrepancies: discrepancies.length,
                highSeverity: highSeverity.length,
                mediumSeverity: mediumSeverity.length,
                details: discrepancies
            };
        } else {
            inventoryLogger.info('✅ All inventory records are in sync with batches');
            return {
                success: true,
                checked: checkedCount,
                discrepancies: 0
            };
        }
    } catch (error) {
        inventoryLogger.error('Error during reconciliation', { error: error.message, stack: error.stack });
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Cleanup expired inventory reservations
 */
const cleanupExpiredReservations = async () => {
    inventoryLogger.info('Cleaning up expired reservations...');

    try {
        const result = await prisma.inventoryReservation.updateMany({
            where: {
                status: 'active',
                expires_at: { lt: new Date() }
            },
            data: {
                status: 'expired',
                updated_at: new Date()
            }
        });

        if (result.count > 0) {
            inventoryLogger.info(`Expired ${result.count} reservations`);
        }

        return result.count;
    } catch (error) {
        inventoryLogger.error('Error cleaning up reservations', { error: error.message });
        return 0;
    }
};

/**
 * Khởi tạo cron job
 * Schedule: Chạy lúc 2:00 AM mỗi ngày
 */
export const startInventoryReconciliationJob = () => {
    // Chạy lúc 2:00 AM mỗi ngày
    cron.schedule('0 2 * * *', async () => {
        inventoryLogger.info('Running scheduled reconciliation...');
        await cleanupExpiredReservations();
        await reconcileInventory();
    }, {
        timezone: 'Asia/Ho_Chi_Minh'
    });

    inventoryLogger.info('Job scheduled to run at 2:00 AM daily');
};

/**
 * Export functions để có thể chạy manual nếu cần
 */
export { reconcileInventory, cleanupExpiredReservations };

export default { startInventoryReconciliationJob, reconcileInventory, cleanupExpiredReservations };
