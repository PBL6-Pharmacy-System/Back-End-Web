import jwt from 'jsonwebtoken';

/**
 * Tạo JWT access token
 */
export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '15m') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Tạo refresh token (long-lived)
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token không hợp lệ');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Refresh token không hợp lệ');
  }
};

/**
 * Hash password
 */
export const hashPassword = async (password) => {
  const bcrypt = await import('bcrypt');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password, hashedPassword) => {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Format response
 */
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

export const errorResponse = (error, statusCode = 500) => {
  return {
    success: false,
    error: error.message || error,
    statusCode
  };
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (page, limit, total) => {
  return {
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    totalRecords: Number(total),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  };
};
