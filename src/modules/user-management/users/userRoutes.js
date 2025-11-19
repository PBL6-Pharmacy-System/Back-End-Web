import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin, authorizeOwnerOrAdmin } from '../../auth/auth.middleware.js';
import * as userController from './userController.js';

const router = express.Router();


// Get all users - Admin only
router.get('/users', 
  authenticateToken, 
  authorizeAdmin, 
  userController.getAllUsers
);

// Create new user - Admin only
router.post('/users', 
  authenticateToken, 
  authorizeAdmin, 
  userController.createUser
);

// Delete user - Admin only
router.delete('/users/:id', 
  authenticateToken, 
  authorizeAdmin, 
  validateId(), 
  userController.deleteUser
);


// Get user by ID - Owner hoặc Admin
router.get('/users/:id', 
  authenticateToken, 
  authorizeOwnerOrAdmin('id'), 
  validateId(), 
  userController.getUserById
);

// Update user - Owner hoặc Admin
router.put('/users/:id', 
  authenticateToken, 
  authorizeOwnerOrAdmin('id'), 
  validateId(), 
  userController.updateUser
);

export default router;
