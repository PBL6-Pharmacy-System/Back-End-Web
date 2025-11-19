import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';

/**
 * Middleware xác thực JWT token
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
    
    // Lấy thông tin user từ database
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        rolepermissions: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User không tồn tại'
      });
    }

    // Gán user vào request để sử dụng ở các middleware/controller tiếp theo
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.rolepermissions?.role_name,
      permissions: user.rolepermissions?.permissions
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

  if (req.user.role_name !== 'admin' && req.user.role_name !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Không có quyền truy cập. Chỉ admin mới được phép.'
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền theo role names
 */
export const authorizeRoles = (...roles) => {
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
 * Middleware kiểm tra user có phải là chủ sở hữu tài nguyên
 */
export const authorizeOwner = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực'
      });
    }

    const resourceId = parseInt(req.params[resourceIdParam]);
    
    // Admin có thể truy cập tất cả
    if (req.user.role_name === 'admin' || req.user.role_name === 'Admin') {
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
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        rolepermissions: true
      }
    });

    req.user = user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.rolepermissions?.role_name,
      permissions: user.rolepermissions?.permissions
    } : null;

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
