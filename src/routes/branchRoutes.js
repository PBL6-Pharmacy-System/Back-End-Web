import express from 'express';
import * as branchController from '../controllers/branchController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - User có thể xem danh sách chi nhánh
router.get('/branches', branchController.getAllBranches);
router.get('/branches/:id', validateId(), branchController.getBranchById);

// Admin only routes - Chỉ admin mới được quản lý chi nhánh
router.post('/branches', authenticateToken, authorizeAdmin, branchController.createBranch);
router.put('/branches/:id', authenticateToken, authorizeAdmin, validateId(), branchController.updateBranch);
router.delete('/branches/:id', authenticateToken, authorizeAdmin, validateId(), branchController.deleteBranch);

export default router;