import { PrismaClient } from '@prisma/client';
import { validateRequiredFields } from '../utils/validation.js';

const prisma = new PrismaClient();

// Validate branch data
const validateBranchData = (data) => {
  // Required fields
  const requiredFields = ['name', 'address', 'phone'];
  const missingFields = validateRequiredFields(data, requiredFields);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
    };
  }

  // Validate name length
  if (data.name.length > 100) {
    return {
      isValid: false,
      error: 'Tên chi nhánh không được vượt quá 100 ký tự'
    };
  }

  // Validate address length
  if (data.address.length > 200) {
    return {
      isValid: false,
      error: 'Địa chỉ không được vượt quá 200 ký tự'
    };
  }

  // Validate phone format
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(data.phone)) {
    return {
      isValid: false,
      error: 'Số điện thoại không hợp lệ'
    };
  }

  // Validate email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        isValid: false,
        error: 'Email không hợp lệ'
      };
    }
  }

  return { isValid: true };
};

// Get all branches with filters and pagination
export const getAllBranches = async ({
  search,
  active,
  hasInventory,
  page = 1,
  limit = 10,
  sortBy = 'id',
  sortOrder = 'asc',
  includeInventory = false
}) => {
  try {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (active !== undefined) {
      where.is_active = active;
    }

    if (hasInventory !== undefined) {
      where.branchinventory = hasInventory ? {
        some: {
          stock: { gt: 0 }
        }
      } : {
        none: {}
      };
    }

    const [branches, total] = await Promise.all([
      prisma.branches.findMany({
        where,
        include: includeInventory ? {
          branchinventory: {
            include: { product: true }
          }
        } : undefined,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.branches.count({ where })
    ]);

    return {
      success: true,
      data: {
        branches,
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

// Get branch by ID
export const getBranchById = async (id, includeInventory = false) => {
  try {
    const branch = await prisma.branches.findUnique({
      where: { id: Number(id) },
      include: includeInventory ? {
        branchinventory: {
          include: { product: true }
        }
      } : undefined
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    return {
      success: true,
      data: branch
    };
  } catch (error) {
    throw error;
  }
};

// Create new branch
export const createBranch = async (data) => {
  try {
    // Validate data
    const validation = validateBranchData(data);
    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Check for existing branch with same name
    const exists = await findBranchByName(data.name.trim());
    if (exists) {
      return {
        success: false,
        status: 409,
        error: 'Chi nhánh với tên này đã tồn tại'
      };
    }

    const branch = await prisma.branches.create({
      data: {
        name: data.name.trim(),
        address: data.address.trim(),
        phone: data.phone,
        email: data.email?.trim(),
        is_active: data.is_active ?? true
      }
    });

    return {
      success: true,
      data: branch
    };
  } catch (error) {
    throw error;
  }
};

// Update branch
export const updateBranch = async (id, data) => {
  try {
    // Check if branch exists
    const existingBranch = await prisma.branches.findUnique({
      where: { id: Number(id) }
    });

    if (!existingBranch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    // Validate name length if provided
    if (data.name && data.name.length > 100) {
      return {
        success: false,
        status: 400,
        error: 'Tên chi nhánh không được vượt quá 100 ký tự'
      };
    }

    // Validate address length if provided
    if (data.address && data.address.length > 200) {
      return {
        success: false,
        status: 400,
        error: 'Địa chỉ không được vượt quá 200 ký tự'
      };
    }

    // Validate phone format if provided
    if (data.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(data.phone)) {
        return {
          success: false,
          status: 400,
          error: 'Số điện thoại không hợp lệ'
        };
      }
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          status: 400,
          error: 'Email không hợp lệ'
        };
      }
    }

    // Check name uniqueness if being changed
    if (data.name && data.name !== existingBranch.name) {
      const exists = await findBranchByName(data.name.trim());
      if (exists) {
        return {
          success: false,
          status: 409,
          error: 'Chi nhánh với tên này đã tồn tại'
        };
      }
    }

    // Check if branch can be deactivated
    if (data.is_active === false && existingBranch.is_active) {
      const hasActiveInventory = await prisma.branchInventory.findFirst({
        where: {
          branch_id: Number(id),
          stock: { gt: 0 }
        }
      });

      if (hasActiveInventory) {
        return {
          success: false,
          status: 400,
          error: 'Không thể vô hiệu hóa chi nhánh còn hàng tồn kho'
        };
      }
    }

    const branch = await prisma.branches.update({
      where: { id: Number(id) },
      data: {
        name: data.name?.trim(),
        address: data.address?.trim(),
        phone: data.phone,
        email: data.email?.trim(),
        is_active: data.is_active
      }
    });

    return {
      success: true,
      data: branch
    };
  } catch (error) {
    throw error;
  }
};

// Delete branch
export const deleteBranch = async (id) => {
  try {
    // Check if branch exists
    const branch = await prisma.branches.findUnique({
      where: { id: Number(id) }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    // Check if branch can be deleted
    const canDelete = await canDeleteBranch(id);
    if (!canDelete) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa chi nhánh có tồn kho hoặc đơn hàng'
      };
    }

    const deleted = await prisma.branches.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      data: deleted,
      message: 'Đã xóa chi nhánh thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Find branch by name
export const findBranchByName = async (name) => {
  return prisma.branches.findFirst({ 
    where: { 
      name: {
        equals: name.trim(),
        mode: 'insensitive'
      }
    } 
  });
};

// Check if branch can be deleted
export const canDeleteBranch = async (id) => {
  const [hasInventory, hasShipments, hasOrders] = await Promise.all([
    prisma.branchInventory.findFirst({ 
      where: { branch_id: Number(id) } 
    }),
    prisma.shipments.findFirst({ 
      where: { branch_id: Number(id) } 
    }),
    prisma.orders.findFirst({
      where: { branch_id: Number(id) }
    })
  ]);

  return !hasInventory && !hasShipments && !hasOrders;
};