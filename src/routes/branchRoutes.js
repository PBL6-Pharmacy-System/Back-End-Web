import express from 'express';
import * as branchController from '../controllers/branchController.js';
const router = express.Router();

// Lấy tất cả chi nhánh (có tồn kho)
router.get('/branches', branchController.getAllBranches);
// Lấy chi tiết chi nhánh (có tồn kho)
router.get('/branches/:id', branchController.getBranchById);
// Tạo mới chi nhánh
router.post('/branches', branchController.createBranch);
// Cập nhật chi nhánh
router.put('/branches/:id', branchController.updateBranch);
// Xóa chi nhánh (chỉ khi không còn tồn kho hoặc shipment liên quan)
router.delete('/branches/:id', branchController.deleteBranch);

export default router;