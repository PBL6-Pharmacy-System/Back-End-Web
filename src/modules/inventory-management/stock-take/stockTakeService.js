import prisma from '../../../config/db.js';

// Generate unique stock take number
const generateStockTakeNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  // Count stock takes this month
  const startOfMonth = new Date(year, today.getMonth(), 1);
  const endOfMonth = new Date(year, today.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.stockTake.count({
    where: {
      start_date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `ST${year}${month}${sequence}`;
};

// Create new stock take
export const createStockTake = async (data, userId) => {
  try {
    const { branch_id, note } = data;

    if (!branch_id) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin chi nhánh'
      };
    }

    // Check if branch exists
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branch_id) }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    // Check if there's already an in-progress stock take for this branch
    const existingStockTake = await prisma.stockTake.findFirst({
      where: {
        branch_id: Number(branch_id),
        status: 'in_progress'
      }
    });

    if (existingStockTake) {
      return {
        success: false,
        status: 400,
        error: 'Chi nhánh này đang có phiếu kiểm kê chưa hoàn thành'
      };
    }

    // Generate stock take number
    const stockTakeNo = await generateStockTakeNumber();

    // Get all inventory items for this branch
    const inventoryItems = await prisma.branchinventory.findMany({
      where: {
        branch_id: Number(branch_id)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });

    if (inventoryItems.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Chi nhánh không có sản phẩm nào để kiểm kê'
      };
    }

    // Create stock take and items in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock take
      const stockTake = await tx.stockTake.create({
        data: {
          branch_id: Number(branch_id),
          stock_take_no: stockTakeNo,
          status: 'in_progress',
          started_by: userId,
          start_date: new Date(),
          note
        },
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          users_stockTake_started_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        }
      });

      // ✅ FIX: Use createMany instead of individual creates to avoid timeout
      // Create stock take items for all products in one batch operation
      const itemsData = inventoryItems.map(item => ({
        stock_take_id: stockTake.id,
        product_id: item.product_id,
        branch_id: Number(branch_id),
        system_qty: item.stock,
        actual_qty: null,
        variance: null,
        variance_value: null
      }));

      const { count } = await tx.stockTakeItem.createMany({
        data: itemsData
      });

      return { ...stockTake, itemCount: count };
    }, {
      timeout: 10000 // ✅ Increase timeout to 10 seconds for large datasets
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

// Get all stock takes with filters
export const getAllStockTakes = async (filters) => {
  try {
    const {
      branch_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = filters;

    const where = {};

    if (branch_id) {
      where.branch_id = Number(branch_id);
    }

    if (status) {
      where.status = status;
    }

    if (start_date && end_date) {
      where.start_date = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    const [stockTakes, total] = await Promise.all([
      prisma.stockTake.findMany({
        where,
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          users_stockTake_started_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          users_stockTake_completed_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          _count: {
            select: {
              stockTakeItem: true
            }
          }
        },
        orderBy: {
          start_date: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.stockTake.count({ where })
    ]);

    return {
      success: true,
      data: {
        stockTakes,
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

// Get stock take by ID
export const getStockTakeById = async (id) => {
  try {
    const stockTake = await prisma.stockTake.findUnique({
      where: { id: Number(id) },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        users_stockTake_started_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        users_stockTake_completed_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        stockTakeItem: {
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
            product_id: 'asc'
          }
        }
      }
    });

    if (!stockTake) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu kiểm kê'
      };
    }

    // Calculate statistics
    const stats = {
      totalItems: stockTake.stockTakeItem.length,
      completedItems: stockTake.stockTakeItem.filter(item => item.actual_qty !== null).length,
      itemsWithVariance: stockTake.stockTakeItem.filter(item => item.variance !== null && item.variance !== 0).length,
      totalVarianceValue: stockTake.stockTakeItem.reduce((sum, item) => sum + (Number(item.variance_value) || 0), 0)
    };

    return {
      success: true,
      data: {
        ...stockTake,
        stats
      }
    };
  } catch (error) {
    throw error;
  }
};

// Update stock take item with actual quantity
export const updateStockTakeItem = async (stockTakeId, itemId, data) => {
  try {
    const { actual_qty, reason, note } = data;

    if (actual_qty === undefined || actual_qty === null) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu số lượng thực tế'
      };
    }

    if (actual_qty < 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng thực tế không được âm'
      };
    }

    // Check if stock take exists and is in progress
    const stockTake = await prisma.stockTake.findUnique({
      where: { id: Number(stockTakeId) }
    });

    if (!stockTake) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu kiểm kê'
      };
    }

    if (stockTake.status !== 'in_progress') {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể cập nhật phiếu kiểm kê đang thực hiện'
      };
    }

    // Get stock take item
    const item = await prisma.stockTakeItem.findUnique({
      where: { id: Number(itemId) },
      include: {
        products: {
          select: {
            price: true
          }
        }
      }
    });

    if (!item) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy mục kiểm kê'
      };
    }

    if (item.stock_take_id !== Number(stockTakeId)) {
      return {
        success: false,
        status: 400,
        error: 'Mục kiểm kê không thuộc phiếu kiểm kê này'
      };
    }

    // Calculate variance
    const variance = Number(actual_qty) - item.system_qty;
    const varianceValue = variance * Number(item.products.price);

    // Update item
    const updatedItem = await prisma.stockTakeItem.update({
      where: { id: Number(itemId) },
      data: {
        actual_qty: Number(actual_qty),
        variance,
        variance_value: varianceValue,
        reason,
        note,
        updated_at: new Date()
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
      }
    });

    return {
      success: true,
      data: updatedItem
    };
  } catch (error) {
    throw error;
  }
};

