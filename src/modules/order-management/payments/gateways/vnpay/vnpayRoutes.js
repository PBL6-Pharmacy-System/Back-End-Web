import express from 'express';
import { authenticateToken } from '../../../../auth/auth.middleware.js';
import * as vnpayController from './vnpayController.js';

const router = express.Router();

router.post('/create-payment-url', authenticateToken, vnpayController.createPaymentUrl);

router.get('/callback', vnpayController.vnpayCallback);

router.get('/ipn', vnpayController.vnpayIPN);

export default router;
