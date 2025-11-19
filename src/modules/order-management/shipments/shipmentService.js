import prisma from '../../../config/db.js';
import { ORDER_STATUS, SHIPMENT_STATUS } from '../../../utils/constants.js';

/**
 * Generate unique tracking number
 */
const generateTrackingNumber = () => {
  const prefix = 'VN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Create shipment for an order
 */
export const createShipment = async (shipmentData) => {
  try {
    const {
      orderId,
      branchId,
      shippingAddressId,
      carrier = 'Standard Delivery',
      estimatedDelivery
    } = shipmentData;

    // Validate required fields
    if (!orderId || !branchId || !shippingAddressId) {
      return {
        success: false,
        status: 400,
        error: 'Order ID, Branch ID và Shipping Address ID là bắt buộc'
      };
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        customers: true
      }
    });

    if (!order) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    // Validate order status - can only create shipment for confirmed/processing orders
    const validStatuses = [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING
    ];

    if (!validStatuses.includes(order.status)) {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể tạo vận chuyển cho đơn hàng đã xác nhận hoặc đang xử lý'
      };
    }

    // Check if branch exists
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branchId) }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    // Check if shipping address exists
    const address = await prisma.shippingaddresses.findUnique({
      where: { id: Number(shippingAddressId) }
    });

    if (!address) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy địa chỉ giao hàng'
      };
    }

    // Check if shipment already exists for this order
    const existingShipment = await prisma.shipments.findFirst({
      where: {
        order_id: Number(orderId),
        status: {
          notIn: [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNED]
        }
      }
    });

    if (existingShipment) {
      return {
        success: false,
        status: 400,
        error: 'Đơn hàng đã có vận chuyển'
      };
    }

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Calculate estimated delivery (default 3 days from now)
    const estimatedDate = estimatedDelivery
      ? new Date(estimatedDelivery)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create shipment
    const shipment = await prisma.shipments.create({
      data: {
        order_id: Number(orderId),
        branch_id: Number(branchId),
        shipping_address_id: Number(shippingAddressId),
        tracking_number: trackingNumber,
        carrier,
        status: SHIPMENT_STATUS.PENDING,
        estimated_delivery: estimatedDate,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        orders: {
          include: {
            customers: true
          }
        },
        branches: true,
        shippingaddresses: true
      }
    });

    // Update order status to shipping if not already
    if (order.status !== ORDER_STATUS.SHIPPING) {
      await prisma.orders.update({
        where: { id: Number(orderId) },
        data: {
          status: ORDER_STATUS.SHIPPING,
          updated_at: new Date()
        }
      });

      // Create status history
      await prisma.order_status_history.create({
        data: {
          order_id: Number(orderId),
          status: ORDER_STATUS.SHIPPING,
          changed_at: new Date()
        }
      });
    }

    return {
      success: true,
      data: shipment,
      message: 'Tạo vận chuyển thành công'
    };
  } catch (error) {
    // Handle unique tracking_number constraint
    if (error.code === 'P2002' && error.meta?.target?.includes('tracking_number')) {
      return {
        success: false,
        status: 400,
        error: 'Mã vận đơn đã tồn tại'
      };
    }
    throw error;
  }
};

/**
 * Get shipment by ID
 */
