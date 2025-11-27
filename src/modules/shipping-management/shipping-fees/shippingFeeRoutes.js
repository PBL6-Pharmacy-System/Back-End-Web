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

const router = express.Router();

// ===============================================
// PUBLIC ROUTES - Tính phí ship & Location
// ===============================================

router.get('/zones', shippingFeeController.getShippingZones);
router.get('/calculate', shippingFeeController.calculateFee);

// GraphHopper API endpoints - Geocoding & Distance
router.post('/geocode', shippingFeeController.geocodeAddress);
router.post('/reverse-geocode', shippingFeeController.reverseGeocode);
router.post('/distance', shippingFeeController.calculateDistance);

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
