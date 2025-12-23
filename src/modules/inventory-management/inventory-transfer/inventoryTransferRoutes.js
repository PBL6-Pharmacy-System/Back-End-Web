import express from 'express';
import * as inventoryTransferController from './inventoryTransferController.js';
import {
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeAdmin,
  authorizeTransferBranch,
  authorizeCreateTransfer
} from '../../auth/auth.middleware.js';
import { validateId, validateTextFields } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Validators
const validateTransferNote = validateTextFields({
  fields: ['note'],
  maxLength: 1000,
  required: false
});

const validateCancelReason = validateTextFields({
  fields: ['reason'],
  maxLength: 500,
  required: true
});

// GET /api/inventory-transfers - Lấy danh sách chuyển kho
router.get('/inventory-transfers',
  authenticateToken,
  authorizeAdminOrStaff,
  inventoryTransferController.getAllTransfers
);

// GET /api/inventory-transfers/:id - Lấy chi tiết chuyển kho
router.get('/inventory-transfers/:id',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  inventoryTransferController.getTransferById
);

// POST /api/inventory-transfers - Tạo phiếu chuyển kho
// ✅ Middleware authorizeCreateTransfer kiểm tra Staff chỉ tạo từ chi nhánh của mình
router.post('/inventory-transfers',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeCreateTransfer,
  validateTransferNote,
  inventoryTransferController.createTransferRequest
);

// POST /api/inventory-transfers/:id/approve - Duyệt phiếu (Admin only)
router.post('/inventory-transfers/:id/approve',
  authenticateToken,
  authorizeAdmin,
  validateId(),
  inventoryTransferController.approveTransfer
);

// POST /api/inventory-transfers/:id/ship - Xuất kho
// ✅ Middleware authorizeTransferBranch('from') kiểm tra Staff chỉ xuất từ chi nhánh nguồn
router.post('/inventory-transfers/:id/ship',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  authorizeTransferBranch('from'),
  inventoryTransferController.shipTransfer
);

// POST /api/inventory-transfers/:id/receive - Nhận kho
// ✅ Middleware authorizeTransferBranch('to') kiểm tra Staff chỉ nhận tại chi nhánh đích
router.post('/inventory-transfers/:id/receive',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  authorizeTransferBranch('to'),
  inventoryTransferController.receiveTransfer
);

// POST /api/inventory-transfers/:id/cancel - Hủy phiếu
// ✅ Middleware authorizeTransferBranch('from') kiểm tra Staff chỉ hủy phiếu của chi nhánh mình
router.post('/inventory-transfers/:id/cancel',
  authenticateToken,
  authorizeAdminOrStaff,
  validateId(),
  authorizeTransferBranch('from'),
  validateCancelReason,
  inventoryTransferController.cancelTransfer
);

export default router;
