import express from 'express';
import * as stockTakeController from './stockTakeController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch } from '../../auth/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(authorizeAdminOrStaff);

// Create new stock take - Staff chỉ có thể tạo kiểm kê cho chi nhánh của mình
router.post('/stock-takes',
    authorizeStaffBranch,
    stockTakeController.createStockTake
);

// Get all stock takes with filters
router.get('/stock-takes', stockTakeController.getAllStockTakes);

// Get stock take by ID
router.get('/stock-takes/:id', stockTakeController.getStockTakeById);

// Get stock take items
router.get('/stock-takes/:id/items', stockTakeController.getStockTakeItems);

// Update stock take item with actual quantity
router.put('/stock-takes/:id/items/:itemId', stockTakeController.updateStockTakeItem);

// Complete stock take
router.post('/stock-takes/:id/complete', stockTakeController.completeStockTake);

// Cancel stock take
router.post('/stock-takes/:id/cancel', stockTakeController.cancelStockTake);

// Delete stock take
router.delete('/stock-takes/:id', stockTakeController.deleteStockTake);

export default router;