// Complete stock take
// ⚠️ IMPORTANT: Khi hoàn thành kiểm kê, cần điều chỉnh CẢ inventory VÀ batch quantities
export const completeStockTake = async (id, userId) => {
  try {
    // Get stock take with items
    const stockTake = await prisma.stockTake.findUnique({
      where: { id: Number(id) },
      include: {
        stockTakeItem: {
          include: {
            products: true
          }
        }
      }
    });

    if (!stockTake) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu kiểm kê'
      };
    }

    if (stockTake.status !== 'in_progress') {
      return {
        success: false,
        status: 400,
        error: 'Phiếu kiểm kê không ở trạng thái đang thực hiện'
      };
    }

    // Check if all items have actual_qty
    const incompleteItems = stockTake.stockTakeItem.filter(item => item.actual_qty === null);
    if (incompleteItems.length > 0) {
      return {
        success: false,
        status: 400,
        error: `Còn ${incompleteItems.length} sản phẩm chưa được kiểm đếm`,
        incompleteItems: incompleteItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products.name
        }))
      };
    }

    // Process completion in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update stock take status
      const completedStockTake = await tx.stockTake.update({
        where: { id: Number(id) },
        data: {
          status: 'completed',
          completed_by: userId,
          complete_date: new Date()
        },
        include: {
          branches: true,
          users_stockTake_completed_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        }
      });

      // Process items with variance
      const itemsWithVariance = stockTake.stockTakeItem.filter(item => item.variance !== 0);
      const batchAdjustments = [];

      for (const item of itemsWithVariance) {
        // Update branch inventory
        await tx.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: item.branch_id,
              product_id: item.product_id
            }
          },
          data: {
            stock: item.actual_qty,
            last_stock_take: new Date(),
            last_updated: new Date()
          }
        });

        // ⚠️ CRITICAL: Also adjust batch quantities to maintain consistency
        // Get all active batches for this product at this branch
        const batches = await tx.productBatch.findMany({
          where: {
            branch_id: item.branch_id,
            product_id: item.product_id,
            status: { in: ['active', 'expired'] }, // Include expired but not disposed
            quantity: { gt: 0 }
          },
          orderBy: [
            { expiry_date: 'asc' }, // FEFO order
            { created_at: 'asc' }
          ]
        });

        // Calculate current batch total
        const currentBatchTotal = batches.reduce((sum, b) => sum + b.quantity, 0);
        const targetTotal = item.actual_qty;
        let adjustmentNeeded = targetTotal - currentBatchTotal;

        // ✅ FIX: Handle case when no batches exist - create adjustment batch
        if (batches.length === 0 && adjustmentNeeded !== 0) {
          console.warn(`[StockTake ${stockTake.stock_take_no}] No batches found for product ${item.product_id}. Creating adjustment batch.`);
          
          // Create an adjustment batch with today as manufacturing date and far future expiry
          const adjustmentBatch = await tx.productBatch.create({
            data: {
              product_id: item.product_id,
              branch_id: item.branch_id,
              batch_number: `ADJ-${stockTake.stock_take_no}-${item.product_id}`,
              quantity: item.actual_qty,
              manufacturing_date: new Date(),
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              status: 'active',
              note: `Batch điều chỉnh từ kiểm kê ${stockTake.stock_take_no}`,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          batchAdjustments.push({
            batch_id: adjustmentBatch.id,
            batch_number: adjustmentBatch.batch_number,
            adjustment: item.actual_qty,
            type: 'created'
          });

          adjustmentNeeded = 0; // Already handled
        }

        // Adjust batch quantities
        if (adjustmentNeeded !== 0 && batches.length > 0) {
          if (adjustmentNeeded > 0) {
            // Stock INCREASE after stocktake: Add to the first (oldest) batch
            // This is a simplification - in real scenario, might need to create adjustment batch
            const firstBatch = batches[0];
            await tx.productBatch.update({
              where: { id: firstBatch.id },
              data: {
                quantity: { increment: adjustmentNeeded },
                note: `${firstBatch.note || ''}\n[Kiểm kê ${stockTake.stock_take_no}] Điều chỉnh +${adjustmentNeeded}`,
                updated_at: new Date()
              }
            });
            batchAdjustments.push({
              batch_id: firstBatch.id,
              batch_number: firstBatch.batch_number,
              adjustment: adjustmentNeeded
            });
          } else {
            // Stock DECREASE after stocktake: Deduct from batches in FEFO order
            let remainingDeduction = Math.abs(adjustmentNeeded);

            for (const batch of batches) {
              if (remainingDeduction <= 0) break;

              const deductFromThis = Math.min(batch.quantity, remainingDeduction);

              await tx.productBatch.update({
                where: { id: batch.id },
                data: {
                  quantity: { decrement: deductFromThis },
                  note: `${batch.note || ''}\n[Kiểm kê ${stockTake.stock_take_no}] Điều chỉnh -${deductFromThis}`,
                  updated_at: new Date()
                }
              });

              batchAdjustments.push({
                batch_id: batch.id,
                batch_number: batch.batch_number,
                adjustment: -deductFromThis
              });

              remainingDeduction -= deductFromThis;
            }

            // If still has remaining deduction, log warning (should not happen normally)
            if (remainingDeduction > 0) {
              console.warn(`[StockTake ${stockTake.stock_take_no}] Could not fully adjust batches. Remaining: ${remainingDeduction}`);
            }
          }
        }

        // Create inventory log for adjustment
        const batchAdjustmentNote = batchAdjustments.length > 0
          ? ` | Batch adjustments: ${batchAdjustments.map(a => `${a.batch_number}(${a.adjustment > 0 ? '+' : ''}${a.adjustment})`).join(', ')}`
          : '';

        const inventoryLog = await tx.inventoryLog.create({
          data: {
            branch_id: item.branch_id,
            product_id: item.product_id,
            quantity: item.variance,
            type: 'ADJUSTMENT',
            reference_type: 'stocktake',
            reference_id: stockTake.id,
            note: `Điều chỉnh sau kiểm kê ${stockTake.stock_take_no}. ${item.reason || ''}${batchAdjustmentNote}`,
            created_by: userId,
            date: new Date()
          }
        });

        // Create junction table entry
        await tx.inventoryLog_StockTake.create({
          data: {
            inventory_log_id: inventoryLog.id,
            stock_take_id: stockTake.id
          }
        });
      }

      return { stockTake: completedStockTake, batchAdjustments };
    }, {
      timeout: 15000 // ✅ Increase timeout to 15 seconds for complex batch adjustments
    });

    return {
      success: true,
      data: result.stockTake,
      batchAdjustments: result.batchAdjustments,
      message: 'Đã hoàn thành kiểm kê và điều chỉnh tồn kho (bao gồm cả batch quantities)'
    };
  } catch (error) {
    throw error;
  }
};

