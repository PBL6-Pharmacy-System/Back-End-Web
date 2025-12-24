import prisma from '../../../config/db.js';
import { Prisma } from '@prisma/client';

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
// ✅ FIX: SQL Injection - Using parameterized queries instead of string interpolation
export const getLowStockProducts = async ({ branchId, page = 1, limit = 20 }) => {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const branchIdNum = branchId ? Number(branchId) : null;

    // Use parameterized query to prevent SQL injection
    let lowStockProducts;
    let totalCount;

    if (branchIdNum) {
      lowStockProducts = await prisma.$queryRaw`
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
        AND bi.branch_id = ${branchIdNum}
        ORDER BY (bi.min_stock - bi.stock) DESC
        LIMIT ${limitNum}
        OFFSET ${offset}
      `;

      totalCount = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM branchinventory
        WHERE min_stock IS NOT NULL
        AND stock <= min_stock
        AND branch_id = ${branchIdNum}
      `;
    } else {
      lowStockProducts = await prisma.$queryRaw`
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
        ORDER BY (bi.min_stock - bi.stock) DESC
        LIMIT ${limitNum}
        OFFSET ${offset}
      `;

      totalCount = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM branchinventory
        WHERE min_stock IS NOT NULL
        AND stock <= min_stock
      `;
    }

    return {
      success: true,
      data: {
        products: lowStockProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
          totalRecords: totalCount[0]?.count || 0
        }
      }
    };
  } catch (error) {
    console.error('getLowStockProducts error:', error);
    throw error;
  }
};

// Sản phẩm tồn kho cao (trên max_stock)
// ✅ FIX: SQL Injection - Using parameterized queries instead of string interpolation
export const getOverstockProducts = async ({ branchId, page = 1, limit = 20 }) => {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const branchIdNum = branchId ? Number(branchId) : null;

    let overstockProducts;
    let totalCount;

    if (branchIdNum) {
      overstockProducts = await prisma.$queryRaw`
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
        AND bi.branch_id = ${branchIdNum}
        ORDER BY (bi.stock - bi.max_stock) DESC
        LIMIT ${limitNum}
        OFFSET ${offset}
      `;

      totalCount = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM branchinventory
        WHERE max_stock IS NOT NULL
        AND stock >= max_stock
        AND branch_id = ${branchIdNum}
      `;
    } else {
      overstockProducts = await prisma.$queryRaw`
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
        ORDER BY (bi.stock - bi.max_stock) DESC
        LIMIT ${limitNum}
        OFFSET ${offset}
      `;

      totalCount = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM branchinventory
        WHERE max_stock IS NOT NULL
        AND stock >= max_stock
      `;
    }

    return {
      success: true,
      data: {
        products: overstockProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
          totalRecords: totalCount[0]?.count || 0
        }
      }
    };
  } catch (error) {
    console.error('getOverstockProducts error:', error);
    throw error;
  }
};

