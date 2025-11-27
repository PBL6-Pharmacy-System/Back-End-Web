/**
 * Validate required fields in an object
 * @param {Object} data - Object to validate
 * @param {Array<string>} fields - Array of required field names
 * @returns {Array<string>} Array of missing field names
 */
export const validateRequiredFields = (data, fields) => {
  return fields.filter(field => !data[field]);
};

/**
 * Validate numeric fields in an object
 * @param {Object} data - Object to validate
 * @param {Array<string>} fields - Array of field names that should be numeric
 * @returns {Array<string>} Array of invalid field names
 */
export const validateNumericFields = (data, fields) => {
  return fields.filter(field => {
    if (data[field] === undefined) return false;
    return isNaN(Number(data[field])) || Number(data[field]) < 0;
  });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate birthdate (not in future and age <= 120)
 * @param {string|Date} birthdate - Birthdate to validate
 * @returns {boolean} True if birthdate is valid
 */
export const isValidBirthdate = (birthdate) => {
  const birthdateObj = new Date(birthdate);
  const now = new Date();

  if (birthdateObj > now) {
    return false;
  }

  // Calculate age
  const age = Math.floor((now - birthdateObj) / (365.25 * 24 * 60 * 60 * 1000));
  return age <= 120;
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date to validate
 * @param {string|Date} endDate - End date to validate
 * @returns {boolean} True if date range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

/**
 * Validate staff branch permission for inventory operations
 * Staff can only perform WRITE operations on their own branch
 * Admin can access all branches
 * 
 * @param {Object} user - User object from req.user (JWT decoded)
 * @param {number} requestedBranchId - Branch ID being accessed
 * @returns {Object} { allowed: boolean, error?: string, userBranchId?: number }
 * 
 * @example
 * const validation = validateStaffBranchPermission(req.user, req.body.branch_id);
 * if (!validation.allowed) {
 *   return res.status(403).json({ success: false, error: validation.error });
 * }
 */
export const validateStaffBranchPermission = (user, requestedBranchId) => {
  // Not authenticated
  if (!user) {
    return {
      allowed: false,
      error: 'Chưa xác thực người dùng'
    };
  }

  // Admin has full access
  if (user.role_name === 'admin') {
    return {
      allowed: true,
      userBranchId: null // Admin can access all
    };
  }

  // Customer cannot access inventory
  if (user.role_name === 'customer') {
    return {
      allowed: false,
      error: 'Khách hàng không có quyền truy cập quản lý kho'
    };
  }

  // Staff validation
  if (user.role_name === 'staff') {
    const staffBranchId = user.branch_id;

    // Staff not assigned to any branch
    if (!staffBranchId) {
      return {
        allowed: false,
        error: 'Nhân viên chưa được gán chi nhánh'
      };
    }

    // If no branch requested, allow (will use staff's branch)
    if (!requestedBranchId) {
      return {
        allowed: true,
        userBranchId: staffBranchId,
        autoAssigned: true
      };
    }

    // Check if staff is accessing their own branch
    if (Number(requestedBranchId) !== staffBranchId) {
      return {
        allowed: false,
        error: 'Bạn chỉ có quyền thao tác trên chi nhánh của mình',
        userBranchId: staffBranchId,
        requestedBranchId: Number(requestedBranchId)
      };
    }

    return {
      allowed: true,
      userBranchId: staffBranchId
    };
  }

  // Unknown role
  return {
    allowed: false,
    error: 'Vai trò không hợp lệ'
  };
};

/**
 * Get effective branch ID for inventory operations
 * - Admin: use requested branch_id (required)
 * - Staff: use their own branch_id (auto-assigned if not provided)
 * 
 * @param {Object} user - User object from req.user
 * @param {number|null} requestedBranchId - Branch ID from request
 * @returns {Object} { branchId: number|null, error?: string }
 */
export const getEffectiveBranchId = (user, requestedBranchId) => {
  if (!user) {
    return { branchId: null, error: 'Chưa xác thực người dùng' };
  }

  // Admin must specify branch_id
  if (user.role_name === 'admin') {
    if (!requestedBranchId) {
      return { branchId: null, error: 'Admin phải chỉ định branch_id' };
    }
    return { branchId: Number(requestedBranchId) };
  }

  // Staff uses their own branch
  if (user.role_name === 'staff') {
    if (!user.branch_id) {
      return { branchId: null, error: 'Nhân viên chưa được gán chi nhánh' };
    }
    // If staff provides branch_id, validate it matches their branch
    if (requestedBranchId && Number(requestedBranchId) !== user.branch_id) {
      return {
        branchId: null,
        error: 'Bạn chỉ có quyền thao tác trên chi nhánh của mình'
      };
    }
    return { branchId: user.branch_id };
  }

  return { branchId: null, error: 'Vai trò không có quyền truy cập' };
};