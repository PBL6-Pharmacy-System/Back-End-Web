import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, authorizeAdmin, authorizeOwner } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Admin routes - Yêu cầu authentication và quyền admin
router.get('/users', authenticateToken, authorizeAdmin, userController.getAllUsers);
router.post('/users', authenticateToken, authorizeAdmin, userController.createUser);

// User routes - User có thể xem/sửa thông tin của mình, admin có thể xem/sửa tất cả
router.get('/users/:id', authenticateToken, authorizeOwner('id'), validateId(), userController.getUserById);
router.put('/users/:id', authenticateToken, authorizeOwner('id'), validateId(), userController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeAdmin, validateId(), userController.deleteUser);

export default router;
