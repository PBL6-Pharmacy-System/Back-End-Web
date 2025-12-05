import prisma from '../../config/db.js';
import {
  calculateGrowth,
  formatChartDate,
  generateDateArray,
  getComparisonPeriod,
  getDaysDifference,
  parseDateRange
} from '../../utils/dateHelpers.js';
import {
  calculateAverageOrderValue,
  calculateAverageProcessingTime,
  calculateAverageRating,
  calculateCancellationRate,
  calculatePerformanceScore,
  calculateRatingDistribution,
  calculateRetentionRate,
  calculateTotalRevenue,
  calculateVoucherUsageRate,
  getBottomN,
  getTopN,
  groupOrdersByHour,
  groupOrdersByStatus
} from '../../utils/statsCalculator.js';

export const getOverviewStats = async (filters = {}) => {
    const { branchId } = filters;
    const now = new Date();
    
    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Build where clause for branch filter
    const buildWhere = (dateCondition) => {
      const where = { ...dateCondition };
      if (branchId) {
        where.shipments = {
          some: { branch_id: Number(branchId) }
        };
      }
      return where;
    };

    // Revenue stats
    const [todayRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.orders.aggregate({
        where: buildWhere({
          order_date: { gte: todayStart },
          status: { notIn: ['cart', 'cancelled'] }
        }),
        _sum: { final_amount: true }
      }),
      prisma.orders.aggregate({
        where: buildWhere({
          order_date: { gte: thisMonthStart },
          status: { notIn: ['cart', 'cancelled'] }
        }),
        _sum: { final_amount: true }
      }),
      prisma.orders.aggregate({
        where: buildWhere({
          order_date: { gte: lastMonthStart, lte: lastMonthEnd },
          status: { notIn: ['cart', 'cancelled'] }
        }),
        _sum: { final_amount: true }
      })
    ]);

    const revenueToday = Number(todayRevenue._sum.final_amount || 0);
    const revenueThisMonth = Number(thisMonthRevenue._sum.final_amount || 0);
    const revenueLastMonth = Number(lastMonthRevenue._sum.final_amount || 0);

    // Orders stats
    const [ordersCount, todayOrders] = await Promise.all([
      prisma.orders.groupBy({
        by: ['status'],
        where: buildWhere({ status: { not: 'cart' } }),
        _count: true
      }),
      prisma.orders.count({
        where: buildWhere({
          order_date: { gte: todayStart },
          status: { not: 'cart' }
        })
      })
    ]);

    const orderStats = ordersCount.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    const totalOrders = Object.values(orderStats).reduce((sum, count) => sum + count, 0);

    // Customers stats
    const [totalCustomers, newCustomersThisMonth, activeCustomersToday] = await Promise.all([
      prisma.customers.count(),
      prisma.customers.count({
        where: { created_at: { gte: thisMonthStart } }
      }),
      prisma.orders.groupBy({
        by: ['customer_id'],
        where: {
          order_date: { gte: todayStart },
          status: { not: 'cart' }
        }
      }).then(results => results.length)
    ]);

    // Products stats
    const productWhere = branchId ? { branch_id: Number(branchId) } : {};
    
    const [totalProducts, outOfStock, lowStock, expiringSoon] = await Promise.all([
      prisma.products.count(),
      prisma.branchinventory.count({
        where: { ...productWhere, stock: 0 }
      }),
      prisma.branchinventory.count({
        where: {
          ...productWhere,
          stock: { gt: 0, lte: prisma.branchinventory.fields.min_stock }
        }
      }),
      prisma.productBatch.count({
        where: {
          ...(branchId && { branch_id: Number(branchId) }),
          expiry_date: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          status: 'active'
        }
      })
    ]);

    return {
      success: true,
      data: {
        revenue: {
          today: revenueToday,
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          growth: calculateGrowth(revenueThisMonth, revenueLastMonth)
        },
        orders: {
          total: totalOrders,
          pending: orderStats.pending || 0,
          processing: orderStats.processing || 0,
          completed: orderStats.completed || 0,
          cancelled: orderStats.cancelled || 0,
          todayOrders
        },
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth,
          activeToday: activeCustomersToday
        },
        products: {
          total: totalProducts,
          outOfStock,
          lowStock,
          expiringSoon
        }
      }
    };
};

