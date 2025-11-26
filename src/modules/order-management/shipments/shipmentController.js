import * as shipmentService from './shipmentService.js';

/**
 * Create shipment for an order
 */
export const createShipment = async (req, res, next) => {
  try {
    const shipmentData = req.body;

    const result = await shipmentService.createShipment(shipmentData);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by ID
 * ✅ FIXED: Add ownership validation
 */
export const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await shipmentService.getShipmentById(id);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    // ✅ FIX: Kiểm tra ownership nếu là customer
    if (req.user.role_name === 'customer') {
      if (!result.data.order || result.data.order.customer_id !== req.user.customer_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền xem thông tin vận chuyển này'
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments (Admin/Staff)
 */
export const getAllShipments = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      branchId: req.query.branchId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await shipmentService.getAllShipments(filters);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipments for an order
 * ✅ FIXED: Add ownership validation
 */
export const getOrderShipments = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await shipmentService.getOrderShipments(orderId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    // ✅ FIX: Kiểm tra ownership nếu là customer
    if (req.user.role_name === 'customer') {
      // Lấy order để kiểm tra ownership
      if (result.data.length > 0) {
        const firstShipment = result.data[0];
        if (!firstShipment.order || firstShipment.order.customer_id !== req.user.customer_id) {
          return res.status(403).json({
            success: false,
            error: 'Bạn không có quyền xem thông tin vận chuyển của đơn hàng này'
          });
        }
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Track shipment by tracking number
 */
export const trackShipment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const result = await shipmentService.trackShipment(trackingNumber);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment status
 */
export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId; // From auth middleware

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái vận chuyển là bắt buộc'
      });
    }

    const result = await shipmentService.updateShipmentStatus(id, status, userId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment statistics (Admin)
 */
export const getShipmentStatistics = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId
    };

    const result = await shipmentService.getShipmentStatistics(filters);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
