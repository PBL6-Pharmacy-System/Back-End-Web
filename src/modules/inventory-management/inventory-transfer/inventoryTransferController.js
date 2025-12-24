import * as inventoryTransferService from './inventoryTransferService.js';

// Create transfer request
// ✅ SECURITY: Staff chỉ được tạo transfer từ chi nhánh của mình
export const createTransferRequest = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ CHECK: Staff chỉ được chuyển từ chi nhánh của mình
    if (req.user.role_name === 'staff') {
      if (!req.body.from_branch_id) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin from_branch_id'
        });
      }

      if (Number(req.body.from_branch_id) !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền tạo phiếu chuyển từ chi nhánh của mình',
          details: {
            your_branch_id: req.user.branch_id,
            requested_from_branch_id: req.body.from_branch_id
          }
        });
      }
    }

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
// ✅ SECURITY: Staff chỉ được xuất kho từ chi nhánh của mình
export const shipTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tracking_number = req.body?.tracking_number;

    // Validate tracking number
    if (tracking_number) {
      if (typeof tracking_number !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Mã vận đơn phải là chuỗi ký tự'
        });
      }
      
      if (tracking_number.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Mã vận đơn không được vượt quá 100 ký tự'
        });
      }
      
      const trackingPattern = /^[A-Z0-9\-]+$/i;
      if (!trackingPattern.test(tracking_number)) {
        return res.status(400).json({
          success: false,
          error: 'Mã vận đơn chỉ được chứa chữ cái, số và dấu gạch ngang'
        });
      }
    }

    // ✅ Get transfer first to check from_branch ownership
    const transferResult = await inventoryTransferService.getTransferById(req.params.id);

    if (!transferResult.success) {
      return res.status(transferResult.status).json(transferResult);
    }

    // ✅ CHECK: Staff chỉ được ship từ chi nhánh của mình
    if (req.user.role_name === 'staff') {
      if (transferResult.data.from_branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền xuất kho từ chi nhánh của mình',
          details: {
            your_branch_id: req.user.branch_id,
            transfer_from_branch_id: transferResult.data.from_branch_id
          }
        });
      }
    }

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
// ✅ FIXED: Add branch ownership check - Staff chỉ nhận được hàng của chi nhánh mình
export const receiveTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ Get transfer first to check to_branch ownership
    const transferResult = await inventoryTransferService.getTransferById(req.params.id);

    if (!transferResult.success) {
      return res.status(transferResult.status).json(transferResult);
    }

    // ✅ Check branch ownership if user is staff
    // Staff chỉ có thể receive transfer tới chi nhánh của mình
    if (req.user.role_name === 'staff') {
      if (transferResult.data.to_branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền nhận hàng chuyển đến chi nhánh của mình',
          details: {
            your_branch_id: req.user.branch_id,
            transfer_to_branch_id: transferResult.data.to_branch_id
          }
        });
      }
    }

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
// ✅ FIX: Thêm kiểm tra branch ownership cho Staff
export const cancelTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    // ✅ Get transfer first to check ownership
    const transferResult = await inventoryTransferService.getTransferById(req.params.id);

    if (!transferResult.success) {
      return res.status(transferResult.status).json(transferResult);
    }

    // ✅ CHECK: Staff chỉ được hủy transfer từ chi nhánh của mình (người tạo)
    if (req.user.role_name === 'staff') {
      if (transferResult.data.from_branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền hủy phiếu chuyển kho từ chi nhánh của mình',
          details: {
            your_branch_id: req.user.branch_id,
            transfer_from_branch_id: transferResult.data.from_branch_id
          }
        });
      }
    }

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
