import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validateId } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes - Xem reviews
router.get('/reviews', reviewController.getAllReviews);
router.get('/reviews/:id', validateId(), reviewController.getReviewById);
router.get('/products/:productId/reviews', validateId('productId'), reviewController.getProductReviews);
router.get('/products/:productId/rating-stats', validateId('productId'), reviewController.getProductRatingStats);

// Protected routes - Cần đăng nhập để tạo/sửa review
router.post('/reviews', authenticateToken, reviewController.createReview);
router.put('/reviews/:id', authenticateToken, validateId(), reviewController.updateReview);

// Admin only - Xóa review
router.delete('/reviews/:id', authenticateToken, authorizeAdmin, validateId(), reviewController.deleteReview);

export default router;