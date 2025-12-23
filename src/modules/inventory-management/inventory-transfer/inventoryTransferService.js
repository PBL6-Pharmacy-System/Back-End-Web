import prisma from '../../../config/db.js';
import { exportStockFEFO } from '../product-batch/productBatchService.js';

// Create inventory transfer request
export const createTransferRequest = async (data, userId) => {
  try {
    // Validate required fields
    if (!data.from_branch_id || !data.to_branch_id || !data.product_id || !data.quantity) {
      return {
        success: false,
        status: 400,
        error: 'Thiếu thông tin bắt buộc'
      };
    }

    if (data.from_branch_id === data.to_branch_id) {
      return {
        success: false,
        status: 400,
        error: 'Không thể chuyển kho trong cùng chi nhánh'
      };
    }

    // Validate quantity
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng phải là số nguyên dương'
      };
    }

    if (quantity > 100000) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng chuyển kho không được vượt quá 100,000'
      };
    }

    // Validate entities exist
    const [fromBranch, toBranch, product] = await Promise.all([
      prisma.branches.findUnique({
        where: { id: Number(data.from_branch_id) },
        select: { id: true, name: true, is_active: true }
      }),
      prisma.branches.findUnique({
        where: { id: Number(data.to_branch_id) },
        select: { id: true, name: true, is_active: true }
      }),
      prisma.products.findUnique({
        where: { id: Number(data.product_id) },
        select: { id: true, name: true }
      })
    ]);

    if (!fromBranch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh nguồn không tồn tại'
      };
    }

    if (!fromBranch.is_active) {
      return {
        success: false,
        status: 400,
        error: 'Chi nhánh nguồn không còn hoạt động'
      };
    }

    if (!toBranch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh đích không tồn tại'
      };
    }

    if (!toBranch.is_active) {
      return {
        success: false,
        status: 400,
        error: 'Chi nhánh đích không còn hoạt động'
      };
    }

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    // Check if from_branch has enough stock
    const fromInventory = await prisma.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: Number(data.from_branch_id),
          product_id: Number(data.product_id)
        }
      }
    });

    if (!fromInventory) {
      return {
        success: false,
        status: 400,
        error: 'Sản phẩm không tồn tại trong kho chi nhánh nguồn'
      };
    }

    if (fromInventory.stock < quantity) {
      return {
        success: false,
        status: 400,
        error: `Không đủ tồn kho để chuyển. Hiện có: ${fromInventory.stock}, Yêu cầu: ${quantity}`
      };
    }

    // Check/Create destination branchinventory (required due to FK constraint)
    // Database has FK: inventoryTransfer(to_branch_id, product_id) -> branchinventory(branch_id, product_id)
    let toInventory = await prisma.branchinventory.findUnique({
      where: {
        branch_id_product_id: {
          branch_id: Number(data.to_branch_id),
          product_id: Number(data.product_id)
        }
      }
    });

    // If destination doesn't have this product yet, create with stock=0
    if (!toInventory) {
      toInventory = await prisma.branchinventory.create({
        data: {
          branch_id: Number(data.to_branch_id),
          product_id: Number(data.product_id),
          stock: 0,
          last_updated: new Date()
        }
      });
    }

    // Create transfer request
    const transfer = await prisma.inventoryTransfer.create({
      data: {
        from_branch_id: Number(data.from_branch_id),
        to_branch_id: Number(data.to_branch_id),
        product_id: Number(data.product_id),
        quantity: quantity,
        status: 'pending',
        requested_by: userId,
        requested_date: new Date(),
        note: data.note || null
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            image_url: true
          }
        },
        users_inventoryTransfer_requested_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        }
      }
    });

    // Add branch info to response
    return {
      success: true,
      data: {
        ...transfer,
        fromBranch: { id: fromBranch.id, name: fromBranch.name },
        toBranch: { id: toBranch.id, name: toBranch.name }
      }
    };
  } catch (error) {
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return {
        success: false,
        status: 400,
        error: 'Lỗi ràng buộc dữ liệu: Vui lòng kiểm tra chi nhánh và sản phẩm'
      };
    }
    throw error;
  }
};

