import bcrypt from 'bcrypt';
import prisma from '../config/db.js';

const validateUserData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {
    if (!data.username?.trim()) {
      errors.push('Tên đăng nhập là bắt buộc');
    }

    if (!data.password) {
      errors.push('Mật khẩu là bắt buộc');
    }
  }

  if (data.password && data.password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Email không hợp lệ');
    }
  } else if (!isUpdate) {
    errors.push('Email là bắt buộc');
  }

  if (data.phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }
  }

  if (data.role_id === undefined && !isUpdate) {
    errors.push('Vai trò là bắt buộc');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

const canDeleteUser = async (id) => {
  const [orders, logs] = await Promise.all([
    prisma.orders.count({ where: { user_id: Number(id) } }),
    prisma.logs.count({ where: { user_id: Number(id) } })
  ]);
  
  return orders === 0 && logs === 0;
};

export const getAllUsers = async ({
  page = 1,
  limit = 10,
  search,
  role,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) => {
  try {
    const where = {
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { full_name: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { 
        role: { name: { equals: role, mode: 'insensitive' } }
      })
    };

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          role: true,
          customers: true
        },
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.users.count({ where })
    ]);

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi lấy danh sách người dùng',
      status: 500
    };
  }
};

export const getUserById = async (id) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(id) },
      include: {
        role: true,
        customers: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'Không tìm thấy người dùng',
        status: 404
      };
    }

    return {
      success: true,
      data: user
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi lấy thông tin người dùng',
      status: 500
    };
  }
};

export const createUser = async (data) => {
  try {
    const validation = validateUserData(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        status: 400
      };
    }

    // Check unique constraints
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          { phone: data.phone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return {
          success: false,
          error: 'Tên đăng nhập đã tồn tại',
          status: 409
        };
      }
      if (existingUser.email === data.email) {
        return {
          success: false,
          error: 'Email đã tồn tại',
          status: 409
        };
      }
      if (existingUser.phone === data.phone) {
        return {
          success: false,
          error: 'Số điện thoại đã tồn tại',
          status: 409
        };
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.users.create({
      data: {
        username: data.username.trim(),
        email: data.email.trim(),
        password_hash: hashedPassword,
        phone: data.phone,
        role_id: Number(data.role_id),
        full_name: data.full_name?.trim(),
        avatar_url: data.avatar_url?.trim()
      },
      include: {
        role: true
      }
    });

    // Omit password_hash from response
    const { password_hash, ...userWithoutPassword } = user;
    return {
      success: true,
      data: userWithoutPassword
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi tạo người dùng mới',
      status: 500
    };
  }
};

export const updateUser = async (id, data) => {
  try {
    const existingUser = await prisma.users.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'Không tìm thấy người dùng',
        status: 404
      };
    }

    const validation = validateUserData(data, true);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        status: 400
      };
    }

    // Check unique constraints for email and phone
    if (data.email !== existingUser.email || data.phone !== existingUser.phone) {
      const duplicateCheck = await prisma.users.findFirst({
        where: {
          OR: [
            { email: data.email },
            { phone: data.phone }
          ],
          id: { not: Number(id) }
        }
      });

      if (duplicateCheck) {
        if (duplicateCheck.email === data.email) {
          return {
            success: false,
            error: 'Email đã tồn tại',
            status: 409
          };
        }
        if (duplicateCheck.phone === data.phone) {
          return {
            success: false,
            error: 'Số điện thoại đã tồn tại',
            status: 409
          };
        }
      }
    }

    const updateData = {
      ...(data.email && { email: data.email.trim() }),
      ...(data.phone && { phone: data.phone }),
      ...(data.full_name && { full_name: data.full_name.trim() }),
      ...(data.role_id && { role_id: Number(data.role_id) }),
      ...(data.avatar_url && { avatar_url: data.avatar_url.trim() })
    };

    // Update password if provided
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(data.password, salt);
    }

    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        role: true
      }
    });

    // Omit password_hash from response
    const { password_hash, ...userWithoutPassword } = updatedUser;
    return {
      success: true,
      data: userWithoutPassword
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi cập nhật thông tin người dùng',
      status: 500
    };
  }
};

export const deleteUser = async (id) => {
  try {
    const existingUser = await prisma.users.findUnique({
      where: { id: Number(id) },
      include: {
        role: true
      }
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'Không tìm thấy người dùng',
        status: 404
      };
    }

    const canDelete = await canDeleteUser(id);
    if (!canDelete) {
      return {
        success: false,
        error: 'Không thể xóa người dùng này vì có liên kết với dữ liệu khác',
        status: 400
      };
    }

    const deletedUser = await prisma.users.delete({
      where: { id: Number(id) },
      include: {
        role: true
      }
    });

    // Omit password_hash from response
    const { password_hash, ...userWithoutPassword } = deletedUser;
    return {
      success: true,
      data: userWithoutPassword
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi xóa người dùng',
      status: 500
    };
  }
};