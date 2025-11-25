import express from 'express';
import * as productBatchController from './productBatchController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch } from '../../auth/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new product batch (IMPORT from supplier)
router.post('/product-batches',
    authorizeAdminOrStaff,
    authorizeStaffBranch,
    productBatchController.createProductBatch
);

// Get all product batches with filters
router.get('/product-batches',
    authorizeAdminOrStaff,
    productBatchController.getAllProductBatches
);

// Get batches expiring soon
router.get('/product-batches/expiring-soon',
    authorizeAdminOrStaff,
    productBatchController.getBatchesExpiringSoon
);

// Get product batch by ID
router.get('/product-batches/:id',
    authorizeAdminOrStaff,
    productBatchController.getProductBatchById
);

// Update product batch
router.put('/product-batches/:id',
    authorizeAdminOrStaff,
    productBatchController.updateProductBatch
);

// Mark batch as expired
router.post('/product-batches/:id/expire',
    authorizeAdminOrStaff,
    productBatchController.markBatchAsExpired
);

// Delete product batch
router.delete('/product-batches/:id',
    authorizeAdminOrStaff,
    productBatchController.deleteProductBatch
);

export default router;
