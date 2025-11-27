import * as checkoutService from './checkoutService.js';

/**
 * Checkout - Convert cart to order
 */
export const checkout = async (req, res) => {
  try {
    const customerId = req.user.customer_id;
    
    if (!customerId) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ khách hàng mới có thể thanh toán'
      });
    }

    // Support both camelCase and snake_case
    const voucherCode = req.body.voucherCode || req.body.voucher_code;
    const shippingAddressId = req.body.shippingAddressId || req.body.shipping_address_id;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    
    console.log('[CHECKOUT CONTROLLER] Request body:', {
      voucherCode,
      shippingAddressId,
      paymentMethod,
      fullBody: req.body
    });
    
    const result = await checkoutService.checkout({
      customerId,
      voucherCode,
      shippingAddressId,
      paymentMethod
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Checkout controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi thanh toán'
    });
  }
};

/**
 * ❌ BUSINESS RULE: Khách hàng KHÔNG được tự hủy đơn hàng
 * 
 * Quy trình hủy đơn:
 * 1. Khách hàng liên hệ Staff/Admin để yêu cầu hủy đơn
 * 2. Staff/Admin sử dụng API: POST /api/orders/:id/cancel
 * 3. Hệ thống sẽ hoàn kho và cập nhật trạng thái đơn hàng
 * 
 * API hủy đơn chỉ dành cho Admin/Staff:
 * @see orderRoutes.js - POST /api/orders/:id/cancel (authorizeRoles('admin', 'staff'))
 * @see orderService.cancelOrder()
 */
