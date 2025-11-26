import prisma from '../../../../../config/db.js';
import { createMoMoPayment, handleMoMoCallback, handleMoMoIPN } from './momoService.js';

export const createPaymentDeeplink = async (req, res, next) => {
  try {
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }

    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderId'
      });
    }

    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          include: {
            users: { select: { id: true } }
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check if order's payment method is MoMo
    const orderPaymentMethod = order.payments?.[0]?.payment_method;
    if (orderPaymentMethod && orderPaymentMethod !== 'momo') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng này sử dụng phương thức thanh toán ${orderPaymentMethod.toUpperCase()}, không thể thanh toán bằng MoMo`
      });
    }

    if (req.user.role === 'customer' && order.customers?.users?.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thanh toán đơn hàng này'
      });
    }

    const existingPayment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        payment_method: 'momo',
        status: 'completed'
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    let payment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        payment_method: 'momo'
      }
    });

    if (!payment) {
      payment = await prisma.payments.create({
        data: {
          order_id: Number(orderId),
          payment_method: 'momo',
          amount: order.final_amount,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      await prisma.payment_logs.create({
        data: {
          payment_id: payment.id,
          action: 'created',
          old_status: null,
          new_status: 'pending',
          metadata: {
            payment_method: 'momo',
            amount: order.final_amount
          },
          created_at: new Date()
        }
      });
    }

    const result = await createMoMoPayment(orderId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Tạo thanh toán MoMo thành công',
        data: result.data
      });
    } else {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Create MoMo payment error:', error);
    next(error);
  }
};

export const momoCallback = async (req, res, next) => {
  try {
    const result = await handleMoMoCallback(req.query);

    if (result.success) {
      const redirectUrl = `${process.env.FRONTEND_URL}/payment-success?orderId=${result.data.orderId}&transId=${result.data.transId}`;
      return res.redirect(redirectUrl);
    } else {
      const redirectUrl = `${process.env.FRONTEND_URL}/payment-failed?error=${encodeURIComponent(result.error)}`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('MoMo callback error:', error);
    const redirectUrl = `${process.env.FRONTEND_URL}/payment-failed?error=${encodeURIComponent('Lỗi hệ thống')}`;
    return res.redirect(redirectUrl);
  }
};

export const momoIPN = async (req, res) => {
  try {
    const result = await handleMoMoIPN(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('MoMo IPN error:', error);
    return res.status(200).json({
      resultCode: 99,
      message: 'Unknown error'
    });
  }
};
