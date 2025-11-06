import prisma from '../config/db.js';

const validateVoucherData = (data) => {
  const errors = [];
  
  if (!data.code?.trim()) {
    errors.push('Mã voucher là bắt buộc');
  }

  if (!data.discount_type) {
    errors.push('Loại giảm giá là bắt buộc');
  } else if (!['amount', 'percent'].includes(data.discount_type)) {
    errors.push('Loại giảm giá không hợp lệ. Chỉ chấp nhận "amount" hoặc "percent"');
  }

  if (!data.discount_value) {
    errors.push('Giá trị giảm giá là bắt buộc');
  } else if (data.discount_type === 'percent' && (Number(data.discount_value) <= 0 || Number(data.discount_value) > 100)) {
    errors.push('Giá trị phần trăm giảm giá phải từ 1 đến 100');
  }

  if (!data.start_date || !data.end_date) {
    errors.push('Ngày bắt đầu và kết thúc là bắt buộc');
  } else {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (endDate <= startDate) {
      errors.push('Ngày kết thúc phải sau ngày bắt đầu');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

export const getAllVouchers = async ({ 
  includeExpired = false,
  page = 1,
  limit = 10,
  search,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) => {
  try {
    const now = new Date();
    const where = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(!includeExpired && {
        end_date: { gte: now }
      })
    };

    const [vouchers, total] = await Promise.all([
      prisma.vouchers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orders: true
        },
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.vouchers.count({ where })
    ]);
    
    return {
      success: true,
      data: {
        vouchers,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi lấy danh sách voucher',
      status: 500
    };
  }
};

export const getVoucherById = async (id) => {
  try {
    const voucher = await prisma.vouchers.findUnique({
      where: { id: Number(id) },
      include: {
        orders: true
      }
    });

    if (!voucher) {
      return {
        success: false,
        error: 'Không tìm thấy voucher',
        status: 404
      };
    }

    return {
      success: true,
      data: voucher
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi lấy thông tin voucher',
      status: 500
    };
  }
};

export const getVoucherByCode = async (code) => {
  try {
    const voucher = await prisma.vouchers.findUnique({
      where: { code },
      include: {
        orders: true
      }
    });

    if (!voucher) {
      return {
        success: false,
        error: 'Không tìm thấy voucher',
        status: 404
      };
    }

    return {
      success: true,
      data: voucher
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi lấy thông tin voucher',
      status: 500
    };
  }
};

export const createVoucher = async (data) => {
  try {
    const validation = validateVoucherData(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        status: 400
      };
    }

    const existingVoucher = await prisma.vouchers.findUnique({
      where: { code: data.code.trim() }
    });

    if (existingVoucher) {
      return {
        success: false,
        error: 'Mã voucher đã tồn tại',
        status: 409
      };
    }

    const voucher = await prisma.vouchers.create({
      data: {
        code: data.code.trim(),
        description: data.description?.trim(),
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        min_order_value: data.min_order_value ? Number(data.min_order_value) : undefined,
        usage_limit: data.usage_limit ? Number(data.usage_limit) : undefined,
        used_count: 0,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date)
      },
      include: {
        orders: true
      }
    });

    return {
      success: true,
      data: voucher
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi tạo voucher mới',
      status: 500
    };
  }
};

export const updateVoucher = async (id, data) => {
  try {
    const existingVoucher = await prisma.vouchers.findUnique({
      where: { id: Number(id) }
    });

    if (!existingVoucher) {
      return {
        success: false,
        error: 'Không tìm thấy voucher',
        status: 404
      };
    }

    // Validate if code is being changed
    if (data.code && data.code !== existingVoucher.code) {
      const codeExists = await prisma.vouchers.findFirst({
        where: {
          code: data.code.trim(),
          id: { not: Number(id) }
        }
      });

      if (codeExists) {
        return {
          success: false,
          error: 'Mã voucher đã tồn tại',
          status: 409
        };
      }
    }

    const updateData = {
      ...(data.code && { code: data.code.trim() }),
      ...(data.description && { description: data.description.trim() }),
      ...(data.discount_type && { discount_type: data.discount_type }),
      ...(data.discount_value && { discount_value: Number(data.discount_value) }),
      ...(data.min_order_value && { min_order_value: Number(data.min_order_value) }),
      ...(data.usage_limit && { usage_limit: Number(data.usage_limit) }),
      ...(data.start_date && { start_date: new Date(data.start_date) }),
      ...(data.end_date && { end_date: new Date(data.end_date) })
    };

    // Validate update data
    const validation = validateVoucherData({
      ...existingVoucher,
      ...updateData
    });

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        status: 400
      };
    }

    const updatedVoucher = await prisma.vouchers.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        orders: true
      }
    });

    return {
      success: true,
      data: updatedVoucher
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi cập nhật voucher',
      status: 500
    };
  }
};

export const deleteVoucher = async (id) => {
  try {
    const existingVoucher = await prisma.vouchers.findUnique({
      where: { id: Number(id) },
      include: {
        orders: true
      }
    });

    if (!existingVoucher) {
      return {
        success: false,
        error: 'Không tìm thấy voucher',
        status: 404
      };
    }

    // Check if voucher can be deleted
    if (existingVoucher.orders.length > 0) {
      return {
        success: false,
        error: 'Không thể xóa voucher đã được sử dụng trong đơn hàng',
        status: 400
      };
    }

    const deletedVoucher = await prisma.vouchers.delete({
      where: { id: Number(id) },
      include: {
        orders: true
      }
    });

    return {
      success: true,
      data: deletedVoucher
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi xóa voucher',
      status: 500
    };
  }
};

export const applyVoucher = async (orderId, voucherCode) => {
  try {
    const voucherResult = await getVoucherByCode(voucherCode);
    if (!voucherResult.success) {
      return voucherResult;
    }
    const voucher = voucherResult.data;

    const now = new Date();
    if (now < voucher.start_date || now > voucher.end_date) {
      return {
        success: false,
        error: 'Voucher hết hạn',
        status: 400
      };
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return {
        success: false,
        error: 'Voucher đã hết lượt sử dụng',
        status: 400
      };
    }

    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        orderItems: true,
        voucher: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Đơn hàng không tồn tại',
        status: 404
      };
    }

    if (voucher.min_order_value && order.total_amount < voucher.min_order_value) {
      return {
        success: false,
        error: 'Đơn hàng chưa đủ điều kiện áp dụng voucher',
        status: 400
      };
    }

    if (order.voucher_id) {
      return {
        success: false,
        error: 'Đơn hàng đã áp dụng voucher khác',
        status: 400
      };
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discount_type === 'percent') {
      discount = order.total_amount * (Number(voucher.discount_value) / 100);
    } else {
      discount = Number(voucher.discount_value);
    }

    const finalAmount = Math.max(0, order.total_amount - discount);

    // Update order and voucher in transaction
    const result = await prisma.$transaction([
      prisma.orders.update({
        where: { id: Number(orderId) },
        data: {
          voucher_id: voucher.id,
          discount_amount: discount,
          final_amount: finalAmount
        },
        include: {
          orderItems: true,
          voucher: true
        }
      }),
      prisma.vouchers.update({
        where: { id: voucher.id },
        data: {
          used_count: { increment: 1 }
        }
      })
    ]);

    return {
      success: true,
      data: {
        order: result[0],
        discount,
        finalAmount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Lỗi khi áp dụng voucher',
      status: 500
    };
  }
};