export const getRevenueAnalytics = async (filters = {}) => {
    const { period, startDate, endDate, branchId, comparison = true } = filters;

    // Parse date range
    const dateRange = parseDateRange(startDate, endDate, period);
    const daysDiff = getDaysDifference(dateRange.startDate, dateRange.endDate);

    // Build where clause
    const buildWhere = (start, end) => {
      const where = {
        order_date: { gte: start, lte: end },
        status: { notIn: ['cart', 'cancelled'] }
      };
      if (branchId) {
        where.shipments = {
          some: { branch_id: Number(branchId) }
        };
      }
      return where;
    };

    // Current period data
    const currentOrders = await prisma.orders.findMany({
      where: buildWhere(dateRange.startDate, dateRange.endDate),
      select: {
        id: true,
        final_amount: true,
        order_date: true
      }
    });

    const totalRevenue = calculateTotalRevenue(currentOrders);
    const totalOrders = currentOrders.length;
    const averageOrderValue = calculateAverageOrderValue(currentOrders);

    // Group by date for chart
    const dateArray = generateDateArray(dateRange.startDate, dateRange.endDate);
    const chartData = dateArray.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = currentOrders.filter(order => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        return orderDate === dateStr;
      });

      return {
        date: formatChartDate(date, daysDiff),
        revenue: calculateTotalRevenue(dayOrders),
        orders: dayOrders.length
      };
    });

    // Comparison period (if enabled)
    let comparisonData = null;
    if (comparison) {
      const compPeriod = getComparisonPeriod(dateRange.startDate, dateRange.endDate);
      const compOrders = await prisma.orders.findMany({
        where: buildWhere(compPeriod.startDate, compPeriod.endDate),
        select: {
          id: true,
          final_amount: true
        }
      });

      const compRevenue = calculateTotalRevenue(compOrders);
      const compOrderCount = compOrders.length;

      comparisonData = {
        previousPeriod: {
          revenue: compRevenue,
          orders: compOrderCount,
          averageOrderValue: calculateAverageOrderValue(compOrders)
        },
        growth: {
          revenue: calculateGrowth(totalRevenue, compRevenue),
          orders: calculateGrowth(totalOrders, compOrderCount)
        }
      };
    }

    return {
      success: true,
      data: {
        period: period || 'custom',
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          days: daysDiff
        },
        current: {
          totalRevenue,
          totalOrders,
          averageOrderValue
        },
        chart: chartData,
        comparison: comparisonData
      }
    };
};

export const getTopProducts = async (filters = {}) => {
    const { period, startDate, endDate, branchId, limit = 10 } = filters;

    const dateRange = parseDateRange(startDate, endDate, period);

    // Build where clause
    const orderWhere = {
      order_date: { gte: dateRange.startDate, lte: dateRange.endDate },
      status: { notIn: ['cart', 'cancelled'] }
    };

    if (branchId) {
      orderWhere.shipments = {
        some: { branch_id: Number(branchId) }
      };
    }

    // Get order items
    const orderItems = await prisma.orderitems.findMany({
      where: {
        orders: orderWhere
      },
      include: {
        products: {
          include: {
            categories: true
          }
        }
      }
    });

    // Group by product
    const productStats = {};
    orderItems.forEach(item => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          name: item.products.name,
          category: item.products.categories?.name,
          image: item.products.image_url,
          soldQuantity: 0,
          revenue: 0
        };
      }
      productStats[productId].soldQuantity += item.quantity;
      productStats[productId].revenue += Number(item.subtotal);
    });

    const productsArray = Object.values(productStats);

    const bestSellers = getTopN(productsArray, Number(limit), 'soldQuantity');
    const worstSellers = getBottomN(productsArray, Number(limit), 'soldQuantity');

    return {
      success: true,
      data: {
        period: period || 'custom',
        bestSellers,
        worstSellers,
        totalProducts: productsArray.length
      }
    };
};

