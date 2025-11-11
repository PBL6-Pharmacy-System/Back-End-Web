import express from 'express';
import * as productController from './productController.js';
import * as bestSellersController from './bestSellersController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { searchLimiter, writeLimiter } from '../../../middlewares/rateLimit.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - Không cần authentication
router.get('/products', productController.getAllProducts);
router.get('/products/search', searchLimiter, productController.searchProducts);
router.get('/products/category/:categoryName', productController.getProductsByCategory);
router.get('/products/best-sellers', bestSellersController.getBestSellers);
router.get('/products/:id', validateId(), productController.getProductById);
router.get('/products/:id/stats', validateId(), bestSellersController.getProductStats);

// Admin only routes - Cần authentication và quyền admin
router.post('/products', authenticateToken, authorizeAdmin, writeLimiter, productController.createProduct);
router.put('/products/:id', authenticateToken, authorizeAdmin, validateId(), writeLimiter, productController.updateProduct);
router.delete('/products/:id', authenticateToken, authorizeAdmin, validateId(), writeLimiter, productController.deleteProduct);
router.post('/products/best-sellers/update-cache', authenticateToken, authorizeAdmin, bestSellersController.updateBestSellersCache);

export default router;
