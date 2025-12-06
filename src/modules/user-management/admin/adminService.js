import prisma from '../../../config/db.js';
import { hashPassword } from '../../../utils/helpers.js';
import { validateRequiredFields } from '../../../utils/validation.js';

// Validate admin data
const validateAdminData = (data, isUpdate = false) => {
  const requiredFields = isUpdate ? [] : ['username', 'email', 'password', 'full_name'];
  const missingFields = validateRequiredFields(data, requiredFields);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
    };
  }

  // Validate email format
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return {
      isValid: false,
      error: 'Email không hợp lệ'
    };
  }

  // Validate admin level
  if (data.admin_level && (data.admin_level < 1 || data.admin_level > 5)) {
    return {
      isValid: false,
      error: 'Admin level phải từ 1 đến 5'
    };
  }

  return { isValid: true };
};

// Get all admins
export const getAllAdmins = async ({ page = 1, limit = 10 }) => {
  try {
    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              full_name: true,
              is_active: true,
              rolepermissions: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          }
        },
        orderBy: {
          admin_level: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.admin.count()
    ]);

    return {
      success: true,
      data: {
        admins,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get admin by ID
export const getAdminById = async (id) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            full_name: true,
            avatar_url: true,
            is_active: true,
            created_at: true,
            last_login: true,
            rolepermissions: {
              select: {
                id: true,
                role_name: true
              }
            }
          }
        }
      }
    });

    if (!admin) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy admin'
      };
    }

    return {
      success: true,
      data: admin
    };
  } catch (error) {
    throw error;
  }
};

// Create admin
export const createAdmin = async (data) => {
  try {
    // Validate data
    const validation = validateAdminData(data);
    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Check if username or email already exists
    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : [])
        ]
      }
    });

    if (existing) {
      return {
        success: false,
        status: 409,
        error: 'Username, email hoặc số điện thoại đã tồn tại'
      };
    }

    // Get admin role
    const adminRole = await prisma.roles.findUnique({
      where: { role_name: 'admin' }
    });

    if (!adminRole) {
      return {
        success: false,
        status: 500,
        error: 'Không tìm thấy role admin'
      };
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create user and admin in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.users.create({
        data: {
          username: data.username,
          email: data.email,
          phone: data.phone,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          password_hash,
          role_id: adminRole.id,
          is_active: true,
          is_verified: true
        }
      });

      // Create admin
      const admin = await tx.admin.create({
        data: {
          user_id: user.id,
          admin_level: data.admin_level || 1,
          permissions: data.permissions || {},
          is_super_admin: data.is_super_admin || false,
          notes: data.notes
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              full_name: true,
              avatar_url: true,
              rolepermissions: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          }
        }
      });

      return admin;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

// Update admin
export const updateAdmin = async (id, data) => {
  try {
    // Check if admin exists
    const existing = await prisma.admin.findUnique({
      where: { id: Number(id) },
      include: { users: true }
    });

    if (!existing) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy admin'
      };
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if user fields provided
      if (data.email || data.phone || data.full_name || data.avatar_url) {
        // Check for unique constraints
        if (data.email || data.phone) {
          const duplicate = await tx.users.findFirst({
            where: {
              AND: [
                { id: { not: existing.user_id } },
                {
                  OR: [
                    ...(data.email ? [{ email: data.email }] : []),
                    ...(data.phone ? [{ phone: data.phone }] : [])
                  ]
                }
              ]
            }
          });

          if (duplicate) {
            throw new Error('Email hoặc số điện thoại đã tồn tại');
          }
        }

        await tx.users.update({
          where: { id: existing.user_id },
          data: {
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
            ...(data.full_name && { full_name: data.full_name }),
            ...(data.avatar_url && { avatar_url: data.avatar_url }),
            ...(data.is_active !== undefined && { is_active: data.is_active })
          }
        });
      }

      // Update admin
      const admin = await tx.admin.update({
        where: { id: Number(id) },
        data: {
          ...(data.admin_level && { admin_level: Number(data.admin_level) }),
          ...(data.permissions && { permissions: data.permissions }),
          ...(data.is_super_admin !== undefined && { is_super_admin: data.is_super_admin }),
          ...(data.notes !== undefined && { notes: data.notes }),
          last_activity: new Date()
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              full_name: true,
              avatar_url: true,
              is_active: true,
              rolepermissions: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          }
        }
      });

      return admin;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error.message === 'Email hoặc số điện thoại đã tồn tại') {
      return {
        success: false,
        status: 409,
        error: error.message
      };
    }
    throw error;
  }
};

// Delete admin
export const deleteAdmin = async (id) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(id) }
    });

    if (!admin) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy admin'
      };
    }

    // Check if super admin
    if (admin.is_super_admin) {
      return {
        success: false,
        status: 403,
        error: 'Không thể xóa super admin'
      };
    }

    // Delete admin (cascade will delete user)
    await prisma.admin.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Đã xóa admin thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Update admin permissions
export const updateAdminPermissions = async (id, permissions) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(id) }
    });

    if (!admin) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy admin'
      };
    }

    const updated = await prisma.admin.update({
      where: { id: Number(id) },
      data: {
        permissions,
        last_activity: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true
          }
        }
      }
    });

    return {
      success: true,
      data: updated
    };
  } catch (error) {
    throw error;
  }
};
