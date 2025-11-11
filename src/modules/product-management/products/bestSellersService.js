import prisma from '../../../config/db.js';

/**
 * Get top 10 best selling products
 */
export const getBestSellers = async () => {
  try {
    // Try to get from cache first
    const cachedBestSellers = await prisma.best_sellers_cache.findMany({
      orderBy: {
        rank: 'asc'
      },
      take: 10,
      include: {
        product: {
          include: {
            categories: true,
            productunits: true,
            reviews: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    // If cache exists and is recent (updated within last hour), return it
    if (cachedBestSellers.length > 0) {
      const latestUpdate = cachedBestSellers[0].updated_at;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (latestUpdate >= oneHourAgo) {
        return {
          success: true,
          data: cachedBestSellers.map(item => ({
            ...item.product,
            rank: item.rank,
            sold_count: item.sold_count,
            average_rating: item.product.reviews.length > 0
              ? item.product.reviews.reduce((sum, r) => sum + r.rating, 0) / item.product.reviews.length
              : 0
          })),
          cached: true,
          lastUpdate: latestUpdate
        };
      }
    }

    // If no cache or cache is old, get fresh data from products
    const bestSellers = await prisma.products.findMany({
      orderBy: {
        sold_count: 'desc'
      },
      take: 10,
      include: {
        categories: true,
        productunits: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate average ratings
    const productsWithRatings = bestSellers.map(product => ({
      ...product,
      average_rating: product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0
    }));

    // Update cache
    await updateBestSellersCache(bestSellers);

    return {
      success: true,
      data: productsWithRatings.map((p, index) => ({
        ...p,
        rank: index + 1
      })),
      cached: false,
      lastUpdate: new Date()
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
 * Update best sellers cache
 */
export const updateBestSellersCache = async (products = null) => {
  try {
    // If products not provided, fetch them
    if (!products) {
      products = await prisma.products.findMany({
        orderBy: {
          sold_count: 'desc'
        },
        take: 10
      });
    }

    // Delete old cache
    await prisma.best_sellers_cache.deleteMany({});

    // Insert new cache
    const cacheData = products.map((product, index) => ({
      product_id: product.id,
      rank: index + 1,
      sold_count: product.sold_count || 0
    }));

    await prisma.best_sellers_cache.createMany({
      data: cacheData
    });

    console.log(`📊 Updated best sellers cache with ${cacheData.length} products`);
    
    return {
      success: true,
      count: cacheData.length
    };
  } catch (error) {
    console.error('Update best sellers cache error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Increment product sold count (called after order completion)
 */
export const incrementProductSoldCount = async (productId, quantity = 1) => {
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

    // Check if this product should be in top 10
    const currentBestSellers = await prisma.best_sellers_cache.findMany({
      orderBy: {
        rank: 'asc'
      },
      take: 10
    });

    // If cache has less than 10 items, or this product sold more than the 10th item
    if (currentBestSellers.length < 10) {
      await updateBestSellersCache();
    } else {
      const tenthPlace = currentBestSellers[currentBestSellers.length - 1];
      if (updated.sold_count > tenthPlace.sold_count) {
        // Product should be in top 10, update cache
        await updateBestSellersCache();
      }
    }

    return {
      success: true,
      data: updated
    };
  } catch (error) {
    console.error('Increment sold count error:', error);
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
    const product = await prisma.products.findUnique({
      where: {
        id: productId
      },
      include: {
        reviews: {
          select: {
            rating: true
          }
        },
        best_sellers_cache: true
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
        sold_count: product.sold_count || 0,
        review_count: product.reviews.length,
        average_rating: averageRating,
        rank: product.best_sellers_cache?.rank || null,
        is_best_seller: !!product.best_sellers_cache
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
