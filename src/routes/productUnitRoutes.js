import express from 'express';
import * as productUnitController from '../controllers/productUnitController.js';
const router = express.Router();

// Lấy tất cả đơn vị sản phẩm
router.get('/productunits', productUnitController.getAllProductUnits);
// Lấy chi tiết đơn vị sản phẩm
router.get('/productunits/:id', productUnitController.getProductUnitById);
// Tạo mới đơn vị sản phẩm
router.post('/productunits', productUnitController.createProductUnit);
// Cập nhật đơn vị sản phẩm
router.put('/productunits/:id', productUnitController.updateProductUnit);
// Xóa đơn vị sản phẩm
router.delete('/productunits/:id', productUnitController.deleteProductUnit);

export default router;