import prisma from '../../../config/db.js';

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

    // Update batch and inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update batch status
      const updatedBatch = await tx.productBatch.update({
        where: { id: Number(id) },
        data: {
          status: 'expired',
          updated_at: new Date()
        }
      });

      // Deduct from inventory if there's remaining quantity
      if (batch.quantity > 0) {
        await tx.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: batch.branch_id,
              product_id: batch.product_id
            }
          },
          data: {
            stock: { decrement: batch.quantity },
            last_updated: new Date()
          }
        });

        // Create inventory log
        await tx.inventoryLog.create({
          data: {
            branch_id: batch.branch_id,
            product_id: batch.product_id,
            quantity: -batch.quantity,
            type: 'DAMAGE',
            batch_id: batch.id,
            reference_type: 'batch_expired',
            reference_id: batch.id,
            note: `Hủy lô hàng hết hạn ${batch.batch_number}`,
            created_by: userId,
            date: new Date()
          }
        });
      }

      return updatedBatch;
    });

    return {
      success: true,
      data: result,
      message: 'Đã đánh dấu lô hàng hết hạn và điều chỉnh tồn kho'
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