// Báo cáo biến động tồn kho theo thời gian
export const getInventoryMovementReport = async ({ branchId, productId, startDate, endDate, type, page = 1, limit = 100 }) => {
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

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [movements, summary, totalCount] = await Promise.all([
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
        skip: (pageNum - 1) * limitNum,
        take: limitNum
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
      }),

      prisma.inventoryLog.count({ where })
    ]);

    return {
      success: true,
      data: {
        movements,
        summary: summary.map(s => ({
          type: s.type,
          totalQuantity: s._sum.quantity,
          count: s._count.id
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalRecords: totalCount
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Top sản phẩm nhập nhiều nhất
// ✅ FIX: SQL Injection - Using parameterized queries instead of string interpolation
export const getTopImportedProducts = async ({ branchId, startDate, endDate, limit = 10 }) => {
  try {
    const limitNum = parseInt(limit);
    const branchIdNum = branchId ? Number(branchId) : null;
    
    // Validate and parse dates
    const startDateParsed = startDate ? new Date(startDate) : null;
    const endDateParsed = endDate ? new Date(endDate) : null;
    
    // Validate dates are valid
    if (startDate && isNaN(startDateParsed.getTime())) {
      throw new Error('Invalid start date format');
    }
    if (endDate && isNaN(endDateParsed.getTime())) {
      throw new Error('Invalid end date format');
    }

    let products;

    if (branchIdNum && startDateParsed && endDateParsed) {
      products = await prisma.$queryRaw`
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
        AND il.branch_id = ${branchIdNum}
        AND il.date BETWEEN ${startDateParsed} AND ${endDateParsed}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_imported DESC
        LIMIT ${limitNum}
      `;
    } else if (branchIdNum) {
      products = await prisma.$queryRaw`
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
        AND il.branch_id = ${branchIdNum}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_imported DESC
        LIMIT ${limitNum}
      `;
    } else if (startDateParsed && endDateParsed) {
      products = await prisma.$queryRaw`
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
        AND il.date BETWEEN ${startDateParsed} AND ${endDateParsed}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_imported DESC
        LIMIT ${limitNum}
      `;
    } else {
      products = await prisma.$queryRaw`
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
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_imported DESC
        LIMIT ${limitNum}
      `;
    }

    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('getTopImportedProducts error:', error);
    throw error;
  }
};

// Top sản phẩm xuất nhiều nhất
// ✅ FIX: SQL Injection - Using parameterized queries instead of string interpolation
export const getTopExportedProducts = async ({ branchId, startDate, endDate, limit = 10 }) => {
  try {
    const limitNum = parseInt(limit);
    const branchIdNum = branchId ? Number(branchId) : null;
    
    // Validate and parse dates
    const startDateParsed = startDate ? new Date(startDate) : null;
    const endDateParsed = endDate ? new Date(endDate) : null;
    
    // Validate dates are valid
    if (startDate && isNaN(startDateParsed.getTime())) {
      throw new Error('Invalid start date format');
    }
    if (endDate && isNaN(endDateParsed.getTime())) {
      throw new Error('Invalid end date format');
    }

    let products;

    if (branchIdNum && startDateParsed && endDateParsed) {
      products = await prisma.$queryRaw`
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
        AND il.branch_id = ${branchIdNum}
        AND il.date BETWEEN ${startDateParsed} AND ${endDateParsed}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_exported DESC
        LIMIT ${limitNum}
      `;
    } else if (branchIdNum) {
      products = await prisma.$queryRaw`
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
        AND il.branch_id = ${branchIdNum}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_exported DESC
        LIMIT ${limitNum}
      `;
    } else if (startDateParsed && endDateParsed) {
      products = await prisma.$queryRaw`
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
        AND il.date BETWEEN ${startDateParsed} AND ${endDateParsed}
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_exported DESC
        LIMIT ${limitNum}
      `;
    } else {
      products = await prisma.$queryRaw`
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
        GROUP BY p.id, p.name, p.image_url, p.price, b.name
        ORDER BY total_exported DESC
        LIMIT ${limitNum}
      `;
    }

    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('getTopExportedProducts error:', error);
    throw error;
  }
};

// Tồn kho theo danh mục
// ✅ FIX: SQL Injection - Using parameterized queries instead of string interpolation
export const getInventoryByCategory = async (branchId) => {
  try {
    const branchIdNum = branchId ? Number(branchId) : null;

    let stats;

    if (branchIdNum) {
      stats = await prisma.$queryRaw`
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(DISTINCT p.id)::int as product_count,
          COALESCE(SUM(bi.stock), 0)::int as total_stock,
          COALESCE(SUM(bi.stock * p.price), 0)::decimal as total_value
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN branchinventory bi ON p.id = bi.product_id
        WHERE bi.branch_id = ${branchIdNum}
        GROUP BY c.id, c.name
        HAVING COUNT(DISTINCT p.id) > 0
        ORDER BY total_value DESC
      `;
    } else {
      stats = await prisma.$queryRaw`
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(DISTINCT p.id)::int as product_count,
          COALESCE(SUM(bi.stock), 0)::int as total_stock,
          COALESCE(SUM(bi.stock * p.price), 0)::decimal as total_value
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN branchinventory bi ON p.id = bi.product_id
        GROUP BY c.id, c.name
        HAVING COUNT(DISTINCT p.id) > 0
        ORDER BY total_value DESC
      `;
    }

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
    console.error('getInventoryByCategory error:', error);
    throw error;
  }
};
