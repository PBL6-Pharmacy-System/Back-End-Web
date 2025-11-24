import express from 'express';
import { authLimiter, passwordLimiter } from '../../middlewares/rateLimit.middleware.js';
import { authenticateToken } from './auth.middleware.js';
import * as authController from './authController.js';

const router = express.Router();

// Public routes với rate limiting
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh-token', authController.refreshToken);

// OTP routes for customer login
router.post('/auth/otp/request', authLimiter, authController.requestLoginOTP);
router.post('/auth/otp/verify', authLimiter, authController.verifyOTPController);
router.post('/auth/customer/login-otp', authLimiter, authController.customerLoginWithOTP);

// Protected routes
router.get('/auth/me', authenticateToken, authController.getCurrentUser);
router.post('/auth/change-password', authenticateToken, passwordLimiter, authController.changePassword);
router.post('/auth/logout', authenticateToken, authController.logout);

export default router;
