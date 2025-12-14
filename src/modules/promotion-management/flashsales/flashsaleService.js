import prisma from '../../../config/db.js';
import { getCurrentUTC, parseVNDateInput } from '../../../utils/timezone.js';

// Lấy tất cả flashsale
export const getAllFlashsales = async ({ page = 1, limit = 10 }) => {
  try {
    const [flashsales, total] = await Promise.all([
      prisma.flashsales.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          flashsale_products: {
            select: {
              id: true,
              flash_price: true,
              stock_limit: true,
              sold_count: true,
              products: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image_url: true
                }
              }
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
    const now = getCurrentUTC(); // Use UTC for database comparison

    console.log('[GET ACTIVE FLASHSALE] Current UTC:', now.toISOString());

    const flashsale = await prisma.flashsales.findFirst({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: 'active'
      },
      include: {
        flashsale_products: {
          include: {
            products: true
          }
        }
      }
    });

    if (flashsale) {
      console.log('[GET ACTIVE FLASHSALE] Found:', {
        id: flashsale.id,
        name: flashsale.name,
        start_time: flashsale.start_time.toISOString(),
        end_time: flashsale.end_time.toISOString()
      });
    } else {
      console.log('[GET ACTIVE FLASHSALE] No active flashsale found');
    }

    return {
      success: true,
      data: flashsale
    };
  } catch (error) {
    throw error;
  }
};

// Lấy flashsale theo ID
export const getFlashsaleById = async (id) => {
  try {
    const flashsale = await prisma.flashsales.findUnique({
      where: { id },
      include: {
        flashsale_products: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                image_url: true,
                sku: true
              }
            }
          }
        }
      }
    });

    if (!flashsale) {
      return {
        success: false,
        error: 'Không tìm thấy flashsale'
      };
    }

    return {
      success: true,
      data: flashsale
    };
  } catch (error) {
    throw error;
  }
};

// Tạo flashsale mới
// ✅ FIX #9: Set initial status dựa trên thời gian
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
    const startTimeUTC = parseVNDateInput(start_time);
    const endTimeUTC = parseVNDateInput(end_time);

    console.log('[CREATE FLASHSALE] Input times:');
    console.log('  Start input:', start_time);
    console.log('  Start UTC:', startTimeUTC.toISOString());
    console.log('  End input:', end_time);
    console.log('  End UTC:', endTimeUTC.toISOString());

    if (startTimeUTC >= endTimeUTC) {
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
            start_time: { lte: startTimeUTC },
            end_time: { gte: startTimeUTC }
          },
          {
            start_time: { lte: endTimeUTC },
            end_time: { gte: endTimeUTC }
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

    // ✅ FIX #9: Xác định initial status dựa trên thời gian hiện tại
    const now = getCurrentUTC();
    let initialStatus = 'pending';

    if (endTimeUTC < now) {
      // Flashsale đã kết thúc (trường hợp tạo flashsale với thời gian quá khứ)
      initialStatus = 'ended';
    } else if (startTimeUTC <= now && endTimeUTC >= now) {
      // Flashsale đang diễn ra
      initialStatus = 'active';
    }
    // Còn lại là 'pending' (flashsale trong tương lai)

    console.log('[CREATE FLASHSALE] Initial status:', initialStatus);

    const flashsale = await prisma.flashsales.create({
      data: {
        name,
        description,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        status: initialStatus,  // ✅ FIX #9: Set status đúng
        flashsale_products: {
          create: products.map(p => ({
            product_id: p.product_id,
            flash_price: p.flash_price,
            stock_limit: p.stock_limit
          }))
        }
      },
      include: {
        flashsale_products: {
          include: {
            products: true
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
    const { name, description, start_time, end_time, status, products } = data;

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
    if (products && Array.isArray(products)) {
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

    // Validate thời gian nếu có cập nhật
    const newStartTime = start_time ? parseVNDateInput(start_time) : existing.start_time;
    const newEndTime = end_time ? parseVNDateInput(end_time) : existing.end_time;

    console.log('[UPDATE FLASHSALE] Times:');
    if (start_time) console.log('  New Start UTC:', newStartTime.toISOString());
    if (end_time) console.log('  New End UTC:', newEndTime.toISOString());

    if (newStartTime >= newEndTime) {
      return {
        success: false,
        error: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      };
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (start_time) updateData.start_time = newStartTime;
    if (end_time) updateData.end_time = newEndTime;
    if (status !== undefined) updateData.status = status;

    // Cập nhật thông tin cơ bản
    await prisma.flashsales.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Nếu có cập nhật sản phẩm
    if (products && Array.isArray(products) && products.length > 0) {
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
          stock_limit: p.stock_limit,
          sold_count: p.sold_count || 0
        }))
      });
    }

    // Lấy flashsale đã cập nhật với đầy đủ thông tin
    const updatedFlashsale = await prisma.flashsales.findUnique({
      where: { id: Number(id) },
      include: {
        flashsale_products: {
          include: {
            products: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedFlashsale,
      message: 'Cập nhật flashsale thành công'
    };
  } catch (error) {
    console.error('[FLASHSALE SERVICE ERROR]', error);
    throw error;
  }
};

// Xóa flashsale
export const deleteFlashsale = async (id) => {
  try {
    // Kiểm tra flashsale tồn tại trước khi xóa
    const existing = await prisma.flashsales.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return {
        success: false,
        error: 'Không tìm thấy flashsale với ID này'
      };
    }

    await prisma.flashsales.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      message: 'Đã xóa flashsale thành công'
    };
  } catch (error) {
    console.error('[DELETE FLASHSALE ERROR]', error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Không tìm thấy flashsale để xóa'
      };
    }

    throw error;
  }
};

// Kiểm tra và cập nhật trạng thái các flashsale
export const updateFlashsaleStatuses = async () => {
  try {
    const now = getCurrentUTC(); // Use UTC for consistency

    console.log('[UPDATE STATUSES] Current UTC:', now.toISOString());

    // Cập nhật các flashsale đã kết thúc
    const ended = await prisma.flashsales.updateMany({
      where: {
        end_time: { lt: now },
        status: { not: 'ended' }
      },
      data: {
        status: 'ended'
      }
    });

    // Cập nhật các flashsale đang diễn ra
    const activated = await prisma.flashsales.updateMany({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: 'pending'
      },
      data: {
        status: 'active'
      }
    });

    if (ended.count > 0 || activated.count > 0) {
      console.log(`[UPDATE STATUSES] Ended: ${ended.count}, Activated: ${activated.count}`);
    }
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