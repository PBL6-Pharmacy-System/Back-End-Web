import express from 'express';
import * as branchInventoryController from '../controllers/branchInventoryController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Protected routes - Cần authentication để xem inventory
router.get('/branchinventory', authenticateToken, branchInventoryController.getAllBranchInventory);
router.get('/branchinventory/:id', authenticateToken, validateId(), branchInventoryController.getBranchInventoryById);

// Staff/Admin routes - Nhập/xuất hàng
router.post('/branchinventory/import', authenticateToken, authorizeRoles('admin', 'staff'), branchInventoryController.importToBranchInventory);
router.post('/branchinventory/export', authenticateToken, authorizeRoles('admin', 'staff'), branchInventoryController.exportFromBranchInventory);

// Admin only routes - Quản lý tồn kho
router.post('/branchinventory', authenticateToken, authorizeAdmin, branchInventoryController.createBranchInventory);
router.put('/branchinventory/:id', authenticateToken, authorizeAdmin, validateId(), branchInventoryController.updateBranchInventory);
router.delete('/branchinventory/:id', authenticateToken, authorizeAdmin, validateId(), branchInventoryController.deleteBranchInventory);

export default router;