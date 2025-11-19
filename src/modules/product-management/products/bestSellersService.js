import prisma from '../../../config/db.js';

/**
 * Get top best selling products (sản phẩm nổi bật)
 * Tính toán trực tiếp từ orderitems - không cần cache
 */
export const getBestSellers = async (limit = 10) => {
  try {
    // Tính tổng số lượng bán của mỗi sản phẩm từ orderitems
    const productSales = await prisma.orderitems.groupBy({
      by: ['product_id'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    });

    // Lấy thông tin chi tiết của các sản phẩm bán chạy
    const productIds = productSales.map(item => item.product_id);
    
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        categories: true,
        suppliers: true,
        unittype: true,
        productunits: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Map products với sold_count và rank
    const productsMap = new Map(products.map(p => [p.id, p]));
    
    const bestSellers = productSales.map((sale, index) => {
      const product = productsMap.get(sale.product_id);
      
      const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        rank: index + 1,
        sold_count: sale._sum.quantity || 0,
        average_rating: Math.round(averageRating * 10) / 10,
        review_count: product.reviews.length
      };
    });

    return {
      success: true,
      data: bestSellers
    };
  } catch (error) {
    console.error('Get best sellers error:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy sản phẩm nổi bật',
      status: 500
    };
  }
};

/**
 * Update product sold_count after order completion
 * Cập nhật sold_count trong bảng products khi đơn hàng hoàn thành
 */
export const updateProductSoldCount = async (productId, quantity = 1) => {
  try {
    const updated = await prisma.products.update({
      where: {
        id: productId
      },
      data: {
        sold_count: {
          increment: quantity
        }
      }
    });

    return {
      success: true,
      data: updated
    };
  } catch (error) {
    console.error('Update sold count error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async (productId) => {
  try {
    // Lấy tổng số lượng đã bán từ orderitems
    const salesData = await prisma.orderitems.aggregate({
      where: {
        product_id: productId
      },
      _sum: {
        quantity: true
      }
    });

    const product = await prisma.products.findUnique({
      where: {
        id: productId
      },
      include: {
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    if (!product) {
      return {
        success: false,
        error: 'Sản phẩm không tồn tại',
        status: 404
      };
    }

    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    return {
      success: true,
      data: {
        product_id: product.id,
        sold_count: salesData._sum.quantity || 0,
        review_count: product.reviews.length,
        average_rating: Math.round(averageRating * 10) / 10
      }
    };
  } catch (error) {
    console.error('Get product stats error:', error);
    return {
      success: false,
      error: 'Lỗi khi lấy thống kê sản phẩm',
      status: 500
    };
  }
};
