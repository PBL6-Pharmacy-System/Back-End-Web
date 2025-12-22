import prisma from '../../../config/db.js';
import { ORDER_STATUS } from '../../../utils/constants.js';

/**
 * ✅ FIX #20: Valid order status transitions (State Machine)
 */

// Bỏ trạng thái Processing và cho phép đổi trạng thái từ confirmed thẳng sang shipping

const VALID_ORDER_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.RETURNED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.RETURNED], // Chỉ có thể return sau completed
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
  [ORDER_STATUS.RETURNED]: []   // Terminal state
};

/**
 * Kiểm tra transition có hợp lệ không
 */
const isValidOrderTransition = (currentStatus, newStatus) => {
  const validNextStatuses = VALID_ORDER_TRANSITIONS[currentStatus];
  if (!validNextStatuses) return false;
  return validNextStatuses.includes(newStatus);
};

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
              },
              productunits: {
                select: {
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
          shippingaddresses: {
            select: {
              id: true,
              address_line: true,
              city_id: true
            }
          },
          payments: {
            select: {
              payment_method: true,
              status: true
            }
          },
          shipments: {
            select: {
              status: true,
              tracking_number: true
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
 * Get order by ID
 * ✅ FIX ISSUE #8: Thêm kiểm tra ownership để bảo mật
 * @param {number} orderId - ID đơn hàng
 * @param {number|null} customerId - ID khách hàng (nếu là customer request)
 * @param {boolean} isAdmin - Có phải admin/staff không
 */
export const getOrderById = async (orderId, customerId = null, isAdmin = false) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: {
          select: {
            id: true,
            users: {
              select: {
                full_name: true,
                email: true,
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
                name: true,
                image_url: true,
                price: true
              }
            },
            productunits: {
              select: {
                id: true,
                unit_name: true,
                conversion_factor: true
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
        shippingaddresses: {
          select: {
            id: true,
            recipient_name: true,
            recipient_phone: true,
            address_line: true,
            city: true,
            state: true,
            postal_code: true,
            city_id: true
          }
        },
        payments: {
          select: {
            id: true,
            payment_method: true,
            amount: true,
            status: true,
            transaction_id: true,
            payment_date: true
          }
        },
        shipments: {
          select: {
            id: true,
            status: true,
            tracking_number: true,
            estimated_delivery: true,
            branches: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        order_status_history: {
          orderBy: {
            changed_at: 'desc'
          },
          select: {
            id: true,
            status: true,
            changed_at: true,
            changed_by: true,
            users: {
              select: {
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

    // ✅ FIX ISSUE #8: Kiểm tra ownership nếu không phải admin
    if (!isAdmin && customerId && order.customer_id !== Number(customerId)) {
      return {
        success: false,
        status: 403,
        error: 'Bạn không có quyền xem đơn hàng này'
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
              discount_value: true,
              discount_type: true
            }
          },
          payments: {
            select: {
              id: true,
              payment_method: true,
              amount: true,
              status: true,
              transaction_id: true,
              payment_date: true
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
 * ✅ FIX #1: Thêm logic tăng sold_count khi order chuyển sang delivered/completed
 * ✅ FIX #20: Thêm state machine validation
 * ✅ FIX #22: Thêm Serializable isolation level
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

    // Get current order with items
    const currentOrder = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        orderitems: {
          select: {
            product_id: true,
            quantity: true
          }
        }
      }
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

    // ✅ FIX #20: Validate state transition
    if (!isValidOrderTransition(currentOrder.status, status)) {
      const validNextStatuses = VALID_ORDER_TRANSITIONS[currentOrder.status] || [];
      return {
        success: false,
        status: 400,
        error: `Không thể chuyển từ "${currentOrder.status}" sang "${status}". Các trạng thái hợp lệ: ${validNextStatuses.join(', ') || 'Không có (trạng thái cuối)'}`,
        currentStatus: currentOrder.status,
        validTransitions: validNextStatuses
      };
    }

    // Check if this is a transition to delivered/completed (for sold_count update)
    const previousStatus = currentOrder.status;
    const isCompletingOrder =
      (status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.COMPLETED) &&
      previousStatus !== ORDER_STATUS.DELIVERED &&
      previousStatus !== ORDER_STATUS.COMPLETED;

    // Check if order was completed but now being reverted (for sold_count decrease)
    const isRevertingFromCompleted =
      (previousStatus === ORDER_STATUS.DELIVERED || previousStatus === ORDER_STATUS.COMPLETED) &&
      status !== ORDER_STATUS.DELIVERED &&
      status !== ORDER_STATUS.COMPLETED;

    // ✅ FIX #22: Update order status với Serializable isolation level
    const result = await prisma.$transaction(async (tx) => {
      // Update order
      const updatedOrder = await tx.orders.update({
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
      });

      // Create status history record
      await tx.order_status_history.create({
        data: {
          order_id: Number(orderId),
          status,
          changed_by: userId ? Number(userId) : null,
          changed_at: new Date()
        }
      });

      // ✅ FIX #1: Update sold_count when order is completed
      if (isCompletingOrder) {
        for (const item of currentOrder.orderitems) {
          await tx.products.update({
            where: { id: item.product_id },
            data: {
              sold_count: { increment: item.quantity }
            }
          });
        }
        console.log(`[OrderService] Incremented sold_count for order #${orderId}`);
      }

      // ✅ FIX #12: Decrease sold_count if reverting from completed status
      // Chỉ giảm nếu sold_count hiện tại >= quantity để tránh âm
      if (isRevertingFromCompleted) {
        for (const item of currentOrder.orderitems) {
          // Lấy product hiện tại để check sold_count
          const product = await tx.products.findUnique({
            where: { id: item.product_id },
            select: { sold_count: true }
          });

          // Chỉ decrement nếu sold_count >= quantity
          if (product && product.sold_count >= item.quantity) {
            await tx.products.update({
              where: { id: item.product_id },
              data: {
                sold_count: { decrement: item.quantity }
              }
            });
          } else {
            // Nếu không đủ, set về 0 thay vì âm
            await tx.products.update({
              where: { id: item.product_id },
              data: {
                sold_count: 0
              }
            });
            console.warn(`[OrderService] Warning: sold_count would go negative for product #${item.product_id}, set to 0`);
          }
        }
        console.log(`[OrderService] Decremented sold_count for order #${orderId} (status reverted)`);
      }

      return updatedOrder;
    }, {
      timeout: 15000,
      isolationLevel: 'Serializable' // ✅ Thêm isolation level
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    // ✅ FIX #22: Handle transaction timeout/conflict
    if (error.code === 'P2028') {
      return {
        success: false,
        status: 503,
        error: 'Hệ thống đang bận xử lý, vui lòng thử lại sau'
      };
    }
    throw error;
  }
};

/**
 * Cancel order
 * ✅ FIX ISSUE #2, #5, #6, #9, #18, #19, #23: 
 * - Hoàn kho về ĐÚNG chi nhánh đã xuất hàng (từ shipments)
 * - Hoàn kho cho CẢ đơn PENDING (vì inventory đã bị trừ khi checkout)
 * - Thêm COMPLETED và RETURNED vào nonCancellableStatuses
 * - Hoàn cả productBatch khi cancel
 * - Rollback voucher khi hủy đơn
 * - ✅ FIX #18: Rollback flashsale sold_count (dựa trên order_date thay vì 24h)
 * - ✅ FIX #19: Handle multi-branch shipments
 * - ✅ FIX #23: Thêm Serializable isolation level
 */
export const cancelOrder = async (orderId, userId, reason = null) => {
  try {
    // Get current order with shipments to know which branch to restore
    const currentOrder = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        orderitems: {
          include: {
            productunits: true,
            products: true
          }
        },
        shipments: {
          select: {
            id: true,
            branch_id: true,
            status: true
          }
        },
        vouchers: {
          select: {
            id: true,
            code: true
          }
        }
      }
    });

    if (!currentOrder) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // ✅ FIX ISSUE #5: Thêm COMPLETED và RETURNED vào danh sách không thể hủy
    const nonCancellableStatuses = [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.RETURNED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.CART
    ];

    if (nonCancellableStatuses.includes(currentOrder.status)) {
      return {
        success: false,
        status: 400,
        error: `Không thể hủy đơn hàng có trạng thái "${currentOrder.status}"`
      };
    }

    // ✅ FIX #23: Cancel order và restore inventory với Serializable isolation
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.orders.update({
        where: { id: Number(orderId) },
        data: {
          status: ORDER_STATUS.CANCELLED,
          note: reason ? `${currentOrder.note || ''}\n[Lý do hủy]: ${reason}`.trim() : currentOrder.note,
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

      // ✅ FIX ISSUE #9: Rollback voucher nếu có
      if (currentOrder.voucher_id) {
        // ✅ FIX: Kiểm tra used_count > 0 trước khi decrement
        const voucher = await tx.vouchers.findUnique({
          where: { id: currentOrder.voucher_id },
          select: { used_count: true }
        });

        if (voucher && voucher.used_count > 0) {
          await tx.vouchers.update({
            where: { id: currentOrder.voucher_id },
            data: {
              used_count: { decrement: 1 }
            }
          });
        }

        await tx.uservouchers.updateMany({
          where: {
            order_id: Number(orderId),
            voucher_id: currentOrder.voucher_id
          },
          data: {
            is_used: false
          }
        });

        console.log(`[OrderService] Rolled back voucher #${currentOrder.voucher_id} for cancelled order #${orderId}`);
      }

      // ✅ FIX ISSUE #18: Rollback flashsale sold_count
      // Tìm flashsale dựa trên ORDER_DATE thay vì thời điểm hiện tại
      const orderDate = currentOrder.order_date || new Date();
      for (const item of currentOrder.orderitems) {
        // Tìm flashsale đang active tại THỜI ĐIỂM ĐẶT HÀNG
        const flashsaleAtOrderTime = await tx.flashsales.findFirst({
          where: {
            start_time: { lte: orderDate },
            end_time: { gte: orderDate }
          },
          include: {
            flashsale_products: {
              where: { product_id: item.product_id }
            }
          }
        });

        if (flashsaleAtOrderTime && flashsaleAtOrderTime.flashsale_products.length > 0) {
          const flashsaleProduct = flashsaleAtOrderTime.flashsale_products[0];

          // Chỉ rollback nếu sold_count >= quantity
          if (flashsaleProduct.sold_count >= item.quantity) {
            await tx.flashsale_products.update({
              where: { id: flashsaleProduct.id },
              data: {
                sold_count: { decrement: item.quantity }
              }
            });
            console.log(`[OrderService] Rolled back flashsale sold_count for product #${item.product_id}, qty: ${item.quantity}`);
          }
        }
      }

      // ✅ FIX ISSUE #19: Handle ALL shipments (multi-branch)
      // Hoàn kho cho TẤT CẢ các shipments, không chỉ shipments[0]
      for (const shipment of currentOrder.shipments) {
        if (!shipment.branch_id) continue;

        // ✅ FIX: Tìm inventory logs cho shipment này - hỗ trợ CẢ 2 convention
        // Convention cũ: type='OUT', quantity < 0
        // Convention mới: type='EXPORT', quantity > 0
        const inventoryLogs = await tx.inventoryLog.findMany({
          where: {
            reference_type: 'order',
            reference_id: Number(orderId),
            branch_id: shipment.branch_id,
            OR: [
              // Convention cũ: số âm
              { type: { in: ['OUT', 'sale'] }, quantity: { lt: 0 } },
              // Convention mới: số dương với type EXPORT
              { type: 'EXPORT', quantity: { gt: 0 } }
            ]
          }
        });

        // Group logs by product_id để tính tổng cần hoàn
        const productRestoreMap = new Map();

        for (const log of inventoryLogs) {
          const currentQty = productRestoreMap.get(log.product_id) || 0;
          // ✅ FIX: Xử lý cả số âm (convention cũ) và số dương (convention mới)
          const qtyToRestore = log.quantity < 0 ? Math.abs(log.quantity) : log.quantity;
          productRestoreMap.set(log.product_id, currentQty + qtyToRestore);

          // ✅ FIX ISSUE #6: Hoàn batch nếu có
          if (log.batch_id) {
            await tx.productBatch.update({
              where: { id: log.batch_id },
              data: {
                quantity: { increment: qtyToRestore },
                updated_at: new Date()
              }
            });
            console.log(`[OrderService] Restored batch #${log.batch_id} with qty ${qtyToRestore}`);
          }
        }

        // Nếu không có logs (legacy orders), tính từ orderitems
        if (inventoryLogs.length === 0) {
          for (const item of currentOrder.orderitems) {
            const conversionFactor = item.productunits?.conversion_factor
              ? Number(item.productunits.conversion_factor)
              : 1;
            const baseQuantity = item.quantity * conversionFactor;
            productRestoreMap.set(item.product_id, baseQuantity);
          }
        }

        // Hoàn kho cho từng product
        for (const [productId, restoreQty] of productRestoreMap) {
          await tx.branchinventory.update({
            where: {
              branch_id_product_id: {
                branch_id: shipment.branch_id,
                product_id: productId
              }
            },
            data: {
              stock: { increment: restoreQty },
              last_updated: new Date()
            }
          });

          // Create inventory log for tracking
          const inventoryLog = await tx.inventoryLog.create({
            data: {
              branch_id: shipment.branch_id,
              product_id: productId,
              quantity: restoreQty,
              type: 'CANCEL_RETURN',
              reference_type: 'order',
              reference_id: orderId,
              note: `Hoàn kho do hủy đơn #${orderId}${reason ? ` - Lý do: ${reason}` : ''}`,
              created_by: userId,
              date: new Date()
            }
          });

          await tx.inventoryLog_Order.create({
            data: {
              inventory_log_id: inventoryLog.id,
              order_id: Number(orderId)
            }
          });
        }

        console.log(`[OrderService] Restored inventory to branch #${shipment.branch_id} for cancelled order #${orderId}`);
      }

      // Fallback nếu không có shipments
      if (currentOrder.shipments.length === 0) {
        console.warn(`[OrderService] No shipments found for order #${orderId}, cannot restore inventory to specific branch`);
      }

      // Cancel any active inventory reservations
      await tx.inventoryReservation.updateMany({
        where: {
          order_id: Number(orderId),
          status: 'active'
        },
        data: {
          status: 'cancelled',
          updated_at: new Date()
        }
      });

      return order;
    }, {
      timeout: 20000,
      isolationLevel: 'Serializable' // ✅ FIX #23: Thêm isolation level
    });

    return {
      success: true,
      data: result,
      message: 'Đơn hàng đã được hủy thành công'
    };
  } catch (error) {
    // ✅ FIX #23: Handle transaction timeout/conflict
    if (error.code === 'P2028') {
      return {
        success: false,
        status: 503,
        error: 'Hệ thống đang bận xử lý, vui lòng thử lại sau'
      };
    }
    console.error(`[OrderService] Error cancelling order #${orderId}:`, error);
    throw error;
  }
};

/**
 * Update order note
 */
export const updateOrderNote = async (orderId, note) => {
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

    // Update note
    const updatedOrder = await prisma.orders.update({
      where: { id: Number(orderId) },
      data: {
        note: note || null,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: updatedOrder,
      message: 'Cập nhật ghi chú đơn hàng thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get order statistics (Admin)
 * ✅ FIX #6: Sửa division by zero trong averageOrderValue
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
        // ✅ FIX #6: Check deliveredOrders > 0 thay vì totalOrders > 0
        averageOrderValue: deliveredOrders > 0
          ? (totalRevenue._sum.final_amount || 0) / deliveredOrders
          : 0
      }
    };
  } catch (error) {
    throw error;
  }
};
