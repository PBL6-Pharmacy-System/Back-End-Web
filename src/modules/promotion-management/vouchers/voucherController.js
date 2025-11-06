import * as voucherService from './voucherService.js';

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

export const applyVoucher = async (req, res) => {
  try {
    const { orderId, voucherCode } = req.body;
    
    if (!orderId || !voucherCode) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ mã đơn hàng và mã voucher'
      });
    }

    const result = await voucherService.applyVoucher(orderId, voucherCode);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json({
      success: true,
      message: 'Áp dụng voucher thành công',
      data: result.data
    });
  } catch (err) {
    console.error('Error in applyVoucher:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi áp dụng voucher'
    });
  }
};