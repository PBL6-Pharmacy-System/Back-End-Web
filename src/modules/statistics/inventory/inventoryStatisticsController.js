import * as inventoryStatisticsService from './inventoryStatisticsService.js';

// Tổng quan tồn kho
export const getInventoryOverview = async (req, res) => {
  try {
    const result = await inventoryStatisticsService.getInventoryOverview();
    res.json(result);
  } catch (error) {
    console.error('Error in getInventoryOverview:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tổng quan tồn kho'
    });
  }
};

// Tồn kho theo chi nhánh
export const getInventoryByBranch = async (req, res) => {
  try {
    const result = await inventoryStatisticsService.getInventoryByBranch(req.params.branchId);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error in getInventoryByBranch:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tồn kho theo chi nhánh'
    });
  }
};

// Sản phẩm sắp hết hàng
export const getLowStockProducts = async (req, res) => {
  try {
    const { branchId, page, limit } = req.query;
    const result = await inventoryStatisticsService.getLowStockProducts({
      branchId,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách sản phẩm sắp hết hàng'
    });
  }
};

// Sản phẩm tồn kho cao
export const getOverstockProducts = async (req, res) => {
  try {
    const { branchId, page, limit } = req.query;
    const result = await inventoryStatisticsService.getOverstockProducts({
      branchId,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getOverstockProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách sản phẩm tồn kho cao'
    });
  }
};

// Báo cáo biến động tồn kho
export const getInventoryMovementReport = async (req, res) => {
  try {
    const { branchId, productId, startDate, endDate, type } = req.query;
    const result = await inventoryStatisticsService.getInventoryMovementReport({
      branchId,
      productId,
      startDate,
      endDate,
      type
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getInventoryMovementReport:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy báo cáo biến động tồn kho'
    });
  }
};

// Top sản phẩm nhập nhiều nhất
export const getTopImportedProducts = async (req, res) => {
  try {
    const { branchId, startDate, endDate, limit } = req.query;
    const result = await inventoryStatisticsService.getTopImportedProducts({
      branchId,
      startDate,
      endDate,
      limit: Number(limit) || 10
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getTopImportedProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy top sản phẩm nhập nhiều nhất'
    });
  }
};

// Top sản phẩm xuất nhiều nhất
export const getTopExportedProducts = async (req, res) => {
  try {
    const { branchId, startDate, endDate, limit } = req.query;
    const result = await inventoryStatisticsService.getTopExportedProducts({
      branchId,
      startDate,
      endDate,
      limit: Number(limit) || 10
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getTopExportedProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy top sản phẩm xuất nhiều nhất'
    });
  }
};

// Tồn kho theo danh mục
export const getInventoryByCategory = async (req, res) => {
  try {
    const { branchId } = req.query;
    const result = await inventoryStatisticsService.getInventoryByCategory(branchId);
    res.json(result);
  } catch (error) {
    console.error('Error in getInventoryByCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tồn kho theo danh mục'
    });
  }
};
