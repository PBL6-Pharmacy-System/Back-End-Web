import prisma from '../../../config/db.js';

// Dashboard tổng quan
export const getDashboardOverview = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders,
      monthOrders,
      pendingOrders,
      totalCustomers,
      monthCustomers
    ] = await Promise.all([
      // Tổng doanh thu
      prisma.orders.aggregate({
        where: {
          status: { in: ['completed', 'delivered'] }
        },
        _sum: {
          final_amount: true
        }
      }),

      // Doanh thu tháng này
      prisma.orders.aggregate({
        where: {
          status: { in: ['completed', 'delivered'] },
          order_date: { gte: startOfMonth }
        },
        _sum: {
          final_amount: true
        }
      }),

      // Doanh thu năm nay
      prisma.orders.aggregate({
        where: {
          status: { in: ['completed', 'delivered'] },
          order_date: { gte: startOfYear }
        },
        _sum: {
          final_amount: true
        }
      }),

      // Tổng đơn hàng
      prisma.orders.count(),

      // Đơn hàng tháng này
      prisma.orders.count({
        where: {
          order_date: { gte: startOfMonth }
        }
      }),

      // Đơn hàng đang chờ
      prisma.orders.count({
        where: {
          status: 'pending'
        }
      }),

      // Tổng khách hàng
      prisma.customers.count(),

      // Khách hàng mới tháng này
      prisma.customers.count({
        where: {
          created_at: { gte: startOfMonth }
        }
      })
    ]);

    return {
      success: true,
      data: {
        revenue: {
          total: parseFloat(totalRevenue._sum.final_amount || 0),
          thisMonth: parseFloat(monthRevenue._sum.final_amount || 0),
          thisYear: parseFloat(yearRevenue._sum.final_amount || 0)
        },
        orders: {
          total: totalOrders,
          thisMonth: monthOrders,
          pending: pendingOrders
        },
        customers: {
          total: totalCustomers,
          newThisMonth: monthCustomers
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Doanh thu theo thời gian
export const getRevenueByPeriod = async ({ startDate, endDate, groupBy = 'day' }) => {
  try {
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    // Build where conditions
    let whereConditions = `WHERE status IN ('completed', 'delivered')`;
    if (startDate) {
      whereConditions += ` AND order_date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      whereConditions += ` AND order_date <= '${new Date(endDate).toISOString()}'`;
    }

    const revenue = await prisma.$queryRawUnsafe(`
      SELECT
        TO_CHAR(order_date, '${dateFormat}') as period,
        COUNT(*)::int as order_count,
        SUM(final_amount)::decimal as total_revenue,
        SUM(discount_amount)::decimal as total_discount,
        AVG(final_amount)::decimal as avg_order_value
      FROM orders
      ${whereConditions}
      GROUP BY period
      ORDER BY period DESC
    `);

    return {
      success: true,
      data: revenue.map(r => ({
        period: r.period,
        orderCount: r.order_count,
        totalRevenue: parseFloat(r.total_revenue || 0),
        totalDiscount: parseFloat(r.total_discount || 0),
        avgOrderValue: parseFloat(r.avg_order_value || 0)
      }))
    };
  } catch (error) {
    console.error('getRevenueByPeriod error:', error);
    throw error;
  }
};

// Đơn hàng theo trạng thái
export const getOrdersByStatus = async ({ startDate, endDate }) => {
  try {
    const where = {};
    if (startDate && endDate) {
      where.order_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const ordersByStatus = await prisma.orders.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      },
      _sum: {
        final_amount: true
      }
    });

    return {
      success: true,
      data: ordersByStatus.map(os => ({
        status: os.status,
        count: os._count.id,
        totalAmount: parseFloat(os._sum.final_amount || 0)
      }))
    };
  } catch (error) {
    throw error;
  }
};

// Sản phẩm bán chạy nhất
export const getBestSellingProducts = async ({ startDate, endDate, limit = 10 }) => {
  try {
    let whereConditions = `WHERE o.status IN ('completed', 'delivered')`;
    if (startDate) {
      whereConditions += ` AND o.order_date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      whereConditions += ` AND o.order_date <= '${new Date(endDate).toISOString()}'`;
    }

    const products = await prisma.$queryRawUnsafe(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.image_url,
        c.name as category_name,
        SUM(oi.quantity)::int as total_sold,
        SUM(oi.subtotal)::decimal as total_revenue,
        COUNT(DISTINCT oi.order_id)::int as order_count
      FROM products p
      JOIN orderitems oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereConditions}
      GROUP BY p.id, p.name, p.price, p.image_url, c.name
      ORDER BY total_sold DESC
      LIMIT ${parseInt(limit)}
    `);

    return {
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        imageUrl: p.image_url,
        categoryName: p.category_name,
        totalSold: p.total_sold,
        totalRevenue: parseFloat(p.total_revenue || 0),
        orderCount: p.order_count
      }))
    };
  } catch (error) {
    console.error('getBestSellingProducts error:', error);
    throw error;
  }
};

// Khách hàng mua nhiều nhất
export const getTopCustomers = async ({ startDate, endDate, limit = 10 }) => {
  try {
    let whereConditions = `WHERE o.status IN ('completed', 'delivered')`;
    if (startDate) {
      whereConditions += ` AND o.order_date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      whereConditions += ` AND o.order_date <= '${new Date(endDate).toISOString()}'`;
    }

    const customers = await prisma.$queryRawUnsafe(`
      SELECT
        c.id,
        u.full_name,
        u.email,
        u.phone,
        COUNT(o.id)::int as order_count,
        SUM(o.final_amount)::decimal as total_spent,
        AVG(o.final_amount)::decimal as avg_order_value,
        MAX(o.order_date) as last_order_date
      FROM customers c
      JOIN users u ON c.user_id = u.id
      JOIN orders o ON c.id = o.customer_id
      ${whereConditions}
      GROUP BY c.id, u.full_name, u.email, u.phone
      ORDER BY total_spent DESC
      LIMIT ${parseInt(limit)}
    `);

    return {
      success: true,
      data: customers.map(c => ({
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        phone: c.phone,
        orderCount: c.order_count,
        totalSpent: parseFloat(c.total_spent || 0),
        avgOrderValue: parseFloat(c.avg_order_value || 0),
        lastOrderDate: c.last_order_date
      }))
    };
  } catch (error) {
    console.error('getTopCustomers error:', error);
    throw error;
  }
};

// Hiệu quả voucher
export const getVoucherPerformance = async ({ startDate, endDate }) => {
  try {
    let dateFilter = '';
    if (startDate) {
      dateFilter += ` AND o.order_date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      dateFilter += ` AND o.order_date <= '${new Date(endDate).toISOString()}'`;
    }

    const voucherStats = await prisma.$queryRawUnsafe(`
      SELECT
        v.id,
        v.code,
        v.discount_type,
        v.discount_value,
        v.usage_limit,
        v.used_count,
        COUNT(o.id)::int as order_count,
        COALESCE(SUM(o.discount_amount), 0)::decimal as total_discount_given,
        COALESCE(SUM(o.final_amount), 0)::decimal as total_revenue
      FROM vouchers v
      LEFT JOIN orders o ON v.id = o.voucher_id
        AND o.status IN ('completed', 'delivered')
        ${dateFilter}
      GROUP BY v.id, v.code, v.discount_type, v.discount_value, v.usage_limit, v.used_count
      ORDER BY total_revenue DESC
    `);

    return {
      success: true,
      data: voucherStats.map(v => ({
        id: v.id,
        code: v.code,
        discountType: v.discount_type,
        discountValue: parseFloat(v.discount_value),
        usageLimit: v.usage_limit,
        usedCount: v.used_count,
        orderCount: v.order_count,
        totalDiscountGiven: parseFloat(v.total_discount_given || 0),
        totalRevenue: parseFloat(v.total_revenue || 0)
      }))
    };
  } catch (error) {
    console.error('getVoucherPerformance error:', error);
    throw error;
  }
};

// Hiệu quả flashsale
export const getFlashsalePerformance = async ({ flashsaleId }) => {
  try {
    const where = {};
    if (flashsaleId) {
      where.flashsale_id = Number(flashsaleId);
    }

    const flashsaleStats = await prisma.flashsale_products.findMany({
      where,
      include: {
        flashsales: {
          select: {
            id: true,
            name: true,
            start_time: true,
            end_time: true,
            status: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true
          }
        }
      }
    });

    const stats = flashsaleStats.map(fs => {
      const regularPrice = parseFloat(fs.products.price);
      const flashPrice = parseFloat(fs.flash_price);
      const discount = regularPrice - flashPrice;
      const discountPercent = (discount / regularPrice) * 100;

      return {
        flashsaleId: fs.flashsale_id,
        flashsaleName: fs.flashsales.name,
        flashsaleStatus: fs.flashsales.status,
        productId: fs.product_id,
        productName: fs.products.name,
        regularPrice,
        flashPrice,
        discount,
        discountPercent: parseFloat(discountPercent.toFixed(2)),
        stockLimit: fs.stock_limit,
        soldCount: fs.sold_count,
        remainingStock: fs.stock_limit - fs.sold_count,
        sellThroughRate: parseFloat(((fs.sold_count / fs.stock_limit) * 100).toFixed(2))
      };
    });

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    throw error;
  }
};

// Tỷ lệ chuyển đổi (Conversion Rate)
export const getConversionRate = async ({ startDate, endDate }) => {
  try {
    let whereFilter = '';
    if (startDate && endDate) {
      whereFilter = `WHERE order_date BETWEEN '${new Date(startDate).toISOString()}' AND '${new Date(endDate).toISOString()}'`;
    }

    const totalCartsResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT customer_id)::int as count
      FROM orders
      ${whereFilter}
    `);

    const completedOrders = await prisma.orders.count({
      where: {
        status: { in: ['completed', 'delivered'] },
        ...(startDate && endDate && {
          order_date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      }
    });

    const totalVisitors = totalCartsResult[0]?.count || 0;
    const conversionRate = totalVisitors > 0
      ? (completedOrders / totalVisitors) * 100
      : 0;

    return {
      success: true,
      data: {
        totalVisitors,
        completedOrders,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      }
    };
  } catch (error) {
    console.error('getConversionRate error:', error);
    throw error;
  }
};

// Giá trị đơn hàng trung bình (AOV - Average Order Value)
export const getAverageOrderValue = async ({ startDate, endDate, groupBy = 'all' }) => {
  try {
    if (groupBy === 'all') {
      const aov = await prisma.orders.aggregate({
        where: {
          status: { in: ['completed', 'delivered'] },
          ...(startDate && endDate && {
            order_date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          })
        },
        _avg: {
          final_amount: true
        },
        _count: {
          id: true
        },
        _sum: {
          final_amount: true
        }
      });

      return {
        success: true,
        data: {
          averageOrderValue: parseFloat(aov._avg.final_amount || 0),
          totalOrders: aov._count.id,
          totalRevenue: parseFloat(aov._sum.final_amount || 0)
        }
      };
    } else {
      // Group by period
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'IYYY-IW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const aovByPeriod = await prisma.$queryRawUnsafe(`
        SELECT
          TO_CHAR(order_date, '${dateFormat}') as period,
          AVG(final_amount)::decimal as avg_order_value,
          COUNT(*)::int as order_count,
          SUM(final_amount)::decimal as total_revenue
        FROM orders
        WHERE status IN ('completed', 'delivered')
        ${startDate ? `AND order_date >= '${new Date(startDate).toISOString()}'` : ''}
        ${endDate ? `AND order_date <= '${new Date(endDate).toISOString()}'` : ''}
        GROUP BY period
        ORDER BY period DESC
      `);

      return {
        success: true,
        data: aovByPeriod.map(a => ({
          period: a.period,
          avgOrderValue: parseFloat(a.avg_order_value),
          orderCount: a.order_count,
          totalRevenue: parseFloat(a.total_revenue)
        }))
      };
    }
  } catch (error) {
    throw error;
  }
};

// Doanh thu theo phương thức thanh toán
export const getRevenueByPaymentMethod = async ({ startDate, endDate }) => {
  try {
    let dateFilter = '';
    if (startDate) {
      dateFilter += ` AND p.payment_date >= '${new Date(startDate).toISOString()}'`;
    }
    if (endDate) {
      dateFilter += ` AND p.payment_date <= '${new Date(endDate).toISOString()}'`;
    }

    const paymentStats = await prisma.$queryRawUnsafe(`
      SELECT
        p.payment_method,
        COUNT(*)::int as transaction_count,
        SUM(p.amount)::decimal as total_amount
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.status = 'completed'
      AND o.status IN ('completed', 'delivered')
      ${dateFilter}
      GROUP BY p.payment_method
      ORDER BY total_amount DESC
    `);

    return {
      success: true,
      data: paymentStats.map(ps => ({
        paymentMethod: ps.payment_method,
        transactionCount: ps.transaction_count,
        totalAmount: parseFloat(ps.total_amount || 0)
      }))
    };
  } catch (error) {
    console.error('getRevenueByPaymentMethod error:', error);
    throw error;
  }
};
