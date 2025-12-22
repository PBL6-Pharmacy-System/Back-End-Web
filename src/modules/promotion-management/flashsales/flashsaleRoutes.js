import express from 'express';
import { authenticateToken, authorizeAdmin, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import * as flashsaleController from './flashsaleController.js';

const router = express.Router();

// Public route - Chỉ cho phép xem flashsale đang active (dành cho khách hàng mua hàng)
router.get('/flashsales/active', flashsaleController.getActiveFlashsale);

// Admin & Staff routes - Staff có thể xem (read-only), chỉ Admin mới tạo/sửa/xóa
router.get('/flashsales', authenticateToken, authorizeRoles('admin', 'staff'), flashsaleController.getAllFlashsales);
router.get('/flashsales/:id', authenticateToken, authorizeRoles('admin', 'staff'), validateId(), flashsaleController.getFlashsaleById);
router.post('/flashsales', authenticateToken, authorizeRoles('admin', 'staff'), flashsaleController.createFlashsale);

router.put('/flashsales/:id',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    validateId(),
    flashsaleController.updateFlashsale
);

router.delete('/flashsales/:id',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    validateId(),
    flashsaleController.deleteFlashsale
);

export default router;