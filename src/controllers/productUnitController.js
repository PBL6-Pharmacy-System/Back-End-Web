
import * as productUnitService from '../services/productUnitService.js';

export const getAllProductUnits = async (req, res) => {
  try {
    const { 
      productId,
      active,
      search,
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc'
    } = req.query;

    const result = await productUnitService.getAllProductUnits({
      productId: productId ? parseInt(productId) : undefined,
      active: active === 'true',
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
    console.error('Error in getAllProductUnits:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy danh sách đơn vị sản phẩm' 
    });
  }
};

export const getProductUnitById = async (req, res) => {
  try {
    const result = await productUnitService.getProductUnitById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error in getProductUnitById:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy thông tin đơn vị sản phẩm' 
    });
  }
};

export const createProductUnit = async (req, res) => {
  try {
    const result = await productUnitService.createProductUnit(req.body);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createProductUnit:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi tạo đơn vị sản phẩm' 
    });
  }
};

export const updateProductUnit = async (req, res) => {
  try {
    const result = await productUnitService.updateProductUnit(
      req.params.id, 
      req.body
    );

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in updateProductUnit:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi cập nhật đơn vị sản phẩm' 
    });
  }
};

export const deleteProductUnit = async (req, res) => {
  try {
    const result = await productUnitService.deleteProductUnit(req.params.id);
    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in deleteProductUnit:', err);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi xóa đơn vị sản phẩm' 
    });
  }
};