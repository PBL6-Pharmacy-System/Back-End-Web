import express from 'express';
import * as inventoryStatisticsController from './inventoryStatisticsController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Admin/Staff only routes - Thống kê tồn kho
router.get('/statistics/inventory/overview',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getInventoryOverview
);

router.get('/statistics/inventory/branch/:branchId',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryStatisticsController.getInventoryByBranch
);

router.get('/statistics/inventory/low-stock',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getLowStockProducts
);

router.get('/statistics/inventory/overstock',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getOverstockProducts
);

router.get('/statistics/inventory/movements',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getInventoryMovementReport
);

router.get('/statistics/inventory/top-imported',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getTopImportedProducts
);

router.get('/statistics/inventory/top-exported',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getTopExportedProducts
);

router.get('/statistics/inventory/by-category',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryStatisticsController.getInventoryByCategory
);

export default router;
