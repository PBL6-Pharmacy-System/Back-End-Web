import prisma from '../../../config/db.js';

// Validate supplier data
const validateSupplierData = async (data, checkRequired = true) => {
  // Validate required fields
  if (checkRequired && (!data.name?.trim() || !data.address?.trim() || !data.phone)) {
    return {
      success: false,
      status: 400,
      error: 'Vui lòng điền đầy đủ thông tin bắt buộc (tên, địa chỉ, số điện thoại)'
    };
  }

  // Validate phone format if provided
  if (data.phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) {
      return {
        success: false,
        status: 400,
        error: 'Số điện thoại không hợp lệ'
      };
    }
  }

  // Validate email format if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        status: 400,
        error: 'Email không hợp lệ'
      };
    }
  }

  // Validate tax number format if provided
  if (data.tax_number) {
    const taxRegex = /^[0-9]{10,13}$/;
    if (!taxRegex.test(data.tax_number)) {
      return {
        success: false,
        status: 400,
        error: 'Mã số thuế không hợp lệ'
      };
    }
  }

  return { success: true };
};

export const getAllSuppliers = async ({
  isActive,
  search,
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'asc'
}) => {
  try {
    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ].filter(obj => Object.keys(obj).length > 0)
    };

    const [total, suppliers] = await Promise.all([
      prisma.suppliers.count({ where }),
      prisma.suppliers.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true
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
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getAllSuppliers service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy danh sách nhà cung cấp'
    };
  }
};

export const getSupplierById = async (id) => {
  try {
    const supplier = await prisma.suppliers.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            products: true,
            supplierOrder: true
          }
        }
      }
    });

    if (!supplier) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy nhà cung cấp'
      };
    }

    return {
      success: true,
      data: supplier
    };
  } catch (error) {
    console.error('Error in getSupplierById service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy thông tin nhà cung cấp'
    };
  }
};

export const createSupplier = async (data) => {
  try {
    // Validate supplier data
    const validation = await validateSupplierData(data);
    if (!validation.success) {
      return validation;
    }

    const supplier = await prisma.suppliers.create({
      data: {
        name: data.name.trim(),
        contact_info: {
          address: data.address?.trim(),
          phone: data.phone,
          email: data.email?.trim(),
          tax_number: data.tax_number,
          contact_person: data.contact_person?.trim()
        }
      },
      include: {
        _count: {
          select: {
            products: true,
            supplierOrder: true
          }
        }
      }
    });

    return {
      success: true,
      status: 201,
      data: supplier,
      message: 'Tạo nhà cung cấp thành công'
    };
  } catch (error) {
    console.error('Error in createSupplier service:', error);
    if (error.code === 'P2002') {
      return {
        success: false,
        status: 409,
        error: 'Tên nhà cung cấp đã tồn tại'
      };
    }
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi tạo nhà cung cấp mới'
    };
  }
};

export const updateSupplier = async (id, data) => {
  try {
    // Check if supplier exists
    const existingSupplier = await getSupplierById(id);
    if (!existingSupplier.success) {
      return existingSupplier;
    }

    // Validate supplier data
    const validation = await validateSupplierData(data, false);
    if (!validation.success) {
      return validation;
    }

    const supplier = await prisma.suppliers.update({
      where: { id: Number(id) },
      data: {
        name: data.name?.trim(),
        contact_info: {
          address: data.address?.trim(),
          phone: data.phone,
          email: data.email?.trim(),
          tax_number: data.tax_number,
          contact_person: data.contact_person?.trim()
        }
      },
      include: {
        _count: {
          select: {
            products: true,
            supplierOrder: true
          }
        }
      }
    });

    return {
      success: true,
      data: supplier,
      message: 'Cập nhật nhà cung cấp thành công'
    };
  } catch (error) {
    console.error('Error in updateSupplier service:', error);
    if (error.code === 'P2002') {
      return {
        success: false,
        status: 409,
        error: 'Tên nhà cung cấp đã tồn tại'
      };
    }
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi cập nhật thông tin nhà cung cấp'
    };
  }
};

export const deleteSupplier = async (id) => {
  try {
    // Check if supplier exists
    const supplier = await getSupplierById(id);
    if (!supplier.success) {
      return supplier;
    }

    // Check if supplier can be deleted
    const canDelete = await canDeleteSupplier(id);
    if (!canDelete) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa nhà cung cấp này vì có liên kết với dữ liệu khác'
      };
    }

    const deletedSupplier = await prisma.suppliers.delete({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            products: true,
            supplierOrder: true
          }
        }
      }
    });

    return {
      success: true,
      data: deletedSupplier,
      message: 'Xóa nhà cung cấp thành công'
    };
  } catch (error) {
    console.error('Error in deleteSupplier service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi xóa nhà cung cấp'
    };
  }
};

export const canDeleteSupplier = async (id) => {
  const [productsCount, supplierOrdersCount] = await Promise.all([
    prisma.products.count({
      where: { supplier_id: Number(id) }
    }),
    prisma.supplierOrder.count({
      where: { supplier_id: Number(id) }
    })
  ]);

  return productsCount === 0 && supplierOrdersCount === 0;
};

export const getSupplierProducts = async (id) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        supplier_id: Number(id)
      },
      include: {
        category: true,
        supplier: true,
        baseUnit: true,
        productUnits: true
      }
    });

    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('Error in getSupplierProducts service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy danh sách sản phẩm của nhà cung cấp'
    };
  }
};
