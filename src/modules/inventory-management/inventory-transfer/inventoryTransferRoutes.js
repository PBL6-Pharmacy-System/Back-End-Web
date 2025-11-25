import express from 'express';
import * as inventoryTransferController from './inventoryTransferController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch, authorizeAdmin } from '../../auth/auth.middleware.js';
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

// Tạo phiếu chuyển kho - Staff chỉ có thể chuyển từ chi nhánh của mình
router.post('/inventory-transfers',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeStaffBranch,
  inventoryTransferController.createTransferRequest
);

// Duyệt phiếu - Admin hoặc Manager
router.post('/inventory-transfers/:id/approve',
  authenticateToken,
  authorizeAdmin,
  validateId(),
  inventoryTransferController.approveTransfer
);

// Xuất kho - Staff chi nhánh nguồn
router.post('/inventory-transfers/:id/ship',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeStaffBranch,
  validateId(),
  inventoryTransferController.shipTransfer
);

// Nhận kho - Staff chi nhánh đích
router.post('/inventory-transfers/:id/receive',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeStaffBranch,
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
