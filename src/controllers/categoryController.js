
import * as categoryService from '../services/categoryService.js';

export const getAllCategories = async (req, res) => {
  try {
    const { 
      includeProducts = true,
      includeInactive = false,
      parentId,
      search,
      page = 1,
      limit = 50,
      sortBy = 'id',
      sortOrder = 'asc'
    } = req.query;

    const result = await categoryService.getAllCategories({
      includeProducts: includeProducts === 'true',
      includeInactive: includeInactive === 'true',
      parentId: parentId ? parseInt(parentId) : undefined,
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
    console.error('Error in getAllCategories:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy danh sách danh mục' 
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { includeProducts = true } = req.query;
    const result = await categoryService.getCategoryById(
      req.params.id,
      includeProducts === 'true'
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getCategoryById:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy thông tin danh mục' 
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const result = await categoryService.createCategory(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createCategory:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi tạo danh mục mới' 
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const result = await categoryService.updateCategory(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in updateCategory:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi cập nhật danh mục' 
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in deleteCategory:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi xóa danh mục' 
    });
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    const result = await categoryService.getCategoryStats(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getCategoryStats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy thống kê danh mục' 
    });
  }
};