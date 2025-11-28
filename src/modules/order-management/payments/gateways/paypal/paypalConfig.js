export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
  apiUrl: process.env.PAYPAL_MODE === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com',
  returnUrl: process.env.PAYPAL_RETURN_URL || 'http://localhost:3000/api/payments/paypal/callback',
  cancelUrl: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000/api/payments/paypal/cancel',
  webhookUrl: process.env.PAYPAL_WEBHOOK_URL || 'http://localhost:3000/api/payments/paypal/webhook',
  currency: 'USD', // PayPal sử dụng USD
  exchangeRate: 26365 // 1 USD = 25,000 VND (có thể điều chỉnh)
};

export const PAYPAL_STATUS = {
  CREATED: 'CREATED',
  SAVED: 'SAVED',
  APPROVED: 'APPROVED',
  VOIDED: 'VOIDED',
  COMPLETED: 'COMPLETED',
  PAYER_ACTION_REQUIRED: 'PAYER_ACTION_REQUIRED'
};

export const PAYPAL_EVENT_TYPES = {
  CHECKOUT_ORDER_APPROVED: 'CHECKOUT.ORDER.APPROVED',
  CHECKOUT_ORDER_COMPLETED: 'CHECKOUT.ORDER.COMPLETED',
  PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED: 'PAYMENT.CAPTURE.DENIED',
  PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED'
};
