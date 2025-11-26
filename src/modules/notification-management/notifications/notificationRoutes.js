import express from 'express';
import * as notificationController from './notificationController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { notificationLimiter } from '../../../middlewares/rateLimit.middleware.js'; // ✅ Added

const router = express.Router();

/**
 * ✅ Middleware to validate notification ownership
 * User can only access their own notifications
 */
const validateNotificationOwnership = (req, res, next) => {
    // Admin có quyền truy cập tất cả
    if (req.user.role_name === 'admin') {
        return next();
    }

    // Regular user: Controller sẽ kiểm tra notification.user_id === req.user.userId
    next();
};

// ✅ FIXED: Protected routes - User chỉ xem được notifications của mình
// Controller phải filter theo req.user.userId
router.get('/notifications',
    authenticateToken,
    notificationController.getAllNotifications // ✅ Controller must filter by user_id
);

// ✅ FIXED: Add ownership validation
router.get('/notifications/:id',
    authenticateToken,
    validateId(),
    validateNotificationOwnership, // ✅ Added ownership validation
    notificationController.getNotificationById
);

// Admin routes - Tạo và quản lý notifications
router.post('/notifications',
    authenticateToken,
    authorizeAdmin,
    notificationLimiter, // ✅ Added rate limiting
    notificationController.createNotification
);
router.delete('/notifications/:id', authenticateToken, authorizeAdmin, validateId(), notificationController.deleteNotification);

// ✅ FIXED: User có thể đánh dấu đã đọc notification của mình
router.put('/notifications/:id',
    authenticateToken,
    validateId(),
    validateNotificationOwnership, // ✅ Added ownership validation
    notificationController.updateNotification
);

export default router;