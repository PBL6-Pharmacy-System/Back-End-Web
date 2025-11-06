import * as orderService from './cartService.js';

export const getCart = async (req, res) => {
  try {
    const result = await orderService.getCart(req.params.customerId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error in getCart:', err);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin giỏ hàng' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const result = await orderService.addToCart(
      req.params.customerId,
      req.body
    );
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.status(201).json(result.data);
  } catch (err) {
    console.error('Error in addToCart:', err);
    res.status(500).json({ error: 'Lỗi khi thêm sản phẩm vào giỏ hàng' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const result = await orderService.removeCartItem(req.params.itemId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ 
      message: 'Xóa sản phẩm thành công',
      data: result.data 
    });
  } catch (err) {
    console.error('Error in removeFromCart:', err);
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng' });
  }
};

export const checkout = async (req, res) => {
  try {
    const result = await orderService.checkout(req.params.orderId);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ 
      message: 'Thanh toán thành công',
      data: result.data 
    });
  } catch (err) {
    console.error('Error in checkout:', err);
    res.status(500).json({ error: 'Lỗi khi thanh toán đơn hàng' });
  }
};
