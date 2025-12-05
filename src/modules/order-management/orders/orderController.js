import * as orderService from './orderService.js';

/**
 * Get all orders (Admin)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      customerId: req.query.customerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await orderService.getAllOrders(filters);

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
 * Get order by ID
 * ✅ FIXED: Add ownership validation
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await orderService.getOrderById(id);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    // ✅ FIX: Kiểm tra ownership nếu là customer
    if (req.user.role_name === 'customer') {
      if (result.data.customer_id !== req.user.customer_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền xem đơn hàng này'
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer's orders
 */
export const getCustomerOrders = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status
    };

    const result = await orderService.getCustomerOrders(customerId, filters);

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
 * Update order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId; // From auth middleware

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái đơn hàng là bắt buộc'
      });
    }

    const result = await orderService.updateOrderStatus(id, status, userId);

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
 * Cancel order
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId; // From auth middleware

    const result = await orderService.cancelOrder(id, userId, reason);

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
 * Update order note
 */
export const updateOrderNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const result = await orderService.updateOrderNote(id, note);

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
 * Get order statistics (Admin)
 */
export const getOrderStatistics = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await orderService.getOrderStatistics(filters);

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
