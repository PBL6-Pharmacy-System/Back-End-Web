/**
 * Inventory Health Check Service
 * API để monitor inventory consistency và phát hiện discrepancy
 * 
 * @module services/inventoryHealthCheck
 */

import prisma from '../../config/db.js';
import { INVENTORY_LOG_TYPE, INVENTORY_INCREASE_TYPES, INVENTORY_DECREASE_TYPES } from '../../utils/constants.js';

/**
 * Check inventory consistency cho một branch
 * So sánh branchinventory.stock với SUM(productBatch.quantity)
 */
export const checkBranchInventoryConsistency = async (branchId) => {
    try {
        // Lấy tất cả inventory của branch
        const inventories = await prisma.branchinventory.findMany({
            where: { branch_id: Number(branchId) },
            include: {
                products: { select: { id: true, name: true } }
            }
        });

        const results = [];
        const discrepancies = [];

        for (const inventory of inventories) {
            // Tính tổng từ batches (active + expired, không tính disposed)
            const batchTotal = await prisma.productBatch.aggregate({
                where: {
                    branch_id: Number(branchId),
                    product_id: inventory.product_id,
                    status: { in: ['active', 'expired'] }
                },
                _sum: { quantity: true }
            });

            const batchQuantity = batchTotal._sum.quantity || 0;
            const inventoryQuantity = inventory.stock || 0;
            const difference = inventoryQuantity - batchQuantity;

            const result = {
                product_id: inventory.product_id,
                product_name: inventory.products?.name,
                inventory_stock: inventoryQuantity,
                batch_total: batchQuantity,
                difference: difference,
                is_consistent: difference === 0
            };

            results.push(result);

            if (difference !== 0) {
                discrepancies.push(result);
            }
        }

        return {
            success: true,
            data: {
                branch_id: branchId,
                total_products: results.length,
                consistent_products: results.filter(r => r.is_consistent).length,
                inconsistent_products: discrepancies.length,
                discrepancies: discrepancies,
                checked_at: new Date()
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Check reservation status - tìm reservation bị stuck
 */
export const checkStuckReservations = async () => {
    try {
        const now = new Date();

        // Tìm reservations active nhưng đã quá hạn
        const stuckReservations = await prisma.inventoryReservation.findMany({
            where: {
                status: 'active',
                expires_at: { lt: now }
            },
            include: {
                orders: { select: { id: true, status: true } },
                products: { select: { id: true, name: true } },
                branches: { select: { id: true, name: true } }
            }
        });

        // Tìm reservations đã completed nhưng order vẫn pending quá lâu (>24h)
        const suspiciousReservations = await prisma.inventoryReservation.findMany({
            where: {
                status: 'completed',
                updated_at: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                orders: {
                    status: 'pending'
                }
            },
            include: {
                orders: { select: { id: true, status: true, order_date: true } },
                products: { select: { id: true, name: true } }
            }
        });

        return {
            success: true,
            data: {
                stuck_reservations: {
                    count: stuckReservations.length,
                    items: stuckReservations.map(r => ({
                        id: r.id,
                        order_id: r.order_id,
                        order_status: r.orders?.status,
                        product_id: r.product_id,
                        product_name: r.products?.name,
                        branch_name: r.branches?.name,
                        quantity: r.quantity,
                        expires_at: r.expires_at,
                        hours_overdue: Math.round((now - new Date(r.expires_at)) / (60 * 60 * 1000))
                    }))
                },
                suspicious_reservations: {
                    count: suspiciousReservations.length,
                    items: suspiciousReservations.map(r => ({
                        id: r.id,
                        order_id: r.order_id,
                        order_status: r.orders?.status,
                        order_date: r.orders?.order_date,
                        product_name: r.products?.name,
                        quantity: r.quantity
                    }))
                },
                checked_at: now
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Check inventory logs consistency
 * Verify SUM của logs khớp với stock hiện tại
 */
export const checkInventoryLogsConsistency = async (branchId, productId) => {
    try {
        // Lấy stock hiện tại
        const inventory = await prisma.branchinventory.findFirst({
            where: {
                branch_id: Number(branchId),
                product_id: Number(productId)
            }
        });

        if (!inventory) {
            return {
                success: false,
                error: 'Không tìm thấy inventory record'
            };
        }

        // Tính stock từ logs
        // ✅ Convention mới: quantity DƯƠNG, type quyết định chiều
        const logs = await prisma.inventoryLog.findMany({
            where: {
                branch_id: Number(branchId),
                product_id: Number(productId)
            },
            select: {
                id: true,
                quantity: true,
                type: true,
                date: true
            }
        });

        let calculatedStock = 0;
        const logSummary = {
            IMPORT: 0,
            EXPORT: 0,
            OUT: 0,
            RETURN: 0,
            CANCEL_RETURN: 0,
            ADJUSTMENT: 0,
            TRANSFER_IN: 0,
            TRANSFER_OUT: 0,
            DAMAGE: 0,
            DISPOSAL: 0,
            other: 0
        };

        for (const log of logs) {
            const absQuantity = Math.abs(log.quantity);

            // Tính theo convention mới
            if (INVENTORY_INCREASE_TYPES.includes(log.type)) {
                calculatedStock += absQuantity;
                if (logSummary[log.type] !== undefined) {
                    logSummary[log.type] += absQuantity;
                }
            } else if (INVENTORY_DECREASE_TYPES.includes(log.type)) {
                calculatedStock -= absQuantity;
                if (logSummary[log.type] !== undefined) {
                    logSummary[log.type] += absQuantity;
                }
            } else {
                logSummary.other += absQuantity;
            }
        }

        const currentStock = inventory.stock || 0;
        const difference = currentStock - calculatedStock;

        return {
            success: true,
            data: {
                branch_id: branchId,
                product_id: productId,
                current_stock: currentStock,
                calculated_from_logs: calculatedStock,
                difference: difference,
                is_consistent: difference === 0,
                log_summary: logSummary,
                total_logs: logs.length,
                checked_at: new Date()
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get overall inventory health status
 */
export const getInventoryHealthStatus = async () => {
    try {
        const now = new Date();

        // Parallel queries cho performance
        const [
            totalBranches,
            totalProducts,
            totalInventoryRecords,
            lowStockCount,
            outOfStockCount,
            expiredBatchCount,
            expiringSoonCount,
            activeReservationsCount,
            stuckReservationsCount
        ] = await Promise.all([
            prisma.branches.count({ where: { is_active: true } }),
            prisma.products.count({ where: { is_active: true } }),
            prisma.branchinventory.count(),
            // Low stock: stock <= min_stock
            prisma.branchinventory.count({
                where: {
                    min_stock: { not: null },
                    stock: { lte: prisma.branchinventory.fields.min_stock }
                }
            }).catch(() => 0), // Fallback if query fails
            // Out of stock
            prisma.branchinventory.count({ where: { stock: 0 } }),
            // Expired batches
            prisma.productBatch.count({
                where: {
                    status: 'expired',
                    quantity: { gt: 0 }
                }
            }),
            // Expiring in 30 days
            prisma.productBatch.count({
                where: {
                    status: 'active',
                    expiry_date: {
                        gte: now,
                        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                    },
                    quantity: { gt: 0 }
                }
            }),
            // Active reservations
            prisma.inventoryReservation.count({ where: { status: 'active' } }),
            // Stuck reservations (expired but still active)
            prisma.inventoryReservation.count({
                where: {
                    status: 'active',
                    expires_at: { lt: now }
                }
            })
        ]);

        // Calculate health score (0-100)
        let healthScore = 100;

        // Deduct points for issues
        if (outOfStockCount > 0) healthScore -= Math.min(20, outOfStockCount * 2);
        if (expiredBatchCount > 0) healthScore -= Math.min(15, expiredBatchCount * 3);
        if (stuckReservationsCount > 0) healthScore -= Math.min(25, stuckReservationsCount * 5);
        if (expiringSoonCount > 10) healthScore -= Math.min(10, expiringSoonCount);

        healthScore = Math.max(0, healthScore);

        // Determine status
        let status = 'healthy';
        if (healthScore < 50) status = 'critical';
        else if (healthScore < 70) status = 'warning';
        else if (healthScore < 90) status = 'good';

        return {
            success: true,
            data: {
                status,
                health_score: healthScore,
                summary: {
                    total_branches: totalBranches,
                    total_products: totalProducts,
                    total_inventory_records: totalInventoryRecords
                },
                issues: {
                    out_of_stock: outOfStockCount,
                    low_stock: lowStockCount,
                    expired_batches: expiredBatchCount,
                    expiring_soon_batches: expiringSoonCount,
                    stuck_reservations: stuckReservationsCount,
                    active_reservations: activeReservationsCount
                },
                recommendations: generateRecommendations({
                    outOfStockCount,
                    expiredBatchCount,
                    stuckReservationsCount,
                    expiringSoonCount
                }),
                checked_at: now
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Generate recommendations based on issues
 */
const generateRecommendations = ({ outOfStockCount, expiredBatchCount, stuckReservationsCount, expiringSoonCount }) => {
    const recommendations = [];

    if (stuckReservationsCount > 0) {
        recommendations.push({
            priority: 'high',
            type: 'stuck_reservations',
            message: `Có ${stuckReservationsCount} reservation bị stuck. Chạy cleanup job ngay.`,
            action: 'POST /api/inventory/reservations/cleanup'
        });
    }

    if (expiredBatchCount > 0) {
        recommendations.push({
            priority: 'high',
            type: 'expired_batches',
            message: `Có ${expiredBatchCount} lô hàng hết hạn cần xử lý tiêu hủy.`,
            action: 'GET /api/inventory/batches?status=expired'
        });
    }

    if (outOfStockCount > 5) {
        recommendations.push({
            priority: 'medium',
            type: 'out_of_stock',
            message: `Có ${outOfStockCount} sản phẩm hết hàng. Cần nhập thêm hàng.`,
            action: 'GET /api/inventory/low-stock'
        });
    }

    if (expiringSoonCount > 10) {
        recommendations.push({
            priority: 'medium',
            type: 'expiring_soon',
            message: `Có ${expiringSoonCount} lô hàng sắp hết hạn trong 30 ngày. Ưu tiên bán trước.`,
            action: 'GET /api/inventory/batches?expiring_soon=true'
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            priority: 'info',
            type: 'all_good',
            message: 'Hệ thống inventory đang hoạt động tốt.',
            action: null
        });
    }

    return recommendations;
};

/**
 * Auto-fix stuck reservations
 */
export const fixStuckReservations = async () => {
    try {
        const now = new Date();

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

        return {
            success: true,
            data: {
                fixed_count: result.count,
                fixed_at: now
            },
            message: `Đã chuyển ${result.count} reservation sang trạng thái expired`
        };
    } catch (error) {
        throw error;
    }
};

export default {
    checkBranchInventoryConsistency,
    checkStuckReservations,
    checkInventoryLogsConsistency,
    getInventoryHealthStatus,
    fixStuckReservations
};
