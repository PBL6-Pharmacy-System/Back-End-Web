

import * as branchService from '../services/branchService.js';

export const getAllBranches = async (req, res) => {
  try {
    const { 
      includeInventory = true, 
      search,
      active,
      hasInventory,
      page = 1, 
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc'
    } = req.query;

    const result = await branchService.getAllBranches({
      includeInventory: includeInventory === 'true',
      search: search?.trim(),
      active: active === 'true',
      hasInventory: hasInventory === 'true',
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
    console.error('Error in getAllBranches:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy danh sách chi nhánh' 
    });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const { includeInventory = true } = req.query;
    const result = await branchService.getBranchById(
      req.params.id,
      includeInventory === 'true'
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error in getBranchById:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy thông tin chi nhánh' 
    });
  }
};

export const createBranch = async (req, res) => {
  try {
    const result = await branchService.createBranch(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createBranch:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi tạo chi nhánh mới' 
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const result = await branchService.updateBranch(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in updateBranch:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi cập nhật chi nhánh' 
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const result = await branchService.deleteBranch(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in deleteBranch:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi xóa chi nhánh' 
    });
  }
};

export const getBranchStats = async (req, res) => {
  try {
    const result = await branchService.getBranchStats(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getBranchStats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy thống kê chi nhánh' 
    });
  }
};

export const getBranchInventoryStats = async (req, res) => {
  try {
    const result = await branchService.getBranchInventoryStats(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Error in getBranchInventoryStats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy thống kê tồn kho' 
    });
  }
};