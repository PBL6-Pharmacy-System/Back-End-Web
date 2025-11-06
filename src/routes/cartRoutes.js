import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { cartLimiter } from '../middlewares/rateLimit.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Protected routes - User phải đăng nhập để sử dụng cart
router.get('/cart/:customerId', authenticateToken, validateId('customerId'), cartController.getCart);
router.post('/cart/:customerId/add', authenticateToken, validateId('customerId'), cartLimiter, cartController.addToCart);
router.delete('/cart/:customerId/remove/:productId', authenticateToken, validateId('customerId'), cartLimiter, cartController.removeFromCart);
router.post('/cart/:customerId/checkout', authenticateToken, validateId('customerId'), cartController.checkout);

export default router;
