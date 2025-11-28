/**
 * Inventory Health Check Routes
 * API endpoints để monitor inventory consistency
 * 
 * @module routes/inventoryHealthCheckRoutes
 */

import express from 'express';
import { authenticateToken } from '../../middlewares/validate.middleware.js';
import { adminOnly, staffOrAdmin } from '../../middlewares/adminOnly.middleware.js';
import * as healthCheckService from './inventoryHealthCheck.js';

const router = express.Router();

/**
 * @route GET /api/inventory/health
 * @desc Get overall inventory health status
 * @access Admin/Staff
 */
router.get('/health', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const result = await healthCheckService.getInventoryHealthStatus();
        res.json(result);
    } catch (error) {
        console.error('[InventoryHealth] Error getting health status:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi kiểm tra trạng thái inventory'
        });
    }
});

/**
 * @route GET /api/inventory/health/branch/:branchId
 * @desc Check inventory consistency for a specific branch
 * @access Admin/Staff
 */
router.get('/health/branch/:branchId', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { branchId } = req.params;
        const result = await healthCheckService.checkBranchInventoryConsistency(branchId);
        res.json(result);
    } catch (error) {
        console.error('[InventoryHealth] Error checking branch consistency:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi kiểm tra consistency của chi nhánh'
        });
    }
});

/**
 * @route GET /api/inventory/health/logs/:branchId/:productId
 * @desc Check inventory logs consistency for a specific product at a branch
 * @access Admin/Staff
 */
router.get('/health/logs/:branchId/:productId', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { branchId, productId } = req.params;
        const result = await healthCheckService.checkInventoryLogsConsistency(branchId, productId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('[InventoryHealth] Error checking logs consistency:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi kiểm tra consistency của logs'
        });
    }
});

/**
 * @route GET /api/inventory/health/reservations
 * @desc Check stuck reservations
 * @access Admin/Staff
 */
router.get('/health/reservations', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const result = await healthCheckService.checkStuckReservations();
        res.json(result);
    } catch (error) {
        console.error('[InventoryHealth] Error checking reservations:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi kiểm tra reservations'
        });
    }
});

/**
 * @route POST /api/inventory/health/reservations/fix
 * @desc Auto-fix stuck reservations
 * @access Admin only
 */
router.post('/health/reservations/fix', authenticateToken, adminOnly, async (req, res) => {
    try {
        const result = await healthCheckService.fixStuckReservations();
        res.json(result);
    } catch (error) {
        console.error('[InventoryHealth] Error fixing reservations:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi fix reservations'
        });
    }
});

export default router;
