import express from 'express';
import * as supplierController from './supplierController.js';
import { authenticateToken, authorizeAdmin, optionalAuth } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// ===============================================
// PUBLIC ROUTES - Xem danh sách suppliers
// ✅ Sử dụng optionalAuth để mask thông tin nhạy cảm cho public users
// ===============================================
router.get('/suppliers', optionalAuth, supplierController.getAllSuppliers);
router.get('/suppliers/:id', optionalAuth, validateId(), supplierController.getSupplierById);

// ===============================================
// ADMIN ONLY ROUTES - Quản lý suppliers (full info)
// ===============================================
router.post('/suppliers', authenticateToken, authorizeAdmin, supplierController.createSupplier);
router.put('/suppliers/:id', authenticateToken, authorizeAdmin, validateId(), supplierController.updateSupplier);
router.delete('/suppliers/:id', authenticateToken, authorizeAdmin, validateId(), supplierController.deleteSupplier);

export default router;