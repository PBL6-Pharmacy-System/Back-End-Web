import prisma from '../../../config/db.js';

// Tổng quan tồn kho tất cả chi nhánh
export const getInventoryOverview = async () => {
  try {
    const [totalProducts, totalBranches, inventoryStats, lowStockCount] = await Promise.all([
      // Tổng số sản phẩm
      prisma.products.count(),

      // Tổng số chi nhánh
      prisma.branches.count({ where: { is_active: true } }),

      // Tổng tồn kho và giá trị
      prisma.branchinventory.aggregate({
        _sum: {
          stock: true
        },
        _count: {
          id: true
        }
      }),

      // Số sản phẩm sắp hết hàng
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM branchinventory
        WHERE min_stock IS NOT NULL
        AND stock <= min_stock
      `
    ]);

    // Tính tổng giá trị tồn kho
    const inventoryValue = await prisma.$queryRaw`
      SELECT SUM(bi.stock * p.price)::decimal as total_value
      FROM branchinventory bi
      JOIN products p ON bi.product_id = p.id
    `;

    return {
      success: true,
      data: {
        totalProducts,
        totalBranches,
        totalStock: inventoryStats._sum.stock || 0,
        totalInventoryItems: inventoryStats._count.id || 0,
        totalInventoryValue: parseFloat(inventoryValue[0]?.total_value || 0),
        lowStockProductsCount: lowStockCount[0]?.count || 0
      }
    };
  } catch (error) {
    throw error;
  }
};

// Tồn kho theo chi nhánh
export const getInventoryByBranch = async (branchId) => {
  try {
    const branch = await prisma.branches.findUnique({
      where: { id: Number(branchId) }
    });

    if (!branch) {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh không tồn tại'
      };
    }

    const [inventory, stats] = await Promise.all([
      prisma.branchinventory.findMany({
        where: { branch_id: Number(branchId) },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              image_url: true,
              categories: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          stock: 'desc'
        }
      }),

      prisma.branchinventory.aggregate({
        where: { branch_id: Number(branchId) },
        _sum: {
          stock: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Tính giá trị tồn kho của chi nhánh
    const branchValue = await prisma.$queryRaw`
      SELECT SUM(bi.stock * p.price)::decimal as total_value
      FROM branchinventory bi
      JOIN products p ON bi.product_id = p.id
      WHERE bi.branch_id = ${Number(branchId)}
    `;

    return {
      success: true,
      data: {
        branch,
        totalStock: stats._sum.stock || 0,
        totalProducts: stats._count.id || 0,
        totalValue: parseFloat(branchValue[0]?.total_value || 0),
        inventory
      }
    };
  } catch (error) {
    throw error;
  }
};

// Sản phẩm sắp hết hàng (dưới min_stock)
export const getLowStockProducts = async ({ branchId, page = 1, limit = 20 }) => {
  try {
    const where = {
      AND: [
        { min_stock: { not: null } }
      ]
    };

    if (branchId) {
      where.branch_id = Number(branchId);
    }

    // Sử dụng raw query để so sánh stock với min_stock
    const lowStockProducts = await prisma.$queryRaw`
      SELECT
        bi.id,
        bi.branch_id,
        bi.product_id,
        bi.stock,
        bi.min_stock,
        bi.max_stock,
        bi.last_updated,
        p.name as product_name,
        p.price,
        p.image_url,
        b.name as branch_name,
        b.address as branch_address
      FROM branchinventory bi
      JOIN products p ON bi.product_id = p.id
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.min_stock IS NOT NULL
      AND bi.stock <= bi.min_stock
      ${branchId ? prisma.Prisma.sql`AND bi.branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
      ORDER BY (bi.min_stock - bi.stock) DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM branchinventory
      WHERE min_stock IS NOT NULL
      AND stock <= min_stock
      ${branchId ? prisma.Prisma.sql`AND branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
    `;

    return {
      success: true,
      data: {
        products: lowStockProducts,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
          totalRecords: totalCount[0]?.count || 0
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Sản phẩm tồn kho cao (trên max_stock)
export const getOverstockProducts = async ({ branchId, page = 1, limit = 20 }) => {
  try {
    const overstockProducts = await prisma.$queryRaw`
      SELECT
        bi.id,
        bi.branch_id,
        bi.product_id,
        bi.stock,
        bi.min_stock,
        bi.max_stock,
        bi.last_updated,
        p.name as product_name,
        p.price,
        p.image_url,
        b.name as branch_name,
        b.address as branch_address
      FROM branchinventory bi
      JOIN products p ON bi.product_id = p.id
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.max_stock IS NOT NULL
      AND bi.stock >= bi.max_stock
      ${branchId ? prisma.Prisma.sql`AND bi.branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
      ORDER BY (bi.stock - bi.max_stock) DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM branchinventory
      WHERE max_stock IS NOT NULL
      AND stock >= max_stock
      ${branchId ? prisma.Prisma.sql`AND branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
    `;

    return {
      success: true,
      data: {
        products: overstockProducts,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
          totalRecords: totalCount[0]?.count || 0
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Báo cáo biến động tồn kho theo thời gian
export const getInventoryMovementReport = async ({ branchId, productId, startDate, endDate, type }) => {
  try {
    const where = {};

    if (branchId) where.branch_id = Number(branchId);
    if (productId) where.product_id = Number(productId);
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [movements, summary] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              image_url: true
            }
          },
          branches: {
            select: {
              id: true,
              name: true
            }
          },
          users: {
            select: {
              id: true,
              username: true,
              full_name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 100
      }),

      prisma.inventoryLog.groupBy({
        by: ['type'],
        where,
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        }
      })
    ]);

    return {
      success: true,
      data: {
        movements,
        summary: summary.map(s => ({
          type: s.type,
          totalQuantity: s._sum.quantity,
          count: s._count.id
        }))
      }
    };
  } catch (error) {
    throw error;
  }
};

// Top sản phẩm nhập nhiều nhất
export const getTopImportedProducts = async ({ branchId, startDate, endDate, limit = 10 }) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT
        p.id,
        p.name,
        p.image_url,
        p.price,
        SUM(il.quantity)::int as total_imported,
        COUNT(il.id)::int as import_count,
        b.name as branch_name
      FROM "inventoryLog" il
      JOIN products p ON il.product_id = p.id
      JOIN branches b ON il.branch_id = b.id
      WHERE il.type = 'IMPORT'
      ${branchId ? prisma.Prisma.sql`AND il.branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
      ${startDate && endDate ? prisma.Prisma.sql`AND il.date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : prisma.Prisma.empty}
      GROUP BY p.id, p.name, p.image_url, p.price, b.name
      ORDER BY total_imported DESC
      LIMIT ${limit}
    `;

    return {
      success: true,
      data: products
    };
  } catch (error) {
    throw error;
  }
};

// Top sản phẩm xuất nhiều nhất
export const getTopExportedProducts = async ({ branchId, startDate, endDate, limit = 10 }) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT
        p.id,
        p.name,
        p.image_url,
        p.price,
        SUM(il.quantity)::int as total_exported,
        COUNT(il.id)::int as export_count,
        b.name as branch_name
      FROM "inventoryLog" il
      JOIN products p ON il.product_id = p.id
      JOIN branches b ON il.branch_id = b.id
      WHERE il.type = 'EXPORT'
      ${branchId ? prisma.Prisma.sql`AND il.branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
      ${startDate && endDate ? prisma.Prisma.sql`AND il.date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : prisma.Prisma.empty}
      GROUP BY p.id, p.name, p.image_url, p.price, b.name
      ORDER BY total_exported DESC
      LIMIT ${limit}
    `;

    return {
      success: true,
      data: products
    };
  } catch (error) {
    throw error;
  }
};

// Tồn kho theo danh mục
export const getInventoryByCategory = async (branchId) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT p.id)::int as product_count,
        SUM(bi.stock)::int as total_stock,
        SUM(bi.stock * p.price)::decimal as total_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN branchinventory bi ON p.id = bi.product_id
      ${branchId ? prisma.Prisma.sql`WHERE bi.branch_id = ${Number(branchId)}` : prisma.Prisma.empty}
      GROUP BY c.id, c.name
      HAVING COUNT(DISTINCT p.id) > 0
      ORDER BY total_value DESC
    `;

    return {
      success: true,
      data: stats.map(s => ({
        categoryId: s.category_id,
        categoryName: s.category_name,
        productCount: s.product_count,
        totalStock: s.total_stock || 0,
        totalValue: parseFloat(s.total_value || 0)
      }))
    };
  } catch (error) {
    throw error;
  }
};
