import express from 'express';
import * as staffController from './staffController.js';
import { authenticateToken, authorizeRoles } from '../auth/auth.middleware.js';
import { validateId } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Admin only routes - Quản lý nhân viên
router.get('/staff',
  authenticateToken,
  authorizeRoles('admin'),
  staffController.getAllStaff
);

router.get('/staff/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  staffController.getStaffById
);

router.post('/staff',
  authenticateToken,
  authorizeRoles('admin'),
  staffController.createStaff
);

router.put('/staff/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  staffController.updateStaff
);

router.delete('/staff/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  staffController.deleteStaff
);

router.get('/branches/:branchId/staff',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  staffController.getStaffByBranch
);

export default router;
