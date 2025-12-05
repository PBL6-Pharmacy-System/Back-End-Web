/**
 * Query Optimization Utilities
 * 
 * Common optimized query patterns to avoid N+1 problems
 * and over-fetching data
 */

/**
 * Common select fields for performance
 */
export const selectFields = {
  user: {
    id: true,
    username: true,
    email: true,
    full_name: true,
    phone: true,
    role_id: true
  },
  
  customer: {
    id: true,
    user_id: true,
    date_of_birth: true,
    gender: true
  },
  
  product: {
    id: true,
    name: true,
    price: true,
    image_url: true,
    category_id: true,
    sold_count: true
  },
  
  productWithCategory: {
    id: true,
    name: true,
    price: true,
    image_url: true,
    sold_count: true,
    categories: {
      select: {
        id: true,
        name: true
      }
    }
  },
  
  order: {
    id: true,
    customer_id: true,
    status: true,
    total_amount: true,
    final_amount: true,
    order_date: true
  },
  
  orderWithCustomer: {
    id: true,
    customer_id: true,
    status: true,
    total_amount: true,
    final_amount: true,
    order_date: true,
    customers: {
      select: {
        id: true,
        users: {
          select: {
            full_name: true,
            phone: true
          }
        }
      }
    }
  },
  
  payment: {
    id: true,
    order_id: true,
    payment_method: true,
    amount: true,
    status: true,
    transaction_id: true
  }
};

/**
 * Common include patterns
 */
export const includePatterns = {
  orderWithDetails: {
    orderitems: {
      include: {
        products: {
          select: selectFields.product
        },
        productunits: {
          select: {
            id: true,
            unit_name: true,
            conversion_factor: true
          }
        }
      }
    },
    customers: {
      select: {
        id: true,
        users: {
          select: {
            full_name: true,
            phone: true
          }
        }
      }
    },
    shippingaddresses: {
      select: {
        address_line: true,
        city: true,
        state: true
      }
    },
    payments: {
      select: selectFields.payment
    }
  },
  
  productWithInventory: {
    categories: {
      select: { id: true, name: true }
    },
    branchinventory: {
      select: {
        branch_id: true,
        stock: true,
        branches: {
          select: { id: true, name: true, city_id: true }
        }
      }
    }
  }
};

/**
 * Batch query helper - prevents N+1 queries
 * 
 * @example
 * // Instead of:
 * for (const order of orders) {
 *   order.customer = await getCustomer(order.customer_id);
 * }
 * 
 * // Use:
 * const customerIds = orders.map(o => o.customer_id);
 * const customers = await batchQuery(prisma.customers, customerIds);
 * orders.forEach(order => {
 *   order.customer = customers[order.customer_id];
 * });
 */
export const batchQuery = async (model, ids, selectFields = null) => {
  const query = {
    where: {
      id: { in: ids }
    }
  };
  
  if (selectFields) {
    query.select = selectFields;
  }
  
  const results = await model.findMany(query);
  
  // Convert to map for O(1) lookup
  return results.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});
};

/**
 * Pagination helper
 */
export const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  };
};

/**
 * Build pagination response
 */
export const paginationResponse = (data, total, page, limit) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const totalPages = Math.ceil(total / limitNum);
  
  return {
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages
    }
  };
};

/**
 * Query performance logger
 */
export const logQuery = (queryName, startTime) => {
  const duration = Date.now() - startTime;
  if (duration > 100) { // Log slow queries (> 100ms)
    console.warn(`[SLOW QUERY] ${queryName} took ${duration}ms`);
  }
};

/**
 * Retry helper for database operations
 */
export const retryQuery = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export default {
  selectFields,
  includePatterns,
  batchQuery,
  paginate,
  paginationResponse,
  logQuery,
  retryQuery
};
