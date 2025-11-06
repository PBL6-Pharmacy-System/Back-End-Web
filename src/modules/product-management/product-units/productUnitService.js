
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

  // Check if product exists and is active (for create or when changing product)
  if (data.product_id) {
    const product = await validateProduct(data.product_id);
    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }
    if (!product.is_active) {
      return {
        success: false,
        status: 400,
        error: 'Sản phẩm đã bị vô hiệu hóa'
      };
    }
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
  active,
  search,
  page = 1,
  limit = 10,
  sortBy = 'id',
  sortOrder = 'asc'
}) => {
  try {
    const where = {
      AND: [
        productId ? { product_id: Number(productId) } : {},
        active !== undefined ? { is_active: active } : {},
        search ? {
          OR: [
            { unit_name: { contains: search, mode: 'insensitive' } },
            { product: { name: { contains: search, mode: 'insensitive' } } }
          ]
        } : {}
      ]
    };

    const [total, units] = await Promise.all([
      prisma.productUnits.count({ where }),
      prisma.productUnits.findMany({
        where,
        include: {
          product: true
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
    const unit = await prisma.productUnits.findUnique({
      where: { id: Number(id) },
      include: {
        product: true
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

export const findProductUnitByName = async (productId, unitName) => {
  return prisma.productUnits.findFirst({
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

export const hasBaseUnit = async (productId) => {
  const count = await prisma.productUnits.count({
    where: {
      product_id: Number(productId),
      is_base_unit: true
    }
  });
  return count > 0;
};

export const hasActiveOrders = async (unitId) => {
  const count = await prisma.orderDetails.count({
    where: {
      product_unit_id: Number(unitId),
      order: {
        status: {
          not: 'cancelled'
        }
      }
    }
  });
  return count > 0;
};

export const hasOrders = async (unitId) => {
  const count = await prisma.orderDetails.count({
    where: {
      product_unit_id: Number(unitId)
    }
  });
  return count > 0;
};

export const createProductUnit = async (data) => {
  try {
    // Validate product unit data
    const validation = await validateProductUnitData(data);
    if (!validation.success) {
      return validation;
    }

    // Check base unit constraint
    if (data.is_base_unit) {
      const hasBase = await hasBaseUnit(data.product_id);
      if (hasBase) {
        return {
          success: false,
          status: 400,
          error: 'Sản phẩm đã có đơn vị cơ sở'
        };
      }
    }

    const unit = await prisma.productUnits.create({
      data: {
        product_id: Number(data.product_id),
        unit_name: data.unit_name.trim(),
        conversion_factor: Number(data.conversion_factor),
        price: Number(data.price),
        is_base_unit: data.is_base_unit || false,
        is_active: true
      },
      include: {
        product: true
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

    // Handle base unit changes
    if (data.is_base_unit !== undefined && data.is_base_unit !== currentUnit.data.is_base_unit) {
      if (data.is_base_unit) {
        const hasBase = await hasBaseUnit(currentUnit.data.product_id);
        if (hasBase) {
          return {
            success: false,
            status: 400,
            error: 'Sản phẩm đã có đơn vị cơ sở'
          };
        }
      } else if (currentUnit.data.is_base_unit) {
        return {
          success: false,
          status: 400,
          error: 'Không thể hủy đơn vị cơ sở. Hãy chọn đơn vị cơ sở khác trước.'
        };
      }
    }

    // Handle deactivation
    if (data.is_active === false && currentUnit.data.is_active) {
      if (currentUnit.data.is_base_unit) {
        return {
          success: false,
          status: 400,
          error: 'Không thể vô hiệu hóa đơn vị cơ sở'
        };
      }

      const hasActiveOrdersCheck = await hasActiveOrders(id);
      if (hasActiveOrdersCheck) {
        return {
          success: false,
          status: 400,
          error: 'Không thể vô hiệu hóa đơn vị đang có trong đơn hàng'
        };
      }
    }

    const updatedUnit = await prisma.productUnits.update({
      where: { id: Number(id) },
      data: {
        unit_name: data.unit_name?.trim(),
        conversion_factor: data.conversion_factor ? Number(data.conversion_factor) : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        is_base_unit: data.is_base_unit,
        is_active: data.is_active
      },
      include: {
        product: true
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

    // Check if unit is base unit
    if (unit.data.is_base_unit) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa đơn vị cơ sở'
      };
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

    const deletedUnit = await prisma.productUnits.delete({
      where: { id: Number(id) },
      include: {
        product: true
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