import * as adminService from './adminService.js';

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAllAdmins({
      page: Number(page) || 1,
      limit: Number(limit) || 10
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getAllAdmins:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách admin'
    });
  }
};

// Get admin by ID
export const getAdminById = async (req, res) => {
  try {
    const result = await adminService.getAdminById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in getAdminById:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin admin'
    });
  }
};

// Create admin
export const createAdmin = async (req, res) => {
  try {
    const result = await adminService.createAdmin(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo admin mới'
    });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const result = await adminService.updateAdmin(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in updateAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông tin admin'
    });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const result = await adminService.deleteAdmin(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in deleteAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa admin'
    });
  }
};

// Update admin permissions
export const updateAdminPermissions = async (req, res) => {
  try {
    const result = await adminService.updateAdminPermissions(req.params.id, req.body.permissions);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in updateAdminPermissions:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật quyền admin'
    });
  }
};
