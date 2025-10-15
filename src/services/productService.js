import { PrismaClient } from '@prisma/client';
import { validateNumericFields, validateRequiredFields } from '../utils/validation.js';

const prisma = new PrismaClient();

// Validate product data
const validateProduct = (data) => {
  // Required fields
  const requiredFields = ['name', 'price', 'base_unit_id'];
  const missingFields = validateRequiredFields(data, requiredFields);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
    };
  }

  // Validate numeric fields
  const numericFields = ['price', 'category_id', 'supplier_id', 'base_unit_id'];
  const invalidNumbers = validateNumericFields(data, numericFields);
  if (invalidNumbers.length > 0) {
    return {
      isValid: false,
      error: `Các trường sau phải là số hợp lệ: ${invalidNumbers.join(', ')}`
    };
  }

  // Validate price
  if (data.price <= 0) {
    return {
      isValid: false,
      error: 'Giá sản phẩm phải lớn hơn 0'
    };
  }

  // Validate array fields
  if (data.images && !Array.isArray(data.images)) {
    return {
      isValid: false,
      error: 'Trường images phải là một mảng'
    };
  }

  return { isValid: true };
};

// Check if product has related data and can be deleted
const canDeleteProduct = async (id) => {
  const [orderItems, cartItems] = await Promise.all([
    prisma.orderItems.count({ where: { product_id: Number(id) } }),
    prisma.cartItems.count({ where: { product_id: Number(id) } })
  ]);

  return orderItems === 0 && cartItems === 0;
};

export const getAllProducts = async ({ 
  search, 
  categoryId, 
  supplierId, 
  minPrice, 
  maxPrice,
  page = 1, 
  limit = 10 
}) => {
  try {
    const where = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.category_id = Number(categoryId);
    }

    if (supplierId) {
      where.supplier_id = Number(supplierId);
    }

    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: Number(minPrice) };
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: Number(maxPrice) };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          categories: true,
          suppliers: true,
          unittype: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.products.count({ where })
    ]);

    return {
      success: true,
      data: {
        products,
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

export const getProductById = async (id) => {
  try {
    const product = await prisma.products.findUnique({
      where: { id: Number(id) },
      include: {
      categories: true,
      suppliers: true,
      unittype: true,
      productunits: true
      }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }

    return {
      success: true,
      data: product
    };
  } catch (error) {
    throw error;
  }
};

export const createProduct = async (data) => {
  try {
    // Validate product data
    const validation = validateProduct(data);
    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Validate foreign keys existence
    const [category, supplier, baseUnit] = await Promise.all([
      data.category_id ? prisma.categories.findUnique({
        where: { id: Number(data.category_id) }
      }) : true,
      data.supplier_id ? prisma.suppliers.findUnique({
        where: { id: Number(data.supplier_id) }
      }) : true,
      prisma.productUnits.findUnique({
        where: { id: Number(data.base_unit_id) }
      })
    ]);

    if (data.category_id && !category) {
      return {
        success: false,
        status: 400,
        error: 'Danh mục không tồn tại'
      };
    }

    if (data.supplier_id && !supplier) {
      return {
        success: false,
        status: 400,
        error: 'Nhà cung cấp không tồn tại'
      };
    }

    if (!baseUnit) {
      return {
        success: false,
        status: 400,
        error: 'Đơn vị cơ bản không tồn tại'
      };
    }

    const product = await prisma.products.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        manufacturer: data.manufacturer,
        usage: data.usage,
        dosage: data.dosage,
        specification: data.specification,
        brand: data.brand,
        images: data.images || [],
        category_id: data.category_id ? Number(data.category_id) : null,
        supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
        base_unit_id: Number(data.base_unit_id),
      },
      include: {
        category: true,
        supplier: true,
        baseUnit: true
      }
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        status: 409,
        error: 'Sản phẩm với tên này đã tồn tại'
      };
    }
    throw error;
  }
};

export const updateProduct = async (id, data) => {
  try {
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProduct) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }

    // If price is being updated, validate it
    if (data.price !== undefined && data.price <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Giá sản phẩm phải lớn hơn 0'
      };
    }

    // Validate foreign keys if they are being updated
    if (data.category_id) {
      const category = await prisma.categories.findUnique({
        where: { id: Number(data.category_id) }
      });
      if (!category) {
        return {
          success: false,
          status: 400,
          error: 'Danh mục không tồn tại'
        };
      }
    }

    if (data.supplier_id) {
      const supplier = await prisma.suppliers.findUnique({
        where: { id: Number(data.supplier_id) }
      });
      if (!supplier) {
        return {
          success: false,
          status: 400,
          error: 'Nhà cung cấp không tồn tại'
        };
      }
    }

    if (data.base_unit_id) {
      const baseUnit = await prisma.productUnits.findUnique({
        where: { id: Number(data.base_unit_id) }
      });
      if (!baseUnit) {
        return {
          success: false,
          status: 400,
          error: 'Đơn vị cơ bản không tồn tại'
        };
      }
    }

    const product = await prisma.products.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        manufacturer: data.manufacturer,
        usage: data.usage,
        dosage: data.dosage,
        specification: data.specification,
        brand: data.brand,
        images: data.images,
        category_id: data.category_id ? Number(data.category_id) : undefined,
        supplier_id: data.supplier_id ? Number(data.supplier_id) : undefined,
        base_unit_id: data.base_unit_id ? Number(data.base_unit_id) : undefined,
      },
      include: {
        category: true,
        supplier: true,
        baseUnit: true
      }
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        status: 409,
        error: 'Sản phẩm với tên này đã tồn tại'
      };
    }
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProduct) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm'
      };
    }

    // Check if product can be deleted
    if (!await canDeleteProduct(id)) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa sản phẩm này vì đã có đơn hàng hoặc giỏ hàng liên quan'
      };
    }

    const product = await prisma.products.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    throw error;
  }
};

export const searchProducts = async ({ keyword, page = 1, limit = 10 }) => {
  try {
    if (!keyword) {
      return {
        success: false,
        status: 400,
        error: 'Vui lòng nhập từ khóa tìm kiếm'
      };
    }

    const where = {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { manufacturer: { contains: keyword, mode: 'insensitive' } },
        { brand: { contains: keyword, mode: 'insensitive' } }
      ]
    };

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          supplier: true,
          baseUnit: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.products.count({ where })
    ]);

    return {
      success: true,
      data: {
        products,
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

export const getProductsByCategory = async (categoryId, { page = 1, limit = 10 }) => {
  try {
    // Check if category exists
    const category = await prisma.categories.findUnique({
      where: { id: Number(categoryId) }
    });

    if (!category) {
      return {
        success: false,
        status: 404,
        error: 'Danh mục không tồn tại'
      };
    }

    const where = { category_id: Number(categoryId) };

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          supplier: true,
          baseUnit: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.products.count({ where })
    ]);

    return {
      success: true,
      data: {
        category,
        products,
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