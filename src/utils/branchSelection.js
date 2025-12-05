import prisma from '../config/db.js';

/**
 * Get city ID from city name (for backward compatibility)
 * @param {string} cityName - City name
 * @returns {number|null} City ID
 */
const getCityIdFromName = async (cityName) => {
  if (!cityName) return null;
  
  const city = await prisma.cities.findFirst({
    where: {
      name: {
        equals: cityName,
        mode: 'insensitive'
      }
    }
  });
  
  return city ? city.id : null;
};

/**
 * Find nearest branch with sufficient stock for a product based on city ID
 * @param {number} productId - Product ID
 * @param {number} requiredQuantity - Required quantity in base unit
 * @param {number} customerCityId - Customer city ID
 * @returns {Object} Nearest branch with stock or null
 */
export const findNearestBranchWithStock = async (productId, requiredQuantity, customerCityId = null) => {
  try {
    // Get all branches with sufficient stock for this product
    const branchesWithStock = await prisma.branchinventory.findMany({
      where: {
        product_id: Number(productId),
        stock: {
          gte: requiredQuantity
        },
        branches: {
          is_active: true
        }
      },
      include: {
        branches: {
          include: {
            cities: true
          }
        }
      }
    });

    if (branchesWithStock.length === 0) {
      return null;
    }

    // If customer city ID provided, prioritize branches in same city
    if (customerCityId) {
      // Find branches in same city
      const sameCityBranches = branchesWithStock.filter(inv => 
        inv.branches.city_id === Number(customerCityId)
      );

      if (sameCityBranches.length > 0) {
        // Return first branch in same city
        return {
          branch: sameCityBranches[0].branches,
          inventory: sameCityBranches[0],
          sameCity: true
        };
      }
    }

    // If no same-city branch or no customer city, return first available
    return {
      branch: branchesWithStock[0].branches,
      inventory: branchesWithStock[0],
      sameCity: false
    };
  } catch (error) {
    console.error('Error finding nearest branch:', error);
    throw error;
  }
};

/**
 * Find optimal branches for multiple products in an order based on city ID
 * Optimizes to find single branch that can fulfill all items if possible
 * @param {Array} orderItems - Array of {productId, quantity, conversionFactor}
 * @param {number} customerCityId - Customer city ID
 * @returns {Object} Branch allocation for order items
 */
export const findOptimalBranchesForOrder = async (orderItems, customerCityId = null) => {
  try {
    // Get all active branches
    const allBranches = await prisma.branches.findMany({
      where: {
        is_active: true
      },
      include: {
        branchinventory: true,
        cities: true
      }
    });

    // Separate branches into same city and other cities
    const sameCityBranches = [];
    const otherCityBranches = [];

    for (const branch of allBranches) {
      if (customerCityId && branch.city_id === Number(customerCityId)) {
        sameCityBranches.push(branch);
      } else {
        otherCityBranches.push(branch);
      }
    }

    // Prioritize same city branches
    const orderedBranches = [...sameCityBranches, ...otherCityBranches];

    // Try to find a single branch that can fulfill all items
    for (const branch of orderedBranches) {
      let canFulfillAll = true;
      
      for (const item of orderItems) {
        const inventory = branch.branchinventory.find(
          inv => inv.product_id === Number(item.productId)
        );
        
        const requiredQty = Number(item.quantity) * Number(item.conversionFactor || 1);
        
        if (!inventory || inventory.stock < requiredQty) {
          canFulfillAll = false;
          break;
        }
      }

      if (canFulfillAll) {
        const sameCity = customerCityId && branch.city_id === Number(customerCityId);
        
        return {
          strategy: 'single_branch',
          branches: [{
            branch,
            items: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              conversionFactor: item.conversionFactor
            })),
            sameCity
          }]
        };
      }
    }

    // If no single branch can fulfill all items, allocate per product from nearest branch
    const allocatedBranches = new Map();

    for (const item of orderItems) {
      const requiredQty = Number(item.quantity) * Number(item.conversionFactor || 1);
      const nearestBranch = await findNearestBranchWithStock(
        item.productId,
        requiredQty,
        customerCityId
      );

      if (!nearestBranch) {
        throw new Error(`Không đủ hàng cho sản phẩm ID ${item.productId}`);
      }

      const branchId = nearestBranch.branch.id;
      
      if (!allocatedBranches.has(branchId)) {
        allocatedBranches.set(branchId, {
          branch: nearestBranch.branch,
          items: [],
          sameCity: nearestBranch.sameCity
        });
      }

      allocatedBranches.get(branchId).items.push({
        productId: item.productId,
        quantity: item.quantity,
        conversionFactor: item.conversionFactor
      });
    }

    return {
      strategy: 'multiple_branches',
      branches: Array.from(allocatedBranches.values())
    };
  } catch (error) {
    console.error('Error finding optimal branches:', error);
    throw error;
  }
};

/**
 * Get customer city ID from shipping address or customer profile
 * @param {number} customerId - Customer ID
 * @param {number} shippingAddressId - Optional shipping address ID
 * @returns {number} City ID or null
 */
export const getCustomerCityId = async (customerId, shippingAddressId = null) => {
  try {
    // If specific shipping address provided, use it
    if (shippingAddressId) {
      const shippingAddress = await prisma.shippingaddresses.findUnique({
        where: {
          id: Number(shippingAddressId),
          customer_id: Number(customerId)
        }
      });

      if (shippingAddress && shippingAddress.city_id) {
        return shippingAddress.city_id;
      }
    }

    // Try to get from most recent shipping address
    const recentShippingAddress = await prisma.shippingaddresses.findFirst({
      where: {
        customer_id: Number(customerId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (recentShippingAddress && recentShippingAddress.city_id) {
      return recentShippingAddress.city_id;
    }

    // Try to get from customer profile
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (customer && customer.city_id) {
      return customer.city_id;
    }

    return null;
  } catch (error) {
    console.error('Error getting customer city ID:', error);
    return null;
  }
};

// Backward compatibility: Get city name (deprecated, use getCustomerCityId instead)
export const getCustomerCity = async (customerId, shippingAddressId = null) => {
  const cityId = await getCustomerCityId(customerId, shippingAddressId);
  if (!cityId) return null;
  
  const city = await prisma.cities.findUnique({
    where: { id: cityId }
  });
  
  return city ? city.name : null;
};

// Keep backward compatibility with old function name
export const getCustomerLocation = getCustomerCityId;
