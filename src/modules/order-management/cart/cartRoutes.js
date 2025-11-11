import express from 'express';
import * as cartController from './cartController.js';
import * as checkoutController from './checkoutController.js';
import { authenticateToken } from '../../auth/auth.middleware.js';
import { cartLimiter } from '../../../middlewares/rateLimit.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';

const router = express.Router();

// Protected routes - User phải đăng nhập để sử dụng cart
router.get('/cart/:customerId', authenticateToken, validateId('customerId'), cartController.getCart);
router.post('/cart/:customerId/add', authenticateToken, validateId('customerId'), cartLimiter, cartController.addToCart);
router.delete('/cart/:customerId/remove/:productId', authenticateToken, validateId('customerId'), cartLimiter, cartController.removeFromCart);

// Checkout routes
router.post('/cart/checkout', authenticateToken, checkoutController.checkout);
router.post('/orders/:id/confirm-payment', authenticateToken, checkoutController.confirmPayment);
router.post('/orders/:id/cancel', authenticateToken, checkoutController.cancelOrder);

export default router;
