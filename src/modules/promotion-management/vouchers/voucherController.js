import * as voucherService from './voucherService.js';

// ========================================
// PUBLIC APIs - User
// ========================================

/**
 * GET /vouchers/available
 * Lấy danh sách vouchers đang active (user có thể dùng)
 * ✅ FIX: Truyền customerId để lọc voucher đã sử dụng
 */
export const getAvailableVouchers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Lấy customerId từ token (nếu có) - ✅ FIX: Sử dụng customer_id thay vì customerId
    const customerId = req.user?.customer_id || null;
    console.log(`🎫 [VoucherController] Getting available vouchers for customerId: ${customerId}`);

    const result = await voucherService.getAvailableVouchers({
      page: parseInt(page),
      limit: parseInt(limit),
      search: search?.trim(),
      sortBy,
      sortOrder,
      customerId
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getAvailableVouchers:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách voucher'
    });
  }
};

/**
 * GET /vouchers/check/:code
 * Validate voucher code trước khi checkout
 */
export const validateVoucherCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mã voucher'
      });
    }

    const result = await voucherService.validateVoucherForUse(
      code,
      orderAmount ? parseFloat(orderAmount) : 0
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in validateVoucherCode:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi kiểm tra voucher'
    });
  }
};

export const getVoucherById = async (req, res) => {
  try {
    const result = await voucherService.getVoucherById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getVoucherById:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin voucher'
    });
  }
};

// ========================================
// ADMIN APIs
// ========================================

export const getAllVouchers = async (req, res) => {
  try {
    const {
      includeExpired,
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const result = await voucherService.getAllVouchers({
      includeExpired: includeExpired === 'true',
      page: parseInt(page),
      limit: parseInt(limit),
      search: search?.trim(),
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getAllVouchers:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách voucher'
    });
  }
};

export const createVoucher = async (req, res) => {
  try {
    const result = await voucherService.createVoucher(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createVoucher:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo voucher mới'
    });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const result = await voucherService.updateVoucher(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateVoucher:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật voucher'
    });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const result = await voucherService.deleteVoucher(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in deleteVoucher:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa voucher'
    });
  }
};