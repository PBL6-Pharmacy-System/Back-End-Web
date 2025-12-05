import * as productService from './productService.js';
import { maskProductInventory, canViewDetailedInventory } from '../../../utils/dataMasking.js';

export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      supplierId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;

    const result = await productService.getAllProducts({
      search,
      categoryId,
      supplierId,
      minPrice,
      maxPrice,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // Data masking for public access
    const isAuthenticated = req.user && canViewDetailedInventory(req.user);

    if (!isAuthenticated && result.data.products) {
      // Mask sensitive inventory data for public/customer
      result.data.products = result.data.products.map(product => maskProductInventory(product));
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách sản phẩm' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const result = await productService.getProductById(req.params.id);
    if (!result.success) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    // Data masking for public access
    const isAuthenticated = req.user && canViewDetailedInventory(req.user);

    if (!isAuthenticated) {
      // Mask sensitive inventory data for public/customer
      result.data = maskProductInventory(result.data);
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy thông tin sản phẩm' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const result = await productService.createProduct(req.body);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.status(201).json(result.data);
  } catch (err) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ error: 'Lỗi khi tạo sản phẩm mới' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({
      message: 'Xóa sản phẩm thành công',
      product: result.data
    });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm' });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q, keyword, page = 1, limit = 10 } = req.query;
    const searchKeyword = q || keyword;

    const result = await productService.searchProducts({
      keyword: searchKeyword,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    // Data masking for public access
    const isAuthenticated = req.user && canViewDetailedInventory(req.user);

    if (!isAuthenticated && result.data.products) {
      // Mask sensitive inventory data for public/customer
      result.data.products = result.data.products.map(product => maskProductInventory(product));
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('Error in searchProducts:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi tìm kiếm sản phẩm' });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await productService.getProductsByCategory(req.params.categoryName, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Data masking for public access
    const isAuthenticated = req.user && canViewDetailedInventory(req.user);

    if (!isAuthenticated && result.data.products) {
      // Mask sensitive inventory data for public/customer
      result.data.products = result.data.products.map(product => maskProductInventory(product));
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('Error in getProductsByCategory:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy sản phẩm theo danh mục' });
  }
};
