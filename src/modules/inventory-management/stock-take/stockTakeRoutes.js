import express from 'express';
import * as stockTakeController from './stockTakeController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

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
router.get('/stock-takes/:id',
    validateId(), // ✅ Added validation
    stockTakeController.getStockTakeById
);

// Get stock take items
router.get('/stock-takes/:id/items',
    validateId(), // ✅ Added validation
    stockTakeController.getStockTakeItems
);

// Update stock take item with actual quantity
router.put('/stock-takes/:id/items/:itemId',
    validateId(), // ✅ Added validation for :id
    validateId('itemId'), // ✅ Added validation for :itemId
    stockTakeController.updateStockTakeItem
);

// Complete stock take
router.post('/stock-takes/:id/complete',
    validateId(), // ✅ Added validation
    stockTakeController.completeStockTake
);

// Cancel stock take
router.post('/stock-takes/:id/cancel',
    validateId(), // ✅ Added validation
    stockTakeController.cancelStockTake
);

// Delete stock take
router.delete('/stock-takes/:id',
    validateId(), // ✅ Added validation
    stockTakeController.deleteStockTake
);

export default router;
