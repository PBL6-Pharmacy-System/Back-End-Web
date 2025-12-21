import * as stockTakeService from './stockTakeService.js';

// Create new stock take
export const createStockTake = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const result = await stockTakeService.createStockTake(req.body, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating stock take:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo phiếu kiểm kê',
      details: error.message
    });
  }
};

// Get all stock takes
export const getAllStockTakes = async (req, res) => {
  try {
    // ✅ FIX: Normalize query params (branchId → branch_id)
    const filters = {
      branch_id: req.query.branchId || req.query.branch_id,
      status: req.query.status,
      start_date: req.query.startDate || req.query.start_date,
      end_date: req.query.endDate || req.query.end_date,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await stockTakeService.getAllStockTakes(filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting stock takes:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách phiếu kiểm kê',
      details: error.message
    });
  }
};

// Get stock take by ID
export const getStockTakeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockTakeService.getStockTakeById(id);

    if (!result.success) {
      return res.status(result.status || 404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting stock take:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin phiếu kiểm kê',
      details: error.message
    });
  }
};

// Get stock take items
export const getStockTakeItems = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockTakeService.getStockTakeItems(id, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error getting stock take items:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách mục kiểm kê',
      details: error.message
    });
  }
};

// Update stock take item
export const updateStockTakeItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const result = await stockTakeService.updateStockTakeItem(id, itemId, req.body);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating stock take item:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật mục kiểm kê',
      details: error.message
    });
  }
};

// Complete stock take
export const completeStockTake = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const result = await stockTakeService.completeStockTake(id, userId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing stock take:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi hoàn thành kiểm kê',
      details: error.message
    });
  }
};

// Cancel stock take
export const cancelStockTake = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp lý do hủy'
      });
    }

    const result = await stockTakeService.cancelStockTake(id, reason);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error cancelling stock take:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi hủy phiếu kiểm kê',
      details: error.message
    });
  }
};

// Delete stock take
export const deleteStockTake = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockTakeService.deleteStockTake(id);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting stock take:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa phiếu kiểm kê',
      details: error.message
    });
  }
};
