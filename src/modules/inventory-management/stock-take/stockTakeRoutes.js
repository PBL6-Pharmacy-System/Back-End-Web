import express from 'express';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch } from '../../auth/auth.middleware.js';
import * as stockTakeController from './stockTakeController.js';

const router = express.Router();

// ✅ FIXED: Removed global router.use() middlewares
// Each route now explicitly declares its middlewares to avoid affecting other routes

// Create new stock take - Staff chỉ có thể tạo kiểm kê cho chi nhánh của mình
router.post('/stock-takes',
    authenticateToken,
    authorizeAdminOrStaff,
    authorizeStaffBranch,
    stockTakeController.createStockTake
);

// Get all stock takes with filters
router.get('/stock-takes',
    authenticateToken,
    authorizeAdminOrStaff,
    stockTakeController.getAllStockTakes
);

// Get stock take by ID
router.get('/stock-takes/:id',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    stockTakeController.getStockTakeById
);

// Get stock take items
router.get('/stock-takes/:id/items',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    stockTakeController.getStockTakeItems
);

// Update stock take item with actual quantity
router.put('/stock-takes/:id/items/:itemId',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    validateId('itemId'),
    stockTakeController.updateStockTakeItem
);

// Complete stock take
router.post('/stock-takes/:id/complete',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    stockTakeController.completeStockTake
);

// Cancel stock take
router.post('/stock-takes/:id/cancel',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    stockTakeController.cancelStockTake
);

// Delete stock take
router.delete('/stock-takes/:id',
    authenticateToken,
    authorizeAdminOrStaff,
    validateId(),
    stockTakeController.deleteStockTake
);

export default router;
