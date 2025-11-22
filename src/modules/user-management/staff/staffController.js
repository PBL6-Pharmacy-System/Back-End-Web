import * as staffService from './staffService.js';

// Get all staff
export const getAllStaff = async (req, res) => {
  try {
    const { branchId, page, limit, isActive } = req.query;
    const result = await staffService.getAllStaff({
      branchId,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      isActive
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getAllStaff:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách nhân viên'
    });
  }
};

// Get staff by ID
export const getStaffById = async (req, res) => {
  try {
    const result = await staffService.getStaffById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in getStaffById:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin nhân viên'
    });
  }
};

// Create staff
export const createStaff = async (req, res) => {
  try {
    const result = await staffService.createStaff(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createStaff:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo nhân viên mới'
    });
  }
};

// Update staff
export const updateStaff = async (req, res) => {
  try {
    const result = await staffService.updateStaff(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in updateStaff:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông tin nhân viên'
    });
  }
};

// Delete staff
export const deleteStaff = async (req, res) => {
  try {
    const result = await staffService.deleteStaff(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa nhân viên'
    });
  }
};

// Get staff by branch
export const getStaffByBranch = async (req, res) => {
  try {
    const result = await staffService.getStaffByBranch(req.params.branchId);
    res.json(result);
  } catch (error) {
    console.error('Error in getStaffByBranch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách nhân viên theo chi nhánh'
    });
  }
};
