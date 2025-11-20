import jwt from 'jsonwebtoken';

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
    
    // ✅ Attach user info từ JWT (KHÔNG CẦN QUERY DATABASE!)
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
      customer_id: decoded.customer_id,  // ✅ Include customer_id for customer role
      staff_id: decoded.staff_id,        // ✅ Include staff_id for staff role
      admin_id: decoded.admin_id         // ✅ Include admin_id for admin role
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
    if (req.user.id !== resourceId) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có thể truy cập tài nguyên của mình'
      });
    }

    next();
  };
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
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
      customer_id: decoded.customer_id,
      staff_id: decoded.staff_id,
      admin_id: decoded.admin_id
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// ✅ Backward compatibility - alias cho các tên cũ
export const authorizeRoles = requireRoles;
export const authorizeOwner = authorizeOwnerOrAdmin;
