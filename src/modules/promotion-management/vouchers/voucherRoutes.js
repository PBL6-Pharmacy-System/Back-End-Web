import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import * as voucherController from './voucherController.js';

const router = express.Router();

// ========================================
// PUBLIC ROUTES - User xem vouchers
// ========================================

// 1. Lấy vouchers của customer hiện tại (đã được assign)
// GET /vouchers - PHẢI ĐẶT TRƯỚC /vouchers/available
router.get('/vouchers', authenticateToken, voucherController.getCustomerVouchers);

// 2. Lấy danh sách vouchers đang active (user có thể dùng)
router.get('/vouchers/available', authenticateToken, voucherController.getAvailableVouchers);

// 3. Validate voucher code (check có hợp lệ không trước khi checkout)
router.get('/vouchers/check/:code', authenticateToken, voucherController.validateVoucherCode);

// 4. Chi tiết voucher cụ thể bằng ID
router.get('/vouchers/:id', authenticateToken, validateId(), voucherController.getVoucherById);

// ========================================
// ADMIN ROUTES - Quản lý vouchers
// ========================================

// Lấy tất cả vouchers (bao gồm cả expired) - CHỈ ADMIN
router.get('/admin/vouchers', authenticateToken, authorizeAdmin, voucherController.getAllVouchers);

// Tạo voucher mới
router.post('/admin/vouchers', authenticateToken, authorizeAdmin, voucherController.createVoucher);

// Sửa voucher
router.put('/admin/vouchers/:id', authenticateToken, authorizeAdmin, validateId(), voucherController.updateVoucher);

// Xóa voucher (chỉ xóa được nếu chưa dùng)
router.delete('/admin/vouchers/:id', authenticateToken, authorizeAdmin, validateId(), voucherController.deleteVoucher);

// ========================================
// NOTE: KHÔNG CÓ API "applyVoucher"
// Voucher được apply tự động trong checkout flow
// Xem: src/modules/order-management/cart/checkoutService.js
// ========================================

export default router;