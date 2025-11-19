import * as customerService from './customerService.js';

export const getAllCustomers = async (req, res) => {
  try {
    const { search, membership, status, page = 1, limit = 10 } = req.query;
    const customers = await customerService.getAllCustomers({
      search: search?.trim(),
      membership,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.json(customers);
  } catch (err) {
    console.error('Error in getAllCustomers:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách khách hàng' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }
    res.json(customer);
  } catch (err) {
    console.error('Error in getCustomerById:', err);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin khách hàng' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const result = await customerService.createCustomer(req.body);
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.status(201).json(result.data);
  } catch (err) {
    console.error('Error in createCustomer:', err);
    res.status(500).json({ error: 'Lỗi khi tạo khách hàng mới' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const result = await customerService.updateCustomer(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error in updateCustomer:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin khách hàng' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ 
      message: 'Xóa khách hàng thành công',
      customer: result.data 
    });
  } catch (err) {
    console.error('Error in deleteCustomer:', err);
    res.status(500).json({ error: 'Lỗi khi xóa khách hàng' });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await customerService.getCustomerOrders(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    if (!result.success) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error in getCustomerOrders:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

export const getCustomerStats = async (req, res) => {
  try {
    const result = await customerService.getCustomerStats(req.params.id);
    if (!result.success) {
      return res.status(result.status || 404).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error in getCustomerStats:', err);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê khách hàng' });
  }
};