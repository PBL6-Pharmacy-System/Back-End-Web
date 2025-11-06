import express from 'express';
import * as supplierController from './supplierController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - Có thể xem danh sách suppliers
router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', validateId(), supplierController.getSupplierById);

// Admin only routes - Chỉ admin mới được thêm/sửa/xóa
router.post('/suppliers', authenticateToken, authorizeAdmin, supplierController.createSupplier);
router.put('/suppliers/:id', authenticateToken, authorizeAdmin, validateId(), supplierController.updateSupplier);
router.delete('/suppliers/:id', authenticateToken, authorizeAdmin, validateId(), supplierController.deleteSupplier);

export default router;