export const getOrdersStatistics = async (filters = {}) => {
    const { period, startDate, endDate, branchId, comparison = true } = filters;

    const dateRange = parseDateRange(startDate, endDate, period);

    const buildWhere = (start, end) => {
      const where = {
        order_date: { gte: start, lte: end },
        status: { not: 'cart' }
      };
      if (branchId) {
        where.shipments = {
          some: { branch_id: Number(branchId) }
        };
      }
      return where;
    };

    // Current period orders
    const currentOrders = await prisma.orders.findMany({
      where: buildWhere(dateRange.startDate, dateRange.endDate),
      select: {
        id: true,
        status: true,
        order_date: true,
        updated_at: true
      }
    });

    const statusBreakdown = groupOrdersByStatus(currentOrders);
    const ordersByHour = groupOrdersByHour(currentOrders);
    const averageProcessingTime = calculateAverageProcessingTime(currentOrders);
    const cancellationRate = calculateCancellationRate(
      currentOrders.length,
      statusBreakdown.cancelled || 0
    );

    // Comparison
    let comparisonData = null;
    if (comparison) {
      const compPeriod = getComparisonPeriod(dateRange.startDate, dateRange.endDate);
      const compOrders = await prisma.orders.findMany({
        where: buildWhere(compPeriod.startDate, compPeriod.endDate),
        select: { id: true, status: true }
      });

      const compStatus = groupOrdersByStatus(compOrders);
      comparisonData = {
        previousPeriod: {
          total: compOrders.length,
          statusBreakdown: compStatus
        },
        growth: calculateGrowth(currentOrders.length, compOrders.length)
      };
    }

    return {
      success: true,
      data: {
        period: period || 'custom',
        current: {
          total: currentOrders.length,
          statusBreakdown,
          ordersByHour,
          averageProcessingTime: `${averageProcessingTime.toFixed(1)} giờ`,
          cancellationRate: `${cancellationRate.toFixed(1)}%`
        },
        comparison: comparisonData
      }
    };
};

