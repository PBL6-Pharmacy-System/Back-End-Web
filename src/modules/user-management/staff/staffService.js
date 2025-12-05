import prisma from '../../../config/db.js';
import { hashPassword } from '../../../utils/helpers.js';
import { validateRequiredFields } from '../../../utils/validation.js';

// Validate staff data
const validateStaffData = (data, isUpdate = false) => {
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

  return { isValid: true };
};

// Get all staff
export const getAllStaff = async ({ branchId, page = 1, limit = 10, isActive }) => {
  try {
    const where = {};
    if (branchId) where.branch_id = Number(branchId);
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              full_name: true,
              is_active: true,
              roles: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          },
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.staff.count({ where })
    ]);

    return {
      success: true,
      data: {
        staff,
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

// Get staff by ID
export const getStaffById = async (id) => {
  try {
    const staff = await prisma.staff.findUnique({
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
            roles: {
              select: {
                id: true,
                role_name: true
              }
            }
          }
        },
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!staff) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy nhân viên'
      };
    }

    return {
      success: true,
      data: staff
    };
  } catch (error) {
    throw error;
  }
};

// Create staff
export const createStaff = async (data) => {
  try {
    // Validate data
    const validation = validateStaffData(data);
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

    // Get staff role
    const staffRole = await prisma.roles.findUnique({
      where: { role_name: 'staff' }
    });

    if (!staffRole) {
      return {
        success: false,
        status: 500,
        error: 'Không tìm thấy role staff'
      };
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create user and staff in transaction
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
          role_id: staffRole.id,
          is_active: true,
          is_verified: true
        }
      });

      // Create staff
      const staff = await tx.staff.create({
        data: {
          user_id: user.id,
          employee_id: data.employee_id,
          branch_id: data.branch_id ? Number(data.branch_id) : null,
          position: data.position,
          department: data.department,
          hire_date: data.hire_date ? new Date(data.hire_date) : null,
          hometown: data.hometown,
          id_number: data.id_number,
          emergency_contact: data.emergency_contact,
          emergency_name: data.emergency_name,
          salary: data.salary ? parseFloat(data.salary) : null,
          bank_account: data.bank_account,
          bank_name: data.bank_name,
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
              roles: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          },
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });

      return staff;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

// Update staff
export const updateStaff = async (id, data) => {
  try {
    // Check if staff exists
    const existing = await prisma.staff.findUnique({
      where: { id: Number(id) },
      include: { users: true }
    });

    if (!existing) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy nhân viên'
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

      // Update staff
      const staff = await tx.staff.update({
        where: { id: Number(id) },
        data: {
          ...(data.employee_id && { employee_id: data.employee_id }),
          ...(data.branch_id !== undefined && { branch_id: data.branch_id ? Number(data.branch_id) : null }),
          ...(data.position && { position: data.position }),
          ...(data.department && { department: data.department }),
          ...(data.hire_date && { hire_date: new Date(data.hire_date) }),
          ...(data.hometown && { hometown: data.hometown }),
          ...(data.id_number && { id_number: data.id_number }),
          ...(data.emergency_contact && { emergency_contact: data.emergency_contact }),
          ...(data.emergency_name && { emergency_name: data.emergency_name }),
          ...(data.salary !== undefined && { salary: data.salary ? parseFloat(data.salary) : null }),
          ...(data.bank_account && { bank_account: data.bank_account }),
          ...(data.bank_name && { bank_name: data.bank_name }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.is_active !== undefined && { is_active: data.is_active })
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
              roles: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          },
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });

      return staff;
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

// Delete staff
export const deleteStaff = async (id) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: Number(id) }
    });

    if (!staff) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy nhân viên'
      };
    }

    // Delete staff (cascade will delete user)
    await prisma.staff.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Đã xóa nhân viên thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Get staff by branch
export const getStaffByBranch = async (branchId) => {
  try {
    const staff = await prisma.staff.findMany({
      where: {
        branch_id: Number(branchId),
        is_active: true
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            full_name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      data: staff
    };
  } catch (error) {
    throw error;
  }
};
