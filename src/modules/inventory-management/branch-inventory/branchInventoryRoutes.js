import express from 'express';
import * as branchInventoryController from './branchInventoryController.js';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Stock query routes - Lấy thông tin tồn kho (phải đặt trước các route dynamic)
router.get('/stock/products', authenticateToken, branchInventoryController.getAllProductsWithStock);
router.get('/stock/low-stock', authenticateToken, branchInventoryController.getAllLowStockProducts);
router.get('/stock/statistics/branches/:branchId', authenticateToken, validateId('branchId'), branchInventoryController.getStockStatisticsByBranch);
router.get('/stock/products/:productId/total', authenticateToken, validateId('productId'), branchInventoryController.getProductTotalStock);
router.get('/stock/products/:productId/branches/:branchId', authenticateToken, (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const branchId = parseInt(req.params.branchId);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ success: false, error: 'productId phải là số nguyên dương' });
  }
  if (isNaN(branchId) || branchId <= 0) {
    return res.status(400).json({ success: false, error: 'branchId phải là số nguyên dương' });
  }
  req.params.productId = productId;
  req.params.branchId = branchId;
  next();
}, branchInventoryController.getProductStockByBranch);

// Protected routes - Cần authentication để xem inventory
router.get('/branchinventory', authenticateToken, branchInventoryController.getAllBranchInventory);
router.get('/branchinventory/:id', authenticateToken, validateId(), branchInventoryController.getBranchInventoryById);

// Staff/Admin routes - Nhập/xuất hàng
router.post('/branchinventory/import', authenticateToken, authorizeRoles('admin', 'staff'), branchInventoryController.importToBranchInventory);
router.post('/branchinventory/export', authenticateToken, authorizeRoles('admin', 'staff'), branchInventoryController.exportFromBranchInventory);

// Admin only routes - Quản lý tồn kho
router.post('/branchinventory', authenticateToken, authorizeAdmin, branchInventoryController.createBranchInventory);
router.put('/branchinventory/:id', authenticateToken, authorizeRoles('admin', 'staff'), validateId(), branchInventoryController.updateBranchInventory);
router.delete('/branchinventory/:id', authenticateToken, authorizeAdmin, validateId(), branchInventoryController.deleteBranchInventory);

export default router;