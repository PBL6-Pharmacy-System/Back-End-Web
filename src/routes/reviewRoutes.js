import express from 'express';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// Các routes cho đánh giá
router.get('/reviews', reviewController.getAllReviews);
router.get('/reviews/:id', reviewController.getReviewById);
router.post('/reviews', reviewController.createReview);
router.put('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);

// Routes cho đánh giá sản phẩm
router.get('/products/:productId/reviews', reviewController.getProductReviews);
router.get('/products/:productId/rating-stats', reviewController.getProductRatingStats);

export default router;