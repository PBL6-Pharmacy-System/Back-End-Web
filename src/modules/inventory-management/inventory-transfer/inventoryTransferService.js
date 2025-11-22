import prisma from '../../../config/db.js';

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

    // Check if from_branch has enough stock
    const fromInventory = await prisma.branchinventory.findFirst({
      where: {
        branch_id: Number(data.from_branch_id),
        product_id: Number(data.product_id)
      }
    });

    if (!fromInventory || fromInventory.stock < data.quantity) {
      return {
        success: false,
        status: 400,
        error: 'Không đủ tồn kho để chuyển'
      };
    }

    // Create transfer request
    const transfer = await prisma.inventoryTransfer.create({
      data: {
        from_branch_id: Number(data.from_branch_id),
        to_branch_id: Number(data.to_branch_id),
        product_id: Number(data.product_id),
        quantity: Number(data.quantity),
        status: 'pending',
        requested_by: userId,
        requested_date: new Date(),
        note: data.note
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            image_url: true
          }
        },
        requestedByUser: {
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
      data: transfer
    };
  } catch (error) {
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
          requestedByUser: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          },
          approvedByUser: {
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

    // Get branch info
    const transfersWithBranches = await Promise.all(
      transfers.map(async (transfer) => {
        const [fromBranch, toBranch] = await Promise.all([
          prisma.branches.findUnique({
            where: { id: transfer.from_branch_id },
            select: { id: true, name: true, address: true }
          }),
          prisma.branches.findUnique({
            where: { id: transfer.to_branch_id },
            select: { id: true, name: true, address: true }
          })
        ]);

        return {
          ...transfer,
          fromBranch,
          toBranch
        };
      })
    );

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
        requestedByUser: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true
          }
        },
        approvedByUser: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        shippedByUser: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        },
        receivedByUser: {
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
        approvedByUser: {
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

// Ship transfer (deduct from source)
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

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source branch
      await tx.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: transfer.from_branch_id,
            product_id: transfer.product_id
          }
        },
        data: {
          stock: {
            decrement: transfer.quantity
          },
          last_updated: new Date()
        }
      });

      // Create inventory log for export
      const inventoryLogOut = await tx.inventoryLog.create({
        data: {
          branch_id: transfer.from_branch_id,
          product_id: transfer.product_id,
          quantity: -transfer.quantity,
          type: 'TRANSFER_OUT',
          reference_type: 'transfer',
          reference_id: transfer.id,
          note: `Chuyển kho đến chi nhánh ID: ${transfer.to_branch_id}`,
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

      // Update transfer status
      const updated = await tx.inventoryTransfer.update({
        where: { id: Number(id) },
        data: {
          status: 'shipped',
          shipped_by: userId,
          shipped_date: new Date(),
          tracking_number: trackingNumber
        },
        include: {
          products: true,
          shippedByUser: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        }
      });

      return updated;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

// Receive transfer (add to destination)
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
            stock: {
              increment: transfer.quantity
            },
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

      // Create inventory log for import
      const inventoryLogIn = await tx.inventoryLog.create({
        data: {
          branch_id: transfer.to_branch_id,
          product_id: transfer.product_id,
          quantity: transfer.quantity,
          type: 'TRANSFER_IN',
          reference_type: 'transfer',
          reference_id: transfer.id,
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
          products: true,
          receivedByUser: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        }
      });

      return updated;
    });

    return {
      success: true,
      data: result
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