// Get all transfers with filters
export const getAllTransfers = async ({ branchId, status, page = 1, limit = 20 }) => {
  try {
    const where = {};

    if (branchId) {
      where.OR = [
        { from_branch_id: Number(branchId) },
        { to_branch_id: Number(branchId) }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      prisma.inventoryTransfer.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              image_url: true,
              price: true
            }
          },
          users_inventoryTransfer_requested_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          users_inventoryTransfer_approved_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          users_inventoryTransfer_shipped_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          users_inventoryTransfer_received_byTousers: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        },
        orderBy: {
          requested_date: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryTransfer.count({ where })
    ]);

    // Get unique branch IDs
    const branchIds = [...new Set([
      ...transfers.map(t => t.from_branch_id),
      ...transfers.map(t => t.to_branch_id)
    ])];

    // Fetch branch info
    const branches = await prisma.branches.findMany({
      where: { id: { in: branchIds } },
      select: {
        id: true,
        name: true,
        address: true
      }
    });

    // Create branch lookup map
    const branchMap = branches.reduce((acc, branch) => {
      acc[branch.id] = branch;
      return acc;
    }, {});

    // Format response with branch names
    const transfersWithBranches = transfers.map(transfer => ({
      ...transfer,
      fromBranch: branchMap[transfer.from_branch_id] || null,
      toBranch: branchMap[transfer.to_branch_id] || null
    }));

    return {
      success: true,
      data: {
        transfers: transfersWithBranches,
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

// Get transfer by ID
export const getTransferById = async (id) => {
  try {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: Number(id) },
      include: {
        products: true,
        users_inventoryTransfer_requested_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true
          }
        },
        users_inventoryTransfer_approved_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        users_inventoryTransfer_shipped_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        users_inventoryTransfer_received_byTousers: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        }
      }
    });

    if (!transfer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu chuyển kho'
      };
    }

    // Get branch info
    const [fromBranch, toBranch] = await Promise.all([
      prisma.branches.findUnique({
        where: { id: transfer.from_branch_id },
        select: { id: true, name: true, address: true, phone: true }
      }),
      prisma.branches.findUnique({
        where: { id: transfer.to_branch_id },
        select: { id: true, name: true, address: true, phone: true }
      })
    ]);

    return {
      success: true,
      data: {
        ...transfer,
        fromBranch,
        toBranch
      }
    };
  } catch (error) {
    throw error;
  }
};

