import * as productBatchService from './productBatchService.js';
import { maskBatchInfo, maskBatchArray } from '../../../utils/dataMasking.js';

// ============================================================
// FEFO (First Expired First Out) CONTROLLERS
// ============================================================

/**
 * Get available batches sorted by FEFO
 * GET /product-batches/fefo/:branchId/:productId
 */
export const getAvailableBatchesFEFO = async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    // Staff can only view their own branch
    if (req.user.role_name === 'staff' && Number(branchId) !== req.user.branch_id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có quyền xem tồn kho của chi nhánh mình'
      });
    }

    const result = await productBatchService.getAvailableBatchesFEFO(branchId, productId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    // Mask sensitive data for staff
    if (result.data?.batches) {
      result.data.batches = maskBatchArray(result.data.batches, req.user);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting FEFO batches:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách lô hàng FEFO',
      details: error.message
    });
  }
};

/**
 * Get allocation plan using FEFO
 * POST /product-batches/fefo/allocate
 */
export const allocateBatchesFEFO = async (req, res) => {
  try {
    const { branch_id, product_id, quantity } = req.body;

    if (!branch_id || !product_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc (branch_id, product_id, quantity)'
      });
    }

    // Staff can only allocate from their own branch
    if (req.user.role_name === 'staff' && Number(branch_id) !== req.user.branch_id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có quyền xuất kho từ chi nhánh mình'
      });
    }

    const result = await productBatchService.allocateBatchesFEFO(branch_id, product_id, quantity);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error allocating FEFO batches:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi phân bổ lô hàng FEFO',
      details: error.message
    });
  }
};

/**
 * Export stock using FEFO strategy
 * POST /product-batches/fefo/export
 */
export const exportStockFEFO = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { branch_id } = req.body;

    // Staff can only export from their own branch
    if (req.user.role_name === 'staff') {
      if (!branch_id) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin branch_id'
        });
      }

      if (Number(branch_id) !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền xuất kho từ chi nhánh mình'
        });
      }
    }

    const result = await productBatchService.exportStockFEFO(req.body, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error exporting stock FEFO:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xuất kho theo FEFO',
      details: error.message
    });
  }
};

/**
 * Import stock to batch (create new or add to existing)
 * POST /product-batches/import
 */
export const importStockToBatch = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { branch_id } = req.body;

    // Staff can only import to their own branch
    if (req.user.role_name === 'staff') {
      if (!branch_id) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin branch_id'
        });
      }

      if (Number(branch_id) !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền nhập kho vào chi nhánh mình'
        });
      }
    }

    const result = await productBatchService.importStockToBatch(req.body, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error importing stock to batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi nhập kho',
      details: error.message
    });
  }
};

/**
 * Add quantity to existing batch
 * POST /product-batches/:id/add-stock
 */
export const addToExistingBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;
    const userId = req.user?.userId;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Số lượng phải lớn hơn 0'
      });
    }

    // Check batch ownership for staff
    const batchResult = await productBatchService.getProductBatchById(id);
    if (!batchResult.success) {
      return res.status(batchResult.status || 404).json(batchResult);
    }

    if (req.user.role_name === 'staff' && batchResult.data.branch_id !== req.user.branch_id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có quyền nhập thêm vào lô hàng của chi nhánh mình'
      });
    }

    const result = await productBatchService.addToExistingBatch(id, quantity, userId, note);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding stock to batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi nhập thêm vào lô hàng',
      details: error.message
    });
  }
};

/**
 * Get batch summary for a product at a branch
 * GET /product-batches/summary/:branchId/:productId
 */
export const getBatchSummary = async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    // Staff can only view their own branch
    if (req.user.role_name === 'staff' && Number(branchId) !== req.user.branch_id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có quyền xem tồn kho của chi nhánh mình'
      });
    }

    const result = await productBatchService.getBatchSummary(branchId, productId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    // Mask sensitive data for staff
    if (result.data?.batches_by_status) {
      for (const status of Object.keys(result.data.batches_by_status)) {
        result.data.batches_by_status[status] = maskBatchArray(
          result.data.batches_by_status[status],
          req.user
        );
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting batch summary:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tổng quan lô hàng',
      details: error.message
    });
  }
};

/**
 * Validate stock consistency between batches and inventory
 * GET /product-batches/validate/:branchId/:productId
 */
export const validateStockConsistency = async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    const result = await productBatchService.validateStockConsistency(branchId, productId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error validating stock consistency:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi kiểm tra đồng bộ tồn kho',
      details: error.message
    });
  }
};

/**
 * Reconcile stock (fix discrepancy between batches and inventory)
 * POST /product-batches/reconcile/:branchId/:productId
 */
export const reconcileStock = async (req, res) => {
  try {
    const { branchId, productId } = req.params;
    const userId = req.user?.userId;

    const result = await productBatchService.reconcileStock(branchId, productId, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error reconciling stock:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi điều chỉnh tồn kho',
      details: error.message
    });
  }
};

/**
 * Auto-expire batches (for cron job or manual trigger)
 * POST /product-batches/auto-expire
 */
export const autoExpireBatches = async (req, res) => {
  try {
    const result = await productBatchService.autoExpireBatches();

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error auto-expiring batches:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tự động hết hạn lô hàng',
      details: error.message
    });
  }
};

/**
 * Generate batch number
 * GET /product-batches/generate-number/:productId/:branchId
 */
export const generateBatchNumber = async (req, res) => {
  try {
    const { productId, branchId } = req.params;
    const batchNumber = await productBatchService.generateBatchNumber(productId, branchId);

    res.json({
      success: true,
      data: { batch_number: batchNumber }
    });
  } catch (error) {
    console.error('Error generating batch number:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo mã lô hàng',
      details: error.message
    });
  }
};

// ============================================================
// EXISTING CONTROLLERS
// ============================================================

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

/**
 * Dispose expired batch - Tiêu hủy lô hàng hết hạn
 * POST /product-batches/:id/dispose
 */
export const disposeExpiredBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
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
          error: 'Bạn chỉ có quyền tiêu hủy lô hàng của chi nhánh mình'
        });
      }
    }

    const result = await productBatchService.disposeExpiredBatch(id, userId, note);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error disposing expired batch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tiêu hủy lô hàng hết hạn',
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
