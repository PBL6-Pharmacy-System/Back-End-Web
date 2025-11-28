import { 
  createPayPalPayment, 
  handlePayPalCallback,
  handlePayPalCancel,
  handlePayPalWebhook
} from './paypalService.js';
import { getCacheInfo, clearExchangeRateCache, getUSDtoVNDRate } from './exchangeRateService.js';

/**
 * Create PayPal payment
 * POST /api/payments/paypal/create
 */
export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin đơn hàng'
      });
    }

    const result = await createPayPalPayment(orderId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Create PayPal payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo thanh toán PayPal',
      message: error.message
    });
  }
};

/**
 * Handle PayPal callback (return URL)
 * GET /api/payments/paypal/callback
 */
export const callback = async (req, res) => {
  try {
    const result = await handlePayPalCallback(req.query);

    if (!result.success) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/payment/failed?error=${encodeURIComponent(result.error)}`);
    }

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/success?orderId=${result.data.orderId}`);
  } catch (error) {
    console.error('PayPal callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/failed?error=system_error`);
  }
};

/**
 * Handle PayPal cancel (cancel URL)
 * GET /api/payments/paypal/cancel
 */
export const cancel = async (req, res) => {
  try {
    await handlePayPalCancel(req.query);

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/cancelled`);
  } catch (error) {
    console.error('PayPal cancel error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/failed?error=cancel_error`);
  }
};

/**
 * Handle PayPal webhook
 * POST /api/payments/paypal/webhook
 */
export const webhook = async (req, res) => {
  try {
    const result = await handlePayPalWebhook(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

/**
 * Get current exchange rate info
 * GET /api/payments/paypal/exchange-rate
 */
export const getExchangeRate = async (req, res) => {
  try {
    const rate = await getUSDtoVNDRate();
    const cacheInfo = getCacheInfo();

    return res.status(200).json({
      success: true,
      data: {
        rate: rate,
        currency: 'USD to VND',
        lastUpdated: cacheInfo.lastFetchTime,
        cacheAge: cacheInfo.cacheAge ? `${Math.round(cacheInfo.cacheAge / 1000)} seconds` : null,
        isExpired: cacheInfo.isExpired
      }
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tỷ giá',
      message: error.message
    });
  }
};

/**
 * Refresh exchange rate cache (Admin only)
 * POST /api/payments/paypal/refresh-rate
 */
export const refreshExchangeRate = async (req, res) => {
  try {
    clearExchangeRateCache();
    const newRate = await getUSDtoVNDRate();

    return res.status(200).json({
      success: true,
      message: 'Đã làm mới tỷ giá',
      data: {
        rate: newRate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Refresh exchange rate error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi khi làm mới tỷ giá',
      message: error.message
    });
  }
};
