import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều lần đăng nhập/đăng ký từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Moderate rate limiter for create/update/delete operations
 * 30 requests per 15 minutes
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 write requests per windowMs
  message: {
    success: false,
    error: 'Quá nhiều request tạo/sửa/xóa từ IP này, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to POST, PUT, DELETE, PATCH
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  }
});

/**
 * Password change rate limiter
 * 3 requests per hour
 */
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password change requests per hour
  message: {
    success: false,
    error: 'Quá nhiều lần đổi password, vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Cart operations rate limiter
 * 50 requests per 15 minutes
 */
export const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 cart operations per windowMs
  message: {
    success: false,
    error: 'Quá nhiều thao tác giỏ hàng, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Search rate limiter
 * 60 requests per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 search requests per minute
  message: {
    success: false,
    error: 'Quá nhiều request tìm kiếm, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});
