import prisma from '../../../config/db.js';
import { validateNumericFields, validateRequiredFields } from '../../../utils/validation.js';

// Validate inventory data
const validateInventoryData = (data) => {
  // Required fields
  const requiredFields = ['branch_id', 'product_id'];
  const missingFields = validateRequiredFields(data, requiredFields);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
    };
  }

  // Validate numeric fields
  const numericFields = ['branch_id', 'product_id', 'stock', 'min_stock', 'max_stock'];
  const invalidNumbers = validateNumericFields(data, numericFields);
  if (invalidNumbers.length > 0) {
    return {
      isValid: false,
      error: `Các trường sau phải là số hợp lệ: ${invalidNumbers.join(', ')}`
    };
  }

  // Validate stock limits
  if (data.min_stock !== undefined && data.max_stock !== undefined) {
    if (Number(data.min_stock) >= Number(data.max_stock)) {
      return {
        isValid: false,
        error: 'Tồn kho tối thiểu phải nhỏ hơn tồn kho tối đa'
      };
    }
  }

  // Validate stock value
  if (data.stock !== undefined && data.stock < 0) {
    return {
      isValid: false,
      error: 'Số lượng tồn kho không được âm'
    };
  }

  return { isValid: true };
};

// Get all branch inventory with filtering and pagination
export const getAllBranchInventory = async ({
  branchId,
  productId,
  page = 1,
  limit = 10,
  sortBy = 'id',
  sortOrder = 'asc'
}) => {
  try {
    const where = {};
    if (branchId) where.branch_id = Number(branchId);
    if (productId) where.product_id = Number(productId);

    const [inventory, total] = await Promise.all([
      prisma.branchinventory.findMany({
        where,
        include: {
          branches: true,
          products: {
            include: {
              unittype: true,
              productunits: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.branchinventory.count({ where })
    ]);

    return {
      success: true,
      data: {
        inventory,
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

// Get inventory by ID
export const getBranchInventoryById = async (id) => {
  try {
    const inventory = await prisma.branchinventory.findUnique({
      where: { id: Number(id) },
      include: {
        branches: true,
        products: {
          include: {
            unittype: true,
            productunits: true
          }
        }
      }
    });

    if (!inventory) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy tồn kho'
      };
    }

    return {
      success: true,
      data: inventory
    };
  } catch (error) {
    throw error;
  }
};

// Create new inventory
export const createBranchInventory = async (data) => {
  try {
    // Validate data
    const validation = validateInventoryData(data);
    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Check if branch and product exist
    const [branch, product] = await Promise.all([
      prisma.branches.findUnique({
        where: { id: Number(data.branch_id) }
      }),
      prisma.products.findUnique({
        where: { id: Number(data.product_id) }
      })
    ]);

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    // Check if inventory already exists
    const exists = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(data.branch_id),
        product_id: Number(data.product_id)
      }
    });

    if (exists) {
      return {
        success: false,
        status: 409,
        error: 'Tồn kho đã tồn tại'
      };
    }

    const inventory = await prisma.branchinventory.create({
      data: {
        branch_id: Number(data.branch_id),
        product_id: Number(data.product_id),
        stock: data.stock ? Number(data.stock) : 0,
        min_stock: data.min_stock ? Number(data.min_stock) : null,
        max_stock: data.max_stock ? Number(data.max_stock) : null,
        last_updated: new Date()
      },
      include: {
        branch: true,
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    return {
      success: true,
      data: inventory
    };
  } catch (error) {
    throw error;
  }
};

// Update inventory
export const updateBranchInventory = async (id, data) => {
  try {
    // Check if inventory exists
    const existingInventory = await prisma.branchInventory.findUnique({
      where: { id: Number(id) }
    });

    if (!existingInventory) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy tồn kho'
      };
    }

    // Validate stock value
    if (data.stock !== undefined && data.stock < 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng tồn kho không được âm'
      };
    }

    // Validate stock limits
    if (data.min_stock !== undefined && data.max_stock !== undefined) {
      if (Number(data.min_stock) >= Number(data.max_stock)) {
        return {
          success: false,
          status: 400,
          error: 'Tồn kho tối thiểu phải nhỏ hơn tồn kho tối đa'
        };
      }
    }

    const inventory = await prisma.branchInventory.update({
      where: { id: Number(id) },
      data: {
        stock: data.stock ? Number(data.stock) : undefined,
        min_stock: data.min_stock ? Number(data.min_stock) : undefined,
        max_stock: data.max_stock ? Number(data.max_stock) : undefined,
        last_updated: new Date()
      },
      include: {
        branch: true,
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    return {
      success: true,
      data: inventory
    };
  } catch (error) {
    throw error;
  }
};

// Delete inventory
export const deleteBranchInventory = async (id) => {
  try {
    // Check if inventory exists
    const inventory = await prisma.branchInventory.findUnique({
      where: { id: Number(id) }
    });

    if (!inventory) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy tồn kho'
      };
    }

    // Check if inventory has movements
    const hasMovements = await prisma.inventoryLog.findFirst({
      where: {
        branch_id: inventory.branch_id,
        product_id: inventory.product_id
      }
    });

    if (hasMovements) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa tồn kho đã có giao dịch'
      };
    }

    const deleted = await prisma.branchInventory.delete({
      where: { id: Number(id) },
      include: {
        branch: true,
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    return {
      success: true,
      data: deleted,
      message: 'Đã xóa tồn kho thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Import stock to branch inventory
export const importToBranchInventory = async (data) => {
  try {
    const { branch_id, product_id, quantity, unit_id, note } = data;

    // Validate required fields
    const requiredFields = ['branch_id', 'product_id', 'quantity'];
    const missingFields = validateRequiredFields(data, requiredFields);
    if (missingFields.length > 0) {
      return {
        success: false,
        status: 400,
        error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
      };
    }

    // Validate quantity
    if (Number(quantity) <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng nhập phải lớn hơn 0'
      };
    }

    // Check if branch and product exist
    const [branch, product] = await Promise.all([
      prisma.branches.findUnique({
        where: { id: Number(branch_id) }
      }),
      prisma.products.findUnique({
        where: { id: Number(product_id) }
      })
    ]);

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    // Get current inventory
    const inventory = await prisma.branchInventory.findFirst({
      where: {
        branch_id: Number(branch_id),
        product_id: Number(product_id)
      },
      include: {
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    // Check max stock limit
    if (inventory && inventory.max_stock) {
      const newStock = inventory.stock + Number(quantity);
      if (newStock > inventory.max_stock) {
        return {
          success: false,
          status: 400,
          error: 'Số lượng nhập vượt quá giới hạn tối đa của kho'
        };
      }
    }

    // Create inventory log
    await prisma.inventoryLog.create({
      data: {
        branch_id: Number(branch_id),
        product_id: Number(product_id),
        quantity: Number(quantity),
        type: 'IMPORT',
        unit_id: unit_id ? Number(unit_id) : undefined,
        date: new Date(),
        note: note || 'Nhập kho'
      }
    });

    // Update or create inventory
    const updatedInventory = inventory 
      ? await prisma.branchInventory.update({
          where: { id: inventory.id },
          data: {
            stock: {
              increment: Number(quantity)
            },
            last_updated: new Date()
          },
          include: {
            branch: true,
            product: {
              include: {
                baseUnit: true,
                productUnits: true
              }
            }
          }
        })
      : await prisma.branchInventory.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            stock: Number(quantity),
            last_updated: new Date()
          },
          include: {
            branch: true,
            product: {
              include: {
                baseUnit: true,
                productUnits: true
              }
            }
          }
        });

    return {
      success: true,
      data: updatedInventory
    };
  } catch (error) {
    throw error;
  }
};

// Export stock from branch inventory
export const exportFromBranchInventory = async (data) => {
  try {
    const { branch_id, product_id, quantity, unit_id, note } = data;

    // Validate required fields
    const requiredFields = ['branch_id', 'product_id', 'quantity'];
    const missingFields = validateRequiredFields(data, requiredFields);
    if (missingFields.length > 0) {
      return {
        success: false,
        status: 400,
        error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
      };
    }

    // Validate quantity
    if (Number(quantity) <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng xuất phải lớn hơn 0'
      };
    }

    // Get current inventory
    const inventory = await prisma.branchInventory.findFirst({
      where: {
        branch_id: Number(branch_id),
        product_id: Number(product_id)
      }
    });

    if (!inventory || inventory.stock < quantity) {
      return {
        success: false,
        status: 400,
        error: 'Không đủ hàng trong kho'
      };
    }

    // Check min stock limit
    if (inventory.min_stock) {
      const newStock = inventory.stock - Number(quantity);
      if (newStock < inventory.min_stock) {
        return {
          success: false,
          status: 400,
          error: 'Số lượng xuất khiến tồn kho xuống dưới mức tối thiểu'
        };
      }
    }

    // Create inventory log
    await prisma.inventoryLog.create({
      data: {
        branch_id: Number(branch_id),
        product_id: Number(product_id),
        quantity: Number(quantity),
        type: 'EXPORT',
        unit_id: unit_id ? Number(unit_id) : undefined,
        date: new Date(),
        note: note || 'Xuất kho'
      }
    });

    // Update inventory
    const updatedInventory = await prisma.branchInventory.update({
      where: { id: inventory.id },
      data: {
        stock: {
          decrement: Number(quantity)
        },
        last_updated: new Date()
      },
      include: {
        branch: true,
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedInventory
    };
  } catch (error) {
    throw error;
  }
};

// Get stock of a product in a branch
export const getBranchProductStock = async (branchId, productId) => {
  try {
    if (!branchId || !productId) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin chi nhánh hoặc sản phẩm'
      };
    }

    const inventory = await prisma.branchInventory.findFirst({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      },
      include: {
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        stock: inventory ? inventory.stock : 0,
        inventory
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get low stock products in a branch
export const getLowStockProducts = async (branchId) => {
  try {
    if (!branchId) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin chi nhánh'
      };
    }

    const products = await prisma.branchInventory.findMany({
      where: {
        branch_id: Number(branchId),
        stock: {
          lte: prisma.branchInventory.fields.min_stock
        }
      },
      include: {
        branch: true,
        product: {
          include: {
            baseUnit: true,
            productUnits: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    return {
      success: true,
      data: products
    };
  } catch (error) {
    throw error;
  }
};

// Get inventory logs with filtering
export const getInventoryLogs = async ({
  branchId,
  startDate,
  endDate,
  type,
  productId,
  page = 1,
  limit = 10
}) => {
  try {
    const where = {};

    if (branchId) {
      where.branch_id = Number(branchId);
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (type) {
      where.type = type;
    }

    if (productId) {
      where.product_id = Number(productId);
    }

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: {
          branch: true,
          product: true,
          unit: true
        },
        orderBy: {
          date: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryLog.count({ where })
    ]);

    return {
      success: true,
      data: {
        logs,
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