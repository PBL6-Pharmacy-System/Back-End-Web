import express from 'express';
import * as flashsaleController from '../controllers/flashsaleController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/auth.middleware.js';


const router = express.Router();

// Public routes
router.get('/flashsales', flashsaleController.getAllFlashsales);
router.get('/flashsales/active', flashsaleController.getActiveFlashsale);

// Admin routes - Yêu cầu authentication và authorization
router.post('/flashsales', authenticateToken, authorizeAdmin, flashsaleController.createFlashsale);
router.put('/flashsales/:id', authenticateToken, authorizeAdmin, flashsaleController.updateFlashsale);
router.delete('/flashsales/:id', authenticateToken, authorizeAdmin, flashsaleController.deleteFlashsale);

export default router;