export const getCustomersStatistics = async (filters = {}) => {
    const { period, startDate, endDate, limit = 10, branchId } = filters;
    const now = new Date();
    const dateRange = parseDateRange(startDate, endDate, period);

    // Build order where clause for branch filter
    const buildOrderWhere = (baseWhere) => {
      if (branchId) {
        return {
          ...baseWhere,
          shipments: {
            some: { branch_id: Number(branchId) }
          }
        };
      }
      return baseWhere;
    };

    // New customers (all branches - no filter)
    const [totalCustomers, newToday, newThisWeek, newThisMonth] = await Promise.all([
      prisma.customers.count(),
      prisma.customers.count({
        where: {
          created_at: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.customers.count({
        where: {
          created_at: {
            gte: new Date(now.setDate(now.getDate() - 6))
          }
        }
      }),
      prisma.customers.count({
        where: {
          created_at: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
      })
    ]);

    // Top customers by spending (filtered by branch if provided)
    const customerOrders = await prisma.orders.groupBy({
      by: ['customer_id'],
      where: buildOrderWhere({
        status: 'completed',
        order_date: { gte: dateRange.startDate, lte: dateRange.endDate }
      }),
      _sum: { final_amount: true },
      _count: { id: true }
    });

    const topCustomersData = await Promise.all(
      customerOrders
        .sort((a, b) => Number(b._sum.final_amount) - Number(a._sum.final_amount))
        .slice(0, Number(limit))
        .map(async (item) => {
          const customer = await prisma.customers.findUnique({
            where: { id: item.customer_id },
            include: {
              users: {
                select: { full_name: true, email: true, phone: true }
              }
            }
          });

          const lastOrder = await prisma.orders.findFirst({
            where: buildOrderWhere({ 
              customer_id: item.customer_id, 
              status: 'completed' 
            }),
            orderBy: { order_date: 'desc' },
            select: { order_date: true }
          });

          return {
            customerId: item.customer_id,
            name: customer?.users?.full_name || 'N/A',
            email: customer?.users?.email,
            phone: customer?.users?.phone,
            totalOrders: item._count.id,
            totalSpent: Number(item._sum.final_amount),
            lastOrder: lastOrder?.order_date
          };
        })
    );

    // Retention rate (customers with > 1 order)
    const returningCustomers = customerOrders.filter(c => c._count.id > 1).length;
    const retentionRate = calculateRetentionRate(returningCustomers, customerOrders.length);

    return {
      success: true,
      data: {
        totalCustomers,
        newCustomers: {
          today: newToday,
          thisWeek: newThisWeek,
          thisMonth: newThisMonth
        },
        topCustomers: topCustomersData,
        retentionRate: `${retentionRate.toFixed(1)}%`,
        ...(branchId && { filteredByBranch: Number(branchId) })
      }
    };
};

export const getInventoryStatistics = async (filters = {}) => {
    const { branchId } = filters;
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const where = branchId ? { branch_id: Number(branchId) } : {};

    // Summary stats
    const [totalProducts, totalValue, lowStock, outOfStock] = await Promise.all([
      prisma.branchinventory.count({ where }),
      prisma.branchinventory.aggregate({
        where,
        _sum: { stock: true }
      }),
      prisma.branchinventory.count({
        where: {
          ...where,
          stock: {
            gt: 0,
            lte: prisma.branchinventory.fields.min_stock
          }
        }
      }),
      prisma.branchinventory.count({
        where: { ...where, stock: 0 }
      })
    ]);

    // Low stock alerts
    const lowStockProducts = await prisma.branchinventory.findMany({
      where: {
        ...where,
        stock: {
          gt: 0,
          lte: prisma.branchinventory.fields.min_stock
        }
      },
      include: {
        products: {
          select: { id: true, name: true }
        },
        branches: {
          select: { id: true, name: true }
        }
      },
      take: 20
    });

    // Expiring soon products
    const expiringProducts = await prisma.productBatch.findMany({
      where: {
        ...(branchId && { branch_id: Number(branchId) }),
        expiry_date: {
          gte: now,
          lte: thirtyDaysLater
        },
        status: 'active',
        quantity: { gt: 0 }
      },
      include: {
        products: {
          select: { id: true, name: true }
        }
      },
      orderBy: { expiry_date: 'asc' },
      take: 20
    });

    const alerts = [
      ...lowStockProducts.map(item => ({
        type: 'LOW_STOCK',
        productId: item.product_id,
        name: item.products.name,
        currentStock: item.stock,
        minimumStock: item.min_stock,
        branchId: item.branch_id,
        branchName: item.branches.name
      })),
      ...expiringProducts.map(item => {
        const daysRemaining = Math.ceil((new Date(item.expiry_date) - now) / (1000 * 60 * 60 * 24));
        return {
          type: 'EXPIRING_SOON',
          productId: item.product_id,
          name: item.products.name,
          expiryDate: item.expiry_date,
          daysRemaining,
          stock: item.quantity,
          batchNumber: item.batch_number
        };
      })
    ];

    return {
      success: true,
      data: {
        summary: {
          totalProducts,
          totalStock: Number(totalValue._sum.stock || 0),
          lowStock,
          outOfStock
        },
        alerts
      }
    };
};

export const getBranchesPerformance = async (filters = {}) => {
    const { period, startDate, endDate, comparison = true } = filters;
    const dateRange = parseDateRange(startDate, endDate, period);

    const branches = await prisma.branches.findMany({
      where: { is_active: true },
      select: { id: true, name: true, city: true }
    });

    const branchesStats = await Promise.all(
      branches.map(async (branch) => {
        // Current period
        const currentOrders = await prisma.orders.findMany({
          where: {
            order_date: { gte: dateRange.startDate, lte: dateRange.endDate },
            status: { notIn: ['cart', 'cancelled'] },
            shipments: {
              some: { branch_id: branch.id }
            }
          },
          select: {
            id: true,
            final_amount: true,
            customer_id: true,
            status: true
          }
        });

        const revenue = calculateTotalRevenue(currentOrders);
        const orderCount = currentOrders.length;
        const uniqueCustomers = new Set(currentOrders.map(o => o.customer_id)).size;
        const cancelledOrders = currentOrders.filter(o => o.status === 'cancelled').length;
        const cancellationRate = calculateCancellationRate(orderCount, cancelledOrders);

        // Staff count
        const staffCount = await prisma.staff.count({
          where: { branch_id: branch.id, is_active: true }
        });

        // Performance score
        const averageRating = 4.5; // TODO: Calculate from reviews
        const performance = calculatePerformanceScore({
          revenue,
          orderCount,
          cancellationRate,
          averageRating
        });

        // Comparison
        let comparisonData = null;
        if (comparison) {
          const compPeriod = getComparisonPeriod(dateRange.startDate, dateRange.endDate);
          const compOrders = await prisma.orders.findMany({
            where: {
              order_date: { gte: compPeriod.startDate, lte: compPeriod.endDate },
              status: { notIn: ['cart', 'cancelled'] },
              shipments: {
                some: { branch_id: branch.id }
              }
            },
            select: { final_amount: true }
          });

          const compRevenue = calculateTotalRevenue(compOrders);
          comparisonData = {
            previousRevenue: compRevenue,
            growth: calculateGrowth(revenue, compRevenue)
          };
        }

        return {
          branchId: branch.id,
          name: branch.name,
          city: branch.city,
          revenue,
          orders: orderCount,
          customers: uniqueCustomers,
          staff: staffCount,
          performance: performance.level,
          performanceScore: performance.score.toFixed(1),
          comparison: comparisonData
        };
      })
    );

    // Sort by revenue
    branchesStats.sort((a, b) => b.revenue - a.revenue);

    const topBranch = branchesStats[0];
    const lowestBranch = branchesStats[branchesStats.length - 1];

    return {
      success: true,
      data: {
        branches: branchesStats,
        comparison: {
          topBranch: {
            name: topBranch?.name,
            revenue: topBranch?.revenue
          },
          lowestBranch: {
            name: lowestBranch?.name,
            revenue: lowestBranch?.revenue
          }
        }
      }
    };
};

export const getPromotionsStatistics = async (filters = {}) => {
    const { period, startDate, endDate, branchId } = filters;
    const now = new Date();
    const dateRange = parseDateRange(startDate, endDate, period);

    // Build order where clause for branch filter
    const buildOrderWhere = (baseWhere) => {
      if (branchId) {
        return {
          ...baseWhere,
          shipments: {
            some: { branch_id: Number(branchId) }
          }
        };
      }
      return baseWhere;
    };

    // Vouchers stats (all branches)
    const [totalVouchers, usedVouchers, voucherOrders] = await Promise.all([
      prisma.vouchers.count({
        where: {
          start_date: { lte: now },
          end_date: { gte: now }
        }
      }),
      prisma.uservouchers.count({
        where: { is_used: true }
      }),
      prisma.orders.findMany({
        where: buildOrderWhere({
          order_date: { gte: dateRange.startDate, lte: dateRange.endDate },
          voucher_id: { not: null },
          status: 'completed'
        }),
        include: {
          vouchers: true
        }
      })
    ]);

    // Flashsales stats (all branches - flashsales không phân theo branch)
    const [activeFlashsales, upcomingFlashsales] = await Promise.all([
      prisma.flashsales.count({
        where: {
          status: 'active',
          start_time: { lte: now },
          end_time: { gte: now }
        }
      }),
      prisma.flashsales.count({
        where: {
          status: 'pending',
          start_time: { gt: now }
        }
      })
    ]);

    // Top vouchers
    const voucherStats = {};
    voucherOrders.forEach(order => {
      const voucherId = order.voucher_id;
      if (!voucherStats[voucherId]) {
        voucherStats[voucherId] = {
          voucherId,
          code: order.vouchers.code,
          used: 0,
          discountGiven: 0
        };
      }
      voucherStats[voucherId].used += 1;
      voucherStats[voucherId].discountGiven += Number(order.discount_amount || 0);
    });

    const topVouchers = Object.values(voucherStats)
      .sort((a, b) => b.used - a.used)
      .slice(0, 10);

    const totalDiscount = voucherOrders.reduce((sum, order) => {
      return sum + Number(order.discount_amount || 0);
    }, 0);

    const usageRate = calculateVoucherUsageRate(totalVouchers, usedVouchers);

    return {
      success: true,
      data: {
        activePromotions: totalVouchers + activeFlashsales,
        flashSales: {
          active: activeFlashsales,
          upcomingSoon: upcomingFlashsales
        },
        vouchers: {
          issued: totalVouchers,
          used: usedVouchers,
          usageRate: `${usageRate.toFixed(1)}%`
        },
        topVouchers,
        totalDiscount,
        ...(branchId && { filteredByBranch: Number(branchId) })
      }
    };
};

export const getReviewsStatistics = async (filters = {}) => {
    const { period, startDate, endDate, productId, branchId } = filters;
    const dateRange = parseDateRange(startDate, endDate, period);

    const where = {
      created_at: { gte: dateRange.startDate, lte: dateRange.endDate }
    };

    if (productId) {
      where.product_id = Number(productId);
    }

    // If branchId is provided, filter reviews by products available in that branch
    if (branchId) {
      const branchProducts = await prisma.branchinventory.findMany({
        where: { branch_id: Number(branchId) },
        select: { product_id: true }
      });
      
      const productIds = branchProducts.map(bp => bp.product_id);
      
      if (productIds.length > 0) {
        where.product_id = { in: productIds };
      } else {
        // If no products in branch, return empty result
        return {
          success: true,
          data: {
            averageRating: '0.0',
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            recentReviews: [],
            pendingModeration: 0,
            filteredByBranch: Number(branchId)
          }
        };
      }
    }

    const reviews = await prisma.reviews.findMany({
      where,
      include: {
        products: {
          select: { id: true, name: true }
        },
        customers: {
          include: {
            users: {
              select: { full_name: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const averageRating = calculateAverageRating(reviews);
    const ratingDistribution = calculateRatingDistribution(reviews);

    const recentReviews = reviews.slice(0, 10).map(review => ({
      id: review.id,
      productId: review.product_id,
      productName: review.products.name,
      customerName: review.customers.users?.full_name || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at
    }));

    const pendingModeration = 0;

    return {
      success: true,
      data: {
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length,
        ratingDistribution,
        recentReviews,
        pendingModeration,
        ...(branchId && { filteredByBranch: Number(branchId) })
      }
    };
};

export const getRecentActivities = async (filters = {}) => {
    const { limit = 20, branchId } = filters;
    const activities = [];

    // Recent orders
    const orderWhere = { status: { not: 'cart' } };
    if (branchId) {
      orderWhere.shipments = {
        some: { branch_id: Number(branchId) }
      };
    }

    const recentOrders = await prisma.orders.findMany({
      where: orderWhere,
      include: {
        customers: {
          include: {
            users: {
              select: { full_name: true }
            }
          }
        }
      },
      orderBy: { order_date: 'desc' },
      take: 5
    });

    recentOrders.forEach(order => {
      activities.push({
        type: 'ORDER_CREATED',
        message: `Đơn hàng #${order.id} vừa được tạo`,
        orderId: order.id,
        customer: order.customers.users?.full_name || 'N/A',
        amount: Number(order.final_amount),
        timestamp: order.order_date
      });
    });

    // Low stock alerts
    const lowStockWhere = branchId ? { branch_id: Number(branchId) } : {};
    const lowStockItems = await prisma.branchinventory.findMany({
      where: {
        ...lowStockWhere,
        stock: {
          gt: 0,
          lte: prisma.branchinventory.fields.min_stock
        }
      },
      include: {
        products: {
          select: { id: true, name: true }
        }
      },
      take: 5
    });

    lowStockItems.forEach(item => {
      activities.push({
        type: 'LOW_STOCK_ALERT',
        message: `${item.products.name} sắp hết hàng`,
        productId: item.product_id,
        currentStock: item.stock,
        timestamp: item.last_updated || new Date()
      });
    });

    // New customers
    const newCustomers = await prisma.customers.findMany({
      include: {
        users: {
          select: { full_name: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    newCustomers.forEach(customer => {
      activities.push({
        type: 'NEW_CUSTOMER',
        message: 'Khách hàng mới đăng ký',
        customerId: customer.id,
        name: customer.users?.full_name || 'N/A',
        timestamp: customer.created_at
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      data: {
        activities: activities.slice(0, Number(limit))
      }
    };
};
