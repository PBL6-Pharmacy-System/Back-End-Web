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
 * Log payment action for audit trail
 */
const logPaymentAction = async (paymentId, action, oldStatus = null, newStatus = null, userId = null, metadata = {}) => {
  try {
    await prisma.payment_logs.create({
      data: {
        payment_id: Number(paymentId),
        action,
        old_status: oldStatus,
        new_status: newStatus,
        metadata,
        created_by: userId,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log payment action:', error);
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
          select: {
            id: true,
            order_date: true,
            total_amount: true,
            final_amount: true,
            status: true,
            customers: {
              select: {
                id: true,
                users: {
                  select: {
                    full_name: true,
                    phone: true
                  }
                }
              }
            },
            orderitems: {
              select: {
                id: true,
                quantity: true,
                price: true,
                subtotal: true,
                products: {
                  select: {
                    id: true,
                    name: true
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

    // Log status change
    await logPaymentAction(
      paymentId,
      'status_changed',
      currentPayment.status,
      status,
      userId,
      { reason: 'Manual update by admin/staff' }
    );

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
 * ✅ FIX #7: Xóa đoạn update sold_count vì đã được xử lý trong orderService.updateOrderStatus()
 */
export const processCODPayment = async (paymentId, userId = null) => {
  try {
    const payment = await prisma.payments.findUnique({
      where: { id: Number(paymentId) },
      include: {
        orders: {
          include: {
            orderitems: {
              include: {
                products: true
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

    // Process COD payment in transaction
    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payments.update({
        where: { id: Number(paymentId) },
        data: {
          status: PAYMENT_STATUS.COMPLETED,
          payment_date: new Date(),
          updated_at: new Date()
        }
      });

      // Log payment action
      await tx.payment_logs.create({
        data: {
          payment_id: Number(paymentId),
          action: 'cod_confirmed',
          old_status: payment.status,
          new_status: PAYMENT_STATUS.COMPLETED,
          metadata: {
            confirmed_by: userId,
            confirmed_at: new Date()
          },
          created_by: userId,
          created_at: new Date()
        }
      });

      // ✅ FIX #7: KHÔNG update sold_count ở đây
      // sold_count đã được update trong orderService.updateOrderStatus() khi order chuyển sang DELIVERED
      // Nếu update ở đây sẽ bị tăng 2 lần

      // Note: Order status đã là DELIVERED nên không cần update lại
      // Chỉ cần xác nhận payment đã hoàn thành
    });

    return {
      success: true,
      message: 'Xác nhận thanh toán COD thành công'
    };
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
