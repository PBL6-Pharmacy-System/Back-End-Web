import prisma from '../../../config/db.js';
import { ORDER_STATUS } from '../../../utils/constants.js';

// Payment methods
export const PAYMENT_METHODS = {
  COD: 'COD',                    // Cash on Delivery
  BANK_TRANSFER: 'bank_transfer',
  VNPAY: 'vnpay',
  MOMO: 'momo',
  CREDIT_CARD: 'credit_card'
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

/**
 * Create payment for an order
 */
export const createPayment = async (paymentData) => {
  try {
    const {
      orderId,
      paymentMethod,
      amount,
      transactionId = null
    } = paymentData;

    // Validate required fields
    if (!orderId || !paymentMethod || !amount) {
      return {
        success: false,
        status: 400,
        error: 'Order ID, phương thức thanh toán và số tiền là bắt buộc'
      };
    }

    // Validate payment method
    const validMethods = Object.values(PAYMENT_METHODS);
    if (!validMethods.includes(paymentMethod)) {
      return {
        success: false,
        status: 400,
        error: 'Phương thức thanh toán không hợp lệ'
      };
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true
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

    // Validate order status
    if (order.status === ORDER_STATUS.CANCELLED) {
      return {
        success: false,
        status: 400,
        error: 'Không thể tạo thanh toán cho đơn hàng đã hủy'
      };
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payments.findFirst({
      where: {
        order_id: Number(orderId),
        status: {
          in: [PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.PROCESSING]
        }
      }
    });

    if (existingPayment) {
      return {
        success: false,
        status: 400,
        error: 'Đơn hàng đã có thanh toán'
      };
    }

    // Validate amount matches order total
    const orderTotal = Number(order.final_amount);
    const paymentAmount = Number(amount);

    if (paymentAmount !== orderTotal) {
      return {
        success: false,
        status: 400,
        error: `Số tiền thanh toán (${paymentAmount}) không khớp với tổng đơn hàng (${orderTotal})`
      };
    }

    // Determine initial payment status based on payment method
    let initialStatus = PAYMENT_STATUS.PENDING;

    if (paymentMethod === PAYMENT_METHODS.COD) {
      // COD is pending until delivery
      initialStatus = PAYMENT_STATUS.PENDING;
    } else {
      // Other methods start as processing
      initialStatus = PAYMENT_STATUS.PROCESSING;
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        order_id: Number(orderId),
        payment_method: paymentMethod,
        amount: paymentAmount,
        status: initialStatus,
        transaction_id: transactionId,
        payment_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        orders: {
          include: {
            customers: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return {
      success: true,
      data: payment,
      message: 'Tạo thanh toán thành công'
    };
  } catch (error) {
    // Handle unique transaction_id constraint
    if (error.code === 'P2002' && error.meta?.target?.includes('transaction_id')) {
      return {
        success: false,
        status: 400,
        error: 'Mã giao dịch đã tồn tại'
      };
    }
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  try {
    const payment = await prisma.payments.findUnique({
      where: { id: Number(paymentId) },
      include: {
        orders: {
          include: {
            customers: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true
              }
            },
            orderitems: {
              include: {
                products: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy thanh toán'
      };
    }

    return {
      success: true,
      data: payment
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get payments for an order
 */
export const getOrderPayments = async (orderId) => {
  try {
    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) }
    });

    if (!order) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // Get all payments for this order
    const payments = await prisma.payments.findMany({
      where: {
        order_id: Number(orderId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      data: payments
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, userId = null) => {
  try {
    // Validate status
    const validStatuses = Object.values(PAYMENT_STATUS);
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        status: 400,
        error: 'Trạng thái thanh toán không hợp lệ'
      };
    }

    // Get current payment
    const currentPayment = await prisma.payments.findUnique({
      where: { id: Number(paymentId) },
      include: {
        orders: true
      }
    });

    if (!currentPayment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy thanh toán'
      };
    }

    // Don't allow updating completed payments
    if (currentPayment.status === PAYMENT_STATUS.COMPLETED) {
      return {
        success: false,
        status: 400,
        error: 'Không thể cập nhật thanh toán đã hoàn thành'
      };
    }

    // Update payment status
    const updatedPayment = await prisma.payments.update({
      where: { id: Number(paymentId) },
      data: {
        status,
        updated_at: new Date()
      },
      include: {
        orders: true
      }
    });

    // If payment is completed, update order status if needed
    if (status === PAYMENT_STATUS.COMPLETED) {
      const order = updatedPayment.orders;

      // Only update order status if it's still pending
      if (order.status === ORDER_STATUS.PENDING) {
        await prisma.$transaction([
          // Update order status to confirmed
          prisma.orders.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.CONFIRMED,
              updated_at: new Date()
            }
          }),
          // Create status history
          prisma.order_status_history.create({
            data: {
              order_id: order.id,
              status: ORDER_STATUS.CONFIRMED,
              changed_by: userId,
              changed_at: new Date()
            }
          })
        ]);
      }
    }

    return {
      success: true,
      data: updatedPayment,
      message: 'Cập nhật trạng thái thanh toán thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Process COD payment (mark as completed when delivered)
 */
export const processCODPayment = async (paymentId, userId = null) => {
  try {
    const payment = await prisma.payments.findUnique({
      where: { id: Number(paymentId) },
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

    if (payment.payment_method !== PAYMENT_METHODS.COD) {
      return {
        success: false,
        status: 400,
        error: 'Chỉ áp dụng cho thanh toán COD'
      };
    }

    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return {
        success: false,
        status: 400,
        error: 'Thanh toán đã được xử lý'
      };
    }

    // Check if order is delivered
    if (payment.orders.status !== ORDER_STATUS.DELIVERED) {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể xác nhận thanh toán COD khi đơn hàng đã giao'
      };
    }

    // Update payment status to completed
    const result = await updatePaymentStatus(
      paymentId,
      PAYMENT_STATUS.COMPLETED,
      userId
    );

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get payment statistics (Admin)
 */
export const getPaymentStatistics = async (filters = {}) => {
  try {
    const { startDate, endDate, paymentMethod } = filters;

    const where = {};

    if (startDate || endDate) {
      where.payment_date = {};
      if (startDate) where.payment_date.gte = new Date(startDate);
      if (endDate) where.payment_date.lte = new Date(endDate);
    }

    if (paymentMethod) {
      where.payment_method = paymentMethod;
    }

    // Get statistics
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      paymentsByMethod
    ] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.count({
        where: { ...where, status: PAYMENT_STATUS.COMPLETED }
      }),
      prisma.payments.count({
        where: { ...where, status: PAYMENT_STATUS.PENDING }
      }),
      prisma.payments.count({
        where: { ...where, status: PAYMENT_STATUS.FAILED }
      }),
      prisma.payments.aggregate({
        where: { ...where, status: PAYMENT_STATUS.COMPLETED },
        _sum: { amount: true }
      }),
      prisma.payments.groupBy({
        by: ['payment_method'],
        where,
        _count: true,
        _sum: { amount: true }
      })
    ]);

    return {
      success: true,
      data: {
        totalPayments,
        paymentsByStatus: {
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments
        },
        totalRevenue: totalRevenue._sum.amount || 0,
        paymentsByMethod: paymentsByMethod.map(pm => ({
          method: pm.payment_method,
          count: pm._count,
          total: pm._sum.amount || 0
        }))
      }
    };
  } catch (error) {
    throw error;
  }
};