// Approve transfer
export const approveTransfer = async (id, userId) => {
  try {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: Number(id) }
    });

    if (!transfer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu chuyển kho'
      };
    }

    if (transfer.status !== 'pending') {
      return {
        success: false,
        status: 400,
        error: 'Chỉ có thể duyệt phiếu đang chờ'
      };
    }

    // Check stock again
    const fromInventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: transfer.from_branch_id,
        product_id: transfer.product_id
      }
    });

    if (!fromInventory || fromInventory.stock < transfer.quantity) {
      return {
        success: false,
        status: 400,
        error: 'Không đủ tồn kho để chuyển'
      };
    }

    const updated = await prisma.inventoryTransfer.update({
      where: { id: Number(id) },
      data: {
        status: 'approved',
        approved_by: userId,
        approved_date: new Date()
      },
      include: {
        products: true,
        users_inventoryTransfer_approved_byTousers: {
          select: {
            id: true,
            username: true,
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

// Ship transfer (deduct from source) - UPDATED with FEFO support
export const shipTransfer = async (id, userId, trackingNumber) => {
  try {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: Number(id) }
    });

    if (!transfer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu chuyển kho'
      };
    }

    if (transfer.status !== 'approved') {
      return {
        success: false,
        status: 400,
        error: 'Phiếu chuyển kho chưa được duyệt'
      };
    }

    // Check if batches exist for this product
    const batches = await prisma.productBatch.findMany({
      where: {
        branch_id: transfer.from_branch_id,
        product_id: transfer.product_id,
        status: 'active',
        quantity: { gt: 0 }
      }
    });

    const hasBatches = batches.length > 0;

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      let allocations = [];

      if (hasBatches) {
        // ✅ USE FEFO: Deduct from batches with earliest expiry first
        const availableBatches = batches
          .filter(b => !b.expiry_date || new Date(b.expiry_date) > new Date())
          .sort((a, b) => {
            // FEFO: earliest expiry first, null expiry last
            if (!a.expiry_date && !b.expiry_date) return 0;
            if (!a.expiry_date) return 1;
            if (!b.expiry_date) return -1;
            return new Date(a.expiry_date) - new Date(b.expiry_date);
          });

        const totalAvailable = availableBatches.reduce((sum, b) => sum + b.quantity, 0);

        if (totalAvailable < transfer.quantity) {
          throw new Error(`Không đủ hàng trong các lô. Yêu cầu: ${transfer.quantity}, Có sẵn: ${totalAvailable}`);
        }

        // Allocate from batches
        let remainingQty = transfer.quantity;
        for (const batch of availableBatches) {
          if (remainingQty <= 0) break;

          const takeQty = Math.min(batch.quantity, remainingQty);

          // Update batch quantity
          await tx.productBatch.update({
            where: { id: batch.id },
            data: {
              quantity: { decrement: takeQty },
              updated_at: new Date()
            }
          });

          allocations.push({
            batch_id: batch.id,
            batch_number: batch.batch_number,
            expiry_date: batch.expiry_date,
            allocated_qty: takeQty
          });

          remainingQty -= takeQty;
        }
      }

      // Deduct from source branch inventory
      await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: transfer.from_branch_id,
            product_id: transfer.product_id
          }
        },
        data: {
          stock: { decrement: transfer.quantity },
          last_updated: new Date()
        }
      });

      // Create inventory log for export
      // ✅ FIX #25: Số DƯƠNG với type TRANSFER_OUT (convention mới)
      const batchInfo = allocations.length > 0
        ? ` [FEFO: ${allocations.map(a => `${a.batch_number}(${a.allocated_qty})`).join(', ')}]`
        : '';

      const inventoryLogOut = await tx.inventoryLog.create({
        data: {
          branch_id: transfer.from_branch_id,
          product_id: transfer.product_id,
          quantity: transfer.quantity,           // ✅ Số DƯƠNG
          type: 'TRANSFER_OUT',                  // ✅ Type cho biết chiều xuất kho
          reference_type: 'transfer',
          reference_id: transfer.id,
          batch_id: allocations.length === 1 ? allocations[0].batch_id : null,
          note: `Chuyển kho đến chi nhánh ID: ${transfer.to_branch_id}${batchInfo}`,
          created_by: userId,
          date: new Date()
        }
      });

      // Create junction table entry
      await tx.inventoryLog_Transfer.create({
        data: {
          inventory_log_id: inventoryLogOut.id,
          transfer_id: transfer.id
        }
      });

      // Update transfer status with batch allocation info
      const updated = await tx.inventoryTransfer.update({
        where: { id: Number(id) },
        data: {
          status: 'shipped',
          shipped_by: userId,
          shipped_date: new Date(),
          tracking_number: trackingNumber,
          note: transfer.note
            ? `${transfer.note}\n[Shipped] Batches: ${JSON.stringify(allocations)}`
            : `[Shipped] Batches: ${JSON.stringify(allocations)}`
        },
        include: {
          products: true
        }
      });

      return { transfer: updated, allocations };
    });

    return {
      success: true,
      data: result.transfer,
      fefo_allocations: result.allocations,
      message: hasBatches
        ? `Đã xuất ${transfer.quantity} sản phẩm từ ${result.allocations.length} lô theo FEFO`
        : 'Đã xuất kho (không có thông tin lô)'
    };
  } catch (error) {
    if (error.message.includes('Không đủ hàng')) {
      return {
        success: false,
        status: 400,
        error: error.message
      };
    }
    throw error;
  }
};

