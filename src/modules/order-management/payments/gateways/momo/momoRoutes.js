import express from 'express';
import { authenticateToken } from '../../../../auth/auth.middleware.js';
import { createPaymentDeeplink, momoCallback, momoIPN } from './momoController.js';

const router = express.Router();

router.post('/create-payment', authenticateToken, createPaymentDeeplink);
router.get('/callback', momoCallback);
router.post('/ipn', momoIPN);

export default router;
