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

    // Support both camelCase and snake_case for shipping address ID
    const {
      voucher_code,
      shipping_address_id,
      payment_method 
    } = req.body;
    
    const result = await checkoutService.checkout({
      customerId,
      voucherCode: voucher_code,
      shippingAddressId: shipping_address_id,
      paymentMethod: payment_method
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
 * Confirm payment
 */
export const confirmPayment = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { transactionId } = req.body;
    
    const result = await checkoutService.confirmPayment(orderId, transactionId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Confirm payment controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xác nhận thanh toán'
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
