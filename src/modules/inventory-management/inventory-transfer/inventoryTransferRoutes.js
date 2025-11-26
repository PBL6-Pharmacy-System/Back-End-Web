import express from 'express';
import * as inventoryTransferController from './inventoryTransferController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Admin/Staff only routes - Quản lý chuyển kho giữa chi nhánh
router.get('/inventory-transfers',
  authenticateToken,
  authorizeAdminOrStaff,
  inventoryTransferController.getAllTransfers
);

router.get('/inventory-transfers/:id',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  inventoryTransferController.getTransferById
);

// Tạo phiếu chuyển kho
// ⚠️ Staff branch authorization được check trong controller (validate from_branch_id)
router.post('/inventory-transfers',
  authenticateToken,
  authorizeAdminOrStaff,
  inventoryTransferController.createTransferRequest
);

// Duyệt phiếu - Admin only
router.post('/inventory-transfers/:id/approve',
  authenticateToken,
  authorizeAdmin,
  validateId(),
  inventoryTransferController.approveTransfer
);

// Xuất kho - Staff chi nhánh nguồn
// ⚠️ Staff branch authorization được check trong controller (validate from_branch_id)
router.post('/inventory-transfers/:id/ship',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  inventoryTransferController.shipTransfer
);

// Nhận kho - Staff chi nhánh đích
// ⚠️ Staff branch authorization được check trong controller (validate to_branch_id)
router.post('/inventory-transfers/:id/receive',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  inventoryTransferController.receiveTransfer
);

// Hủy phiếu
router.post('/inventory-transfers/:id/cancel',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  inventoryTransferController.cancelTransfer
);

export default router;
