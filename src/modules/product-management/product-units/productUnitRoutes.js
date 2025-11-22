import express from 'express';
import * as productUnitController from './productUnitController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - User có thể xem đơn vị sản phẩm
router.get('/productunits', productUnitController.getAllProductUnits);
router.get('/productunits/:id', validateId(), productUnitController.getProductUnitById);
router.get('/product-units/product/:productId', validateId('productId'), productUnitController.getProductUnitsByProduct);

// Admin only routes - Chỉ admin mới được quản lý đơn vị sản phẩm
router.post('/productunits', authenticateToken, authorizeAdmin, productUnitController.createProductUnit);
router.put('/productunits/:id', authenticateToken, authorizeAdmin, validateId(), productUnitController.updateProductUnit);
router.delete('/productunits/:id', authenticateToken, authorizeAdmin, validateId(), productUnitController.deleteProductUnit);

export default router;