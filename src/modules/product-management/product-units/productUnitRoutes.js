import express from 'express';
import * as productUnitController from './productUnitController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - User có thể xem đơn vị sản phẩm
// ✅ Fixed: Consistent kebab-case naming with backward compatibility
router.get('/product-units', productUnitController.getAllProductUnits);
router.get('/product-units/:id', validateId(), productUnitController.getProductUnitById);
router.get('/product-units/product/:productId', validateId('productId'), productUnitController.getProductUnitsByProduct);

// Admin only routes - Chỉ admin mới được quản lý đơn vị sản phẩm
router.post('/product-units', authenticateToken, authorizeAdmin, productUnitController.createProductUnit);
router.put('/product-units/:id', authenticateToken, authorizeAdmin, validateId(), productUnitController.updateProductUnit);
router.delete('/product-units/:id', authenticateToken, authorizeAdmin, validateId(), productUnitController.deleteProductUnit);

// ===============================================
// DEPRECATED ROUTES (Backward Compatibility)
// ===============================================
router.get('/productunits', (req, res) => {
    res.redirect(308, `/api/product-units?${new URLSearchParams(req.query)}`);
});
router.get('/productunits/:id', (req, res) => {
    res.redirect(308, `/api/product-units/${req.params.id}`);
});

export default router;