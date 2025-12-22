import crypto from 'crypto';
import prisma from '../../config/db.js';
import { comparePassword, generateRefreshToken, generateToken, hashPassword, verifyRefreshToken } from '../../utils/helpers.js';
import { isValidEmail } from '../../utils/validation.js';

/**
 * Đăng ký user mới
 * ✅ Chỉ cho Admin và Staff (role_id = 1 hoặc 2)
 * ❌ Customer phải đăng ký qua OTP (customerLoginWithOTP)
 */
export const register = async (data) => {
  try {
    const { username, email, password, phone, full_name, role_id } = data;

    // Validate input
    if (!username || !email || !password) {
      return {
        success: false,
        error: 'Username, email và password là bắt buộc',
        status: 400
      };
    }

    // Validate role_id
    if (!role_id) {
      return {
        success: false,
        error: 'Role ID là bắt buộc',
        status: 400
      };
    }

    // ❌ KHÔNG CHO PHÉP ĐĂNG KÝ CUSTOMER
    if (Number(role_id) === 3) {
      return {
        success: false,
        error: 'Không thể đăng ký tài khoản Customer. Vui lòng sử dụng chức năng đăng nhập OTP',
        status: 403
      };
    }

    // Validate role_id (chỉ cho phép 1=admin, 2=staff)
    if (![1, 2].includes(Number(role_id))) {
      return {
        success: false,
        error: 'Role ID phải là 1 (admin) hoặc 2 (staff)',
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
    const role = await prisma.roles.findUnique({
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

    // Create user with transaction to ensure role-specific record is created
    const user = await prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.users.create({
        data: {
          username: username.trim(),
          email: email.trim(),
          password_hash,
          phone,
          full_name: full_name?.trim(),
          role_id: Number(role_id)
        },
      include: {
        roles: true
      }
    });      // Create role-specific record based on role_id
      if (Number(role_id) === 2) {
        // Staff role
        await tx.staff.create({
          data: {
            user_id: newUser.id
          }
        });
      } else if (Number(role_id) === 1) {
        // Admin role
        await tx.admin.create({
          data: {
            user_id: newUser.id
          }
        });
      }
      // Customer không được tạo qua register

      // Return user with all relations
      return tx.users.findUnique({
        where: { id: newUser.id },
        include: {
          roles: true,
          customers: true,
          staff: {
            include: {
              branches: true
            }
          },
          admin: true
        }
      });
    });

    // Generate tokens with role and profile info
    const tokenData = {
      userId: user.id,  // ✅ REVERTED: Use 'userId' to match middleware
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.roles.role_name
    };

    // Add role-specific ID to token (chỉ staff hoặc admin cho register)
    if (user.staff) {
      tokenData.staff_id = user.staff.id;
      tokenData.branch_id = user.staff.branch_id;
    } else if (user.admin) {
      tokenData.admin_id = user.admin.id;
      tokenData.is_super_admin = user.admin.is_super_admin;
    }

    const token = generateToken(tokenData);

    const refreshToken = generateRefreshToken({
      userId: user.id  // ✅ REVERTED: Use 'userId' to match middleware
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

    // Find user by username or email with all role relations
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        roles: true,
        customers: true,
        staff: {
          include: {
            branches: true
          }
        },
        admin: true
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

    // Update last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Generate tokens with role and profile info
    const tokenData = {
      userId: user.id,  // ✅ REVERTED: Use 'userId' to match middleware
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.roles.role_name
    };

    // Add role-specific ID to token
    if (user.customers) {
      tokenData.customer_id = user.customers.id;
    } else if (user.staff) {
      tokenData.staff_id = user.staff.id;
      tokenData.branch_id = user.staff.branch_id;
    } else if (user.admin) {
      tokenData.admin_id = user.admin.id;
      tokenData.is_super_admin = user.admin.is_super_admin;
    }

    const token = generateToken(tokenData);

    const refreshToken = generateRefreshToken({
      userId: user.id  // ✅ REVERTED: Use 'userId' to match middleware
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
        roles: true,
        customers: true,
        staff: {
          include: {
            branches: true
          }
        },
        admin: true
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

    // Get user with role info
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },  // ✅ REVERTED: Use 'userId' to match middleware
      include: {
        roles: true,
        customers: true,
        staff: true,
        admin: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User không tồn tại',
        status: 404
      };
    }

    // Generate new access token with role and profile info
    const tokenData = {
      userId: user.id,  // ✅ REVERTED: Use 'userId' to match middleware
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.roles.role_name
    };

    // Add role-specific ID
    if (user.customers) {
      tokenData.customer_id = user.customers.id;
    } else if (user.staff) {
      tokenData.staff_id = user.staff.id;
      tokenData.branch_id = user.staff.branch_id;
    } else if (user.admin) {
      tokenData.admin_id = user.admin.id;
      tokenData.is_super_admin = user.admin.is_super_admin;
    }

    const token = generateToken(tokenData);

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
 * Customer login with OTP (Phone hoặc Email verification)
 */
export const customerLoginWithOTP = async (phone = null, email = null, otpCode) => {
  try {
    console.log('🔐 [customerLoginWithOTP] Starting with:', { phone, email, otpCode: otpCode?.substring(0, 2) + '****' });
    
    // Validate
    if ((!phone && !email) || !otpCode) {
      console.log('❌ [customerLoginWithOTP] Validation failed: missing phone/email or OTP');
      return {
        success: false,
        error: 'Số điện thoại/email và mã OTP là bắt buộc',
        status: 400
      };
    }

    let normalizedPhone = null;
    let normalizedEmail = null;

    // Normalize phone nếu có
    if (phone) {
      normalizedPhone = phone.startsWith('+84') ? phone : phone.replace(/^0/, '+84');
    }

    // Normalize email nếu có
    if (email) {
      normalizedEmail = email.toLowerCase().trim();
    }
    
    console.log('📞 [customerLoginWithOTP] Normalized:', { normalizedPhone, normalizedEmail });

    console.log('📞 [customerLoginWithOTP] Normalized:', { normalizedPhone, normalizedEmail });

    // Verify OTP first
    const whereClause = {
      OR: [
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
      ],
      otp_code: otpCode,
      verified: false,
      expires_at: {
        gte: new Date()
      }
    };
    
    console.log('🔍 [customerLoginWithOTP] Searching for OTP with clause:', JSON.stringify(whereClause, null, 2));

    const otpRecord = await prisma.otp_verifications.findFirst({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('📋 [customerLoginWithOTP] OTP record found:', !!otpRecord);

    if (!otpRecord) {
      console.log('❌ [customerLoginWithOTP] OTP not found or expired');
      return {
        success: false,
        error: 'Mã OTP không hợp lệ hoặc đã hết hạn',
        status: 400
      };
    }
    
    console.log('✅ [customerLoginWithOTP] OTP verified, marking as used...');

    console.log('✅ [customerLoginWithOTP] OTP verified, marking as used...');

    // Mark OTP as verified
    await prisma.otp_verifications.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });
    
    console.log('✅ [customerLoginWithOTP] OTP marked as verified');

    // Find or create customer
    // Tìm user bằng phone, email HOẶC username (vì username có thể = email hoặc phone)
    const potentialUsername = normalizedEmail || normalizedPhone;
    const userWhereClause = {
      OR: [
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(potentialUsername ? [{ username: potentialUsername }] : [])
      ]
    };
    
    console.log('🔍 [customerLoginWithOTP] Searching for user with clause:', JSON.stringify(userWhereClause, null, 2));

    let user = await prisma.users.findFirst({
      where: userWhereClause,
      include: {
        roles: true,
        customers: true
      }
    });
    
    console.log('👤 [customerLoginWithOTP] User found:', !!user, user ? { id: user.id, role_id: user.role_id } : null);

    let isNewAccount = false;

    // If user doesn't exist, create new customer account
    if (!user) {
      console.log('➕ [customerLoginWithOTP] Creating new customer account...');
      console.log('➕ [customerLoginWithOTP] Creating new customer account...');
      isNewAccount = true;
      // Create user with customer role (role_id = 3) in transaction
      user = await prisma.$transaction(async (tx) => {
        console.log('📝 [customerLoginWithOTP] Creating user record...');
        const newUser = await tx.users.create({
          data: {
            username: normalizedEmail || normalizedPhone,
            phone: normalizedPhone,
            email: normalizedEmail || `${normalizedPhone?.replace('+', '')}@temp.com`,
            password_hash: await hashPassword(crypto.randomBytes(32).toString('hex')), // Random password
            role_id: 3, // Customer role
            full_name: null,
            is_verified: true // Auto-verified via OTP
          }
        });
        
        console.log('✅ [customerLoginWithOTP] User created with ID:', newUser.id);
        console.log('📝 [customerLoginWithOTP] Creating customer record...');

        // Create customer record
        await tx.customers.create({
          data: {
            user_id: newUser.id
          }
        });
        
        console.log('✅ [customerLoginWithOTP] Customer record created');

        // ✅ FIX: Return user with all relations including roles
        const userWithRelations = await tx.users.findUnique({
          where: { id: newUser.id },
          include: {
            roles: true,
            customers: true
          }
        });
        
        console.log('✅ [customerLoginWithOTP] User loaded with relations:', {
          id: userWithRelations.id,
          has_role: !!userWithRelations.roles,
          has_customer: !!userWithRelations.customers
        });
        
        return userWithRelations;
      });
      
      console.log('✅ [customerLoginWithOTP] Transaction completed');
    }
    
    console.log('🔐 [customerLoginWithOTP] Checking user role...');

    console.log('🔐 [customerLoginWithOTP] Checking user role...');

    // Check if user is customer role
    if (user.role_id !== 3) {
      console.log('❌ [customerLoginWithOTP] User is not a customer, role_id:', user.role_id);
      return {
        success: false,
        error: 'Tài khoản này không phải là khách hàng. Vui lòng đăng nhập bằng username và password',
        status: 403
      };
    }
    
    console.log('✅ [customerLoginWithOTP] User is customer, updating last login...');

    // Update last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    
    console.log('✅ [customerLoginWithOTP] Last login updated');

    // ✅ FIX: Ensure role_name is always 'customer' for customer accounts
    // và customer_id luôn có giá trị
    const roleName = user.roles?.role_name || 'customer';
    const customerId = user.customers?.id;
    
    console.log('🏷️ [customerLoginWithOTP] Role info:', { roleName, customerId, has_roles: !!user.roles });

    // ✅ FIX: Nếu không có customer record, tạo một cái
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      console.log('➕ [customerLoginWithOTP] Creating missing customer record...');
      const newCustomer = await prisma.customers.create({
        data: {
          user_id: user.id
        }
      });
      finalCustomerId = newCustomer.id;
      console.log('✅ [customerLoginWithOTP] Customer record created with ID:', finalCustomerId);

      // Reload user để có customer data
      user = await prisma.users.findUnique({
        where: { id: user.id },
        include: {
          roles: true,
          customers: true
        }
      });
      console.log('✅ [customerLoginWithOTP] User reloaded with customer data');
    }
    
    console.log('🎟️ [customerLoginWithOTP] Generating tokens...');

    // Generate tokens với đầy đủ thông tin
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_name: roleName,           // ✅ Luôn có giá trị 'customer'
      customer_id: finalCustomerId   // ✅ Luôn có giá trị
    });

    const refreshToken = generateRefreshToken({
      userId: user.id
    });
    
    console.log('✅ [customerLoginWithOTP] Tokens generated successfully');

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;
    
    console.log('🎉 [customerLoginWithOTP] Login successful!');

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          ...userWithoutPassword,
          role_name: roleName,        // ✅ Thêm role_name vào response
          customer_id: finalCustomerId // ✅ Thêm customer_id vào response
        },
        token,
        refreshToken,
        isNewAccount
      }
    };
  } catch (error) {
    console.error('💥 [customerLoginWithOTP] Error:', error);
    console.error('💥 [customerLoginWithOTP] Stack:', error.stack);
    return {
      success: false,
      error: 'Lỗi khi đăng nhập',
      status: 500
    };
  }
};

