import * as supplierService from '../services/supplierService.js';

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

    res.json(result);
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

    res.json(result);
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