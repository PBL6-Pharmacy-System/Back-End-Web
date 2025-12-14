import * as voucherService from './voucherService.js';

// ========================================
// PUBLIC APIs - User
// ========================================

/**
 * GET /vouchers
 * Lấy danh sách vouchers của customer hiện tại (đã được assign)
 */
export const getCustomerVouchers = async (req, res) => {
  try {
    const customerId = req.user?.customer_id;
    
    if (!customerId) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ khách hàng mới có thể xem voucher của mình'
      });
    }

    const {
      page = 1,
      limit = 10,
      isUsed // 'true', 'false', or undefined
    } = req.query;

    const result = await voucherService.getCustomerVouchers(customerId, {
      page: parseInt(page),
      limit: parseInt(limit),
      isUsed: isUsed === 'true' ? true : isUsed === 'false' ? false : null
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getCustomerVouchers:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách voucher của khách hàng'
    });
  }
};

/**
 * GET /vouchers/available
 * Lấy danh sách vouchers đang active (user có thể dùng)
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

    const result = await voucherService.getAvailableVouchers({
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
    const customerId = req.user?.customer_id;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mã voucher'
      });
    }

    const result = await voucherService.validateVoucherForUse(
      code,
      orderAmount ? parseFloat(orderAmount) : 0,
      customerId // Pass customer_id để check đã dùng chưa
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