// Receive transfer (add to destination) - UPDATED to create batch at destination
export const receiveTransfer = async (id, userId) => {
  try {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: Number(id) }
    });

    if (!transfer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu chuyển kho'
      };
    }

    if (transfer.status !== 'shipped') {
      return {
        success: false,
        status: 400,
        error: 'Phiếu chuyển kho chưa được giao'
      };
    }

    // Parse batch allocations from note (if exists)
    let sourceAllocations = [];
    if (transfer.note && transfer.note.includes('[Shipped] Batches:')) {
      try {
        const match = transfer.note.match(/\[Shipped\] Batches: (\[.*?\])/);
        if (match) {
          sourceAllocations = JSON.parse(match[1]);
        }
      } catch (e) {
        console.warn('Could not parse batch allocations from transfer note');
      }
    }

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if destination inventory exists
      const destInventory = await tx.branchinventory.findFirst({
        where: {
          branch_id: transfer.to_branch_id,
          product_id: transfer.product_id
        }
      });

      if (destInventory) {
        // Update existing
        await tx.branchinventory.update({
          where: { id: destInventory.id },
          data: {
            stock: { increment: transfer.quantity },
            last_updated: new Date()
          }
        });
      } else {
        // Create new
        await tx.branchinventory.create({
          data: {
            branch_id: transfer.to_branch_id,
            product_id: transfer.product_id,
            stock: transfer.quantity,
            last_updated: new Date()
          }
        });
      }

      // Create batch(es) at destination branch (for traceability)
      const createdBatches = [];
      if (sourceAllocations.length > 0) {
        for (const allocation of sourceAllocations) {
          // Get source batch info
          const sourceBatch = await tx.productBatch.findUnique({
            where: { id: allocation.batch_id }
          });

          if (sourceBatch) {
            // Create new batch at destination with same expiry info
            const newBatch = await tx.productBatch.create({
              data: {
                product_id: transfer.product_id,
                branch_id: transfer.to_branch_id,
                batch_number: `TRF-${transfer.id}-${allocation.batch_number}`,
                manufacture_date: sourceBatch.manufacture_date,
                expiry_date: sourceBatch.expiry_date,
                quantity: allocation.allocated_qty,
                cost_price: sourceBatch.cost_price,
                supplier_id: sourceBatch.supplier_id,
                status: 'active',
                note: `Nhận từ chuyển kho #${transfer.id} (Lô gốc: ${allocation.batch_number})`
              }
            });
            createdBatches.push(newBatch);
          }
        }
      } else {
        // No batch info, create a generic batch for traceability
        const newBatch = await tx.productBatch.create({
          data: {
            product_id: transfer.product_id,
            branch_id: transfer.to_branch_id,
            batch_number: `TRF-${transfer.id}-${Date.now()}`,
            quantity: transfer.quantity,
            status: 'active',
            note: `Nhận từ chuyển kho #${transfer.id} từ chi nhánh ${transfer.from_branch_id}`
          }
        });
        createdBatches.push(newBatch);
      }

      // Create inventory log for import
      const inventoryLogIn = await tx.inventoryLog.create({
        data: {
          branch_id: transfer.to_branch_id,
          product_id: transfer.product_id,
          quantity: transfer.quantity,
          type: 'TRANSFER_IN',
          reference_type: 'transfer',
          reference_id: transfer.id,
          batch_id: createdBatches.length === 1 ? createdBatches[0].id : null,
          note: `Nhận chuyển kho từ chi nhánh ID: ${transfer.from_branch_id}`,
          created_by: userId,
          date: new Date()
        }
      });

      // Create junction table entry
      await tx.inventoryLog_Transfer.create({
        data: {
          inventory_log_id: inventoryLogIn.id,
          transfer_id: transfer.id
        }
      });

      // Update transfer status
      const updated = await tx.inventoryTransfer.update({
        where: { id: Number(id) },
        data: {
          status: 'completed',
          received_by: userId,
          received_date: new Date()
        },
        include: {
          products: true
        }
      });

      return { transfer: updated, createdBatches };
    });

    return {
      success: true,
      data: result.transfer,
      created_batches: result.createdBatches,
      message: `Đã nhận ${transfer.quantity} sản phẩm và tạo ${result.createdBatches.length} lô hàng mới`
    };
  } catch (error) {
    throw error;
  }
};

// Cancel transfer
export const cancelTransfer = async (id, userId, reason) => {
  try {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: Number(id) }
    });

    if (!transfer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy phiếu chuyển kho'
      };
    }

    if (!['pending', 'approved'].includes(transfer.status)) {
      return {
        success: false,
        status: 400,
        error: 'Không thể hủy phiếu chuyển kho đã giao hoặc đã hoàn thành'
      };
    }

    const updated = await prisma.inventoryTransfer.update({
      where: { id: Number(id) },
      data: {
        status: 'cancelled',
        note: `${transfer.note || ''}\nLý do hủy: ${reason}`,
        updated_at: new Date()
      },
      include: {
        products: true
      }
    });

    return {
      success: true,
      data: updated,
      message: 'Đã hủy phiếu chuyển kho'
    };
  } catch (error) {
    throw error;
  }
};
