import prisma from '../../../config/db.js';
import { inventoryLogger } from '../../../utils/logger.js';

// ============================================================
// FEFO (First Expired First Out) INVENTORY MANAGEMENT
// ============================================================

/**
 * Get available batches for a product at a branch, sorted by FEFO
 * (First Expired First Out - lô hết hạn sớm nhất được xuất trước)
 */
export const getAvailableBatchesFEFO = async (branchId, productId) => {
  try {
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId),
        status: 'active',
        quantity: { gt: 0 },
        // Chỉ lấy lô chưa hết hạn hoặc không có ngày hết hạn
        OR: [
          { expiry_date: null },
          { expiry_date: { gt: new Date() } }
        ]
      },
      orderBy: [
        // FEFO: Lô hết hạn sớm nhất lên đầu
        // Lô không có expiry_date sẽ được đẩy xuống cuối (null last)
        { expiry_date: 'asc' },
        // Nếu cùng ngày hết hạn, lấy lô nhập trước (FIFO)
        { created_at: 'asc' }
      ],
      include: {
        products: {
          select: { id: true, name: true }
        },
        suppliers: {
          select: { id: true, name: true }
        }
      }
    });

    // Tính tổng số lượng có thể xuất
    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

    return {
      success: true,
      data: {
        batches,
        totalAvailable,
        batchCount: batches.length
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Allocate quantity from batches using FEFO strategy
 * Returns allocation plan: which batch to take how much
 */
export const allocateBatchesFEFO = async (branchId, productId, requiredQuantity) => {
  try {
    // Get available batches sorted by FEFO
    const result = await getAvailableBatchesFEFO(branchId, productId);

    if (!result.success) {
      return result;
    }

    const { batches, totalAvailable } = result.data;

    // Check if enough stock
    if (totalAvailable < requiredQuantity) {
      return {
        success: false,
        status: 400,
        error: `Không đủ hàng trong kho. Yêu cầu: ${requiredQuantity}, Có sẵn: ${totalAvailable}`,
        data: {
          required: requiredQuantity,
          available: totalAvailable,
          shortage: requiredQuantity - totalAvailable
        }
      };
    }

    // Allocate from batches (FEFO order)
    const allocations = [];
    let remainingQty = requiredQuantity;

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

    return {
      success: true,
      data: {
        allocations,
        totalAllocated: requiredQuantity,
        batchesUsed: allocations.length
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export stock using FEFO - Main function for selling/transferring
 * This will:
 * 1. Allocate from batches using FEFO
 * 2. Deduct from each batch
 * 3. Update branchinventory total stock
 * 4. Create inventory logs for traceability
 * 
 * ✅ FIX #24: Thêm atomic check để batch quantity không âm
 * 
 * ⚠️ CONVENTION: Quantity trong InventoryLog dùng số ÂM cho xuất kho
 * Điều này giúp dễ dàng tính SUM(quantity) để reconcile
 */
export const exportStockFEFO = async (data, userId) => {
  try {
    const {
      branch_id,
      product_id,
      quantity,
      reference_type = 'manual_export',
      reference_id = null,
      note = 'Xuất kho FEFO'
    } = data;

    // Validate inputs
    if (!branch_id || !product_id || !quantity) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin bắt buộc (branch_id, product_id, quantity)'
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng xuất phải lớn hơn 0'
      };
    }

    // Get allocation plan
    const allocationResult = await allocateBatchesFEFO(branch_id, product_id, quantity);

    if (!allocationResult.success) {
      return allocationResult;
    }

    const { allocations } = allocationResult.data;

    // ✅ FIX #24: Execute in transaction với Serializable isolation
    const result = await prisma.$transaction(async (tx) => {
      const logs = [];

      // Deduct from each batch với atomic check
      for (const allocation of allocations) {
        // ✅ FIX #24: Atomic update với điều kiện quantity >= allocated_qty
        const updateResult = await tx.productBatch.updateMany({
          where: {
            id: allocation.batch_id,
            quantity: { gte: allocation.allocated_qty } // ✅ Atomic check
          },
          data: {
            quantity: { decrement: allocation.allocated_qty },
            updated_at: new Date()
          }
        });

        // Nếu không update được (do race condition), rollback
        if (updateResult.count === 0) {
          throw new Error(`Lô hàng #${allocation.batch_id} không đủ số lượng (race condition detected)`);
        }

        // Create inventory log for this batch
        // ✅ FIX #25: Số DƯƠNG với type EXPORT (convention mới)
        const log = await tx.inventoryLog.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            batch_id: allocation.batch_id,
            quantity: allocation.allocated_qty, // ✅ Số DƯƠNG
            type: 'EXPORT',                     // ✅ Type cho biết chiều xuất kho
            reference_type,
            reference_id,
            note: `${note} - Lô ${allocation.batch_number} (HSD: ${allocation.expiry_date ? new Date(allocation.expiry_date).toLocaleDateString('vi-VN') : 'N/A'})`,
            created_by: userId,
            date: new Date()
          }
        });
        logs.push(log);
      }

      // ✅ FIX #24: Update total inventory với atomic check
      const inventoryUpdate = await tx.branchinventory.updateMany({
        where: {
          branch_id: Number(branch_id),
          product_id: Number(product_id),
          stock: { gte: quantity } // ✅ Atomic check
        },
        data: {
          stock: { decrement: quantity },
          last_updated: new Date()
        }
      });

      if (inventoryUpdate.count === 0) {
        throw new Error(`Không đủ tồn kho trong branchinventory (race condition detected)`);
      }

      return {
        allocations,
        logs,
        totalExported: quantity
      };
    }, {
      timeout: 15000,
      isolationLevel: 'Serializable' // ✅ Thêm isolation level
    });

    return {
      success: true,
      data: result,
      message: `Đã xuất ${quantity} sản phẩm từ ${allocations.length} lô theo FEFO`
    };
  } catch (error) {
    // ✅ Handle race condition errors
    if (error.message && error.message.includes('race condition')) {
      return {
        success: false,
        status: 409,
        error: error.message
      };
    }
    if (error.code === 'P2028') {
      return {
        success: false,
        status: 503,
        error: 'Hệ thống đang bận xử lý, vui lòng thử lại sau'
      };
    }
    throw error;
  }
};

/**
 * Import stock to a specific batch or create new batch
 */
export const importStockToBatch = async (data, userId) => {
  try {
    const {
      branch_id,
      product_id,
      batch_number,
      quantity,
      manufacture_date,
      expiry_date,
      cost_price,
      selling_price,
      supplier_id,
      note,
      // If batch_id is provided, add to existing batch
      batch_id
    } = data;

    // Validate
    if (!branch_id || !product_id || !quantity) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin bắt buộc (branch_id, product_id, quantity)'
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng nhập phải lớn hơn 0'
      };
    }

    // If adding to existing batch
    if (batch_id) {
      return await addToExistingBatch(batch_id, quantity, userId, note);
    }

    // Create new batch
    if (!batch_number) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu mã lô hàng (batch_number) khi tạo lô mới'
      };
    }

    // Use existing createProductBatch function
    return await createProductBatch({
      product_id,
      branch_id,
      batch_number,
      manufacture_date,
      expiry_date,
      quantity,
      cost_price,
      selling_price,
      supplier_id,
      note
    }, userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Add quantity to existing batch
 */
export const addToExistingBatch = async (batchId, quantity, userId, note = 'Nhập thêm vào lô') => {
  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id: Number(batchId) }
    });

    if (!batch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    if (batch.status !== 'active') {
      return {
        success: false,
        status: 400,
        error: 'Không thể nhập thêm vào lô hàng không còn hoạt động'
      };
    }

    // Check expiry
    if (batch.expiry_date && new Date(batch.expiry_date) < new Date()) {
      return {
        success: false,
        status: 400,
        error: 'Không thể nhập thêm vào lô hàng đã hết hạn'
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update batch
      const updatedBatch = await tx.productBatch.update({
        where: { id: Number(batchId) },
        data: {
          quantity: { increment: Number(quantity) },
          updated_at: new Date()
        }
      });

      // Update inventory
      await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: batch.branch_id,
            product_id: batch.product_id
          }
        },
        data: {
          stock: { increment: Number(quantity) },
          last_updated: new Date()
        }
      });

      // Create log
      await tx.inventoryLog.create({
        data: {
          branch_id: batch.branch_id,
          product_id: batch.product_id,
          batch_id: batch.id,
          quantity: Number(quantity),
          type: 'IMPORT',
          reference_type: 'batch_addition',
          reference_id: batch.id,
          note: `${note} - Lô ${batch.batch_number}`,
          created_by: userId,
          date: new Date()
        }
      });

      return updatedBatch;
    });

    return {
      success: true,
      data: result,
      message: `Đã nhập thêm ${quantity} vào lô ${batch.batch_number}`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get batch summary for a product at a branch
 */
export const getBatchSummary = async (branchId, productId) => {
  try {
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      },
      include: {
        products: {
          select: { id: true, name: true, price: true }
        }
      },
      orderBy: { expiry_date: 'asc' }
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Categorize batches
    const summary = {
      total_batches: batches.length,
      active_batches: 0,
      expired_batches: 0,
      expiring_soon_batches: 0,
      total_quantity: 0,
      active_quantity: 0,
      expired_quantity: 0,
      expiring_soon_quantity: 0,
      batches_by_status: {
        active: [],
        expired: [],
        expiring_soon: [],
        depleted: []
      }
    };

    for (const batch of batches) {
      const isExpired = batch.expiry_date && new Date(batch.expiry_date) < now;
      const isExpiringSoon = batch.expiry_date &&
        new Date(batch.expiry_date) >= now &&
        new Date(batch.expiry_date) <= thirtyDaysFromNow;
      const isDepleted = batch.quantity === 0;

      if (isDepleted) {
        summary.batches_by_status.depleted.push(batch);
      } else if (isExpired || batch.status === 'expired') {
        summary.expired_batches++;
        summary.expired_quantity += batch.quantity;
        summary.batches_by_status.expired.push(batch);
      } else if (isExpiringSoon) {
        summary.expiring_soon_batches++;
        summary.expiring_soon_quantity += batch.quantity;
        summary.active_batches++;
        summary.active_quantity += batch.quantity;
        summary.batches_by_status.expiring_soon.push(batch);
      } else if (batch.status === 'active') {
        summary.active_batches++;
        summary.active_quantity += batch.quantity;
        summary.batches_by_status.active.push(batch);
      }

      summary.total_quantity += batch.quantity;
    }

    return {
      success: true,
      data: summary
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Validate stock consistency between batches and inventory
 * ⚠️ IMPORTANT: Tính cả batch 'expired' vì hàng hết hạn vẫn còn trong kho (chưa tiêu hủy)
 * Chỉ loại trừ batch 'disposed' vì đã thực sự xuất kho
 */
export const validateStockConsistency = async (branchId, productId) => {
  try {
    // Get sum of ALL batch quantities (active + expired, NOT disposed)
    // Expired batches still have physical stock until disposed
    const batchSum = await prisma.productBatch.aggregate({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId),
        status: { in: ['active', 'expired'] } // Include expired, exclude disposed
      },
      _sum: {
        quantity: true
      }
    });

    // Also get breakdown by status for detailed reporting
    const [activeSum, expiredSum] = await Promise.all([
      prisma.productBatch.aggregate({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId),
          status: 'active'
        },
        _sum: { quantity: true }
      }),
      prisma.productBatch.aggregate({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId),
          status: 'expired'
        },
        _sum: { quantity: true }
      })
    ]);

    // Get inventory stock
    const inventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(branchId),
        product_id: Number(productId)
      }
    });

    const batchTotal = batchSum._sum.quantity || 0;
    const activeTotal = activeSum._sum.quantity || 0;
    const expiredTotal = expiredSum._sum.quantity || 0;
    const inventoryStock = inventory?.stock || 0;
    const isConsistent = batchTotal === inventoryStock;

    return {
      success: true,
      data: {
        batch_total: batchTotal,
        active_batch_total: activeTotal,
        expired_batch_total: expiredTotal,
        inventory_stock: inventoryStock,
        is_consistent: isConsistent,
        discrepancy: inventoryStock - batchTotal,
        warning: expiredTotal > 0
          ? `⚠️ Có ${expiredTotal} sản phẩm trong các lô hết hạn cần được xử lý tiêu hủy`
          : null
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Reconcile batch quantities with inventory
 * Use when there's discrepancy between batch sum and inventory stock
 */
export const reconcileStock = async (branchId, productId, userId) => {
  try {
    const validation = await validateStockConsistency(branchId, productId);

    if (!validation.success) {
      return validation;
    }

    const { batch_total, inventory_stock, is_consistent, discrepancy } = validation.data;

    if (is_consistent) {
      return {
        success: true,
        message: 'Tồn kho đã đồng bộ, không cần điều chỉnh',
        data: validation.data
      };
    }

    // Update inventory to match batch total
    const result = await prisma.$transaction(async (tx) => {
      await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: Number(branchId),
            product_id: Number(productId)
          }
        },
        data: {
          stock: batch_total,
          last_updated: new Date()
        }
      });

      // Create adjustment log
      // ✅ FIX #25: Với ADJUSTMENT, quantity có thể âm hoặc dương tùy thuộc vào chiều điều chỉnh
      // Nếu discrepancy > 0: inventory > batch → cần giảm → quantity âm
      // Nếu discrepancy < 0: inventory < batch → cần tăng → quantity dương
      // Giữ nguyên logic vì ADJUSTMENT là trường hợp đặc biệt
      await tx.inventoryLog.create({
        data: {
          branch_id: Number(branchId),
          product_id: Number(productId),
          quantity: Math.abs(discrepancy),  // ✅ Số DƯƠNG
          type: discrepancy > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT', // Cùng type, note sẽ giải thích
          reference_type: 'stock_reconciliation',
          note: `Điều chỉnh tồn kho: ${inventory_stock} → ${batch_total} (${discrepancy > 0 ? 'giảm' : 'tăng'} ${Math.abs(discrepancy)})`,
          created_by: userId,
          date: new Date()
        }
      });

      return {
        previous_stock: inventory_stock,
        new_stock: batch_total,
        adjustment: -discrepancy
      };
    });

    return {
      success: true,
      data: result,
      message: `Đã điều chỉnh tồn kho từ ${inventory_stock} thành ${batch_total}`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Auto-expire batches that have passed their expiry date
 * Should be run as a scheduled job
 */
export const autoExpireBatches = async () => {
  try {
    const now = new Date();

    // Find all expired but still active batches
    const expiredBatches = await prisma.productBatch.findMany({
      where: {
        status: 'active',
        expiry_date: { lt: now },
        quantity: { gt: 0 }
      }
    });

    if (expiredBatches.length === 0) {
      return {
        success: true,
        message: 'Không có lô hàng nào cần đánh dấu hết hạn',
        data: { processed: 0 }
      };
    }

    // Process each expired batch
    const results = [];
    for (const batch of expiredBatches) {
      try {
        const result = await markBatchAsExpired(batch.id, null);
        results.push({
          batch_id: batch.id,
          batch_number: batch.batch_number,
          ...result
        });
      } catch (error) {
        results.push({
          batch_id: batch.id,
          batch_number: batch.batch_number,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      data: {
        processed: expiredBatches.length,
        results
      },
      message: `Đã xử lý ${expiredBatches.length} lô hàng hết hạn`
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Generate batch number automatically
 */
export const generateBatchNumber = async (productId, branchId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `BATCH-${productId}-${branchId}-${dateStr}-${random}`;
};

// ============================================================
// EXISTING FUNCTIONS
// ============================================================

// Create a new product batch
export const createProductBatch = async (data, userId) => {
  try {
    const {
      product_id,
      branch_id,
      batch_number,
      manufacture_date,
      expiry_date,
      quantity,
      cost_price,
      selling_price,
      supplier_id,
      note
    } = data;

    // Validate required fields
    if (!product_id || !branch_id || !batch_number || !quantity) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin bắt buộc (product_id, branch_id, batch_number, quantity)'
      };
    }

    // Validate quantity
    if (quantity <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng phải lớn hơn 0'
      };
    }

    // Check if product and branch exist
    const [product, branch] = await Promise.all([
      prisma.products.findUnique({ where: { id: Number(product_id) } }),
      prisma.branches.findUnique({ where: { id: Number(branch_id) } })
    ]);

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    // Check if batch already exists
    const existingBatch = await prisma.productBatch.findFirst({
      where: {
        batch_number: batch_number,
        product_id: Number(product_id),
        branch_id: Number(branch_id)
      }
    });

    if (existingBatch) {
      return {
        success: false,
        status: 409,
        error: 'Số lô hàng đã tồn tại cho sản phẩm này tại chi nhánh này'
      };
    }

    // Validate dates
    if (expiry_date && manufacture_date) {
      if (new Date(expiry_date) <= new Date(manufacture_date)) {
        return {
          success: false,
          status: 400,
          error: 'Ngày hết hạn phải sau ngày sản xuất'
        };
      }
    }

    // Check if expiry date is in the past
    if (expiry_date && new Date(expiry_date) < new Date()) {
      return {
        success: false,
        status: 400,
        error: 'Ngày hết hạn không được ở quá khứ'
      };
    }

    // Create batch and update inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create product batch
      const batch = await tx.productBatch.create({
        data: {
          product_id: Number(product_id),
          branch_id: Number(branch_id),
          batch_number,
          manufacture_date: manufacture_date ? new Date(manufacture_date) : null,
          expiry_date: expiry_date ? new Date(expiry_date) : null,
          quantity: Number(quantity),
          cost_price: cost_price ? Number(cost_price) : null,
          selling_price: selling_price ? Number(selling_price) : null,
          supplier_id: supplier_id ? Number(supplier_id) : null,
          status: 'active',
          note
        },
        include: {
          products: true,
          branchinventory: {
            include: {
              branches: true
            }
          },
          suppliers: true
        }
      });

      // Update or create branch inventory
      const inventory = await tx.branchinventory.findFirst({
        where: {
          branch_id: Number(branch_id),
          product_id: Number(product_id)
        }
      });

      if (inventory) {
        await tx.branchinventory.update({
          where: { id: inventory.id },
          data: {
            stock: { increment: Number(quantity) },
            last_updated: new Date()
          }
        });
      } else {
        await tx.branchinventory.create({
          data: {
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            stock: Number(quantity),
            last_updated: new Date()
          }
        });
      }

      // Create inventory log
      const inventoryLog = await tx.inventoryLog.create({
        data: {
          branch_id: Number(branch_id),
          product_id: Number(product_id),
          quantity: Number(quantity),
          type: 'IMPORT',
          batch_id: batch.id,
          reference_type: 'batch_import',
          reference_id: batch.id,
          note: `Nhập lô hàng ${batch_number}`,
          created_by: userId,
          date: new Date()
        }
      });

      return batch;
    }, {
      timeout: 15000
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

// Get all product batches with filters
export const getAllProductBatches = async (filters) => {
  try {
    const {
      branch_id,
      product_id,
      supplier_id,
      status,
      expiring_soon,
      page = 1,
      limit = 20
    } = filters;

    const where = {};

    if (branch_id) {
      where.branch_id = Number(branch_id);
    }

    if (product_id) {
      where.product_id = Number(product_id);
    }

    if (supplier_id) {
      where.supplier_id = Number(supplier_id);
    }

    if (status) {
      where.status = status;
    }

    // Filter batches expiring in next 30 days
    if (expiring_soon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      where.expiry_date = {
        gte: new Date(),
        lte: thirtyDaysFromNow
      };
      where.status = 'active';
    }

    const [batches, total] = await Promise.all([
      prisma.productBatch.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              image_url: true
            }
          },
          branchinventory: {
            include: {
              branches: {
                select: {
                  id: true,
                  name: true,
                  address: true
                }
              }
            }
          },
          suppliers: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.productBatch.count({ where })
    ]);

    return {
      success: true,
      data: {
        batches,
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

// Get batch by ID
export const getProductBatchById = async (id) => {
  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id: Number(id) },
      include: {
        products: true,
        branchinventory: {
          include: {
            branches: true
          }
        },
        suppliers: true,
        inventoryLog: {
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      }
    });

    if (!batch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    return {
      success: true,
      data: batch
    };
  } catch (error) {
    throw error;
  }
};

// Update product batch
export const updateProductBatch = async (id, data) => {
  try {
    // Check if batch exists
    const existingBatch = await prisma.productBatch.findUnique({
      where: { id: Number(id) }
    });

    if (!existingBatch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    // Validate dates if provided
    if (data.expiry_date && data.manufacture_date) {
      if (new Date(data.expiry_date) <= new Date(data.manufacture_date)) {
        return {
          success: false,
          status: 400,
          error: 'Ngày hết hạn phải sau ngày sản xuất'
        };
      }
    }

    const batch = await prisma.productBatch.update({
      where: { id: Number(id) },
      data: {
        manufacture_date: data.manufacture_date ? new Date(data.manufacture_date) : undefined,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
        cost_price: data.cost_price !== undefined ? Number(data.cost_price) : undefined,
        selling_price: data.selling_price !== undefined ? Number(data.selling_price) : undefined,
        status: data.status,
        note: data.note,
        updated_at: new Date()
      },
      include: {
        products: true,
        branchinventory: {
          include: {
            branches: true
          }
        },
        suppliers: true
      }
    });

    return {
      success: true,
      data: batch
    };
  } catch (error) {
    throw error;
  }
};

// Mark batch as expired
// ⚠️ LƯU Ý: Đánh dấu hết hạn KHÔNG tự động trừ stock
// Việc xử lý hàng hết hạn (tiêu hủy, trả NCC) cần được thực hiện riêng
export const markBatchAsExpired = async (id, userId) => {
  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id: Number(id) }
    });

    if (!batch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    if (batch.status === 'expired') {
      return {
        success: false,
        status: 400,
        error: 'Lô hàng đã được đánh dấu hết hạn'
      };
    }

    // Update batch status only - DO NOT deduct from inventory automatically
    // The expired stock is still physically in the warehouse
    // Disposal/return should be handled separately with proper documentation
    const result = await prisma.$transaction(async (tx) => {
      // Update batch status
      const updatedBatch = await tx.productBatch.update({
        where: { id: Number(id) },
        data: {
          status: 'expired',
          updated_at: new Date()
        }
      });

      // Create inventory log as WARNING/NOTIFICATION only (quantity = 0)
      // This is just for audit trail, not actual stock movement
      await tx.inventoryLog.create({
        data: {
          branch_id: batch.branch_id,
          product_id: batch.product_id,
          quantity: 0, // No stock movement yet
          type: 'EXPIRED',
          batch_id: batch.id,
          reference_type: 'batch_expired_notice',
          reference_id: batch.id,
          note: `⚠️ Lô hàng ${batch.batch_number} đã hết hạn. Số lượng còn lại: ${batch.quantity}. Cần xử lý tiêu hủy/trả hàng.`,
          created_by: userId,
          date: new Date()
        }
      });

      return updatedBatch;
    });

    return {
      success: true,
      data: result,
      message: `Đã đánh dấu lô hàng hết hạn. Số lượng ${batch.quantity} cần được xử lý (tiêu hủy/trả hàng).`,
      warning: batch.quantity > 0 ? `Còn ${batch.quantity} sản phẩm trong lô cần xử lý` : null
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Dispose expired batch - Tiêu hủy lô hàng hết hạn
 * Đây là action thực sự trừ stock khỏi inventory
 */
export const disposeExpiredBatch = async (id, userId, disposalNote = 'Tiêu hủy hàng hết hạn') => {
  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id: Number(id) }
    });

    if (!batch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    if (batch.status !== 'expired') {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể tiêu hủy lô hàng đã được đánh dấu hết hạn'
      };
    }

    if (batch.quantity === 0) {
      return {
        success: false,
        status: 400,
        error: 'Lô hàng không còn số lượng để tiêu hủy'
      };
    }

    const quantityToDispose = batch.quantity;

    const result = await prisma.$transaction(async (tx) => {
      // Set batch quantity to 0 and mark as disposed
      const updatedBatch = await tx.productBatch.update({
        where: { id: Number(id) },
        data: {
          quantity: 0,
          status: 'disposed',
          note: `${batch.note || ''}\n[${new Date().toISOString()}] Đã tiêu hủy: ${disposalNote}`,
          updated_at: new Date()
        }
      });

      // Deduct from inventory - THIS is the actual stock movement
      await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: batch.branch_id,
            product_id: batch.product_id
          }
        },
        data: {
          stock: { decrement: quantityToDispose },
          last_updated: new Date()
        }
      });

      // Create inventory log for actual disposal
      // ✅ FIX #25: Số DƯƠNG với type DISPOSAL (convention mới)
      await tx.inventoryLog.create({
        data: {
          branch_id: batch.branch_id,
          product_id: batch.product_id,
          quantity: quantityToDispose,  // ✅ Số DƯƠNG
          type: 'DISPOSAL',             // ✅ Type cho biết chiều xuất kho
          batch_id: batch.id,
          reference_type: 'batch_disposal',
          reference_id: batch.id,
          note: `Tiêu hủy lô ${batch.batch_number}: ${disposalNote}`,
          created_by: userId,
          date: new Date()
        }
      });

      return updatedBatch;
    }, {
      timeout: 15000
    });

    return {
      success: true,
      data: result,
      message: `Đã tiêu hủy ${quantityToDispose} sản phẩm từ lô ${batch.batch_number}`
    };
  } catch (error) {
    throw error;
  }
};

// Get batches expiring soon (within days)
export const getBatchesExpiringSoon = async (days = 30) => {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const batches = await prisma.productBatch.findMany({
      where: {
        status: 'active',
        expiry_date: {
          gte: new Date(),
          lte: endDate
        }
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            image_url: true
          }
        },
        branchinventory: {
          include: {
            branches: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: {
        expiry_date: 'asc'
      }
    });

    return {
      success: true,
      data: batches
    };
  } catch (error) {
    throw error;
  }
};

// Delete product batch (only if no transactions)
export const deleteProductBatch = async (id) => {
  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id: Number(id) },
      include: {
        inventoryLog: true
      }
    });

    if (!batch) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy lô hàng'
      };
    }

    // Check if there are any transactions
    if (batch.inventoryLog && batch.inventoryLog.length > 0) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa lô hàng đã có giao dịch. Hãy đánh dấu hết hạn thay vì xóa.'
      };
    }

    await prisma.productBatch.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Đã xóa lô hàng thành công'
    };
  } catch (error) {
    throw error;
  }
};
