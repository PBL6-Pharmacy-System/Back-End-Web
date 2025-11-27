import prisma from '../../../config/db.js';

// Validate product unit data
const validateProductUnitData = async (data, unitId = null, checkRequired = true) => {
  // Validate required fields
  if (checkRequired) {
    if (!data.product_id || !data.unit_name?.trim() || !data.conversion_factor || !data.price) {
      return {
        success: false,
        status: 400,
        error: 'Sản phẩm, tên đơn vị, hệ số chuyển đổi và giá là bắt buộc'
      };
    }
  }

  // Validate unit name length
  if (data.unit_name && data.unit_name.length > 50) {
    return {
      success: false,
      status: 400,
      error: 'Tên đơn vị không được vượt quá 50 ký tự'
    };
  }

  // Validate conversion factor
  if (data.conversion_factor && data.conversion_factor <= 0) {
    return {
      success: false,
      status: 400,
      error: 'Hệ số chuyển đổi phải lớn hơn 0'
    };
  }

  // Validate price
  if (data.price !== undefined && data.price < 0) {
    return {
      success: false,
      status: 400,
      error: 'Giá không được âm'
    };
  }

  // Check if product exists (for create or when changing product)
  if (data.product_id) {
    const product = await validateProduct(data.product_id);
    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }
    // Note: products table doesn't have is_active field, removed that check
  }

  if (data.unit_name && data.product_id) {
    const existingUnit = await findProductUnitByName(
      data.product_id,
      data.unit_name.trim()
    );
    if (existingUnit && (!unitId || existingUnit.id !== parseInt(unitId))) {
      return {
        success: false,
        status: 409,
        error: 'Đã tồn tại đơn vị này cho sản phẩm'
      };
    }
  }

  return { success: true };
};

export const getAllProductUnits = async ({
  productId,
  search,
  page = 1,
  limit = 10,
  sortBy = 'id',
  sortOrder = 'asc'
}) => {
  try {
    const where = {};

    if (productId) {
      where.product_id = Number(productId);
    }

    if (search) {
      where.OR = [
        { unit_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, units] = await Promise.all([
      prisma.productunits.count({ where }),
      prisma.productunits.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: units,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getAllProductUnits service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy danh sách đơn vị sản phẩm'
    };
  }
};

export const getProductUnitById = async (id) => {
  try {
    const unit = await prisma.productunits.findUnique({
      where: { id: Number(id) },
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

    if (!unit) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn vị'
      };
    }

    return {
      success: true,
      data: unit
    };
  } catch (error) {
    console.error('Error in getProductUnitById service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy thông tin đơn vị sản phẩm'
    };
  }
};

export const getProductUnitsByProduct = async (productId) => {
  try {
    const units = await prisma.productunits.findMany({
      where: {
        product_id: Number(productId)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        conversion_factor: 'asc'
      }
    });

    return {
      success: true,
      data: units
    };
  } catch (error) {
    console.error('Error in getProductUnitsByProduct service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy đơn vị sản phẩm'
    };
  }
};

export const findProductUnitByName = async (productId, unitName) => {
  return prisma.productunits.findFirst({
    where: {
      product_id: Number(productId),
      unit_name: {
        equals: unitName,
        mode: 'insensitive'
      }
    }
  });
};

export const validateProduct = async (productId) => {
  return prisma.products.findUnique({
    where: { id: Number(productId) }
  });
};

/**
 * Check if unit has active orders (not cancelled)
 * Uses orderitems table with correct relation
 */
export const hasActiveOrders = async (unitId) => {
  try {
    const count = await prisma.orderitems.count({
      where: {
        unit_id: Number(unitId),
        orders: {
          status: {
            not: 'cancelled'
          }
        }
      }
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking active orders:', error);
    return false;
  }
};

/**
 * Check if unit has any orders
 */
export const hasOrders = async (unitId) => {
  try {
    const count = await prisma.orderitems.count({
      where: {
        unit_id: Number(unitId)
      }
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking orders:', error);
    return false;
  }
};

export const createProductUnit = async (data) => {
  try {
    // Validate product unit data
    const validation = await validateProductUnitData(data);
    if (!validation.success) {
      return validation;
    }

    const unit = await prisma.productunits.create({
      data: {
        product_id: Number(data.product_id),
        unit_name: data.unit_name.trim(),
        conversion_factor: Number(data.conversion_factor),
        price: Number(data.price)
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

    return {
      success: true,
      status: 201,
      data: unit,
      message: 'Tạo đơn vị sản phẩm thành công'
    };
  } catch (error) {
    console.error('Error in createProductUnit service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi tạo đơn vị sản phẩm'
    };
  }
};

export const updateProductUnit = async (id, data) => {
  try {
    // Get current unit
    const currentUnit = await getProductUnitById(id);
    if (!currentUnit.success) {
      return currentUnit;
    }

    // Validate product unit data
    const validation = await validateProductUnitData(data, id, false);
    if (!validation.success) {
      return validation;
    }

    const updatedUnit = await prisma.productunits.update({
      where: { id: Number(id) },
      data: {
        unit_name: data.unit_name?.trim(),
        conversion_factor: data.conversion_factor ? Number(data.conversion_factor) : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        updated_at: new Date()
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

    return {
      success: true,
      data: updatedUnit,
      message: 'Cập nhật đơn vị sản phẩm thành công'
    };
  } catch (error) {
    console.error('Error in updateProductUnit service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi cập nhật đơn vị sản phẩm'
    };
  }
};

export const deleteProductUnit = async (id) => {
  try {
    // Check if unit exists
    const unit = await getProductUnitById(id);
    if (!unit.success) {
      return unit;
    }

    // Check if unit has orders
    const hasOrdersCheck = await hasOrders(id);
    if (hasOrdersCheck) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa đơn vị đã có trong đơn hàng'
      };
    }

    const deletedUnit = await prisma.productunits.delete({
      where: { id: Number(id) },
      include: {
        products: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: deletedUnit,
      message: 'Xóa đơn vị sản phẩm thành công'
    };
  } catch (error) {
    console.error('Error in deleteProductUnit service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi xóa đơn vị sản phẩm'
    };
  }
};