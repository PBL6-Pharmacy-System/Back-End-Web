import rateLimit from 'express-rate-limit';

/**
 * ========================================
 * 🔧 DEVELOPMENT MODE: Rate limits tăng cao để test
 * Khi deploy production, giảm lại các giá trị này
 * ========================================
 */
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const DEV_MULTIPLIER = IS_DEVELOPMENT ? 100 : 1; // Tăng 100x trong development

/**
 * General API rate limiter
 * Production: 100 requests per 15 minutes
 * Development: 10000 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 * DEV_MULTIPLIER, // 10000 in dev, 100 in prod
  message: {
    success: false,
    error: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Production: 10 requests per 15 minutes
 * Development: 1000 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều lần đăng nhập/đăng ký từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const username = req.body?.username || req.body?.email || req.body?.phone || 'unknown';
    return `${req.ip}-${username}`;
  },
  validate: { trustProxy: false, xForwardedForHeader: false, limit: false, default: false }
});

/**
 * Moderate rate limiter for create/update/delete operations
 * Production: 30 requests per 15 minutes
 * Development: 3000 requests per 15 minutes
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều request tạo/sửa/xóa từ IP này, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  }
});

/**
 * Password change rate limiter
 * Production: 3 requests per hour
 * Development: 300 requests per hour
 */
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều lần đổi password, vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Cart operations rate limiter
 * Production: 50 requests per 15 minutes
 * Development: 5000 requests per 15 minutes
 */
export const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều thao tác giỏ hàng, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Search rate limiter
 * Production: 60 requests per minute
 * Development: 6000 requests per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều request tìm kiếm, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Review rate limiter
 * Production: 10 reviews per hour
 * Development: 1000 reviews per hour
 */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều đánh giá, vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin notification limiter
 * Production: 20 notifications per 15 minutes
 * Development: 2000 notifications per 15 minutes
 */
export const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều thông báo được tạo, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Order status update limiter
 * Production: 30 updates per 15 minutes
 * Development: 3000 updates per 15 minutes
 */
export const orderStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều cập nhật trạng thái đơn hàng, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * ✅ NEW: Checkout rate limiter
 * Giới hạn số lần checkout để tránh spam và abuse
 * Production: 5 checkouts per 15 minutes per user
 * Development: 500 checkouts per 15 minutes
 */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Bạn đã thực hiện quá nhiều lần thanh toán. Vui lòng thử lại sau 15 phút.',
    code: 'CHECKOUT_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit theo user ID nếu có, fallback to IP
    const userId = req.user?.id || req.body?.customerId;
    return userId ? `checkout-user-${userId}` : `checkout-ip-${req.ip}`;
  },
  validate: { trustProxy: false, xForwardedForHeader: false, limit: false, default: false }
});

/**
 * ✅ NEW: Cancel order rate limiter
 * Giới hạn số lần hủy đơn để tránh abuse
 * Production: 10 cancels per hour
 * Development: 1000 cancels per hour
 */
export const cancelOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Bạn đã hủy quá nhiều đơn hàng. Vui lòng thử lại sau 1 giờ.',
    code: 'CANCEL_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `cancel-user-${userId}` : `cancel-ip-${req.ip}`;
  },
  validate: { trustProxy: false, xForwardedForHeader: false, limit: false, default: false }
});

/**
 * ✅ NEW: Inventory operations rate limiter
 * Giới hạn các thao tác inventory quan trọng
 * Production: 50 operations per 15 minutes
 * Development: 5000 operations per 15 minutes
 */
export const inventoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều thao tác kho, vui lòng thử lại sau',
    code: 'INVENTORY_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * ✅ NEW: Product stats rate limiter
 * Giới hạn truy cập thống kê sản phẩm để tránh abuse/scraping
 * Production: 30 requests per minute per IP
 * Development: 3000 requests per minute
 */
export const productStatsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều request thống kê sản phẩm, vui lòng thử lại sau 1 phút',
    code: 'PRODUCT_STATS_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * ✅ NEW: Best sellers rate limiter
 * Giới hạn truy cập best sellers để tránh abuse
 * Production: 20 requests per minute per IP
 * Development: 2000 requests per minute
 */
export const bestSellersLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 * DEV_MULTIPLIER,
  message: {
    success: false,
    error: 'Quá nhiều request best sellers, vui lòng thử lại sau 1 phút',
    code: 'BEST_SELLERS_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
