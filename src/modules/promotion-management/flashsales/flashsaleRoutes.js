import express from 'express';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import * as flashsaleController from './flashsaleController.js';


const router = express.Router();

// Public routes
router.get('/flashsales', authenticateToken, authorizeAdmin, flashsaleController.getAllFlashsales);
router.get('/flashsales/active', flashsaleController.getActiveFlashsale);

// Admin routes - Yêu cầu authentication và authorization
router.post('/flashsales', authenticateToken, authorizeAdmin, flashsaleController.createFlashsale);
router.put('/flashsales/:id', authenticateToken, authorizeAdmin, flashsaleController.updateFlashsale);
router.delete('/flashsales/:id', authenticateToken, authorizeAdmin, flashsaleController.deleteFlashsale);

export default router;