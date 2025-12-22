/**
 * ✅ FIX #14: Inventory Reservation Service
 * Quản lý việc giữ chỗ tạm thời khi checkout để tránh race condition âm kho
 */
import prisma from '../../../config/db.js';

// Thời gian giữ chỗ mặc định (15 phút) - có thể config qua env
const DEFAULT_RESERVATION_MINUTES = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 15;

/**
 * Tạo reservation cho order khi bắt đầu checkout
 * Giữ chỗ hàng để không bị user khác mua mất
 */
export const createReservation = async (orderId, items, branchId) => {
  try {
    const expiresAt = new Date(Date.now() + DEFAULT_RESERVATION_MINUTES * 60 * 1000);
    
    const reservations = await prisma.$transaction(async (tx) => {
      const createdReservations = [];

      for (const item of items) {
        const { productId, quantity, conversionFactor = 1 } = item;
        const baseQuantity = quantity * conversionFactor;

        // Check available stock (excluding active reservations)
        const inventory = await tx.branchinventory.findUnique({
          where: {
            branch_id_product_id: {
              branch_id: Number(branchId),
              product_id: Number(productId)
            }
          }
        });

        if (!inventory) {
          throw new Error(`Sản phẩm ${productId} không có tại chi nhánh ${branchId}`);
        }

        // Get total active reservations for this product
        const activeReservations = await tx.inventoryReservation.aggregate({
          where: {
            branch_id: Number(branchId),
            product_id: Number(productId),
            status: 'active',
            expires_at: { gt: new Date() }
          },
          _sum: { quantity: true }
        });

        const reservedQty = activeReservations._sum.quantity || 0;
        const availableStock = inventory.stock - reservedQty;

        if (availableStock < baseQuantity) {
          throw new Error(
            `Sản phẩm ${productId} không đủ số lượng. Có sẵn: ${availableStock}, Cần: ${baseQuantity}`
          );
        }

        // Create reservation
        const reservation = await tx.inventoryReservation.create({
          data: {
            branch_id: Number(branchId),
            product_id: Number(productId),
            order_id: Number(orderId),
            quantity: baseQuantity,
            status: 'active',
            expires_at: expiresAt
          }
        });

        createdReservations.push(reservation);
      }

      return createdReservations;
    });

    return {
      success: true,
      data: {
        reservations,
        expires_at: expiresAt,
        message: `Đã giữ chỗ ${items.length} sản phẩm trong ${DEFAULT_RESERVATION_MINUTES} phút`
      }
    };
  } catch (error) {
    return {
      success: false,
      status: 400,
      error: error.message
    };
  }
};

/**
 * Hoàn thành reservation khi order được xác nhận
 * Chuyển status từ 'active' sang 'completed'
 */
export const completeReservation = async (orderId) => {
  try {
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        order_id: Number(orderId),
        status: 'active'
      },
      data: {
        status: 'completed',
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: {
        updated: result.count,
        message: `Đã hoàn thành ${result.count} reservation cho order #${orderId}`
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy reservation khi order bị hủy hoặc hết thời gian
 */
export const cancelReservation = async (orderId) => {
  try {
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        order_id: Number(orderId),
        status: 'active'
      },
      data: {
        status: 'cancelled',
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: {
        cancelled: result.count,
        message: `Đã hủy ${result.count} reservation cho order #${orderId}`
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra và hủy các reservation đã hết hạn
 * Nên chạy định kỳ bằng cron job
 */
export const expireOldReservations = async () => {
  try {
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        status: 'active',
        expires_at: { lt: new Date() }
      },
      data: {
        status: 'expired',
        updated_at: new Date()
      }
    });

    console.log(`[InventoryReservation] Expired ${result.count} reservations`);

    return {
      success: true,
      data: {
        expired: result.count
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy available stock (đã trừ reservations)
 */
export const getAvailableStock = async (branchId, productId) => {
  try {
    const [inventory, activeReservations] = await Promise.all([
      prisma.branchinventory.findUnique({
        where: {
          branch_id_product_id: {
            branch_id: Number(branchId),
            product_id: Number(productId)
          }
        }
      }),
      prisma.inventoryReservation.aggregate({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId),
          status: 'active',
          expires_at: { gt: new Date() }
        },
        _sum: { quantity: true }
      })
    ]);

    const totalStock = inventory?.stock || 0;
    const reservedQty = activeReservations._sum.quantity || 0;
    const availableStock = totalStock - reservedQty;

    return {
      success: true,
      data: {
        branch_id: branchId,
        product_id: productId,
        total_stock: totalStock,
        reserved_quantity: reservedQty,
        available_stock: availableStock
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách reservations theo order
 */
export const getReservationsByOrder = async (orderId) => {
  try {
    const reservations = await prisma.inventoryReservation.findMany({
      where: { order_id: Number(orderId) },
      include: {
        products: {
          select: { id: true, name: true }
        },
        branches: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return {
      success: true,
      data: reservations
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Extend reservation time (gia hạn thêm thời gian)
 */
export const extendReservation = async (orderId, additionalMinutes = 10) => {
  try {
    const reservations = await prisma.inventoryReservation.findMany({
      where: {
        order_id: Number(orderId),
        status: 'active'
      }
    });

    if (reservations.length === 0) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy reservation active cho order này'
      };
    }

    const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);

    const result = await prisma.inventoryReservation.updateMany({
      where: {
        order_id: Number(orderId),
        status: 'active'
      },
      data: {
        expires_at: newExpiresAt,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: {
        extended: result.count,
        new_expires_at: newExpiresAt,
        message: `Đã gia hạn ${result.count} reservation thêm ${additionalMinutes} phút`
      }
    };
  } catch (error) {
    throw error;
  }
};
