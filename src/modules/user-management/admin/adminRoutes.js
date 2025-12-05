import express from 'express';
import * as adminController from './adminController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Admin only routes - Quản lý admin (chỉ super admin hoặc admin level cao)
router.get('/admins',
  authenticateToken,
  authorizeRoles('admin'),
  adminController.getAllAdmins
);

router.get('/admins/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  adminController.getAdminById
);

router.post('/admins',
  authenticateToken,
  authorizeRoles('admin'),
  adminController.createAdmin
);

router.put('/admins/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  adminController.updateAdmin
);

router.delete('/admins/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  adminController.deleteAdmin
);

router.put('/admins/:id/permissions',
  authenticateToken,
  authorizeRoles('admin'),
  validateId(),
  adminController.updateAdminPermissions
);

export default router;
