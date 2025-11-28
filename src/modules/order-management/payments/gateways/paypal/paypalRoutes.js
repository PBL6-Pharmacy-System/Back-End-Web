import express from 'express';
import { createPayment, callback, cancel, webhook, getExchangeRate, refreshExchangeRate } from './paypalController.js';
import { authenticateToken, authorizeRoles } from '../../../../auth/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/payments/paypal/create
 * @desc    Create PayPal payment
 * @access  Private (Customer)
 */
router.post('/create', authenticateToken, createPayment);

/**
 * @route   GET /api/payments/paypal/callback
 * @desc    Handle PayPal return callback
 * @access  Public
 */
router.get('/callback', callback);

/**
 * @route   GET /api/payments/paypal/cancel
 * @desc    Handle PayPal cancel
 * @access  Public
 */
router.get('/cancel', cancel);

/**
 * @route   POST /api/payments/paypal/webhook
 * @desc    Handle PayPal webhook
 * @access  Public (verified by PayPal signature)
 */
router.post('/webhook', webhook);

/**
 * @route   GET /api/payments/paypal/exchange-rate
 * @desc    Get current USD to VND exchange rate
 * @access  Public
 */
router.get('/exchange-rate', getExchangeRate);

/**
 * @route   POST /api/payments/paypal/refresh-rate
 * @desc    Force refresh exchange rate (clear cache)
 * @access  Private (Admin/Staff)
 */
router.post('/refresh-rate', authenticateToken, authorizeRoles('admin', 'staff'), refreshExchangeRate);

export default router;
