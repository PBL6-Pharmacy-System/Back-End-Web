import * as cartService from './cartService.js';

export const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart(req.params.customerId);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    console.error('Error in getCart:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin giỏ hàng'
    });
  }
};

export const getCartSummary = async (req, res) => {
  try {
    const result = await cartService.getCartSummary(req.params.customerId);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    console.error('Error in getCartSummary:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tóm tắt giỏ hàng'
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCart(
      req.params.customerId,
      req.body
    );
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
    res.status(201).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      data: result.data
    });
  } catch (err) {
    console.error('Error in addToCart:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi thêm sản phẩm vào giỏ hàng'
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await cartService.updateCartItem(req.params.itemId, quantity);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
    res.json({
      success: true,
      message: 'Đã cập nhật số lượng sản phẩm',
      data: result.data
    });
  } catch (err) {
    console.error('Error in updateCartItem:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật số lượng sản phẩm'
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeCartItem(req.params.itemId);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      message: result.message || 'Đã xóa sản phẩm khỏi giỏ hàng'
    });
  } catch (err) {
    console.error('Error in removeFromCart:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng'
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const result = await cartService.clearCart(req.params.customerId);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      message: result.message || 'Đã xóa toàn bộ giỏ hàng'
    });
  } catch (err) {
    console.error('Error in clearCart:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa giỏ hàng'
    });
  }
};

export const previewVoucher = async (req, res) => {
  try {
    const { voucherCode } = req.body;
    const result = await cartService.applyVoucherPreview(
      req.params.customerId,
      voucherCode
    );
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    console.error('Error in previewVoucher:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xem trước voucher'
    });
  }
};

export const mergeGuestCart = async (req, res) => {
  try {
    const { guestCartId } = req.body;
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản không phải là khách hàng'
      });
    }

    if (!guestCartId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin giỏ hàng tạm'
      });
    }

    const result = await cartService.mergeGuestCart(guestCartId, customerId);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    console.error('Error in mergeGuestCart:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi hợp nhất giỏ hàng'
    });
  }
};
