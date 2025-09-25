import express from 'express';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

router.get('/cart/:customerId', orderController.getCart);
router.post('/cart/:customerId/items', orderController.addToCart);
router.put('/cart/items/:itemId', orderController.updateCartItem);
router.delete('/cart/items/:itemId', orderController.removeCartItem);
router.post('/cart/:orderId/checkout', orderController.checkout);

export default router;
