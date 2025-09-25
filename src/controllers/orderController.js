import * as orderService from '../services/orderService.js';

export const getCart = async (req, res) => {
  try {
    const cart = await orderService.getCart(req.params.customerId);
    res.json(cart || { message: 'Giỏ hàng trống' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, productUnitId, quantity, unitPrice } = req.body;
    const item = await orderService.addToCart(
      req.params.customerId,
      productId,
      productUnitId,
      quantity || 1,
      unitPrice
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const item = await orderService.updateCartItem(req.params.itemId, req.body.quantity);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    await orderService.removeCartItem(req.params.itemId);
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const checkout = async (req, res) => {
  try {
    const order = await orderService.checkout(req.params.orderId);
    res.json({ message: 'Thanh toán thành công', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
