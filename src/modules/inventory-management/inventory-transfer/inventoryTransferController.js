import * as inventoryTransferService from './inventoryTransferService.js';

// Create transfer request
export const createTransferRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await inventoryTransferService.createTransferRequest(req.body, userId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createTransferRequest:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo yêu cầu chuyển kho'
    });
  }
};

// Get all transfers
export const getAllTransfers = async (req, res) => {
  try {
    const { branchId, status, page, limit } = req.query;
    const result = await inventoryTransferService.getAllTransfers({
      branchId,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAllTransfers:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách chuyển kho'
    });
  }
};

// Get transfer by ID
export const getTransferById = async (req, res) => {
  try {
    const result = await inventoryTransferService.getTransferById(req.params.id);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in getTransferById:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin chuyển kho'
    });
  }
};

// Approve transfer
export const approveTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await inventoryTransferService.approveTransfer(req.params.id, userId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in approveTransfer:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi duyệt chuyển kho'
    });
  }
};

// Ship transfer
export const shipTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tracking_number } = req.body;
    const result = await inventoryTransferService.shipTransfer(req.params.id, userId, tracking_number);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in shipTransfer:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi giao hàng chuyển kho'
    });
  }
};

// Receive transfer
export const receiveTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await inventoryTransferService.receiveTransfer(req.params.id, userId);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in receiveTransfer:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi nhận hàng chuyển kho'
    });
  }
};

// Cancel transfer
export const cancelTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;
    const result = await inventoryTransferService.cancelTransfer(req.params.id, userId, reason);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in cancelTransfer:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi hủy chuyển kho'
    });
  }
};