export const getShipmentById = async (shipmentId) => {
  try {
    const shipment = await prisma.shipments.findUnique({
      where: { id: Number(shipmentId) },
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
                    image_url: true
                  }
                }
              }
            }
          }
        },
        branches: true,
        shippingaddresses: true
      }
    });

    if (!shipment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy vận chuyển'
      };
    }

    return {
      success: true,
      data: shipment
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all shipments with pagination and filters
 */
export const getAllShipments = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      branchId,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branch_id = Number(branchId);
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    // Get shipments
    const [shipments, total] = await Promise.all([
      prisma.shipments.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          orders: {
            select: {
              id: true,
              status: true,
              total_amount: true,
              customers: {
                select: {
                  id: true,
                  full_name: true,
                  phone: true
                }
              }
            }
          },
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          shippingaddresses: true
        }
      }),
      prisma.shipments.count({ where })
    ]);

    return {
      success: true,
      data: {
        shipments,
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
 * Get shipments for an order
 */
export const getOrderShipments = async (orderId) => {
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

    // Get shipments
    const shipments = await prisma.shipments.findMany({
      where: {
        order_id: Number(orderId)
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        branches: true,
        shippingaddresses: true
      }
    });

    return {
      success: true,
      data: shipments
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Track shipment by tracking number
 */
export const trackShipment = async (trackingNumber) => {
  try {
    const shipment = await prisma.shipments.findUnique({
      where: { tracking_number: trackingNumber },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            order_date: true
          }
        },
        branches: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        },
        shippingaddresses: true
      }
    });

    if (!shipment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy mã vận đơn'
      };
    }

    return {
      success: true,
      data: shipment
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update shipment status
 */
export const updateShipmentStatus = async (shipmentId, status, userId = null) => {
  try {
    // Validate status
    const validStatuses = Object.values(SHIPMENT_STATUS);
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        status: 400,
        error: 'Trạng thái vận chuyển không hợp lệ'
      };
    }

    // Get current shipment
    const currentShipment = await prisma.shipments.findUnique({
      where: { id: Number(shipmentId) },
      include: {
        orders: true
      }
    });

    if (!currentShipment) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy vận chuyển'
      };
    }

    // Don't allow updating delivered shipments
    if (currentShipment.status === SHIPMENT_STATUS.DELIVERED) {
      return {
        success: false,
        status: 400,
        error: 'Không thể cập nhật vận chuyển đã giao'
      };
    }

    // Prepare update data
    const updateData = {
      status,
      updated_at: new Date()
    };

    // If status is picked_up, set shipped_date
    if (status === SHIPMENT_STATUS.PICKED_UP && !currentShipment.shipped_date) {
      updateData.shipped_date = new Date();
    }

    // If status is delivered, set actual_delivery
    if (status === SHIPMENT_STATUS.DELIVERED) {
      updateData.actual_delivery = new Date();
    }

    // Update shipment
    const updatedShipment = await prisma.shipments.update({
      where: { id: Number(shipmentId) },
      data: updateData,
      include: {
        orders: true,
        branches: true,
        shippingaddresses: true
      }
    });

    // If shipment is delivered, update order status
    if (status === SHIPMENT_STATUS.DELIVERED) {
      await prisma.$transaction([
        prisma.orders.update({
          where: { id: currentShipment.order_id },
          data: {
            status: ORDER_STATUS.DELIVERED,
            updated_at: new Date()
          }
        }),
        prisma.order_status_history.create({
          data: {
            order_id: currentShipment.order_id,
            status: ORDER_STATUS.DELIVERED,
            changed_by: userId,
            changed_at: new Date()
          }
        })
      ]);
    }

    // If shipment failed, update order status
    if (status === SHIPMENT_STATUS.FAILED) {
      await prisma.$transaction([
        prisma.orders.update({
          where: { id: currentShipment.order_id },
          data: {
            status: ORDER_STATUS.PROCESSING, // Back to processing
            updated_at: new Date()
          }
        }),
        prisma.order_status_history.create({
          data: {
            order_id: currentShipment.order_id,
            status: ORDER_STATUS.PROCESSING,
            changed_by: userId,
            changed_at: new Date()
          }
        })
      ]);
    }

    return {
      success: true,
      data: updatedShipment,
      message: 'Cập nhật trạng thái vận chuyển thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get shipment statistics (Admin)
 */
export const getShipmentStatistics = async (filters = {}) => {
  try {
    const { startDate, endDate, branchId } = filters;

    const where = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    if (branchId) {
      where.branch_id = Number(branchId);
    }

    // Get statistics
    const [
      totalShipments,
      pendingShipments,
      pickedUpShipments,
      inTransitShipments,
      outForDeliveryShipments,
      deliveredShipments,
      failedShipments,
      returnedShipments,
      shipmentsByBranch
    ] = await Promise.all([
      prisma.shipments.count({ where }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.PENDING }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.PICKED_UP }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.IN_TRANSIT }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.OUT_FOR_DELIVERY }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.DELIVERED }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.FAILED }
      }),
      prisma.shipments.count({
        where: { ...where, status: SHIPMENT_STATUS.RETURNED }
      }),
      prisma.shipments.groupBy({
        by: ['branch_id'],
        where,
        _count: true
      })
    ]);

    // Calculate success rate
    const successRate = totalShipments > 0
      ? ((deliveredShipments / totalShipments) * 100).toFixed(2)
      : 0;

    return {
      success: true,
      data: {
        totalShipments,
        shipmentsByStatus: {
          pending: pendingShipments,
          picked_up: pickedUpShipments,
          in_transit: inTransitShipments,
          out_for_delivery: outForDeliveryShipments,
          delivered: deliveredShipments,
          failed: failedShipments,
          returned: returnedShipments
        },
        successRate: `${successRate}%`,
        shipmentsByBranch: shipmentsByBranch.map(sb => ({
          branchId: sb.branch_id,
          count: sb._count
        }))
      }
    };
  } catch (error) {
    throw error;
  }
};
