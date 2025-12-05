import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';

/**
 * Middleware xác thực JWT token
 * ✅ Refactored: Không cần query permissions, chỉ verify token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token không được cung cấp'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user info từ JWT - STANDARDIZED property names
    req.user = {
      userId: decoded.userId,           // ✅ Changed from 'id' to 'userId'
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
      customer_id: decoded.customer_id,  // For customer role
      staff_id: decoded.staff_id,        // For staff role
      admin_id: decoded.admin_id,        // For admin role
      branch_id: decoded.branch_id       // ✅ For staff - from JWT directly
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Token không hợp lệ'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'Token đã hết hạn'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Lỗi xác thực token'
    });
  }
};

/**
 * Middleware kiểm tra quyền admin
 */
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Chưa xác thực'
    });
  }

  if (req.user.role_name !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Không có quyền truy cập. Chỉ admin mới được phép.'
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền theo danh sách roles
 * @param {...string} roles - Danh sách role names được phép
 * @example requireRoles('admin', 'staff')
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực'
      });
    }

    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        error: `Không có quyền truy cập. Yêu cầu vai trò: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra user có phải chủ sở hữu tài nguyên hoặc admin
 * @param {string} resourceIdParam - Tên param chứa ID tài nguyên (default: 'id')
 * @example authorizeOwnerOrAdmin('id')
 */
export const authorizeOwnerOrAdmin = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực'
      });
    }

    const resourceId = parseInt(req.params[resourceIdParam]);

    // Admin có thể truy cập tất cả
    if (req.user.role_name === 'admin') {
      return next();
    }

    // User chỉ có thể truy cập tài nguyên của mình
    if (req.user.userId !== resourceId) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có thể truy cập tài nguyên của mình'
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra Staff có quyền WRITE vào chi nhánh
 * ✅ NEW LOGIC:
 * - Admin: Full quyền mọi branch
 * - Staff: CHỈ WRITE own branch (không cho write cross-branch)
 * - Customer: Không có quyền
 * 
 * ⚠️ NOTE: Middleware này chỉ dùng cho WRITE operations (POST/PUT/DELETE)
 * ⚠️ Với READ operations, Staff có thể xem cross-branch (không cần middleware này)
 * 
 * @example 
 * // WRITE operation - Chặn Staff write cross-branch
 * router.post('/branch-inventory/import', authenticateToken, authorizeStaffBranch, controller)
 * 
 * // READ operation - Không dùng middleware này, Staff xem được cross-branch
 * router.get('/branches/:branchId/inventory', authenticateToken, authorizeAdminOrStaff, controller)
 */
export const authorizeStaffBranch = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực'
      });
    }

    // Admin có quyền truy cập tất cả chi nhánh
    if (req.user.role_name === 'admin') {
      return next();
    }

    // Customer không có quyền truy cập inventory
    if (req.user.role_name === 'customer') {
      return res.status(403).json({
        success: false,
        error: 'Khách hàng không có quyền truy cập quản lý kho'
      });
    }

    // Kiểm tra staff
    if (req.user.role_name === 'staff') {
      // ✅ Lấy branch_id từ JWT token (không cần query database)
      const staffBranchId = req.user.branch_id;

      if (!staffBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Nhân viên chưa được gán chi nhánh'
        });
      }

      // Lấy branch_id từ request (params, query, body)
      const requestedBranchId =
        req.params.branchId ||
        req.params.branch_id ||
        req.query.branch_id ||
        req.body.branchId ||
        req.body.branch_id ||
        req.body.from_branch_id; // Cho transfer

      // ✅ WRITE PERMISSION: Staff chỉ được write vào branch của mình
      if (requestedBranchId && Number(requestedBranchId) !== staffBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền thao tác trên chi nhánh của mình',
          details: {
            your_branch_id: staffBranchId,
            requested_branch_id: Number(requestedBranchId)
          }
        });
      }

      // ✅ Nếu không có branchId trong request, tự động set về branch của staff
      if (!requestedBranchId) {
        req.body.branchId = staffBranchId;
        req.body.branch_id = staffBranchId;
      }
    }

    next();
  } catch (error) {
    console.error('Error in authorizeStaffBranch:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi kiểm tra quyền truy cập chi nhánh'
    });
  }
};

/**
 * Middleware cho phép Admin và Staff truy cập
 */
export const authorizeAdminOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Chưa xác thực'
    });
  }

  if (!['admin', 'staff'].includes(req.user.role_name)) {
    return res.status(403).json({
      success: false,
      error: 'Không có quyền truy cập. Yêu cầu vai trò: admin hoặc staff.'
    });
  }

  next();
};

/**
 * Optional authentication - không bắt buộc phải có token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,           // ✅ Changed from 'id' to 'userId'
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
      customer_id: decoded.customer_id,
      staff_id: decoded.staff_id,
      admin_id: decoded.admin_id,
      branch_id: decoded.branch_id      // ✅ For staff
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Middleware kiểm tra quyền Staff trên inventory transfer
 * Dùng cho các operations: ship, receive, cancel
 * 
 * @param {'from' | 'to' | 'from_or_creator'} branchType - Loại branch cần check
 */
export const authorizeTransferBranch = (branchType = 'from') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Chưa xác thực'
        });
      }

      // Admin có quyền truy cập tất cả
      if (req.user.role_name === 'admin') {
        return next();
      }

      // Customer không có quyền
      if (req.user.role_name === 'customer') {
        return res.status(403).json({
          success: false,
          error: 'Khách hàng không có quyền truy cập chức năng này'
        });
      }

      // Staff: Kiểm tra branch ownership
      if (req.user.role_name === 'staff') {
        const staffBranchId = req.user.branch_id;

        if (!staffBranchId) {
          return res.status(403).json({
            success: false,
            error: 'Nhân viên chưa được gán chi nhánh'
          });
        }

        // Lấy transfer ID từ params
        const transferId = req.params.id;
        if (!transferId) {
          return res.status(400).json({
            success: false,
            error: 'Thiếu transfer ID'
          });
        }

        // Lấy thông tin transfer
        const transfer = await prisma.inventoryTransfer.findUnique({
          where: { id: Number(transferId) },
          select: {
            from_branch_id: true,
            to_branch_id: true,
            created_by: true
          }
        });

        if (!transfer) {
          return res.status(404).json({
            success: false,
            error: 'Không tìm thấy phiếu chuyển kho'
          });
        }

        // Kiểm tra quyền dựa trên branchType
        let hasPermission = false;
        let errorMessage = '';

        switch (branchType) {
          case 'from':
            // Staff chỉ được thao tác trên transfer từ chi nhánh của mình
            hasPermission = transfer.from_branch_id === staffBranchId;
            errorMessage = 'Bạn chỉ có quyền thao tác phiếu chuyển từ chi nhánh của mình';
            break;

          case 'to':
            // Staff chỉ được nhận hàng đến chi nhánh của mình
            hasPermission = transfer.to_branch_id === staffBranchId;
            errorMessage = 'Bạn chỉ có quyền nhận hàng chuyển đến chi nhánh của mình';
            break;

          case 'from_or_creator':
            // Staff được thao tác nếu là người tạo hoặc thuộc chi nhánh nguồn
            hasPermission = transfer.from_branch_id === staffBranchId;
            errorMessage = 'Bạn chỉ có quyền thao tác phiếu chuyển từ chi nhánh của mình';
            break;

          default:
            hasPermission = false;
            errorMessage = 'Loại kiểm tra quyền không hợp lệ';
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: errorMessage,
            details: {
              your_branch_id: staffBranchId,
              transfer_from_branch_id: transfer.from_branch_id,
              transfer_to_branch_id: transfer.to_branch_id
            }
          });
        }

        // Attach transfer data để controller không cần query lại
        req.transfer = transfer;
      }

      next();
    } catch (error) {
      console.error('Error in authorizeTransferBranch:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi kiểm tra quyền truy cập'
      });
    }
  };
};

/**
 * Middleware kiểm tra from_branch_id khi tạo transfer
 * Staff chỉ được tạo transfer từ chi nhánh của mình
 */
export const authorizeCreateTransfer = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực'
      });
    }

    // Admin có quyền tạo từ bất kỳ chi nhánh nào
    if (req.user.role_name === 'admin') {
      return next();
    }

    // Staff: Kiểm tra from_branch_id
    if (req.user.role_name === 'staff') {
      const staffBranchId = req.user.branch_id;

      if (!staffBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Nhân viên chưa được gán chi nhánh'
        });
      }

      const fromBranchId = req.body.from_branch_id || req.body.fromBranchId;

      if (!fromBranchId) {
        // Tự động set from_branch_id là chi nhánh của staff
        req.body.from_branch_id = staffBranchId;
        req.body.fromBranchId = staffBranchId;
        return next();
      }

      if (Number(fromBranchId) !== staffBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chỉ có quyền tạo phiếu chuyển từ chi nhánh của mình',
          details: {
            your_branch_id: staffBranchId,
            requested_from_branch_id: fromBranchId
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in authorizeCreateTransfer:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi kiểm tra quyền tạo phiếu chuyển kho'
    });
  }
};

// ✅ Backward compatibility - alias cho các tên cũ
export const authorizeRoles = requireRoles;
export const authorizeOwner = authorizeOwnerOrAdmin;
