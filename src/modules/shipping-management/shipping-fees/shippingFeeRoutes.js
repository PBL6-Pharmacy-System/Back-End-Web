/**
 * Shipping Fee Routes
 * API endpoints cho tính phí vận chuyển và quản lý shipping zones
 * Tích hợp GraphHopper API cho geocoding và routing
 * 
 * @module modules/shipping-management/shipping-fees/shippingFeeRoutes
 */

import express from 'express';
import * as shippingFeeController from './shippingFeeController.js';
import { authenticateToken, authorizeAdmin } from '../../auth/auth.middleware.js';
import { validateId } from '../../../middlewares/validate.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ===============================================
// RATE LIMITERS - Chống abuse public endpoints
// ===============================================
const geocodeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 10, // 10 requests/phút
    message: { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút' }
});

const calculateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30, // 30 requests/phút
    message: { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút' }
});

// ===============================================
// PUBLIC ROUTES - Tính phí ship & Location
// ===============================================

router.get('/zones', shippingFeeController.getShippingZones);
router.get('/calculate', calculateLimiter, shippingFeeController.calculateFee);

// GraphHopper API endpoints - Geocoding & Distance (với rate limit)
router.post('/geocode', geocodeLimiter, shippingFeeController.geocodeAddress);
router.post('/reverse-geocode', geocodeLimiter, shippingFeeController.reverseGeocode);
router.post('/distance', calculateLimiter, shippingFeeController.calculateDistance);

// ===============================================
// AUTHENTICATED ROUTES - Ước tính phí ship
// ===============================================

router.post('/estimate', authenticateToken, shippingFeeController.estimateShipping);
router.post('/estimate-by-coordinates', shippingFeeController.estimateShippingByCoordinates);
router.post('/nearest-branch', shippingFeeController.findNearestBranch);

// ===============================================
// ADMIN ONLY ROUTES - Quản lý shipping zones
// ===============================================

router.post('/zones', authenticateToken, authorizeAdmin, shippingFeeController.createZone);
router.put('/zones/:id', authenticateToken, authorizeAdmin, validateId(), shippingFeeController.updateZone);
router.delete('/zones/:id', authenticateToken, authorizeAdmin, validateId(), shippingFeeController.deleteZone);

export default router;
