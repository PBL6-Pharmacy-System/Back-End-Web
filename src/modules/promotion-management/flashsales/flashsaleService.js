import prisma from '../../../config/db.js';

// Lấy tất cả flashsale
export const getAllFlashsales = async ({ page = 1, limit = 10 }) => {
  try {
    const [flashsales, total] = await Promise.all([
      prisma.flashsales.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            include: {
              product: true
            }
          }
        },
        orderBy: { start_time: 'desc' }
      }),
      prisma.flashsales.count()
    ]);

    return {
      success: true,
      data: {
        flashsales,
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

// Lấy flashsale đang diễn ra
export const getActiveFlashsale = async () => {
  try {
    const now = new Date();
    
    const flashsale = await prisma.flashsales.findFirst({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: 'active'
      },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });

    return {
      success: true,
      data: flashsale
    };
  } catch (error) {
    throw error;
  }
};

// Tạo flashsale mới
export const createFlashsale = async (data) => {
  try {
    const { name, description, start_time, end_time, products } = data;

      // Validate dữ liệu đầu vào
    if (!name || !start_time || !end_time || !products || !Array.isArray(products) || products.length === 0) {
      return {
        success: false,
        error: 'Thiếu thông tin bắt buộc cho flashsale'
      };
    }

    // Validate sản phẩm
    for (const product of products) {
      if (!product.product_id || !product.flash_price || !product.stock_limit) {
        return {
          success: false,
          error: 'Thiếu thông tin sản phẩm cho flashsale'
        };
      }
      if (product.flash_price <= 0 || product.stock_limit <= 0) {
        return {
          success: false,
          error: 'Giá và số lượng phải lớn hơn 0'
        };
      }
    }

    // Validate thời gian
    if (new Date(start_time) >= new Date(end_time)) {
      return {
        success: false,
        error: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      };
    }

    // Kiểm tra trùng lặp thời gian với các flashsale khác
    const overlapping = await prisma.flashsales.findFirst({
      where: {
        OR: [
          {
            start_time: { lte: new Date(start_time) },
            end_time: { gte: new Date(start_time) }
          },
          {
            start_time: { lte: new Date(end_time) },
            end_time: { gte: new Date(end_time) }
          }
        ]
      }
    });

    if (overlapping) {
      return {
        success: false,
        error: 'Thời gian đã trùng với một flashsale khác'
      };
    }

    const flashsale = await prisma.flashsales.create({
      data: {
        name,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        products: {
          create: products.map(p => ({
            product_id: p.product_id,
            flash_price: p.flash_price,
            stock_limit: p.stock_limit
          }))
        }
      },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });

    return {
      success: true,
      data: flashsale
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật flashsale
export const updateFlashsale = async (id, data) => {
  try {
    const { name, description, start_time, end_time, products } = data;

    // Kiểm tra flashsale tồn tại
    const existing = await prisma.flashsales.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return {
        success: false,
        error: 'Không tìm thấy flashsale'
      };
    }

    // Validate sản phẩm nếu có cập nhật
    if (products) {
      for (const product of products) {
        if (!product.product_id || !product.flash_price || !product.stock_limit) {
          return {
            success: false,
            error: 'Thiếu thông tin sản phẩm cho flashsale'
          };
        }
        if (product.flash_price <= 0 || product.stock_limit <= 0) {
          return {
            success: false,
            error: 'Giá và số lượng phải lớn hơn 0'
          };
        }
      }
    }

    // Cập nhật thông tin cơ bản
    const flashsale = await prisma.flashsales.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined
      }
    });

    // Nếu có cập nhật sản phẩm
    if (products && products.length > 0) {
      // Xóa các sản phẩm cũ
      await prisma.flashsale_products.deleteMany({
        where: { flashsale_id: Number(id) }
      });

      // Thêm sản phẩm mới
      await prisma.flashsale_products.createMany({
        data: products.map(p => ({
          flashsale_id: Number(id),
          product_id: p.product_id,
          flash_price: p.flash_price,
          stock_limit: p.stock_limit
        }))
      });
    }

    return {
      success: true,
      data: flashsale
    };
  } catch (error) {
    throw error;
  }
};

// Xóa flashsale
export const deleteFlashsale = async (id) => {
  try {
    await prisma.flashsales.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Đã xóa flashsale thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Kiểm tra và cập nhật trạng thái các flashsale
export const updateFlashsaleStatuses = async () => {
  try {
    const now = new Date();

    // Cập nhật các flashsale đã kết thúc
    await prisma.flashsales.updateMany({
      where: {
        end_time: { lt: now },
        status: { not: 'ended' }
      },
      data: {
        status: 'ended'
      }
    });

    // Cập nhật các flashsale đang diễn ra
    await prisma.flashsales.updateMany({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: 'pending'
      },
      data: {
        status: 'active'
      }
    });
  } catch (error) {
    throw error;
  }
};

// Mua sản phẩm trong flashsale
export const purchaseFlashsaleProduct = async (flashsaleId, productId, quantity) => {
  try {
    const flashsaleProduct = await prisma.flashsale_products.findFirst({
      where: {
        flashsale_id: Number(flashsaleId),
        product_id: Number(productId)
      }
    });

    if (!flashsaleProduct) {
      return {
        success: false,
        error: 'Sản phẩm không có trong flashsale'
      };
    }

    // Kiểm tra còn hàng không
    if (flashsaleProduct.sold_count + quantity > flashsaleProduct.stock_limit) {
      return {
        success: false,
        error: 'Số lượng sản phẩm không đủ'
      };
    }

    // Cập nhật số lượng đã bán
    await prisma.flashsale_products.update({
      where: { id: flashsaleProduct.id },
      data: {
        sold_count: {
          increment: quantity
        }
      }
    });

    return {
      success: true,
      data: {
        flash_price: flashsaleProduct.flash_price,
        quantity
      }
    };
  } catch (error) {
    throw error;
  }
};