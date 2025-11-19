import express from 'express';
import * as categoryController from './categoryController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - Không cần authentication
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', validateId(), categoryController.getCategoryById);

// Admin only routes - Cần authentication và quyền admin
router.post('/categories', authenticateToken, authorizeAdmin, categoryController.createCategory);
router.put('/categories/:id', authenticateToken, authorizeAdmin, validateId(), categoryController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeAdmin, validateId(), categoryController.deleteCategory);

export default router;