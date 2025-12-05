import express from 'express';
import * as branchInventoryController from './branchInventoryController.js';
import { authenticateToken, authorizeAdmin, authorizeAdminOrStaff } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// ===============================================
// GLOBAL INVENTORY ROUTES (Cross-branch)
// ===============================================

// GET /api/branch-inventory - Xem tất cả tồn kho (có thể filter theo branch)
// Admin: xem tất cả, Staff: chỉ xem chi nhánh của mình
router.get('/branch-inventory',
  authenticateToken,
  authorizeAdminOrStaff,
  branchInventoryController.getAllBranchInventory
);

// GET /api/branch-inventory/alerts/low-stock - Cảnh báo tồn kho thấp
router.get('/branch-inventory/alerts/low-stock',
  authenticateToken,
  authorizeAdminOrStaff,
  branchInventoryController.getLowStockItems
);

// GET /api/branch-inventory/:id - Xem chi tiết 1 bản ghi inventory
router.get('/branch-inventory/:id',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  branchInventoryController.getBranchInventoryById
);

// ===============================================
// ADMIN ONLY ROUTES
// ===============================================

// POST /api/branch-inventory - Tạo bản ghi inventory mới (Admin only)
router.post('/branch-inventory',
  authenticateToken,
  authorizeAdmin,
  branchInventoryController.createBranchInventory
);

// DELETE /api/branch-inventory/:id - Xóa bản ghi inventory (Admin only)
router.delete('/branch-inventory/:id',
  authenticateToken,
  authorizeAdmin,
  validateId(),
  branchInventoryController.deleteBranchInventory
);

// ===============================================
// DEPRECATED ROUTES (Backward Compatibility)
// ===============================================
// Redirect từ /branchinventory → /branch-inventory

router.get('/branchinventory', (req, res) => {
  res.redirect(308, `/api/branch-inventory?${new URLSearchParams(req.query)}`);
});

router.get('/branchinventory/:id', (req, res) => {
  res.redirect(308, `/api/branch-inventory/${req.params.id}`);
});

// ===============================================
// NOTE: Các routes nested đã được di chuyển sang /branches/:branchId/inventory
// - GET /branches/:branchId/inventory → Xem tồn kho chi nhánh
// - GET /branches/:branchId/inventory/:productId → Xem chi tiết lô hàng
// - PUT /branches/:branchId/inventory/:productId → Cập nhật tồn kho
// ===============================================

export default router;