/**
 * PayOS Utility Functions
 * Các hàm tiện ích cho PayOS
 */

import crypto from 'crypto';

/**
 * Tạo checksum cho PayOS request
 * @param {Object} data - Dữ liệu cần tạo checksum
 * @param {string} checksumKey - Key để tạo checksum
 * @returns {string} Checksum string
 */
export const createPayOSChecksum = (data, checksumKey) => {
    // PayOS yêu cầu checksum theo format: amount=X&cancelUrl=Y&description=Z&orderCode=A&returnUrl=B
    const sortedKeys = Object.keys(data).sort();
    const signData = sortedKeys
        .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== '')
        .map(key => `${key}=${data[key]}`)
        .join('&');
    
    return crypto
        .createHmac('sha256', checksumKey)
        .update(signData)
        .digest('hex');
};

/**
 * Verify webhook signature từ PayOS
 * @param {Object} webhookBody - Body của webhook
 * @param {string} signature - Signature từ header
 * @param {string} checksumKey - Checksum key
 * @returns {boolean}
 */
export const verifyPayOSWebhook = (webhookBody, signature, checksumKey) => {
    const sortedKeys = Object.keys(webhookBody.data || webhookBody).sort();
    const signData = sortedKeys
        .filter(key => webhookBody.data ? webhookBody.data[key] !== undefined : webhookBody[key] !== undefined)
        .map(key => `${key}=${webhookBody.data ? webhookBody.data[key] : webhookBody[key]}`)
        .join('&');
    
    const calculatedSignature = crypto
        .createHmac('sha256', checksumKey)
        .update(signData)
        .digest('hex');
    
    return calculatedSignature === signature;
};

/**
 * Generate unique order code cho PayOS
 * PayOS yêu cầu orderCode là số nguyên unique
 * @param {number} orderId - Order ID từ database
 * @returns {number}
 */
export const generateOrderCode = (orderId) => {
    // Kết hợp orderId với timestamp để đảm bảo unique
    const timestamp = Date.now() % 1000000; // Lấy 6 số cuối của timestamp
    return parseInt(`${orderId}${timestamp}`);
};

/**
 * Format amount cho PayOS (đơn vị VND, không có số thập phân)
 * @param {number} amount 
 * @returns {number}
 */
export const formatPayOSAmount = (amount) => {
    return Math.round(Number(amount));
};
