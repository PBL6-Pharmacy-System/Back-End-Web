import prisma from '../../../../../config/db.js';
import { VNPAY_CONFIG } from './vnpayConfig.js';
import { createVNPaySignature, formatAmount, formatDate, getClientIp, sortObject } from './vnpayUtils.js';

export const createVNPayPaymentUrl = async (orderId, req) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          include: {
            users: {
              select: { id: true, email: true, full_name: true }
            }
          }
        },
        payments: {
          select: {
            payment_method: true
          },
          take: 1
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

    // Check if order's payment method is VNPay
    const orderPaymentMethod = order.payments?.[0]?.payment_method;
    if (orderPaymentMethod && orderPaymentMethod !== 'vnpay') {
      return {
        success: false,
        status: 400,
        error: `Đơn hàng này sử dụng phương thức thanh toán ${orderPaymentMethod.toUpperCase()}, không thể thanh toán bằng VNPay`
      };
    }

    const createDate = formatDate();
    const orderId_vnpay = `${order.id}_${createDate}`;
    const amount = formatAmount(Number(order.final_amount));
    const ipAddr = getClientIp(req);

    const vnp_Params = {
      vnp_Version: VNPAY_CONFIG.vnp_Version,
      vnp_Command: VNPAY_CONFIG.vnp_Command,
      vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
      vnp_Locale: VNPAY_CONFIG.vnp_Locale,
      vnp_CurrCode: VNPAY_CONFIG.vnp_CurrCode,
      vnp_TxnRef: orderId_vnpay,
      vnp_OrderInfo: `Thanh toan don hang #${order.id}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    const sortedParams = sortObject(vnp_Params);
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
      .join('&');

    const secureHash = createVNPaySignature(vnp_Params, VNPAY_CONFIG.vnp_HashSecret);
    const paymentUrl = `${VNPAY_CONFIG.vnp_Url}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      success: true,
      data: {
        paymentUrl,
        orderId: order.id,
        amount: amount,
        txnRef: orderId_vnpay
      }
    };
  } catch (error) {
    console.error('VNPay create payment URL error:', error);
    throw error;
  }
};

export const handleVNPayCallback = async (query) => {
  try {
    const secureHash = query.vnp_SecureHash;
    const { vnp_SecureHash, vnp_SecureHashType, ...paramsWithoutHash } = query;

    const calculatedHash = createVNPaySignature(paramsWithoutHash, VNPAY_CONFIG.vnp_HashSecret);

    if (secureHash !== calculatedHash) {
      return {
        success: false,
        status: 400,
        error: 'Chữ ký không hợp lệ',
        RspCode: '97'
      };
    }

    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const vnp_TransactionNo = query.vnp_TransactionNo;
    const vnp_Amount = query.vnp_Amount;
    
    const orderId = vnp_TxnRef.split('_')[0];

    const payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        payment_method: 'vnpay'
      },
      include: {
        orders: true
      }
    });

    if (!payment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy thanh toán',
        RspCode: '01'
      };
    }

    if (vnp_ResponseCode === '00') {
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transaction_id: vnp_TransactionNo,
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'vnpay_callback_success',
            old_status: payment.status,
            new_status: 'completed',
            metadata: {
              vnp_TxnRef,
              vnp_TransactionNo,
              vnp_ResponseCode,
              vnp_Amount
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
          transactionNo: vnp_TransactionNo,
          amount: vnp_Amount / 100
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
            action: 'vnpay_callback_failed',
            old_status: payment.status,
            new_status: 'failed',
            metadata: {
              vnp_TxnRef,
              vnp_ResponseCode,
              error: `VNPay response code: ${vnp_ResponseCode}`
            },
            created_at: new Date()
          }
        });
      });

      return {
        success: false,
        status: 400,
        error: 'Thanh toán thất bại',
        RspCode: vnp_ResponseCode
      };
    }
  } catch (error) {
    console.error('VNPay callback error:', error);
    throw error;
  }
};

export const handleVNPayIPN = async (query) => {
  try {
    const secureHash = query.vnp_SecureHash;
    const { vnp_SecureHash, vnp_SecureHashType, ...paramsWithoutHash } = query;

    const calculatedHash = createVNPaySignature(paramsWithoutHash, VNPAY_CONFIG.vnp_HashSecret);

    if (secureHash !== calculatedHash) {
      return {
        RspCode: '97',
        Message: 'Invalid signature'
      };
    }

    const vnp_TxnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const vnp_TransactionNo = query.vnp_TransactionNo;
    const orderId = vnp_TxnRef.split('_')[0];

    const payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        payment_method: 'vnpay'
      }
    });

    if (!payment) {
      return {
        RspCode: '01',
        Message: 'Order not found'
      };
    }

    if (payment.status === 'completed') {
      return {
        RspCode: '02',
        Message: 'Order already confirmed'
      };
    }

    if (vnp_ResponseCode === '00') {
      await prisma.$transaction(async (tx) => {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            transaction_id: vnp_TransactionNo,
            updated_at: new Date()
          }
        });

        await tx.payment_logs.create({
          data: {
            payment_id: payment.id,
            action: 'vnpay_ipn_success',
            old_status: payment.status,
            new_status: 'completed',
            metadata: {
              vnp_TxnRef,
              vnp_TransactionNo,
              vnp_ResponseCode
            },
            created_at: new Date()
          }
        });
      });

      return {
        RspCode: '00',
        Message: 'Success'
      };
    } else {
      await prisma.payment_logs.create({
        data: {
          payment_id: payment.id,
          action: 'vnpay_ipn_failed',
          old_status: payment.status,
          new_status: payment.status,
          metadata: {
            vnp_TxnRef,
            vnp_ResponseCode
          },
          created_at: new Date()
        }
      });

      return {
        RspCode: '00',
        Message: 'Success'
      };
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    return {
      RspCode: '99',
      Message: 'Unknown error'
    };
  }
};
