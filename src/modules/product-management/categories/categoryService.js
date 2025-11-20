import prisma from '../../../config/db.js';

// Helper function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Validate category data
const validateCategoryData = async (data, categoryId = null) => {
  const errors = [];

  // Validate required name
  if (!data.name?.trim()) {
    return {
      success: false,
      status: 400,
      error: 'Tên danh mục là bắt buộc'
    };
  }

  // Validate name length
  if (data.name.length > 100) {
    return {
      success: false,
      status: 400,
      error: 'Tên danh mục không được vượt quá 100 ký tự'
    };
  }

  // Validate description length if provided
  if (data.description && data.description.length > 500) {
    return {
      success: false,
      status: 400,
      error: 'Mô tả không được vượt quá 500 ký tự'
    };
  }

  // Check for existing category with same name
  const existingCategory = await findCategoryByName(data.name.trim());
  if (existingCategory && (!categoryId || existingCategory.id !== parseInt(categoryId))) {
    return {
      success: false,
      status: 409,
      error: 'Tên danh mục đã tồn tại'
    };
  }

  // Validate parent category if provided
  if (data.parent_id) {
    const parentExists = await getCategoryById(data.parent_id, false);
    if (!parentExists?.data) {
      return {
        success: false,
        status: 400,
        error: 'Danh mục cha không tồn tại'
      };
    }

    if (await wouldCreateCircularReference(data.parent_id, categoryId)) {
      return {
        success: false,
        status: 400,
        error: categoryId ? 'Không thể chọn danh mục con làm danh mục cha' : 'Không thể tạo danh mục con của chính nó'
      };
    }
  }

  // Validate image URL if provided
  if (data.image_url && !isValidUrl(data.image_url)) {
    return {
      success: false,
      status: 400,
      error: 'URL hình ảnh không hợp lệ'
    };
  }

  return { success: true };
};

export const getAllCategories = async ({ 
  includeProducts = true,
  includeInactive = false,
  parentId,
  search,
  page = 1,
  limit = 50,
  sortBy = 'id',
  sortOrder = 'asc'
}) => {
  try {
    const where = {
      AND: [
        parentId ? { parent_id: parentId } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ].filter(obj => Object.keys(obj).length > 0)
    };

    const [total, categories] = await Promise.all([
      prisma.categories.count({ where }),
      prisma.categories.findMany({
        where,
        include: {
          products: includeProducts
        },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getAllCategories service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy danh sách danh mục'
    };
  }
};

export const getCategoryById = async (id, includeProducts = true) => {
  try {
    const category = await prisma.categories.findUnique({
      where: { id: Number(id) },
      include: {
        products: includeProducts
      }
    });

    if (!category) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy danh mục'
      };
    }

    return {
      success: true,
      data: category
    };
  } catch (error) {
    console.error('Error in getCategoryById service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy thông tin danh mục'
    };
  }
};

export const findCategoryByName = async (name) => {
  return prisma.categories.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  });
};

export const createCategory = async (data) => {
  try {
    // Validate category data
    const validation = await validateCategoryData(data);
    if (!validation.success) {
      return validation;
    }

    const category = await prisma.categories.create({
      data: {
        name: data.name.trim(),
        description: data.description,
        parent_id: data.parent_id,
        image_url: data.image_url,
        is_active: true
      },
      include: {
        products: true,
        parent: true,
        children: true
      }
    });

    return {
      success: true,
      status: 201,
      data: category,
      message: 'Tạo danh mục thành công'
    };
  } catch (error) {
    console.error('Error in createCategory service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi tạo danh mục mới'
    };
  }
};

export const updateCategory = async (id, data) => {
  try {
    // Check if category exists
    const categoryResult = await getCategoryById(id, false);
    if (!categoryResult.success) {
      return categoryResult;
    }

    // Validate category data
    const validation = await validateCategoryData(data, id);
    if (!validation.success) {
      return validation;
    }

    // Check if category can be deactivated
    if (data.is_active === false && categoryResult.data.is_active) {
      const hasActiveProducts = await hasActiveProducts(id);
      if (hasActiveProducts) {
        return {
          success: false,
          status: 400,
          error: 'Không thể vô hiệu hóa danh mục còn sản phẩm đang hoạt động'
        };
      }
    }

    const updatedCategory = await prisma.categories.update({
      where: { id: Number(id) },
      data: {
        name: data.name?.trim(),
        description: data.description,
        parent_id: data.parent_id,
        image_url: data.image_url,
        is_active: data.is_active
      },
      include: {
        products: true,
        parent: true,
        children: true
      }
    });

    return {
      success: true,
      data: updatedCategory,
      message: 'Cập nhật danh mục thành công'
    };
  } catch (error) {
    console.error('Error in updateCategory service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi cập nhật danh mục'
    };
  }
};

export const deleteCategory = async (id) => {
  try {
    // Check if category exists
    const categoryResult = await getCategoryById(id);
    if (!categoryResult.success) {
      return categoryResult;
    }

    // Check if category can be deleted
    const canDelete = await canDeleteCategory(id);
    if (!canDelete) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa danh mục còn sản phẩm hoặc danh mục con'
      };
    }

    const deletedCategory = await prisma.categories.delete({
      where: { id: Number(id) }
    });

    return {
      success: true,
      data: deletedCategory,
      message: 'Xóa danh mục thành công'
    };
  } catch (error) {
    console.error('Error in deleteCategory service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi xóa danh mục'
    };
  }
};

export const wouldCreateCircularReference = async (parentId, categoryId) => {
  const visited = new Set();
  let currentId = parentId;

  while (currentId) {
    if (currentId === categoryId || visited.has(currentId)) {
      return true;
    }
    visited.add(currentId);
    const parent = await prisma.categories.findUnique({
      where: { id: currentId },
      select: { parent_id: true }
    });
    currentId = parent?.parent_id;
  }

  return false;
};

export const hasActiveProducts = async (categoryId) => {
  const count = await prisma.products.count({
    where: {
      category_id: categoryId,
      is_active: true
    }
  });
  return count > 0;
};

export const canDeleteCategory = async (categoryId) => {
  const [productsCount, childrenCount] = await Promise.all([
    prisma.products.count({
      where: { category_id: categoryId }
    }),
    prisma.categories.count({
      where: { parent_id: categoryId }
    })
  ]);
  
  return productsCount === 0 && childrenCount === 0;
};

export const getCategoryStats = async (categoryId) => {
  try {
    const category = await prisma.categories.findUnique({
      where: { id: Number(categoryId) },
      include: {
        products: {
          select: {
            id: true,
            is_active: true,
            branch_inventory: {
              select: {
                quantity: true,
                import_price: true
              }
            }
          }
        },
        children: {
          include: {
            products: {
              select: {
                id: true,
                is_active: true,
                branch_inventory: {
                  select: {
                    quantity: true,
                    import_price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!category) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy danh mục'
      };
    }

    const allProducts = [...category.products];
    category.children.forEach(child => {
      allProducts.push(...child.products);
    });

    const stats = {
      totalProducts: allProducts.length,
      activeProducts: allProducts.filter(p => p.is_active).length,
      totalInventory: allProducts.reduce((sum, p) => 
        sum + p.branch_inventory.reduce((total, bi) => total + bi.quantity, 0), 0),
      totalInventoryValue: allProducts.reduce((sum, p) => 
        sum + p.branch_inventory.reduce((total, bi) => total + (bi.quantity * bi.import_price), 0), 0)
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error in getCategoryStats service:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy thống kê danh mục'
    };
  }
};