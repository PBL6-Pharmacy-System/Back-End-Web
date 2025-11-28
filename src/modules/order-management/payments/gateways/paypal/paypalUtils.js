import axios from 'axios';
import { PAYPAL_CONFIG } from './paypalConfig.js';
import { getUSDtoVNDRate } from './exchangeRateService.js';

/**
 * Get PayPal access token
 */
export const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`
    ).toString('base64');

    const response = await axios.post(
      `${PAYPAL_CONFIG.apiUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('PayPal get access token error:', error.response?.data || error.message);
    throw new Error('Không thể lấy access token từ PayPal');
  }
};

/**
 * Convert VND to USD with live exchange rate
 */
export const convertVNDtoUSD = async (amountVND) => {
  const exchangeRate = await getUSDtoVNDRate();
  const amountUSD = (amountVND / exchangeRate).toFixed(2);
  console.log(`💱 Converting: ${amountVND} VND = ${amountUSD} USD (rate: ${exchangeRate})`);
  return parseFloat(amountUSD);
};

/**
 * Convert USD to VND with live exchange rate
 */
export const convertUSDtoVND = async (amountUSD) => {
  const exchangeRate = await getUSDtoVNDRate();
  const amountVND = Math.round(amountUSD * exchangeRate);
  console.log(`💱 Converting: ${amountUSD} USD = ${amountVND} VND (rate: ${exchangeRate})`);
  return amountVND;
};

/**
 * Generate PayPal order ID
 */
export const generatePayPalOrderId = (systemOrderId) => {
  return `PAYPAL_${systemOrderId}_${Date.now()}`;
};

/**
 * Verify PayPal webhook signature
 */
export const verifyPayPalWebhook = async (headers, body, webhookId) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const verifyData = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body
    };

    const response = await axios.post(
      `${PAYPAL_CONFIG.apiUrl}/v1/notifications/verify-webhook-signature`,
      verifyData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error.response?.data || error.message);
    return false;
  }
};
