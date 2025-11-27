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
        branches: true,
        products: {
          include: {
            unittype: true,
            productunits: true
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
    const existingInventory = await prisma.branchinventory.findUnique({
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

    const inventory = await prisma.branchinventory.update({
      where: { id: Number(id) },
      data: {
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
        min_stock: data.min_stock !== undefined ? Number(data.min_stock) : undefined,
        max_stock: data.max_stock !== undefined ? Number(data.max_stock) : undefined,
        last_updated: new Date()
      },
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
    const inventory = await prisma.branchinventory.findUnique({
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

    const deleted = await prisma.branchinventory.delete({
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
// ⚠️ UPDATED: Tự động tạo batch để đảm bảo đồng bộ inventory và batch tracking
export const importToBranchInventory = async (data, userId = null) => {
  try {
    const {
      branch_id,
      product_id,
      quantity,
      unit_id,
      note,
      // Batch information (optional - if not provided, auto-generate)
      batch_number,
      manufacture_date,
      expiry_date,
      cost_price,
      selling_price,
      supplier_id,
      // Flag to skip batch creation (for legacy compatibility)
      skip_batch = false
    } = data;

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
    const inventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(branch_id),
        product_id: Number(product_id)
      },
      include: {
        products: {
          include: {
            unittype: true,
            productunits: true
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
          error: `Số lượng nhập vượt quá giới hạn tối đa của kho. Tối đa: ${inventory.max_stock}, Hiện tại: ${inventory.stock}, Nhập: ${quantity}`
        };
      }
    }

    // Auto-generate batch number if not provided
    const finalBatchNumber = batch_number || await generateAutoBatchNumber(product_id, branch_id);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      let createdBatch = null;

      // ⚠️ IMPORTANT: Create batch for tracking (unless explicitly skipped)
      if (!skip_batch) {
        // Check if batch number already exists
        const existingBatch = await tx.productBatch.findFirst({
          where: {
            batch_number: finalBatchNumber,
            product_id: Number(product_id),
            branch_id: Number(branch_id)
          }
        });

        if (existingBatch) {
          // Add to existing batch
          createdBatch = await tx.productBatch.update({
            where: { id: existingBatch.id },
            data: {
              quantity: { increment: Number(quantity) },
              updated_at: new Date()
            }
          });
        } else {
          // Create new batch
          createdBatch = await tx.productBatch.create({
            data: {
              product_id: Number(product_id),
              branch_id: Number(branch_id),
              batch_number: finalBatchNumber,
              manufacture_date: manufacture_date ? new Date(manufacture_date) : null,
              expiry_date: expiry_date ? new Date(expiry_date) : null,
              quantity: Number(quantity),
              cost_price: cost_price ? Number(cost_price) : null,
              selling_price: selling_price ? Number(selling_price) : null,
              supplier_id: supplier_id ? Number(supplier_id) : null,
              status: 'active',
              note: note || 'Nhập kho tự động tạo batch'
            }
          });
        }
      }

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          branch_id: Number(branch_id),
          product_id: Number(product_id),
          batch_id: createdBatch?.id || null,
          quantity: Number(quantity),
          type: 'IMPORT',
          unit_id: unit_id ? Number(unit_id) : undefined,
          date: new Date(),
          note: note || `Nhập kho${createdBatch ? ` - Lô ${finalBatchNumber}` : ''}`,
          created_by: userId
        }
      });

      // Update or create inventory
      const updatedInventory = inventory
        ? await tx.branchinventory.update({
          where: { id: inventory.id },
          data: {
            stock: { increment: Number(quantity) },
            last_updated: new Date()
          },
          include: {
            branches: true,
            products: {
              include: {
                unittype: true,
                productunits: true
              }
            }
          }
        })
        : await tx.branchinventory.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            stock: Number(quantity),
            last_updated: new Date()
          },
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

      return {
        inventory: updatedInventory,
        batch: createdBatch
      };
    });

    return {
      success: true,
      data: result.inventory,
      batch: result.batch,
      message: result.batch
        ? `Đã nhập ${quantity} sản phẩm vào lô ${finalBatchNumber}`
        : `Đã nhập ${quantity} sản phẩm (không tạo lô)`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Auto-generate batch number
 */
const generateAutoBatchNumber = async (productId, branchId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `AUTO-${productId}-${branchId}-${dateStr}${timeStr}-${random}`;
};

// Export stock from branch inventory - UPDATED with FEFO support
// ✅ FIX #10: Sử dụng số dương cho quantity, thêm field 'direction' để phân biệt
export const exportFromBranchInventory = async (data, userId = null) => {
  try {
    const { branch_id, product_id, quantity, unit_id, note, use_fefo = true } = data;

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
    const inventory = await prisma.branchinventory.findFirst({
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

    // Check min stock limit (warning only, not blocking)
    let minStockWarning = null;
    if (inventory.min_stock) {
      const newStock = inventory.stock - Number(quantity);
      if (newStock < inventory.min_stock) {
        minStockWarning = `Cảnh báo: Tồn kho sẽ xuống dưới mức tối thiểu (${inventory.min_stock})`;
      }
    }

    // If FEFO is enabled, use batch-based export
    if (use_fefo) {
      return await exportWithFEFO({
        branch_id,
        product_id,
        quantity,
        unit_id,
        note,
        userId,
        minStockWarning
      });
    }

    // Legacy: Simple stock deduction (no batch tracking)
    const updatedInventory = await prisma.$transaction(async (tx) => {
      // ✅ FIX #10: Sử dụng số dương với type = 'EXPORT' thay vì số âm
      await tx.inventoryLog.create({
        data: {
          branch_id: Number(branch_id),
          product_id: Number(product_id),
          quantity: Number(quantity), // ✅ Số dương
          type: 'EXPORT', // Type cho biết đây là xuất kho
          unit_id: unit_id ? Number(unit_id) : undefined,
          date: new Date(),
          note: note || 'Xuất kho (không theo lô)',
          created_by: userId
        }
      });

      // Update inventory
      const result = await tx.branchinventory.update({
        where: { id: inventory.id },
        data: {
          stock: {
            decrement: Number(quantity)
          },
          last_updated: new Date()
        },
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

      return result;
    });

    return {
      success: true,
      data: updatedInventory,
      warning: minStockWarning
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export stock using FEFO (First Expired First Out) strategy
 * This function deducts from batches with earliest expiry date first
 * ✅ FIX #10: Sử dụng số dương cho quantity trong inventoryLog
 */
const exportWithFEFO = async ({ branch_id, product_id, quantity, unit_id, note, userId, minStockWarning }) => {
  try {
    // Get available batches sorted by FEFO
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: Number(branch_id),
        product_id: Number(product_id),
        status: 'active',
        quantity: { gt: 0 },
        OR: [
          { expiry_date: null },
          { expiry_date: { gt: new Date() } }
        ]
      },
      orderBy: [
        { expiry_date: 'asc' },
        { created_at: 'asc' }
      ]
    });

    // Calculate total available from batches
    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

    // If no batches found but inventory has stock, use legacy method
    if (batches.length === 0) {
      console.warn(`No batches found for product ${product_id} at branch ${branch_id}, using legacy export`);

      const inventory = await prisma.branchinventory.findFirst({
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

      // Legacy export without batch tracking
      const result = await prisma.$transaction(async (tx) => {
        // ✅ FIX #10: Sử dụng số dương
        await tx.inventoryLog.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            quantity: Number(quantity), // ✅ Số dương
            type: 'EXPORT',
            unit_id: unit_id ? Number(unit_id) : undefined,
            date: new Date(),
            note: `${note || 'Xuất kho'} (không có lô)`,
            created_by: userId
          }
        });

        return await tx.branchinventory.update({
          where: { id: inventory.id },
          data: {
            stock: { decrement: Number(quantity) },
            last_updated: new Date()
          },
          include: {
            branches: true,
            products: true
          }
        });
      });

      return {
        success: true,
        data: result,
        warning: minStockWarning,
        fefo_used: false
      };
    }

    // Check if enough stock in batches
    if (totalAvailable < quantity) {
      return {
        success: false,
        status: 400,
        error: `Không đủ hàng trong các lô. Yêu cầu: ${quantity}, Có sẵn: ${totalAvailable}`,
        data: {
          required: quantity,
          available: totalAvailable,
          shortage: quantity - totalAvailable
        }
      };
    }

    // Allocate from batches (FEFO order)
    const allocations = [];
    let remainingQty = Number(quantity);

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const takeQty = Math.min(batch.quantity, remainingQty);

      allocations.push({
        batch_id: batch.id,
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        available_qty: batch.quantity,
        allocated_qty: takeQty,
        remaining_after: batch.quantity - takeQty
      });

      remainingQty -= takeQty;
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const logs = [];

      // Deduct from each batch
      for (const allocation of allocations) {
        // Update batch quantity
        await tx.productBatch.update({
          where: { id: allocation.batch_id },
          data: {
            quantity: { decrement: allocation.allocated_qty },
            updated_at: new Date()
          }
        });

        // ✅ FIX #10: Sử dụng số dương cho quantity
        const log = await tx.inventoryLog.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            batch_id: allocation.batch_id,
            quantity: allocation.allocated_qty, // ✅ Số dương
            type: 'EXPORT',
            unit_id: unit_id ? Number(unit_id) : undefined,
            date: new Date(),
            note: `${note || 'Xuất kho FEFO'} - Lô ${allocation.batch_number} (HSD: ${allocation.expiry_date ? new Date(allocation.expiry_date).toLocaleDateString('vi-VN') : 'N/A'})`,
            created_by: userId
          }
        });
        logs.push(log);
      }

      // Update total inventory
      const updatedInventory = await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: Number(branch_id),
            product_id: Number(product_id)
          }
        },
        data: {
          stock: { decrement: Number(quantity) },
          last_updated: new Date()
        },
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

      return {
        inventory: updatedInventory,
        allocations,
        logs
      };
    });

    return {
      success: true,
      data: result.inventory,
      fefo_details: {
        allocations: result.allocations,
        total_exported: quantity,
        batches_used: result.allocations.length
      },
      warning: minStockWarning,
      fefo_used: true,
      message: `Đã xuất ${quantity} sản phẩm từ ${result.allocations.length} lô theo FEFO`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * ✅ FIX #13: Reconcile inventory với batch
 * Đồng bộ branchinventory.stock với SUM(productBatch.quantity)
 */
export const reconcileInventoryWithBatches = async (branchId = null, productId = null) => {
  try {
    const where = {};
    if (branchId) where.branch_id = Number(branchId);
    if (productId) where.product_id = Number(productId);

    // Get all branch inventory records
    const inventories = await prisma.branchinventory.findMany({
      where,
      include: {
        branches: { select: { id: true, name: true } },
        products: { select: { id: true, name: true } }
      }
    });

    const results = [];
    const discrepancies = [];

    for (const inventory of inventories) {
      // Calculate total from batches
      const batchTotal = await prisma.productBatch.aggregate({
        where: {
          branch_id: inventory.branch_id,
          product_id: inventory.product_id,
          status: 'active'
        },
        _sum: { quantity: true }
      });

      const batchQuantity = batchTotal._sum.quantity || 0;
      const inventoryQuantity = inventory.stock || 0;
      const difference = inventoryQuantity - batchQuantity;

      if (difference !== 0) {
        discrepancies.push({
          branch_id: inventory.branch_id,
          branch_name: inventory.branches.name,
          product_id: inventory.product_id,
          product_name: inventory.products.name,
          inventory_stock: inventoryQuantity,
          batch_total: batchQuantity,
          difference: difference
        });
      }

      results.push({
        branch_id: inventory.branch_id,
        product_id: inventory.product_id,
        inventory_stock: inventoryQuantity,
        batch_total: batchQuantity,
        in_sync: difference === 0
      });
    }

    return {
      success: true,
      data: {
        total_checked: results.length,
        in_sync: results.filter(r => r.in_sync).length,
        out_of_sync: discrepancies.length,
        discrepancies: discrepancies
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * ✅ FIX #13: Auto-fix inventory discrepancies
 * Cập nhật branchinventory.stock = SUM(productBatch.quantity)
 */
export const autoFixInventoryDiscrepancies = async (branchId = null, productId = null, userId = null) => {
  try {
    // First, get discrepancies
    const reconcileResult = await reconcileInventoryWithBatches(branchId, productId);

    if (!reconcileResult.success) {
      return reconcileResult;
    }

    const discrepancies = reconcileResult.data.discrepancies;

    if (discrepancies.length === 0) {
      return {
        success: true,
        message: 'Không có sự khác biệt cần sửa',
        data: { fixed: 0 }
      };
    }

    // Fix each discrepancy in transaction
    const fixed = await prisma.$transaction(async (tx) => {
      const fixedItems = [];

      for (const disc of discrepancies) {
        // Update inventory to match batch total
        await tx.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: disc.branch_id,
              product_id: disc.product_id
            }
          },
          data: {
            stock: disc.batch_total,
            last_updated: new Date()
          }
        });

        // Log the adjustment
        await tx.inventoryLog.create({
          data: {
            branch_id: disc.branch_id,
            product_id: disc.product_id,
            quantity: Math.abs(disc.difference),
            type: 'ADJUSTMENT',
            note: `Auto-fix: Đồng bộ inventory với batch (${disc.inventory_stock} -> ${disc.batch_total})`,
            created_by: userId,
            date: new Date()
          }
        });

        fixedItems.push({
          branch_id: disc.branch_id,
          product_id: disc.product_id,
          old_stock: disc.inventory_stock,
          new_stock: disc.batch_total,
          adjustment: disc.difference
        });
      }

      return fixedItems;
    });

    return {
      success: true,
      message: `Đã sửa ${fixed.length} sản phẩm không đồng bộ`,
      data: {
        fixed: fixed.length,
        details: fixed
      }
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

    const inventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      },
      include: {
        products: {
          include: {
            unittype: true,
            productunits: true
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

    // Fetch all inventory with min_stock defined
    const inventories = await prisma.branchinventory.findMany({
      where: {
        branch_id: Number(branchId),
        min_stock: { not: null }
      },
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
        stock: 'asc'
      }
    });

    // Filter in JavaScript: stock <= min_stock
    const lowStockProducts = inventories.filter(inv =>
      (inv.stock || 0) <= (inv.min_stock || 0)
    );

    return {
      success: true,
      data: lowStockProducts
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
          branches: true,
          products: true,
          productunits: true,
          users: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
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

// Get total stock of a product across all branches
export const getProductTotalStock = async (productId) => {
  try {
    if (!productId) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin sản phẩm'
      };
    }

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
      include: {
        unittype: true,
        productunits: true
      }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    // Get stock from all branches
    const inventories = await prisma.branchinventory.findMany({
      where: {
        product_id: Number(productId)
      },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            city_id: true
          }
        }
      },
      orderBy: {
        stock: 'desc'
      }
    });

    // Calculate total stock
    const totalStock = inventories.reduce((sum, inv) => sum + (inv.stock || 0), 0);

    // Group by branch with stock info
    const branchStocks = inventories.map(inv => ({
      branch_id: inv.branch_id,
      branch_name: inv.branches.name,
      branch_address: inv.branches.address,
      city_id: inv.branches.city_id,
      stock: inv.stock || 0,
      min_stock: inv.min_stock,
      max_stock: inv.max_stock,
      last_updated: inv.last_updated,
      in_stock: (inv.stock || 0) > 0 ? 1 : 0
    }));

    return {
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        unit_type: product.unittype?.name,
        total_stock: totalStock,
        in_stock: totalStock > 0 ? 1 : 0,
        branch_count: inventories.length,
        branches: branchStocks
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get stock of a product by specific branch
export const getProductStockByBranch = async (productId, branchId) => {
  try {
    if (!productId || !branchId) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin sản phẩm hoặc chi nhánh'
      };
    }

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
      include: {
        unittype: true,
        productunits: true
      }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    // Check if branch exists
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branchId) },
      include: {
        cities: true
      }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    // Get inventory
    const inventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      }
    });

    const stock = inventory ? inventory.stock : 0;

    return {
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        unit_type: product.unittype?.name,
        branch_id: branch.id,
        branch_name: branch.name,
        branch_address: branch.address,
        city: branch.cities?.name,
        stock: stock,
        min_stock: inventory?.min_stock,
        max_stock: inventory?.max_stock,
        reorder_point: inventory?.reorder_point,
        reorder_quantity: inventory?.reorder_quantity,
        last_updated: inventory?.last_updated,
        last_stock_take: inventory?.last_stock_take,
        in_stock: stock > 0 ? 1 : 0
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get all products with stock availability across all branches
export const getAllProductsWithStock = async ({
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'asc',
  categoryId,
  inStockOnly = false,
  branchId
}) => {
  try {
    const where = {};

    if (categoryId) {
      where.category_id = Number(categoryId);
    }

    const branchInventoryWhere = {};
    if (branchId) {
      branchInventoryWhere.branch_id = Number(branchId);
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: {
          unittype: true,
          productunits: true,
          branchinventory: {
            where: branchInventoryWhere,
            include: {
              branches: {
                select: {
                  id: true,
                  name: true,
                  city_id: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.products.count({ where })
    ]);

    // Calculate stock for each product
    const productsWithStock = products.map(product => {
      const totalStock = product.branchinventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
      const inStock = totalStock > 0 ? 1 : 0;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        unit_type: product.unittype?.name,
        total_stock: totalStock,
        in_stock: inStock,
        branch_count: product.branchinventory.length,
        branches: product.branchinventory.map(inv => ({
          branch_id: inv.branch_id,
          branch_name: inv.branches.name,
          city_id: inv.branches.city_id,
          stock: inv.stock || 0
        }))
      };
    });

    // Filter by stock availability if requested
    let filteredProducts = productsWithStock;
    if (inStockOnly) {
      filteredProducts = productsWithStock.filter(p => p.in_stock === 1);
    }

    return {
      success: true,
      data: {
        products: filteredProducts,
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

// Get low stock products across all branches (below min_stock)
export const getAllLowStockProducts = async (branchId = null) => {
  try {
    const where = {
      min_stock: { not: null }
    };

    // If branchId is provided (for staff), filter by branch
    if (branchId) {
      where.branch_id = Number(branchId);
    }

    // Get all inventories where stock <= min_stock
    const inventories = await prisma.branchinventory.findMany({
      where,
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            city_id: true
          }
        },
        products: {
          include: {
            unittype: true
          }
        }
      }
    });

    // Filter low stock items
    const lowStockInventories = inventories.filter(inv =>
      inv.stock <= inv.min_stock
    );

    // Group by product
    const groupedByProduct = {};

    lowStockInventories.forEach(inv => {
      const productId = inv.product_id;

      if (!groupedByProduct[productId]) {
        groupedByProduct[productId] = {
          product_id: productId,
          product_name: inv.products.name,
          unit_type: inv.products.unittype?.name,
          branches: []
        };
      }

      groupedByProduct[productId].branches.push({
        branch_id: inv.branch_id,
        branch_name: inv.branches.name,
        branch_address: inv.branches.address,
        city_id: inv.branches.city_id,
        current_stock: inv.stock,
        min_stock: inv.min_stock,
        shortage: inv.min_stock - inv.stock,
        reorder_point: inv.reorder_point,
        reorder_quantity: inv.reorder_quantity
      });
    });

    const result = Object.values(groupedByProduct);

    return {
      success: true,
      data: {
        total_low_stock_items: result.length,
        products: result
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get low stock products for a specific branch (nested route)
 * Use Case: Chi nhánh xem sản phẩm tồn kho thấp của mình
 */
export const getBranchLowStockProducts = async (branchId, threshold = 10) => {
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

    // Get all inventories for the branch
    const allInventories = await prisma.branchinventory.findMany({
      where: {
        branch_id: Number(branchId)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true
          }
        }
      },
      orderBy: {
        stock: 'asc' // Thấp nhất lên đầu
      }
    });

    // Filter in JavaScript: stock <= threshold OR stock <= min_stock
    const inventories = allInventories.filter(inv => {
      const stock = inv.stock || 0;
      const minStock = inv.min_stock;

      // Below custom threshold
      if (stock <= Number(threshold)) return true;

      // Below min_stock (if defined)
      if (minStock !== null && stock <= minStock) return true;

      return false;
    });

    // Classify by urgency
    const productsWithUrgency = inventories.map(inv => {
      const stock = inv.stock || 0;
      const minStock = inv.min_stock || threshold;
      const shortage = minStock - stock;

      let urgency = 'low';
      if (stock === 0) {
        urgency = 'critical'; // Out of stock
      } else if (stock <= minStock * 0.3) {
        urgency = 'high'; // < 30% of min_stock
      } else if (stock <= minStock * 0.5) {
        urgency = 'medium'; // < 50% of min_stock
      }

      return {
        id: inv.id,
        product_id: inv.product_id,
        product: inv.products,
        current_stock: stock,
        min_stock: inv.min_stock || threshold,
        shortage: shortage > 0 ? shortage : 0,
        urgency,
        reorder_point: inv.reorder_point,
        reorder_quantity: inv.reorder_quantity,
        last_updated: inv.last_updated
      };
    });

    // Group by urgency
    const summary = {
      critical: productsWithUrgency.filter(p => p.urgency === 'critical').length,
      high: productsWithUrgency.filter(p => p.urgency === 'high').length,
      medium: productsWithUrgency.filter(p => p.urgency === 'medium').length,
      low: productsWithUrgency.filter(p => p.urgency === 'low').length,
      total: productsWithUrgency.length
    };

    return {
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address
        },
        threshold,
        products: productsWithUrgency,
        summary
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get stock statistics by branch
export const getStockStatisticsByBranch = async (branchId) => {
  try {
    if (!branchId) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin chi nhánh'
      };
    }

    // Check if branch exists
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branchId) },
      include: {
        cities: true
      }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    // Get all inventory for the branch
    const inventories = await prisma.branchinventory.findMany({
      where: {
        branch_id: Number(branchId)
      },
      include: {
        products: true
      }
    });

    // Calculate statistics
    const totalProducts = inventories.length;
    const inStockProducts = inventories.filter(inv => inv.stock > 0).length;
    const outOfStockProducts = inventories.filter(inv => inv.stock === 0).length;
    const lowStockProducts = inventories.filter(inv =>
      inv.min_stock && inv.stock <= inv.min_stock
    ).length;
    const totalStockValue = inventories.reduce((sum, inv) => {
      const price = inv.products.price || 0;
      const stock = inv.stock || 0;
      return sum + (Number(price) * stock);
    }, 0);

    return {
      success: true,
      data: {
        branch_id: branch.id,
        branch_name: branch.name,
        branch_address: branch.address,
        city: branch.cities?.name,
        statistics: {
          total_products: totalProducts,
          in_stock_products: inStockProducts,
          out_of_stock_products: outOfStockProducts,
          low_stock_products: lowStockProducts,
          total_stock_value: totalStockValue
        }
      }
    };
  } catch (error) {
    throw error;
  }
};