import express from 'express';
import * as branchController from './branchController.js';
import * as branchInventoryController from '../branch-inventory/branchInventoryController.js';
import { authenticateToken, authorizeAdmin, authorizeAdminOrStaff, authorizeStaffBranch, optionalAuth } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// ===============================================
// PUBLIC ROUTES - Branch Information
// ===============================================

// Get all branches (Public access - chỉ thông tin cơ bản)
router.get('/branches', branchController.getAllBranches);

// Get branch by ID (Public access - chỉ thông tin cơ bản)
router.get('/branches/:id', validateId(), branchController.getBranchById);

// ===============================================
// BRANCH INVENTORY ROUTES (Nested Resources)
// ⚠️ SECURITY: Áp dụng optionalAuth để mask sensitive data cho Public/Customer
// ===============================================

// GET /branches/:branchId/inventory - Xem tất cả tồn kho của chi nhánh
// ✅ Staff có thể READ cross-branch (xem chi nhánh khác)
// ⚠️ Public/Customer chỉ xem được in_stock (boolean), không xem số lượng chính xác
router.get('/branches/:branchId/inventory',
    optionalAuth, // ✅ Changed: Optional auth để support cả Public và Staff
    validateId('branchId'),
    branchInventoryController.getBranchInventoryByBranchId
);

// GET /branches/:branchId/inventory/:productId - Xem chi tiết lô hàng của 1 sản phẩm
// ✅ Staff: Xem được chi tiết lô hàng, giá nhập, supplier (READ cross-branch)
// ⚠️ Public/Customer: Chỉ xem in_stock, expiry_date (masked)
router.get('/branches/:branchId/inventory/:productId',
    optionalAuth, // ✅ Changed: Optional auth để mask data cho Public
    validateId('branchId'),
    (req, res, next) => {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'productId phải là số nguyên dương'
            });
        }
        next();
    },
    branchController.getBranchInventoryDetails
);

// GET /branches/:branchId/inventory/alerts/expiring-soon
// 🔒 CHANGED: Staff/Admin ONLY - Public KHÔNG ĐƯỢC xem batch information
router.get('/branches/:branchId/inventory/alerts/expiring-soon',
    authenticateToken,  // ✅ Required authentication (không còn optionalAuth)
    authorizeAdminOrStaff,  // ✅ Chỉ Staff/Admin
    validateId('branchId'),
    branchController.getBranchExpiringSoonBatches
);

// GET /branches/:branchId/inventory/alerts/low-stock
// 🔒 CHANGED: Staff/Admin ONLY - Thông tin kinh doanh nội bộ
router.get('/branches/:branchId/inventory/alerts/low-stock',
    authenticateToken,  // ✅ Required authentication
    authorizeAdminOrStaff,  // ✅ Chỉ Staff/Admin
    validateId('branchId'),
    branchInventoryController.getBranchLowStockItems
);

// PUT /branches/:branchId/inventory/:productId - Cập nhật tồn kho thủ công
// ✅ WRITE PERMISSION: Staff chỉ được update own branch
router.put('/branches/:branchId/inventory/:productId',
    authenticateToken,
    authorizeAdminOrStaff,
    authorizeStaffBranch, // ✅ Added: Staff chỉ được WRITE own branch
    validateId('branchId'),
    (req, res, next) => {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'productId phải là số nguyên dương'
            });
        }
        req.params.productId = productId;
        next();
    },
    branchInventoryController.updateBranchInventoryByBranchProduct
);

// ===============================================
// ADMIN ONLY ROUTES
// ===============================================

// POST /branches - Tạo chi nhánh mới
router.post('/branches',
    authenticateToken,
    authorizeAdmin,
    branchController.createBranch
);

// PUT /branches/:id - Cập nhật chi nhánh
router.put('/branches/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    branchController.updateBranch
);

// DELETE /branches/:id - Xóa chi nhánh
router.delete('/branches/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    branchController.deleteBranch
);

export default router;