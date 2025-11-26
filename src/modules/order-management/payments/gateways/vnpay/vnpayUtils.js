import crypto from 'crypto';
import querystring from 'querystring';

export const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
};

export const createVNPaySignature = (params, secretKey) => {
  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  
  const hmac = crypto.createHmac('sha512', secretKey);
  const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  return signature;
};

export const verifyVNPaySignature = (params, secureHash, secretKey) => {
  const { vnp_SecureHash, vnp_SecureHashType, ...paramsWithoutHash } = params;
  const calculatedSignature = createVNPaySignature(paramsWithoutHash, secretKey);
  
  return secureHash === calculatedSignature;
};

export const formatAmount = (amount) => {
  return Math.round(amount);
};

export const formatDate = (date = new Date()) => {
  const pad = (num) => String(num).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};
