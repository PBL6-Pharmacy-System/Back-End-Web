import express from 'express';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import * as flashsaleController from './flashsaleController.js';

const router = express.Router();

// Public route - Chỉ cho phép xem flashsale đang active (dành cho khách hàng mua hàng)
router.get('/flashsales/active', flashsaleController.getActiveFlashsale);

// Admin-only routes - Chỉ admin mới được quản lý và xem danh sách flashsale
router.get('/flashsales', authenticateToken, authorizeAdmin, flashsaleController.getAllFlashsales);
router.get('/flashsales/:id', authenticateToken, authorizeAdmin, validateId(), flashsaleController.getFlashsaleById);
router.post('/flashsales', authenticateToken, authorizeAdmin, flashsaleController.createFlashsale);

router.put('/flashsales/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    flashsaleController.updateFlashsale
);

router.delete('/flashsales/:id',
    authenticateToken,
    authorizeAdmin,
    validateId(),
    flashsaleController.deleteFlashsale
);

export default router;