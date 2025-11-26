import { VNPAY_RESPONSE_CODES } from './vnpayConfig.js';
import * as vnpayService from './vnpayService.js';

export const createPaymentUrl = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID là bắt buộc'
      });
    }

    const result = await vnpayService.createVNPayPaymentUrl(orderId, req);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const vnpayCallback = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await vnpayService.handleVNPayCallback(query);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (result.success) {
      return res.redirect(`${frontendUrl}/payment/success?orderId=${result.data.orderId}&transactionNo=${result.data.transactionNo}`);
    } else {
      const errorMessage = VNPAY_RESPONSE_CODES[result.RspCode] || 'Thanh toán thất bại';
      return res.redirect(`${frontendUrl}/payment/failed?error=${encodeURIComponent(errorMessage)}`);
    }
  } catch (error) {
    next(error);
  }
};

export const vnpayIPN = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await vnpayService.handleVNPayIPN(query);

    res.json(result);
  } catch (error) {
    res.json({
      RspCode: '99',
      Message: 'Unknown error'
    });
  }
};
