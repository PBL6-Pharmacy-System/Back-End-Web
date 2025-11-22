import * as productBatchService from './productBatchService.js';

// Create new product batch
export const createProductBatch = async (req, res) => {
  try {
    const userId = req.user?.id;
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
    const userId = req.user?.id;
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
