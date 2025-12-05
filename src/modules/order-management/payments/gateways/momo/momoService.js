import axios from 'axios';
import crypto from 'crypto';
import prisma from '../../../../../config/db.js';
import { MOMO_CONFIG } from './momoConfig.js';
import { createMoMoSignature, generateRequestId } from './momoUtils.js';

export const createMoMoPayment = async (orderId) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          include: {
            users: {
              select: { id: true, email: true, full_name: true, phone: true }
            }
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    const requestId = generateRequestId();
    const momoOrderId = `MOMO_${order.id}_${Date.now()}`;
    const amount = String(Math.round(Number(order.final_amount)));

    const rawData = {
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: 'PBL6 Pharmacy',
      storeId: 'PBL6Store',
      requestId: requestId,
      amount: amount,
      orderId: momoOrderId,
      orderInfo: `Thanh toan don hang #${order.id}`,
      redirectUrl: MOMO_CONFIG.returnUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      requestType: MOMO_CONFIG.requestType,
      extraData: Buffer.from(JSON.stringify({ 
        systemOrderId: order.id,
        customerEmail: order.customers?.users?.email 
      })).toString('base64'),
      lang: 'vi',
      autoCapture: true
    };

    const signature = createMoMoSignature({
      accessKey: MOMO_CONFIG.accessKey,
      amount: rawData.amount,
      extraData: rawData.extraData,
      ipnUrl: rawData.ipnUrl,
      orderId: rawData.orderId,
      orderInfo: rawData.orderInfo,
      partnerCode: rawData.partnerCode,
      redirectUrl: rawData.redirectUrl,
      requestId: rawData.requestId,
      requestType: rawData.requestType
    }, MOMO_CONFIG.secretKey);

    const requestBody = {
      ...rawData,
      signature
    };

    console.log('🔵 MoMo Payment Request:', {
      orderId: order.id,
      momoOrderId,
      amount,
      requestId
    });

    const response = await axios.post(MOMO_CONFIG.endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('🔵 MoMo Response:', response.data);

    if (response.data.resultCode === 0) {
      return {
        success: true,
        data: {
          payUrl: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
          orderId: order.id,
          momoOrderId,
          amount,
          requestId
        }
      };
    } else {
      return {
        success: false,
        status: 400,
        error: response.data.message || 'Không thể tạo thanh toán MoMo',
        resultCode: response.data.resultCode
      };
    }
  } catch (error) {
    console.error('MoMo create payment error:', error.response?.data || error.message);
    throw error;
  }
};

export const handleMoMoCallback = async (body) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = body;

    const dataToVerify = {
      accessKey: MOMO_CONFIG.accessKey,
      amount,
      extraData: extraData || '',
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId
    };

    const isValidSignature = verifyMoMoSignature(dataToVerify, signature, MOMO_CONFIG.secretKey);

    if (!isValidSignature) {
      return {
        success: false,
        status: 400,
        error: 'Chữ ký không hợp lệ'
      };
    }

    let systemOrderId;
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
      systemOrderId = decoded.systemOrderId;
    } catch (e) {
      systemOrderId = orderId.split('_')[1];
    }

    const payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(systemOrderId),
        payment_method: 'momo'
      },
      include: {
        orders: true
      }
    });

    if (!payment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy thanh toán'
      };
    }

    if (resultCode === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transaction_id: String(transId),
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'momo_callback_success',
            old_status: payment.status,
            new_status: 'completed',
            metadata: {
              orderId,
              transId,
              resultCode,
              amount,
              payType
            },
            created_at: new Date()
          }
        });

        if (payment.orders.status === 'pending') {
          await tx.orders.update({
            where: { id: payment.order_id },
            data: {
              status: 'confirmed',
              updated_at: new Date()
            }
          });
        }
      });

      return {
        success: true,
        message: 'Thanh toán thành công',
        data: {
          orderId: payment.order_id,
          transId,
          amount
        }
      };
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'momo_callback_failed',
            old_status: payment.status,
            new_status: 'failed',
            metadata: {
              orderId,
              resultCode,
              message,
              error: `MoMo result code: ${resultCode}`
            },
            created_at: new Date()
          }
        });
      });

      return {
        success: false,
        status: 400,
        error: message || 'Thanh toán thất bại',
        resultCode
      };
    }
  } catch (error) {
    console.error('MoMo callback error:', error);
    throw error;
  }
};

export const handleMoMoIPN = async (body) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = body;

    const dataToVerify = {
      accessKey: MOMO_CONFIG.accessKey,
      amount,
      extraData: extraData || '',
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId
    };

    const isValidSignature = verifyMoMoSignature(dataToVerify, signature, MOMO_CONFIG.secretKey);

    if (!isValidSignature) {
      return {
        resultCode: 97,
        message: 'Invalid signature'
      };
    }

    let systemOrderId;
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
      systemOrderId = decoded.systemOrderId;
    } catch (e) {
      systemOrderId = orderId.split('_')[1];
    }

    const payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(systemOrderId),
        payment_method: 'momo'
      }
    });

    if (!payment) {
      return {
        resultCode: 1,
        message: 'Order not found'
      };
    }

    if (payment.status === 'completed') {
      return {
        resultCode: 0,
        message: 'Order already confirmed'
      };
    }

    if (resultCode === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transaction_id: String(transId),
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'momo_ipn_success',
            old_status: payment.status,
            new_status: 'completed',
            metadata: {
              orderId,
              transId,
              resultCode
            },
            created_at: new Date()
          }
        });
      });

      return {
        resultCode: 0,
        message: 'Success'
      };
    } else {
      await prisma.payment_logs.create({
        data: {
          payment_id: payment.id,
          action: 'momo_ipn_failed',
          old_status: payment.status,
          new_status: payment.status,
          metadata: {
            orderId,
            resultCode,
            message
          },
          created_at: new Date()
        }
      });

      return {
        resultCode: 0,
        message: 'Acknowledged'
      };
    }
  } catch (error) {
    console.error('MoMo IPN error:', error);
    return {
      resultCode: 99,
      message: 'Unknown error'
    };
  }
};

const verifyMoMoSignature = (data, signature, secretKey) => {
  const rawSignature = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  const calculatedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
    
  return signature === calculatedSignature;
};
