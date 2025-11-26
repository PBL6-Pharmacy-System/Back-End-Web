import express from 'express';
import * as productBatchController from './productBatchController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new product batch (IMPORT from supplier)
// ⚠️ Staff branch authorization được check trong controller (cần query DB)
router.post('/product-batches',
    authorizeAdminOrStaff,
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
    validateId(), // ✅ Added validation
    productBatchController.getProductBatchById
);

// Update product batch
// ⚠️ Staff branch authorization được check trong controller
router.put('/product-batches/:id',
    authorizeAdminOrStaff,
    validateId(), // ✅ Added validation
    productBatchController.updateProductBatch
);

// Mark batch as expired
// ⚠️ Staff branch authorization được check trong controller
router.post('/product-batches/:id/expire',
    authorizeAdminOrStaff,
    validateId(), // ✅ Added validation
    productBatchController.markBatchAsExpired
);

// Delete product batch
router.delete('/product-batches/:id',
    authorizeAdmin,
    validateId(), // ✅ Added validation
    productBatchController.deleteProductBatch
);

export default router;
