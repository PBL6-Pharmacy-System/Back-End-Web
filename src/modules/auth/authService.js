import crypto from 'crypto';
import prisma from '../../config/db.js';
import { comparePassword, generateRefreshToken, generateToken, hashPassword, verifyRefreshToken } from '../../utils/helpers.js';
import { isValidEmail } from '../../utils/validation.js';

/**
 * Đăng ký user mới
 * ✅ Refactored: Không cần validate permissions
 */
export const register = async (data) => {
  try {
    const { username, email, password, phone, full_name, role_id = 3 } = data;

    // Validate input
    if (!username || !email || !password) {
      return {
        success: false,
        error: 'Username, email và password là bắt buộc',
        status: 400
      };
    }

    if (!isValidEmail(email)) {
      return {
        success: false,
        error: 'Email không hợp lệ',
        status: 400
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password phải có ít nhất 8 ký tự',
        status: 400
      };
    }

    // Verify role exists
    const role = await prisma.rolepermissions.findUnique({
      where: { id: Number(role_id) }
    });

    if (!role) {
      return {
        success: false,
        error: 'Role không hợp lệ',
        status: 400
      };
    }

    // Check existing user
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return {
          success: false,
          error: 'Username đã tồn tại',
          status: 409
        };
      }
      if (existingUser.email === email) {
        return {
          success: false,
          error: 'Email đã tồn tại',
          status: 409
        };
      }
      if (existingUser.phone === phone) {
        return {
          success: false,
          error: 'Số điện thoại đã tồn tại',
          status: 409
        };
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await prisma.users.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        password_hash,
        phone,
        full_name: full_name?.trim(),
        role_id: Number(role_id)
      },
      include: {
        rolepermissions: true
      }
    });

    // ✅ Generate tokens - chỉ cần role_name
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.rolepermissions.role_name
    });

    const refreshToken = generateRefreshToken({
      userId: user.id
    });

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: 'Lỗi khi đăng ký',
      status: 500
    };
  }
};

/**
 * Đăng nhập
 * ✅ Refactored: Không cần validate permissions
 */
export const login = async (data) => {
  try {
    const { username, password } = data;

    // Validate
    if (!username || !password) {
      return {
        success: false,
        error: 'Username và password là bắt buộc',
        status: 400
      };
    }

    // Find user by username or email
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        rolepermissions: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'Username hoặc password không đúng',
        status: 401
      };
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Username hoặc password không đúng',
        status: 401
      };
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.rolepermissions.role_name
    });

    const refreshToken = generateRefreshToken({
      userId: user.id
    });

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Lỗi khi đăng nhập',
      status: 500
    };
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const getCurrentUser = async (userId) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      include: {
        rolepermissions: true,
        customers: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User không tồn tại',
        status: 404
      };
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: userWithoutPassword
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy thông tin user',
      status: 500
    };
  }
};

/**
 * Đổi password
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Validate
    if (!oldPassword || !newPassword) {
      return {
        success: false,
        error: 'Old password và new password là bắt buộc',
        status: 400
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'New password phải có ít nhất 8 ký tự',
        status: 400
      };
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return {
        success: false,
        error: 'User không tồn tại',
        status: 404
      };
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Old password không đúng',
        status: 401
      };
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    await prisma.users.update({
      where: { id: Number(userId) },
      data: { password_hash }
    });

    return {
      success: true,
      message: 'Đổi password thành công'
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: 'Lỗi khi đổi password',
      status: 500
    };
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token không được cung cấp',
        status: 400
      };
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        rolepermissions: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User không tồn tại',
        status: 404
      };
    }

    // Generate new access token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.rolepermissions.role_name
    });

    return {
      success: true,
      data: {
        token
      }
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    return {
      success: false,
      error: 'Refresh token không hợp lệ hoặc đã hết hạn',
      status: 401
    };
  }
};

/**
 * Customer login with OTP (Phone verification)
 */
export const customerLoginWithOTP = async (phone, otpCode) => {
  try {
    // Validate
    if (!phone || !otpCode) {
      return {
        success: false,
        error: 'Số điện thoại và mã OTP là bắt buộc',
        status: 400
      };
    }

    // Normalize phone
    const normalizedPhone = phone.startsWith('+84') 
      ? phone 
      : phone.replace(/^0/, '+84');

    // Verify OTP first
    const otpRecord = await prisma.otp_verifications.findFirst({
      where: {
        phone: normalizedPhone,
        otp_code: otpCode,
        verified: true,
        created_at: {
          gte: new Date(Date.now() - 10 * 60000) // Within last 10 minutes
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!otpRecord) {
      return {
        success: false,
        error: 'Mã OTP không hợp lệ hoặc đã hết hạn',
        status: 400
      };
    }

    // Find or create customer
    let user = await prisma.users.findFirst({
      where: {
        phone: normalizedPhone
      },
      include: {
        rolepermissions: true,
        customers: true
      }
    });

    // If user doesn't exist, create new customer account
    if (!user) {
      // Create user with customer role (role_id = 3)
      user = await prisma.users.create({
        data: {
          username: normalizedPhone,
          phone: normalizedPhone,
          email: `${normalizedPhone.replace('+', '')}@temp.com`, // Temporary email
          password_hash: await hashPassword(crypto.randomBytes(32).toString('hex')), // Random password
          role_id: 3, // Customer role
          full_name: null,
          is_verified: true // Auto-verified via OTP
        },
        include: {
          rolepermissions: true
        }
      });

      // Create customer record (without duplicate fields)
      await prisma.customers.create({
        data: {
          user_id: user.id
        }
      });

      // Reload user with customer data
      user = await prisma.users.findUnique({
        where: { id: user.id },
        include: {
          rolepermissions: true,
          customers: true
        }
      });
    }

    // Check if user is customer role
    if (user.role_id !== 3) {
      return {
        success: false,
        error: 'Tài khoản này không phải là khách hàng. Vui lòng đăng nhập bằng username và password',
        status: 403
      };
    }

    // Update last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.rolepermissions?.role_name,
      customer_id: user.customers?.id
    });

    const refreshToken = generateRefreshToken({
      userId: user.id
    });

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    // Delete used OTP
    await prisma.otp_verifications.delete({
      where: {
        id: otpRecord.id
      }
    });

    return {
      success: true,
      message: user.customers ? 'Đăng nhập thành công' : 'Tài khoản mới đã được tạo',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    };
  } catch (error) {
    console.error('Customer OTP login error:', error);
    return {
      success: false,
      error: 'Lỗi khi đăng nhập',
      status: 500
    };
  }
};

