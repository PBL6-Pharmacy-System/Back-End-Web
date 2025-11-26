import crypto from 'crypto';

export const createMoMoSignature = (data, secretKey) => {
  const rawSignature = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
};

export const verifyMoMoSignature = (data, signature, secretKey) => {
  const calculatedSignature = createMoMoSignature(data, secretKey);
  return signature === calculatedSignature;
};

export const formatAmount = (amount) => {
  return Math.round(amount);
};

export const generateRequestId = () => {
  return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

export const generateOrderId = (orderId) => {
  return `ORDER_${orderId}_${Date.now()}`;
};
