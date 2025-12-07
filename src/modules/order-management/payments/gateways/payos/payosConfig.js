/**
 * PayOS Configuration
 * Cấu hình cho cổng thanh toán PayOS
 */

export const PAYOS_CONFIG = {
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    baseUrl: process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
    returnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:3000/api/payments/payos/callback',
    cancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:3000/api/payments/payos/cancel',
    webhookUrl: process.env.PAYOS_WEBHOOK_URL || 'http://localhost:3000/api/payments/payos/webhook'
};

export const isPayOSConfigured = () => {
    return PAYOS_CONFIG.clientId && PAYOS_CONFIG.apiKey && PAYOS_CONFIG.checksumKey;
};
