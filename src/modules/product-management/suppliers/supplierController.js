import * as supplierService from './supplierService.js';

/**
 * Helper function để mask thông tin nhạy cảm của supplier cho public users
 * @param {Object} supplier - Supplier data
 * @param {Object} user - User từ req.user (null nếu chưa đăng nhập)
 * @returns {Object} - Supplier data đã được mask (nếu cần)
 */
const maskSupplierData = (supplier, user) => {
  // Admin và Staff được xem full thông tin
  if (user && (user.role_name === 'admin' || user.role_name === 'staff')) {
    return supplier;
  }

  // Public users và Customer: Ẩn thông tin contact nhạy cảm
  const { contact_info, ...safeData } = supplier;

  return {
    ...safeData,
    // Chỉ hiển thị tên supplier, không hiển thị contact details
    contact_info: contact_info ? {
      // Ẩn các thông tin nhạy cảm
      address: undefined,
      phone: undefined,
      email: undefined,
      tax_number: undefined,
      contact_person: undefined
    } : null
  };
};

export const getAllSuppliers = async (req, res) => {
  try {
    const {
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const result = await supplierService.getAllSuppliers({
      isActive: isActive === 'true',
      search: search?.trim(),
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    // ✅ Mask thông tin nhạy cảm cho public users
    const maskedData = result.data.map(supplier => maskSupplierData(supplier, req.user));

    res.json({
      ...result,
      data: maskedData
    });
  } catch (err) {
    console.error('Error in getAllSuppliers:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách nhà cung cấp'
    });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const result = await supplierService.getSupplierById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    // ✅ Mask thông tin nhạy cảm cho public users
    const maskedData = maskSupplierData(result.data, req.user);

    res.json({
      ...result,
      data: maskedData
    });
  } catch (err) {
    console.error('Error in getSupplierById:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin nhà cung cấp'
    });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const result = await supplierService.createSupplier(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createSupplier:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo nhà cung cấp mới'
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const result = await supplierService.updateSupplier(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateSupplier:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông tin nhà cung cấp'
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const result = await supplierService.deleteSupplier(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in deleteSupplier:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa nhà cung cấp'
    });
  }
};