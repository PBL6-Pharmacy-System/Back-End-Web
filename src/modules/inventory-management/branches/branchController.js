import * as branchService from './branchService.js';
import {
  maskBatchArray,
  canViewDetailedInventory,
  maskProductInventory
} from '../../../utils/dataMasking.js';

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

/**
 * GET /api/branches/:branchId/inventory/:productId
 * Lấy chi tiết các lô hàng của sản phẩm tại chi nhánh
 * 🔒 SECURITY v4.0: Public/Customer KHÔNG XEM được batch information
 */
export const getBranchInventoryDetails = async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    const result = await branchService.getBranchInventoryDetails(
      branchId,
      productId
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    // DATA MASKING: Kiểm tra quyền xem chi tiết
    const hasDetailedAccess = canViewDetailedInventory(req.user);

    if (!hasDetailedAccess) {
      // ❌ Public/Customer: CHỈ trả về thông tin cơ bản
      return res.json({
        success: true,
        data: {
          branch: {
            id: result.data.branch?.id,
            name: result.data.branch?.name,
            address: result.data.branch?.address,
            phone: result.data.branch?.phone
          },
          product: {
            id: result.data.product?.id,
            name: result.data.product?.name,
            price: result.data.product?.price,
            image_url: result.data.product?.image_url,
            description: result.data.product?.description
          },
          in_stock: (result.data.total_stock || 0) > 0,
          // ❌ KHÔNG trả về: batches, total_stock, summary
        }
      });
    }

    // ✅ Staff/Admin: Trả về full data (với masking cost_price cho staff)
    if (result.data.batches) {
      result.data.batches = maskBatchArray(result.data.batches, req.user);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getBranchInventoryDetails:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy chi tiết tồn kho'
    });
  }
};

/**
 * GET /api/branches/:branchId/inventory/alerts/expiring-soon
 * Lấy danh sách lô hàng sắp hết hạn của chi nhánh
 * 🔒 SECURITY: Staff/Admin only - Public KHÔNG ĐƯỢC xem
 */
export const getBranchExpiringSoonBatches = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { days = 30 } = req.query;

    // ❌ Chặn luôn Public/Customer - endpoint này chỉ cho nội bộ
    if (!canViewDetailedInventory(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập thông tin lô hàng'
      });
    }

    const result = await branchService.getBranchExpiringSoonBatches(
      branchId,
      Number(days)
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    // Mask batch info (remove cost_price for staff)
    if (result.data.batches) {
      result.data.batches = maskBatchArray(result.data.batches, req.user);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getBranchExpiringSoonBatches:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách lô hàng sắp hết hạn'
    });
  }
};