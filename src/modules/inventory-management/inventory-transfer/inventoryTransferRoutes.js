import express from 'express';
import * as inventoryTransferController from './inventoryTransferController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Admin/Staff only routes - Quản lý chuyển kho giữa chi nhánh
router.get('/inventory-transfers',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryTransferController.getAllTransfers
);

router.get('/inventory-transfers/:id',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryTransferController.getTransferById
);

router.post('/inventory-transfers',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  inventoryTransferController.createTransferRequest
);

router.post('/inventory-transfers/:id/approve',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryTransferController.approveTransfer
);

router.post('/inventory-transfers/:id/ship',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryTransferController.shipTransfer
);

router.post('/inventory-transfers/:id/receive',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryTransferController.receiveTransfer
);

router.post('/inventory-transfers/:id/cancel',
  authenticateToken,
  authorizeRoles('admin', 'staff'),
  validateId(),
  inventoryTransferController.cancelTransfer
);

export default router;
