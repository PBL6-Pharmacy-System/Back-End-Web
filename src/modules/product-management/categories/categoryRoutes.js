import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import * as categoryController from './categoryController.js';

const router = express.Router();

// Public routes - Không cần authentication
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.get('/categories/:id', validateId(), categoryController.getCategoryById);
router.get('/categories/:id/stats', validateId(), categoryController.getCategoryStats);

// Admin only routes - Cần authentication và quyền admin
router.post('/categories', authenticateToken, authorizeAdmin, categoryController.createCategory);
router.put('/categories/:id', authenticateToken, authorizeAdmin, validateId(), categoryController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeAdmin, validateId(), categoryController.deleteCategory);

export default router;