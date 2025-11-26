import { cache } from '../config/cache.js';

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @param {function} keyGenerator - Custom key generator function
 */
export const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl || req.url}`;

      // Check if cached data exists
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`⚠️ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache successful responses
      res.json = (data) => {
        // Only cache successful responses (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch((err) => {
            console.error('Error caching response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Don't break request if cache fails
      next();
    }
  };
};

/**
 * Cache invalidation middleware for write operations
 * Clears cache patterns after POST, PUT, PATCH, DELETE
 * @param {string|function} pattern - Pattern to clear or function returning pattern
 */
export const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    // Store original functions
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override response methods to invalidate cache after successful write
    const wrapResponse = (fn) => {
      return async (data) => {
        // Only invalidate on successful write operations (2xx status)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cachePattern = typeof pattern === 'function' 
            ? pattern(req) 
            : pattern;
          
          if (cachePattern) {
            await cache.delPattern(cachePattern);
            console.log(`🗑️ Cache invalidated: ${cachePattern}`);
          }
        }
        return fn(data);
      };
    };

    res.json = wrapResponse(originalJson);
    res.send = wrapResponse(originalSend);

    next();
  };
};

/**
 * Predefined cache key generators for common patterns
 */
export const cacheKeys = {
  /**
   * Generate key for product list
   */
  productList: (req) => {
    const { page = 1, limit = 10, categoryId, supplierId, keyword } = req.query;
    return `cache:products:page=${page}:limit=${limit}:cat=${categoryId || 'all'}:sup=${supplierId || 'all'}:kw=${keyword || 'none'}`;
  },

  /**
   * Generate key for single product
   */
  product: (req) => {
    return `cache:product:${req.params.id}`;
  },

  /**
   * Generate key for categories
   */
  categories: (req) => {
    return `cache:categories:all`;
  },

  /**
   * Generate key for customer orders
   */
  customerOrders: (req) => {
    const customerId = req.user?.customerId || req.params.customerId;
    const { page = 1, limit = 10, status } = req.query;
    return `cache:orders:customer=${customerId}:page=${page}:limit=${limit}:status=${status || 'all'}`;
  },

  /**
   * Generate key for reviews
   */
  productReviews: (req) => {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    return `cache:reviews:product=${productId}:page=${page}:limit=${limit}`;
  }
};

/**
 * Predefined cache invalidation patterns
 */
export const cachePatterns = {
  products: 'cache:products:*',
  singleProduct: (req) => `cache:product:${req.params.id || req.body.id}`,
  categories: 'cache:categories:*',
  orders: 'cache:orders:*',
  customerOrders: (req) => `cache:orders:customer=${req.user?.customerId || req.params.customerId}:*`,
  reviews: (req) => `cache:reviews:product=${req.params.productId || req.body.product_id}:*`,
  cart: (req) => `cache:cart:customer=${req.user?.customerId}:*`
};

export default cacheMiddleware;
