import * as userService from './userService.js';

export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const result = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search: search?.trim(),
      role,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách người dùng'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin người dùng'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createUser:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo người dùng mới'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông tin người dùng'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa người dùng'
    });
  }
};