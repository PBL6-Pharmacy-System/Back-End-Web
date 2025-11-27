import express from 'express';
import * as productBatchController from './productBatchController.js';
import { authenticateToken, authorizeAdminOrStaff, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================
// FEFO (First Expired First Out) ROUTES
// ============================================================

// Get available batches sorted by FEFO for a product at a branch
router.get('/product-batches/fefo/:branchId/:productId',
    authorizeAdminOrStaff,
    productBatchController.getAvailableBatchesFEFO
);

// Get allocation plan using FEFO strategy (preview before export)
router.post('/product-batches/fefo/allocate',
    authorizeAdminOrStaff,
    productBatchController.allocateBatchesFEFO
);

// Export stock using FEFO strategy
router.post('/product-batches/fefo/export',
    authorizeAdminOrStaff,
    productBatchController.exportStockFEFO
);

// Import stock to batch (create new or add to existing)
router.post('/product-batches/import',
    authorizeAdminOrStaff,
    productBatchController.importStockToBatch
);

// Add quantity to existing batch
router.post('/product-batches/:id/add-stock',
    authorizeAdminOrStaff,
    validateId(),
    productBatchController.addToExistingBatch
);

// Get batch summary for a product at a branch
router.get('/product-batches/summary/:branchId/:productId',
    authorizeAdminOrStaff,
    productBatchController.getBatchSummary
);

// Validate stock consistency between batches and inventory
router.get('/product-batches/validate/:branchId/:productId',
    authorizeAdminOrStaff,
    productBatchController.validateStockConsistency
);

// Reconcile stock (fix discrepancy) - Admin only
router.post('/product-batches/reconcile/:branchId/:productId',
    authorizeAdmin,
    productBatchController.reconcileStock
);

// Auto-expire batches (for cron job or manual trigger) - Admin only
router.post('/product-batches/auto-expire',
    authorizeAdmin,
    productBatchController.autoExpireBatches
);

// Generate batch number
router.get('/product-batches/generate-number/:productId/:branchId',
    authorizeAdminOrStaff,
    productBatchController.generateBatchNumber
);

// ============================================================
// EXISTING ROUTES
// ============================================================

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

// Create new product batch (IMPORT from supplier)
// ⚠️ Staff branch authorization được check trong controller (cần query DB)
router.post('/product-batches',
    authorizeAdminOrStaff,
    productBatchController.createProductBatch
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

// Dispose expired batch - Tiêu hủy lô hàng hết hạn (trừ stock thực tế)
// ⚠️ Staff branch authorization được check trong controller
router.post('/product-batches/:id/dispose',
    authorizeAdminOrStaff,
    validateId(),
    productBatchController.disposeExpiredBatch
);

// Delete product batch
router.delete('/product-batches/:id',
    authorizeAdmin,
    validateId(), // ✅ Added validation
    productBatchController.deleteProductBatch
);

export default router;
