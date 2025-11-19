import prisma from '../config/db.js';

/**
 * Middleware to validate that the authenticated user owns the cart they're trying to access
 */
export const validateCartOwnership = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const authenticatedUserId = req.user?.id;
    const authenticatedCustomerId = req.user?.customer_id;

    // Check if user is authenticated
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để truy cập giỏ hàng'
      });
    }

    // Admin and staff can access any cart
    if (req.user?.role === 'admin' || req.user?.role === 'staff') {
      return next();
    }

    // Customer can only access their own cart
    if (!authenticatedCustomerId) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản không phải là khách hàng'
      });
    }

    // Verify customer ID matches
    if (Number(customerId) !== Number(authenticatedCustomerId)) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập giỏ hàng này'
      });
    }

    next();
  } catch (error) {
    console.error('Error in validateCartOwnership:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xác thực quyền truy cập giỏ hàng'
    });
  }
};

/**
 * Middleware to validate order ownership (for checkout, cancel, etc.)
 */
export const validateOrderOwnership = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const orderIdToCheck = id || orderId;
    const authenticatedUserId = req.user?.id;
    const authenticatedCustomerId = req.user?.customer_id;

    // Check if user is authenticated
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để truy cập đơn hàng'
      });
    }

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderIdToCheck) },
      select: { customer_id: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    // Admin and staff can access any order
    if (req.user?.role === 'admin' || req.user?.role === 'staff') {
      return next();
    }

    // Customer can only access their own orders
    if (!authenticatedCustomerId) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản không phải là khách hàng'
      });
    }

    // Verify customer ID matches order owner
    if (order.customer_id !== Number(authenticatedCustomerId)) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập đơn hàng này'
      });
    }

    next();
  } catch (error) {
    console.error('Error in validateOrderOwnership:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xác thực quyền truy cập đơn hàng'
    });
  }
};
