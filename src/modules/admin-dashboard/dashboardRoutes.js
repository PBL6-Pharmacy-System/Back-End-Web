import express from 'express';
import { adminOnly } from '../../middlewares/adminOnly.middleware.js';
import { authenticateToken } from '../auth/auth.middleware.js';
import * as dashboardController from './dashboardController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(adminOnly);

router.get('/overview', dashboardController.getOverview);
router.get('/revenue', dashboardController.getRevenueAnalytics);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/orders-stats', dashboardController.getOrdersStatistics);
router.get('/customers-stats', dashboardController.getCustomersStatistics);
router.get('/inventory-stats', dashboardController.getInventoryStatistics);
router.get('/branches-performance', dashboardController.getBranchesPerformance);
router.get('/promotions-stats', dashboardController.getPromotionsStatistics);
router.get('/reviews-stats', dashboardController.getReviewsStatistics);
router.get('/recent-activities', dashboardController.getRecentActivities);

export default router;
