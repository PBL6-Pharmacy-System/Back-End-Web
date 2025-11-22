import express from 'express';
import * as businessStatisticsController from './businessStatisticsController.js';
import { authenticateToken, authorizeRoles } from '../../auth/auth.middleware.js';

const router = express.Router();

// Admin only routes - Thống kê kinh doanh
router.get('/statistics/business/dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getDashboardOverview
);

router.get('/statistics/business/revenue',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getRevenueByPeriod
);

router.get('/statistics/business/orders-by-status',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getOrdersByStatus
);

router.get('/statistics/business/best-selling',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getBestSellingProducts
);

router.get('/statistics/business/top-customers',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getTopCustomers
);

router.get('/statistics/business/voucher-performance',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getVoucherPerformance
);

router.get('/statistics/business/flashsale-performance',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getFlashsalePerformance
);

router.get('/statistics/business/conversion-rate',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getConversionRate
);

router.get('/statistics/business/average-order-value',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getAverageOrderValue
);

router.get('/statistics/business/payment-methods',
  authenticateToken,
  authorizeRoles('admin'),
  businessStatisticsController.getRevenueByPaymentMethod
);

export default router;
