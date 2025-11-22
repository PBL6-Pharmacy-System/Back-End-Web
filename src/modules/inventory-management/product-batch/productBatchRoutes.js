import express from 'express';
import * as productBatchController from './productBatchController.js';
import { authenticateToken } from '../../auth/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new product batch
router.post('/product-batches', productBatchController.createProductBatch);

// Get all product batches with filters
router.get('/product-batches', productBatchController.getAllProductBatches);

// Get batches expiring soon
router.get('/product-batches/expiring-soon', productBatchController.getBatchesExpiringSoon);

// Get product batch by ID
router.get('/product-batches/:id', productBatchController.getProductBatchById);

// Update product batch
router.put('/product-batches/:id', productBatchController.updateProductBatch);

// Mark batch as expired
router.post('/product-batches/:id/expire', productBatchController.markBatchAsExpired);

// Delete product batch
router.delete('/product-batches/:id', productBatchController.deleteProductBatch);

export default router;
