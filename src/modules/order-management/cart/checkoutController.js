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
 * Cancel order
 */
export const cancelOrder = async (req, res) => {
  try {
    const customerId = req.user.customer_id;
    const { id } = req.params;
    
    const result = await checkoutService.cancelOrder(parseInt(id), customerId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Cancel order controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi hủy đơn hàng'
    });
  }
};
