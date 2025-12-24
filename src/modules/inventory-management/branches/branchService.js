import prisma from '../../../config/db.js';
import { validateRequiredFields } from '../../../utils/validation.js';

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
          include: { products: true }
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

    // Nếu include inventory, thêm các thống kê
    if (includeInventory && branch.branchinventory) {
      const totalProducts = branch.branchinventory.length;
      const totalStock = branch.branchinventory.reduce((sum, item) => sum + (item.stock || 0), 0);
      const lowStockCount = branch.branchinventory.filter(item => 
        item.min_stock && item.stock !== null && item.stock < item.min_stock
      ).length;

      branch.stats = {
        totalProducts,
        totalStock,
        lowStockCount
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
    if (error.code === 'P2025') {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }
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
  const [hasInventory, hasShipments] = await Promise.all([
    prisma.branchinventory.findFirst({
      where: { branch_id: Number(id) }
    }),
    prisma.shipments.findFirst({
      where: { branch_id: Number(id) }
    })
  ]);

  return !hasInventory && !hasShipments;
};

/**
 * Get branch inventory details with batches
 * Theo IMPLEMENT_PLAN.md: GET /branches/:branchId/inventory/details?productId=xyz
 * Use Case: Kiểm tra sản phẩm X tại chi nhánh có những lô nào, số lượng mỗi lô
 */
export const getBranchInventoryDetails = async (branchId, productId) => {
  try {
    // Kiểm tra chi nhánh và sản phẩm có tồn tại không
    const [branch, product] = await Promise.all([
      prisma.branches.findUnique({
        where: { id: Number(branchId) }
      }),
      prisma.products.findUnique({
        where: { id: Number(productId) }
      })
    ]);

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }

    // Lấy tổng tồn kho từ branchinventory
    const inventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      }
    });

    // Lấy chi tiết các lô hàng (FEFO - First Expired First Out)
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId),
        status: 'active'
      },
      orderBy: {
        expiry_date: 'asc' // ✅ FEFO: Lô hết hạn trước lên đầu
      },
      include: {
        suppliers: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url
        },
        total_stock: inventory?.stock || 0,
        last_updated: inventory?.last_updated,
        batches: batches.map(batch => ({
          id: batch.id,
          batch_number: batch.batch_number,
          quantity: batch.quantity,
          manufacture_date: batch.manufacture_date,
          expiry_date: batch.expiry_date,
          cost_price: batch.cost_price,
          selling_price: batch.selling_price,
          status: batch.status,
          supplier: batch.suppliers,
          note: batch.note,
          created_at: batch.created_at
        })),
        summary: {
          total_batches: batches.length,
          total_stock: inventory?.stock || 0,
          expiring_soon: batches.filter(b => {
            if (!b.expiry_date) return false;
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return new Date(b.expiry_date) <= thirtyDaysFromNow;
          }).length
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get batches expiring soon for a specific branch
 * Use Case: Chi nhánh xem các lô hàng sắp hết hạn của mình để xử lý
 */
export const getBranchExpiringSoonBatches = async (branchId, days = 30) => {
  try {
    // Kiểm tra chi nhánh có tồn tại không
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branchId) }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy chi nhánh'
      };
    }

    // Calculate date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    // Lấy các lô hàng sắp hết hạn
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: Number(branchId),
        status: 'active',
        expiry_date: {
          gte: now,        // Chưa hết hạn
          lte: futureDate  // Sẽ hết hạn trong X ngày
        }
      },
      orderBy: {
        expiry_date: 'asc' // Sắp hết hạn nhất lên đầu
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true
          }
        },
        suppliers: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Tính số ngày còn lại cho mỗi lô
    const batchesWithDaysLeft = batches.map(batch => {
      const daysLeft = Math.ceil(
        (new Date(batch.expiry_date) - now) / (1000 * 60 * 60 * 24)
      );

      return {
        id: batch.id,
        batch_number: batch.batch_number,
        product_id: batch.product_id,
        product: batch.products,
        quantity: batch.quantity,
        expiry_date: batch.expiry_date,
        days_until_expiry: daysLeft,
        urgency: daysLeft <= 7 ? 'critical' : daysLeft <= 15 ? 'high' : 'medium',
        cost_price: batch.cost_price,
        supplier: batch.suppliers,
        note: batch.note
      };
    });

    // Group by urgency
    const summary = {
      critical: batchesWithDaysLeft.filter(b => b.urgency === 'critical').length,
      high: batchesWithDaysLeft.filter(b => b.urgency === 'high').length,
      medium: batchesWithDaysLeft.filter(b => b.urgency === 'medium').length,
      total: batchesWithDaysLeft.length
    };

    return {
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address
        },
        expiring_within_days: days,
        batches: batchesWithDaysLeft,
        summary
      }
    };
  } catch (error) {
    throw error;
  }
};