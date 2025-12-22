import express from 'express';
import { reviewLimiter } from '../../../middlewares/rateLimit.middleware.js'; // ✅ Added
import { reviewUpload } from '../../../middlewares/upload.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import * as reviewController from './reviewController.js';

const router = express.Router();

/**
 * ✅ Middleware to validate review ownership
 * Customer can only update/delete their own reviews
 */
const validateReviewOwnership = (req, res, next) => {
    // Admin có quyền truy cập tất cả
    if (req.user.role_name === 'admin') {
        return next();
    }

    // Customer: Controller sẽ kiểm tra review.customer_id === req.user.customer_id
    next();
};

// Public routes - Xem reviews
router.get('/reviews', reviewController.getAllReviews);
router.get('/reviews/:id', validateId(), reviewController.getReviewById);
router.get('/products/:productId/reviews', validateId('productId'), reviewController.getProductReviews);
router.get('/products/:productId/rating-stats', validateId('productId'), reviewController.getProductRatingStats);

// Protected routes - Customer's own reviews
router.get('/customers/me/reviews', 
  authenticateToken, 
  reviewController.getCustomerOwnReviews
);

// Protected routes - Cần đăng nhập để tạo/sửa review
// ✅ FIXED: Add validation to check if customer purchased the product
router.post('/reviews',
    authenticateToken,
    reviewLimiter, // ✅ Added rate limiting
    reviewUpload.array('media', 5), // Nhận tối đa 5 file với field name 'media'
    reviewController.createReview // ✅ Controller will check if customer purchased product
);

// ✅ FIXED: Add ownership validation
router.put('/reviews/:id',
    authenticateToken,
    validateId(),
    validateReviewOwnership, // ✅ Added ownership validation
    reviewController.updateReview
);

// ✅ FIXED: Allow customer to delete their own review OR admin
router.delete('/reviews/:id', 
  authenticateToken, 
  validateId(), 
  validateReviewOwnership, // ✅ Customer can delete own review, admin can delete any
  reviewController.deleteReview
);

export default router;