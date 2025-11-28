/**
 * Constants cho ứng dụng
 */

// Order Status
export const ORDER_STATUS = {
  CART: 'cart',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

// Flashsale Status
export const FLASHSALE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  ENDED: 'ended'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Payment Methods
export const PAYMENT_METHODS = {
  COD: 'COD',                    // Cash on Delivery
  BANK_TRANSFER: 'bank_transfer',
  VNPAY: 'vnpay',
  MOMO: 'momo',
  CREDIT_CARD: 'credit_card'
};

// Shipment Status
export const SHIPMENT_STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PAYMENT: 'payment',
  SHIPMENT: 'shipment',
  PROMOTION: 'promotion',
  SYSTEM: 'system'
};

// Voucher Discount Types
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'  // ✅ Đổi từ 'fixed_amount' thành 'fixed'
};

// Gender
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

// Insurance Claim Status
export const INSURANCE_CLAIM_STATUS = {
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
};

// Prescription Status
export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Date formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss'
};

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_LENGTH: 10,
  MAX_AGE: 120,
  MIN_PRICE: 0,
  MIN_QUANTITY: 1
};

// Cart limits
export const CART_LIMITS = {
  MAX_ITEMS_PER_CART: 100, // Maximum number of different items in cart
  MAX_QUANTITY_PER_ITEM: 999, // Maximum quantity for a single product
  CART_EXPIRATION_DAYS: 30 // Cart expires after 30 days
};

// ✅ FIX ISSUE #10: Thêm constants cho InventoryLog types
// ⚠️ CONVENTION MỚI: Quantity luôn DƯƠNG, Type cho biết hướng di chuyển
// - IMPORT, RETURN, CANCEL_RETURN, TRANSFER_IN: Tăng stock
// - EXPORT, OUT, TRANSFER_OUT, DAMAGE, DISPOSAL: Giảm stock
export const INVENTORY_LOG_TYPE = {
  IMPORT: 'IMPORT',           // Nhập kho từ NCC
  EXPORT: 'EXPORT',           // Xuất kho (bán hàng) - thay thế cho OUT
  OUT: 'OUT',                 // ⚠️ DEPRECATED: Dùng EXPORT thay thế
  ADJUSTMENT: 'ADJUSTMENT',   // Điều chỉnh kiểm kê
  TRANSFER_IN: 'TRANSFER_IN', // Chuyển kho vào
  TRANSFER_OUT: 'TRANSFER_OUT', // Chuyển kho ra
  RETURN: 'RETURN',           // Hoàn trả từ khách hàng (shipment returned)
  CANCEL_RETURN: 'CANCEL_RETURN', // Hoàn kho do hủy đơn
  STOCK_TAKE: 'STOCK_TAKE',   // Kiểm kê kho
  DAMAGE: 'DAMAGE',           // Hàng hư hỏng
  EXPIRED: 'EXPIRED',         // Đánh dấu hàng hết hạn (chưa xuất kho)
  DISPOSAL: 'DISPOSAL'        // Tiêu hủy hàng hết hạn (xuất kho thực tế)
};

// Inventory log types that increase stock (nhập kho)
export const INVENTORY_INCREASE_TYPES = [
  INVENTORY_LOG_TYPE.IMPORT,
  INVENTORY_LOG_TYPE.RETURN,
  INVENTORY_LOG_TYPE.CANCEL_RETURN,
  INVENTORY_LOG_TYPE.TRANSFER_IN
];

// Inventory log types that decrease stock (xuất kho)
export const INVENTORY_DECREASE_TYPES = [
  INVENTORY_LOG_TYPE.EXPORT,
  INVENTORY_LOG_TYPE.OUT,
  INVENTORY_LOG_TYPE.TRANSFER_OUT,
  INVENTORY_LOG_TYPE.DAMAGE,
  INVENTORY_LOG_TYPE.DISPOSAL
];

/**
 * ✅ NEW: Helper để tính stock movement từ inventory log
 * Convention: quantity luôn DƯƠNG, type quyết định chiều tăng/giảm
 * @param {string} type - Loại inventory log
 * @param {number} quantity - Số lượng (luôn dương)
 * @returns {number} - Số dương nếu tăng stock, số âm nếu giảm stock
 */
export const calculateStockMovement = (type, quantity) => {
  const absQuantity = Math.abs(quantity);
  if (INVENTORY_INCREASE_TYPES.includes(type)) {
    return absQuantity; // Tăng stock
  }
  if (INVENTORY_DECREASE_TYPES.includes(type)) {
    return -absQuantity; // Giảm stock
  }
  return 0; // ADJUSTMENT, STOCK_TAKE, EXPIRED không tự động thay đổi stock
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Chưa xác thực',
  FORBIDDEN: 'Không có quyền truy cập',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  SERVER_ERROR: 'Lỗi server',
  TOKEN_INVALID: 'Token không hợp lệ',
  TOKEN_EXPIRED: 'Token đã hết hạn'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Tạo mới thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công'
};