// Cancel stock take
export const cancelStockTake = async (id, reason) => {
  try {
    const stockTake = await prisma.stockTake.findUnique({
      where: { id: Number(id) }
    });

    if (!stockTake) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu kiểm kê'
      };
    }

    if (stockTake.status !== 'in_progress') {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể hủy phiếu kiểm kê đang thực hiện'
      };
    }

    const cancelled = await prisma.stockTake.update({
      where: { id: Number(id) },
      data: {
        status: 'cancelled',
        note: `${stockTake.note || ''}\nLý do hủy: ${reason}`,
        complete_date: new Date()
      },
      include: {
        branches: true
      }
    });

    return {
      success: true,
      data: cancelled,
      message: 'Đã hủy phiếu kiểm kê'
    };
  } catch (error) {
    throw error;
  }
};

// Get stock take items for a specific stock take
export const getStockTakeItems = async (stockTakeId, filters = {}) => {
  try {
    const { has_variance, completed, page = 1, limit = 50 } = filters;

    const where = {
      stock_take_id: Number(stockTakeId)
    };

    if (has_variance === 'true') {
      where.variance = {
        not: 0
      };
    }

    if (completed === 'true') {
      where.actual_qty = {
        not: null
      };
    } else if (completed === 'false') {
      where.actual_qty = null;
    }

    const [items, total] = await Promise.all([
      prisma.stockTakeItem.findMany({
        where,
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
          product_id: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.stockTakeItem.count({ where })
    ]);

    return {
      success: true,
      data: {
        items,
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

// Delete stock take (only if in_progress and no items updated)
export const deleteStockTake = async (id) => {
  try {
    const stockTake = await prisma.stockTake.findUnique({
      where: { id: Number(id) },
      include: {
        stockTakeItem: true
      }
    });

    if (!stockTake) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu kiểm kê'
      };
    }

    if (stockTake.status !== 'in_progress') {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể xóa phiếu kiểm kê đang thực hiện'
      };
    }

    // Check if any items have been updated
    const updatedItems = stockTake.stockTakeItem.filter(item => item.actual_qty !== null);
    if (updatedItems.length > 0) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa phiếu kiểm kê đã có mục được cập nhật. Hãy hủy thay vì xóa.'
      };
    }

    // Delete in transaction (cascade will delete items)
    await prisma.$transaction(async (tx) => {
      await tx.stockTake.delete({
        where: { id: Number(id) }
      });
    });

    return {
      success: true,
      message: 'Đã xóa phiếu kiểm kê thành công'
    };
  } catch (error) {
    throw error;
  }
};
