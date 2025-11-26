import express from 'express';
import { cartLimiter } from '../../../middlewares/rateLimit.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { validateCartOwnership, validateOrderOwnership } from '../../../middlewares/validateCartOwnership.middleware.js';
import { authenticateToken } from '../../auth/auth.middleware.js';
import * as cartController from './cartController.js';
import * as checkoutController from './checkoutController.js';

const router = express.Router();

// Cart routes - Protected and ownership validated
router.get('/cart/:customerId',
  authenticateToken,
  validateId('customerId'),
  validateCartOwnership,
  cartController.getCart
);

router.get('/cart/:customerId/summary',
  authenticateToken,
  validateId('customerId'),
  validateCartOwnership,
  cartController.getCartSummary
);

router.post('/cart/:customerId/add',
  authenticateToken,
  validateId('customerId'),
  validateCartOwnership,
  cartLimiter,
  cartController.addToCart
);

router.put('/cart/:customerId/items/:itemId',
  authenticateToken,
  validateId('customerId'),
  validateId('itemId'),
  validateCartOwnership,
  cartLimiter,
  cartController.updateCartItem
);

router.delete('/cart/:customerId/items/:itemId',
  authenticateToken,
  validateId('customerId'),
  validateId('itemId'),
  validateCartOwnership,
  cartLimiter,
  cartController.removeFromCart
);

router.delete('/cart/:customerId/clear',
  authenticateToken,
  validateId('customerId'),
  validateCartOwnership,
  cartController.clearCart
);

// Voucher preview
router.post('/cart/:customerId/voucher/preview',
  authenticateToken,
  validateId('customerId'),
  validateCartOwnership,
  cartController.previewVoucher
);

// Merge guest cart
router.post('/cart/merge',
  authenticateToken,
  cartController.mergeGuestCart
);

// Checkout routes
router.post('/cart/checkout',
  authenticateToken,
  checkoutController.checkout
);

router.post('/orders/:id/cancel',
  authenticateToken,
  validateId('id'),
  validateOrderOwnership,
  checkoutController.cancelOrder
);

export default router;
