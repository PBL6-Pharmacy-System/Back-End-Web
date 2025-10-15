import express from 'express';
import * as branchInventoryController from '../controllers/branchInventoryController.js';
const router = express.Router();

// Lấy tất cả tồn kho chi nhánh
router.get('/branchinventory', branchInventoryController.getAllBranchInventory);
// Lấy chi tiết tồn kho
router.get('/branchinventory/:id', branchInventoryController.getBranchInventoryById);
// Nhập hàng vào kho
router.post('/branchinventory/import', branchInventoryController.importToBranchInventory);
// Xuất hàng khỏi kho
router.post('/branchinventory/export', branchInventoryController.exportFromBranchInventory);
// Tạo mới tồn kho (khởi tạo)
router.post('/branchinventory', branchInventoryController.createBranchInventory);
// Cập nhật tồn kho (sửa số lượng thủ công)
router.put('/branchinventory/:id', branchInventoryController.updateBranchInventory);
// Xóa tồn kho
router.delete('/branchinventory/:id', branchInventoryController.deleteBranchInventory);

export default router;