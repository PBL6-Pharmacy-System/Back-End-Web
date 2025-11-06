import express from 'express';
import * as voucherController from './voucherController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - User có thể xem vouchers
router.get('/vouchers', voucherController.getAllVouchers);
router.get('/vouchers/:id', validateId(), voucherController.getVoucherById);

// Admin only routes - Chỉ admin mới được quản lý vouchers
router.post('/vouchers', authenticateToken, authorizeAdmin, voucherController.createVoucher);
router.put('/vouchers/:id', authenticateToken, authorizeAdmin, validateId(), voucherController.updateVoucher);
router.delete('/vouchers/:id', authenticateToken, authorizeAdmin, validateId(), voucherController.deleteVoucher);

export default router;