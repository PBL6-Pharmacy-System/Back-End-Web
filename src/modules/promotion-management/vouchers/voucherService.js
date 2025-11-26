import prisma from '../../../config/db.js';

const validateVoucherData = (data) => {
  const errors = [];
  
  if (!data.code?.trim()) {
    errors.push('Mã voucher là bắt buộc');
  }

  if (!data.discount_type) {
    errors.push('Loại giảm giá là bắt buộc');
  } else if (!['fixed', 'percentage'].includes(data.discount_type)) {
    errors.push('Loại giảm giá không hợp lệ. Chỉ chấp nhận "fixed" hoặc "percentage"');
  }

  if (!data.discount_value) {
    errors.push('Giá trị giảm giá là bắt buộc');
  } else if (data.discount_type === 'percentage' && (Number(data.discount_value) <= 0 || Number(data.discount_value) > 100)) {
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

// ========================================
// PUBLIC APIs - User có thể gọi
// ========================================

/**
 * Lấy danh sách vouchers đang active (cho user)
 * Chỉ trả về vouchers còn hạn và còn lượt dùng
 */
export const getAvailableVouchers = async ({ 
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
        code: { contains: search, mode: 'insensitive' }
      }),
      // Chỉ lấy vouchers đang active
      start_date: { lte: now },
      end_date: { gte: now }
    };

    // Lấy tất cả vouchers thỏa điều kiện date, sau đó filter trong code
    const [allVouchers, total] = await Promise.all([
      prisma.vouchers.findMany({
        where,
        select: {
          id: true,
          code: true,
          discount_type: true,
          discount_value: true,
          min_order_value: true,
          start_date: true,
          end_date: true,
          usage_limit: true,
          used_count: true,
          created_at: true,
        },
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.vouchers.count({ where })
    ]);

    // Filter vouchers còn lượt dùng
    const vouchers = allVouchers.filter(v => 
      v.usage_limit === null || v.used_count < v.usage_limit
    );

    // Apply pagination sau khi filter
    const paginatedVouchers = vouchers.slice((page - 1) * limit, page * limit);
    const filteredTotal = vouchers.length;
    
    return {
      success: true,
      data: {
        vouchers: paginatedVouchers,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(filteredTotal / limit),
          totalRecords: filteredTotal
        }
      }
    };
  } catch (error) {
    console.error('Error in getAvailableVouchers:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy danh sách voucher',
      status: 500
    };
  }
};

/**
 * Validate voucher code trước khi checkout
 * Trả về thông tin voucher và discount estimate
 */
export const validateVoucherForUse = async (code, orderAmount = 0) => {
  try {
    const voucher = await prisma.vouchers.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!voucher) {
      return {
        success: false,
        error: 'Mã voucher không tồn tại',
        status: 404
      };
    }

    // Check date range
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    endDate.setHours(23, 59, 59, 999);

    if (now < startDate) {
      return {
        success: false,
        error: `Voucher chưa có hiệu lực. Bắt đầu từ ${startDate.toLocaleDateString('vi-VN')}`,
        status: 400
      };
    }

    if (now > endDate) {
      return {
        success: false,
        error: 'Mã voucher đã hết hạn',
        status: 400
      };
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return {
        success: false,
        error: 'Mã voucher đã hết lượt sử dụng',
        status: 400
      };
    }

    // Check minimum order value
    if (voucher.min_order_value && orderAmount > 0 && orderAmount < voucher.min_order_value) {
      return {
        success: false,
        error: `Đơn hàng phải có giá trị tối thiểu ${Number(voucher.min_order_value).toLocaleString('vi-VN')} VNĐ`,
        status: 400
      };
    }

    // Calculate estimated discount
    let estimatedDiscount = 0;
    if (orderAmount > 0) {
      if (voucher.discount_type === 'percentage') {
        estimatedDiscount = (orderAmount * Number(voucher.discount_value)) / 100;
      } else {
        estimatedDiscount = Number(voucher.discount_value);
      }
    }

    return {
      success: true,
      data: {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          discount_type: voucher.discount_type,
          discount_value: voucher.discount_value,
          min_order_value: voucher.min_order_value,
          start_date: voucher.start_date,
          end_date: voucher.end_date
        },
        isValid: true,
        estimatedDiscount: orderAmount > 0 ? estimatedDiscount : null,
        message: 'Voucher hợp lệ'
      }
    };
  } catch (error) {
    console.error('Error in validateVoucherForUse:', error);
    return {
      success: false,
      error: 'Lỗi khi kiểm tra voucher',
      status: 500
    };
  }
};

// ========================================
// SHARED APIs
// ========================================

export const getVoucherById = async (id) => {
  try {
    const voucher = await prisma.vouchers.findUnique({
      where: { id: Number(id) },
      include: {
        orders: {
          select: {
            id: true,
            order_date: true,
            total_amount: true,
            final_amount: true
          },
          take: 10, // Chỉ lấy 10 orders gần nhất
          orderBy: {
            order_date: 'desc'
          }
        }
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
    console.error('Error in getVoucherById:', error);
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
      where: { code: code.trim().toUpperCase() }
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
    console.error('Error in getVoucherByCode:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy thông tin voucher',
      status: 500
    };
  }
};

// ========================================
// ADMIN APIs
// ========================================

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
        code: { contains: search, mode: 'insensitive' }
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
          _count: {
            select: { orders: true }
          }
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
    console.error('Error in getAllVouchers:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy danh sách voucher',
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

    const voucherCode = data.code.trim().toUpperCase();

    const existingVoucher = await prisma.vouchers.findUnique({
      where: { code: voucherCode }
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
        code: voucherCode,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        min_order_value: data.min_order_value ? Number(data.min_order_value) : null,
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
        used_count: 0,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date)
      }
    });

    return {
      success: true,
      data: voucher,
      message: 'Tạo voucher thành công'
    };
  } catch (error) {
    console.error('Error in createVoucher:', error);
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
    if (data.code && data.code.trim().toUpperCase() !== existingVoucher.code) {
      const codeExists = await prisma.vouchers.findFirst({
        where: {
          code: data.code.trim().toUpperCase(),
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
      ...(data.code && { code: data.code.trim().toUpperCase() }),
      ...(data.discount_type && { discount_type: data.discount_type }),
      ...(data.discount_value !== undefined && { discount_value: Number(data.discount_value) }),
      ...(data.min_order_value !== undefined && { min_order_value: data.min_order_value ? Number(data.min_order_value) : null }),
      ...(data.usage_limit !== undefined && { usage_limit: data.usage_limit ? Number(data.usage_limit) : null }),
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
      data: updateData
    });

    return {
      success: true,
      data: updatedVoucher,
      message: 'Cập nhật voucher thành công'
    };
  } catch (error) {
    console.error('Error in updateVoucher:', error);
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
        _count: {
          select: { orders: true }
        }
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
    if (existingVoucher._count.orders > 0) {
      return {
        success: false,
        error: `Không thể xóa voucher đã được sử dụng trong ${existingVoucher._count.orders} đơn hàng. Bạn có thể vô hiệu hóa bằng cách đặt end_date về quá khứ.`,
        status: 400
      };
    }

    await prisma.vouchers.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Xóa voucher thành công'
    };
  } catch (error) {
    console.error('Error in deleteVoucher:', error);
    return {
      success: false,
      error: 'Lỗi khi xóa voucher',
      status: 500
    };
  }
};