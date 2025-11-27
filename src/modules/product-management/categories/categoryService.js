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
        search ? { name: { contains: search, mode: 'insensitive' } } : {}
      ].filter(obj => Object.keys(obj).length > 0)
    };

    const [total, categories] = await Promise.all([
      prisma.categories.count({ where }),
      prisma.categories.findMany({
        where,
        include: includeProducts ? {
          products: {
            select: { id: true, name: true, price: true }
          }
        } : {},
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
      include: includeProducts ? {
        products: {
          select: { id: true, name: true, price: true, image_url: true }
        }
      } : {}
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

/**
 * Lấy cây phân cấp categories (dạng nested tree)
 * Phù hợp cho Flutter app/Frontend để hiển thị menu
 * Đếm products bao gồm cả products của các category con
 * @param {Object} options - Tùy chọn lọc
 * @param {boolean} options.onlyActiveProducts - Chỉ đếm products active (mặc định: false)
 */
export const getCategoryTree = async (options = {}) => {
  const { 
    onlyActiveProducts = false 
  } = options;

  try {
    // Build where clause cho products
    const productWhere = onlyActiveProducts ? { is_active: true } : {};

    // Lấy tất cả categories với thông tin products
    const allCategories = await prisma.categories.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        parent_id: true,
        products: {
          where: productWhere,
          select: { id: true }
        }
      }
    });

    // Hàm đệ quy để đếm products (bao gồm children)
    const getProductCountRecursive = (categoryId, categoryMap) => {
      const category = categoryMap[categoryId];
      if (!category) return 0;
      
      // Đếm products trực tiếp của category này
      let count = category.directProductCount;
      
      // Cộng thêm products từ tất cả children
      category.children.forEach(childId => {
        count += getProductCountRecursive(childId, categoryMap);
      });
      
      return count;
    };

    // Tạo map để tra cứu nhanh
    const categoryMap = {};
    const childrenMap = {}; // Map lưu danh sách children IDs
    
    allCategories.forEach(cat => {
      categoryMap[cat.id] = {
        id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id,
        directProductCount: cat.products.length, // Số products trực tiếp
        product_count: 0, // Sẽ tính sau (bao gồm children)
        children: [] // Array chứa children objects
      };
      childrenMap[cat.id] = []; // Array chứa children IDs
    });

    // Build children map
    allCategories.forEach(cat => {
      if (cat.parent_id !== null && categoryMap[cat.parent_id]) {
        childrenMap[cat.parent_id].push(cat.id);
      }
    });

    // Gán children IDs vào categoryMap
    Object.keys(childrenMap).forEach(catId => {
      categoryMap[catId].children = childrenMap[catId];
    });

    // Tính product_count cho tất cả categories (bao gồm children)
    allCategories.forEach(cat => {
      categoryMap[cat.id].product_count = getProductCountRecursive(cat.id, categoryMap);
    });

    // Build tree structure với children là objects (không phải IDs)
    const tree = [];
    allCategories.forEach(cat => {
      const categoryNode = categoryMap[cat.id];
      
      if (cat.parent_id === null) {
        // Main category (root)
        tree.push({
          id: categoryNode.id,
          name: categoryNode.name,
          parent_id: categoryNode.parent_id,
          product_count: categoryNode.product_count,
          children: categoryNode.children.map(childId => categoryMap[childId])
        });
      }
    });

    // Convert children IDs to objects recursively
    const convertChildrenToObjects = (node) => {
      if (node.children && node.children.length > 0) {
        node.children = node.children.map(child => {
          const childNode = typeof child === 'number' ? categoryMap[child] : child;
          return {
            id: childNode.id,
            name: childNode.name,
            parent_id: childNode.parent_id,
            product_count: childNode.product_count,
            children: childNode.children.map(grandchildId => {
              const grandchild = categoryMap[grandchildId];
              return {
                id: grandchild.id,
                name: grandchild.name,
                parent_id: grandchild.parent_id,
                product_count: grandchild.product_count,
                children: [] // Level 3 không có children nữa
              };
            })
          };
        });
      }
      return node;
    };

    // Apply conversion
    tree.forEach(node => convertChildrenToObjects(node));

    return {
      success: true,
      data: tree,
      meta: {
        total_categories: allCategories.length,
        main_categories: tree.length,
        filters: {
          only_active_products: onlyActiveProducts
        }
      }
    };
  } catch (error) {
    console.error('Error getting category tree:', error);
    return {
      success: false,
      status: 500,
      error: 'Lỗi khi lấy cây phân cấp categories'
    };
  }
};