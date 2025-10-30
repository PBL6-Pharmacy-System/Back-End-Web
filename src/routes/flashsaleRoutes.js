import express from 'express';
import * as flashsaleController from '../controllers/flashsaleController.js';


const router = express.Router();

// Public routes
router.get('/flashsales',flashsaleController.getAllFlashsales);
router.get('/flashsales/active',flashsaleController.getActiveFlashsale);

// Admin routes
router.post('/flashsales', flashsaleController.createFlashsale);
router.put('/flashsales/:id', flashsaleController.updateFlashsale);
router.delete('/flashsales/:id', flashsaleController.deleteFlashsale);

export default router;