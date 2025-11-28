/**
 * Middleware validation cho request body
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Trả về tất cả lỗi, không chỉ lỗi đầu tiên
      stripUnknown: true // Loại bỏ các field không được định nghĩa trong schema
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: errors
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

/**
 * Middleware validation cho query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Query parameters không hợp lệ',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware validation cho route parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Route parameters không hợp lệ',
        details: errors
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Validate ID parameter (phổ biến nhất)
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: `${paramName} phải là số nguyên dương`
      });
    }

    req.params[paramName] = id;
    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) {
    return res.status(400).json({
      success: false,
      error: 'Page phải là số nguyên dương'
    });
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error: 'Limit phải từ 1 đến 100'
    });
  }

  req.query.page = page;
  req.query.limit = limit;
  next();
};

/**
 * Sanitize input - loại bỏ các ký tự đặc biệt nguy hiểm
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

const sanitizeObject = (obj) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Loại bỏ script tags và các ký tự nguy hiểm
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// ===============================================
// TEXT FIELD VALIDATORS
// ===============================================

/**
 * Sanitize và validate text fields (note, reason, description, etc.)
 * @param {Object} options - Validation options
 * @param {string[]} options.fields - Field names to validate
 * @param {number} options.maxLength - Maximum length (default: 1000)
 * @param {number} options.minLength - Minimum length (default: 0)
 * @param {boolean} options.required - Whether field is required (default: false)
 */
export const validateTextFields = (options = {}) => {
  const {
    fields = ['note', 'reason'],
    maxLength = 1000,
    minLength = 0,
    required = false
  } = options;

  return (req, res, next) => {
    for (const field of fields) {
      const value = req.body[field];

      // Check required
      if (required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({
          success: false,
          error: `Trường "${field}" là bắt buộc`
        });
      }

      // Skip if not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Must be string
      if (typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          error: `Trường "${field}" phải là chuỗi ký tự`
        });
      }

      // Trim and sanitize
      const sanitized = sanitizeTextField(value);

      // Check length
      if (sanitized.length < minLength) {
        return res.status(400).json({
          success: false,
          error: `Trường "${field}" phải có ít nhất ${minLength} ký tự`
        });
      }

      if (sanitized.length > maxLength) {
        return res.status(400).json({
          success: false,
          error: `Trường "${field}" không được vượt quá ${maxLength} ký tự`
        });
      }

      // Update with sanitized value
      req.body[field] = sanitized;
    }

    next();
  };
};

/**
 * Sanitize a single text field
 * Removes dangerous characters while preserving Vietnamese text
 */
const sanitizeTextField = (text) => {
  if (!text) return '';

  return String(text)
    .trim()
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags but keep content
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace (but keep single spaces and newlines)
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ');
};

/**
 * Validate note field specifically (common use case)
 */
export const validateNote = validateTextFields({
  fields: ['note'],
  maxLength: 2000,
  required: false
});

/**
 * Validate reason field specifically (for cancel operations)
 */
export const validateReason = validateTextFields({
  fields: ['reason'],
  maxLength: 500,
  required: false
});

/**
 * Validate both note and reason
 */
export const validateNoteAndReason = validateTextFields({
  fields: ['note', 'reason'],
  maxLength: 1000,
  required: false
});
