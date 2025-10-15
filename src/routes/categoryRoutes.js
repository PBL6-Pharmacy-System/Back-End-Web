import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
const router = express.Router();

// Lấy tất cả danh mục (có sản phẩm con)
router.get('/categories', categoryController.getAllCategories);
// Lấy chi tiết danh mục
router.get('/categories/:id', categoryController.getCategoryById);
// Tạo mới danh mục
router.post('/categories', categoryController.createCategory);
// Cập nhật danh mục
router.put('/categories/:id', categoryController.updateCategory);
// Xóa danh mục (chỉ khi không còn sản phẩm con)
router.delete('/categories/:id', categoryController.deleteCategory);

export default router;