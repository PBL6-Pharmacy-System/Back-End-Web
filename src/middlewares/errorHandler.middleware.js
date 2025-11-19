/**
 * Global Error Handler Middleware
 * Xử lý tất cả lỗi trong application
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token đã hết hạn'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi server';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Xử lý các lỗi từ Prisma
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: `${field} đã tồn tại trong hệ thống`
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy dữ liệu'
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu tham chiếu không tồn tại'
      });

    case 'P2014':
      // Required relation violation
      return res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu liên quan bắt buộc'
      });

    case 'P2021':
      // Table does not exist
      return res.status(500).json({
        success: false,
        error: 'Bảng dữ liệu không tồn tại. Vui lòng chạy migration.'
      });

    case 'P2023':
      // Inconsistent column data
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không nhất quán'
      });

    default:
      return res.status(500).json({
        success: false,
        error: 'Lỗi database',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
      });
  }
};

/**
 * Handle 404 - Not Found
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} không tồn tại`
  });
};

/**
 * Async handler wrapper - bọc async functions để tự động catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
