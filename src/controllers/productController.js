import * as productService from '../services/productService.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted', product });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query; // lấy keyword từ query string: /products/search?q=panadol
    if (!q) return res.status(400).json({ error: "Missing search keyword" });

    const products = await productService.searchProductsByName(q);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const products = await productService.getProductsByCategory(categoryId);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'Không có sản phẩm trong danh mục này' });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};