import prisma from '../../../config/db.js';
import { ORDER_STATUS } from '../../../utils/constants.js';

/**
 * Get all orders with pagination and filters (Admin)
 */
export const getAllOrders = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerId,
      startDate,
      endDate,
      sortBy = 'order_date',
      sortOrder = 'desc'
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = {
      status: {
        not: ORDER_STATUS.CART // Exclude cart items
      }
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customer_id = Number(customerId);
    }

    if (startDate || endDate) {
      where.order_date = {};
      if (startDate) where.order_date.gte = new Date(startDate);
      if (endDate) where.order_date.lte = new Date(endDate);
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          customers: {
            include: {
              user: {
                select: {
                  full_name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          orderitems: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  image_url: true
                }
              },
              productunits: {
                select: {
                  id: true,
                  unit_name: true
                }
              }
            }
          },
          vouchers: {
            select: {
              id: true,
              code: true,
              discount_type: true,
              discount_value: true
            }
          },
          shippingaddresses: true
        }
      }),
      prisma.orders.count({ where })
    ]);

    return {
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          include: {
            user: {
              select: {
                full_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        },
        vouchers: true,
        shippingaddresses: true,
        payments: true,
        shipments: {
          include: {
            branches: true
          }
        },
        order_status_history: {
          orderBy: {
            changed_at: 'desc'
          },
          include: {
            users: {
              select: {
                id: true,
                username: true,
                full_name: true
              }
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

    return {
      success: true,
      data: order
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get customer's orders
 */
export const getCustomerOrders = async (customerId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = {
      customer_id: Number(customerId),
      status: {
        not: ORDER_STATUS.CART // Exclude cart
      }
    };

    if (status) {
      where.status = status;
    }

    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    // Get orders
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take,
        orderBy: {
          order_date: 'desc'
        },
        include: {
          orderitems: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  image_url: true
                }
              },
              productunits: {
                select: {
                  id: true,
                  unit_name: true
                }
              }
            }
          },
          vouchers: {
            select: {
              code: true,
              discount_value: true
            }
          },
          shipments: {
            select: {
              tracking_number: true,
              status: true,
              estimated_delivery: true
            }
          }
        }
      }),
      prisma.orders.count({ where })
    ]);

    return {
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status, userId) => {
  try {
    // Validate status
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        status: 400,
        error: 'Trạng thái đơn hàng không hợp lệ'
      };
    }

    // Get current order
    const currentOrder = await prisma.orders.findUnique({
      where: { id: Number(orderId) }
    });

    if (!currentOrder) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // Don't allow updating cart status
    if (currentOrder.status === ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Không thể cập nhật trạng thái giỏ hàng'
      };
    }

    // Update order status and create history record
    const [updatedOrder] = await prisma.$transaction([
      prisma.orders.update({
        where: { id: Number(orderId) },
        data: {
          status,
          updated_at: new Date()
        },
        include: {
          customers: true,
          orderitems: {
            include: {
              products: true,
              productunits: true
            }
          }
        }
      }),
      // Create status history record
      prisma.order_status_history.create({
        data: {
          order_id: Number(orderId),
          status,
          changed_by: userId ? Number(userId) : null,
          changed_at: new Date()
        }
      })
    ]);

    return {
      success: true,
      data: updatedOrder
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId, userId, reason = null) => {
  try {
    // Get current order
    const currentOrder = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        orderitems: true
      }
    });

    if (!currentOrder) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.CART
    ];

    if (nonCancellableStatuses.includes(currentOrder.status)) {
      return {
        success: false,
        status: 400,
        error: 'Không thể hủy đơn hàng này'
      };
    }

    // Cancel order and restore inventory
    const [cancelledOrder] = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.orders.update({
        where: { id: Number(orderId) },
        data: {
          status: ORDER_STATUS.CANCELLED,
          updated_at: new Date()
        },
        include: {
          customers: true,
          orderitems: {
            include: {
              products: true
            }
          }
        }
      });

      // Create status history
      await tx.order_status_history.create({
        data: {
          order_id: Number(orderId),
          status: ORDER_STATUS.CANCELLED,
          changed_by: userId ? Number(userId) : null,
          changed_at: new Date()
        }
      });

      // Restore inventory if order was confirmed
      if (currentOrder.status !== ORDER_STATUS.PENDING) {
        for (const item of currentOrder.orderitems) {
          // Find branch inventory to restore
          const inventory = await tx.branchinventory.findFirst({
            where: {
              product_id: item.product_id
            }
          });

          if (inventory) {
            await tx.branchinventory.update({
              where: { id: inventory.id },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      return [order];
    });

    return {
      success: true,
      data: cancelledOrder,
      message: 'Đơn hàng đã được hủy thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get order statistics (Admin)
 */
export const getOrderStatistics = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const where = {
      status: {
        not: ORDER_STATUS.CART
      }
    };

    if (startDate || endDate) {
      where.order_date = {};
      if (startDate) where.order_date.gte = new Date(startDate);
      if (endDate) where.order_date.lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.PENDING } }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.CONFIRMED } }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.PROCESSING } }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.SHIPPING } }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.DELIVERED } }),
      prisma.orders.count({ where: { ...where, status: ORDER_STATUS.CANCELLED } }),
      prisma.orders.aggregate({
        where: {
          ...where,
          status: ORDER_STATUS.DELIVERED
        },
        _sum: {
          final_amount: true
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipping: shippingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        totalRevenue: totalRevenue._sum.final_amount || 0,
        averageOrderValue: totalOrders > 0
          ? (totalRevenue._sum.final_amount || 0) / deliveredOrders
          : 0
      }
    };
  } catch (error) {
    throw error;
  }
};
