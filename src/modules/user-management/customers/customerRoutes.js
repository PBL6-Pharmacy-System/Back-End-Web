import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin, authorizeOwnerOrAdmin } from '../../auth/auth.middleware.js';
import * as customerController from './customerController.js';

const router = express.Router();

// Admin only - Xem tất cả customers
router.get('/customers', authenticateToken, authorizeAdmin, customerController.getAllCustomers);

// ✅ FIXED: Protected routes - Customer chỉ có thể xem/sửa thông tin của MÌNH, Admin xem được tất cả
router.get('/customers/:id',
    authenticateToken,
    validateId(),
    // ✅ FIX: Kiểm tra customer_id trong req.user.customer_id === req.params.id
    (req, res, next) => {
        // Admin có quyền xem tất cả
        if (req.user.role_name === 'admin') {
            return next();
        }

        // Customer chỉ xem được thông tin của mình
        if (req.user.customer_id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể xem thông tin của chính mình'
            });
        }
        next();
    },
    customerController.getCustomerById
);

router.put('/customers/:id',
    authenticateToken,
    validateId(),
    // ✅ FIX: Kiểm tra ownership
    (req, res, next) => {
        if (req.user.role_name === 'admin') {
            return next();
        }

        if (req.user.customer_id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể cập nhật thông tin của chính mình'
            });
        }
        next();
    },
    customerController.updateCustomer
);

// ✅ FIXED: Chỉ Admin mới có thể tạo customer thủ công (tránh bypass OTP flow)
router.post('/customers', authenticateToken, authorizeAdmin, customerController.createCustomer);

// Admin only - Xóa customer
router.delete('/customers/:id', authenticateToken, authorizeAdmin, validateId(), customerController.deleteCustomer);

// ✅ REMOVED: Duplicate route /customers/:id/orders 
// Endpoint này đã có trong orderRoutes.js với logic đầy đủ hơn
// Use: GET /api/customers/:customerId/orders from orderRoutes.js instead

// ✅ FIXED: Customer stats - Chỉ xem được stats của mình
router.get('/customers/:id/stats',
    authenticateToken,
    validateId(),
    (req, res, next) => {
        if (req.user.role_name === 'admin') {
            return next();
        }

        if (req.user.customer_id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể xem thống kê của chính mình'
            });
        }
        next();
    },
    customerController.getCustomerStats
);

// ✅ FIXED: Customer reviews - Chỉ xem được reviews của mình
router.get('/customers/:id/reviews',
    authenticateToken,
    validateId(),
    (req, res, next) => {
        if (req.user.role_name === 'admin') {
            return next();
        }

        if (req.user.customer_id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể xem đánh giá của chính mình'
            });
        }
        next();
    },
    customerController.getCustomerReviews
);

export default router;