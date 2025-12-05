import { 
  createPayPalPayment, 
  handlePayPalCallback,
  handlePayPalCancel,
  handlePayPalWebhook
} from './paypalService.js';
import { getCacheInfo, clearExchangeRateCache, getUSDtoVNDRate } from './exchangeRateService.js';
import prisma from '../../../../../config/db.js';

/**
 * Create PayPal payment
 * POST /api/payments/paypal/create
 */
export const createPayment = async (req, res) => {
  try {
    console.log('🟡 [PayPal] Create payment request:', {
      user: req.user,
      body: req.body,
      url: req.originalUrl
    });

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin đơn hàng'
      });
    }

    // Get order with payment info to check payment method
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        payments: {
          select: {
            payment_method: true,
            status: true
          },
          take: 1
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    // Check if order already has a completed payment
    const completedPayment = order.payments?.find(p => p.status === 'completed');
    if (completedPayment) {
      return res.status(400).json({
        success: false,
        error: 'Đơn hàng đã được thanh toán'
      });
    }

    // Check if order's payment method is PayPal (if payment exists)
    const orderPaymentMethod = order.payments?.[0]?.payment_method;
    if (orderPaymentMethod && orderPaymentMethod !== 'paypal') {
      return res.status(400).json({
        success: false,
        error: `Đơn hàng này sử dụng phương thức thanh toán ${orderPaymentMethod.toUpperCase()}, không thể thanh toán bằng PayPal`
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
