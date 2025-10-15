import express from 'express';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

// Lấy giỏ hàng hiện tại
router.get('/cart/:customerId', cartController.getCart);
// Thêm sản phẩm vào giỏ
router.post('/cart/:customerId/add', cartController.addToCart);
// Xóa sản phẩm khỏi giỏ
router.delete('/cart/:customerId/remove/:productId', cartController.removeFromCart);
// Checkout
router.post('/cart/:customerId/checkout', cartController.checkout);

export default router;
