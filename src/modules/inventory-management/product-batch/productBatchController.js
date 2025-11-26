import * as productBatchService from './productBatchService.js';
import { maskBatchInfo, maskBatchArray } from '../../../utils/dataMasking.js';

// Create new product batch
// ✅ SECURITY: Staff chỉ được nhập hàng cho chi nhánh của mình
export const createProductBatch = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // ✅ CHECK: Staff chỉ được nhập hàng cho chi nhánh của mình
    if (req.user.role_name === 'staff') {
      if (!req.body.branch_id) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin branch_id'
        });
      }

      if (Number(req.body.branch_id) !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền nhập hàng cho chi nhánh của mình',
          details: {
            your_branch_id: req.user.branch_id,
            requested_branch_id: req.body.branch_id
          }
        });
      }
    }

    const result = await productBatchService.createProductBatch(req.body, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating product batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo lô hàng',
      details: error.message
    });
  }
};

// Get all product batches
export const getAllProductBatches = async (req, res) => {
  try {
    const result = await productBatchService.getAllProductBatches(req.query);

    // ✅ DATA MASKING: Staff không xem được cost_price
    if (result.success && result.data && result.data.batches) {
      result.data.batches = maskBatchArray(result.data.batches, req.user);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting product batches:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách lô hàng',
      details: error.message
    });
  }
};

// Get product batch by ID
export const getProductBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productBatchService.getProductBatchById(id);

    if (!result.success) {
      return res.status(result.status || 404).json(result);
    }

    // ✅ DATA MASKING: Staff không xem được cost_price
    if (result.data) {
      result.data = maskBatchInfo(result.data, req.user);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting product batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin lô hàng',
      details: error.message
    });
  }
};

// Update product batch
export const updateProductBatch = async (req, res) => {
  try {
    const { id } = req.params;

    // Get batch first to check branch ownership (for staff)
    const batchResult = await productBatchService.getProductBatchById(id);

    if (!batchResult.success) {
      return res.status(batchResult.status || 404).json(batchResult);
    }

    // Check branch ownership if user is staff
    if (req.user.role_name === 'staff') {
      if (batchResult.data.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền cập nhật lô hàng của chi nhánh mình'
        });
      }
    }

    const result = await productBatchService.updateProductBatch(id, req.body);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating product batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật lô hàng',
      details: error.message
    });
  }
};

// Mark batch as expired
export const markBatchAsExpired = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Get batch first to check branch ownership (for staff)
    const batchResult = await productBatchService.getProductBatchById(id);

    if (!batchResult.success) {
      return res.status(batchResult.status || 404).json(batchResult);
    }

    // Check branch ownership if user is staff
    if (req.user.role_name === 'staff') {
      if (batchResult.data.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền đánh dấu lô hàng hết hạn của chi nhánh mình'
        });
      }
    }

    const result = await productBatchService.markBatchAsExpired(id, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error marking batch as expired:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đánh dấu lô hàng hết hạn',
      details: error.message
    });
  }
};

// Get batches expiring soon
export const getBatchesExpiringSoon = async (req, res) => {
  try {
    const days = req.query.days || 30;
    const result = await productBatchService.getBatchesExpiringSoon(Number(days));

    // ✅ DATA MASKING: Staff không xem được cost_price
    if (result.success && result.data && result.data.batches) {
      result.data.batches = maskBatchArray(result.data.batches, req.user);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting expiring batches:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách lô hàng sắp hết hạn',
      details: error.message
    });
  }
};

// Delete product batch
export const deleteProductBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productBatchService.deleteProductBatch(id);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting product batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa lô hàng',
      details: error.message
    });
  }
};
