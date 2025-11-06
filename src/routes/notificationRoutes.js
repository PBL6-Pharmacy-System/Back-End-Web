import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Protected routes - User chỉ xem được notifications của mình
router.get('/notifications', authenticateToken, notificationController.getAllNotifications);
router.get('/notifications/:id', authenticateToken, validateId(), notificationController.getNotificationById);

// Admin routes - Tạo và quản lý notifications
router.post('/notifications', authenticateToken, authorizeAdmin, notificationController.createNotification);
router.delete('/notifications/:id', authenticateToken, authorizeAdmin, validateId(), notificationController.deleteNotification);

// User có thể đánh dấu đã đọc notification của mình
router.put('/notifications/:id', authenticateToken, validateId(), notificationController.updateNotification);

export default router;