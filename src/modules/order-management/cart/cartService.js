import prisma from '../../../config/db.js';
import { findOptimalBranchesForOrder, getCustomerLocation } from '../../../utils/branchSelection.js';
import { CART_LIMITS, ORDER_STATUS } from '../../../utils/constants.js';
import { validateNumericFields } from '../../../utils/validation.js';

const validateOrderItem = (item) => {
  // Required fields
  if (!item.productId || !item.productUnitId || !item.quantity) {
    return {
      isValid: false,
      error: 'Thiếu thông tin sản phẩm hoặc số lượng'
    };
  }

  // Validate numeric fields (unitPrice is optional, will be fetched from DB)
  const numericFields = ['productId', 'productUnitId', 'quantity'];
  if (item.unitPrice !== undefined && item.unitPrice !== null) {
    numericFields.push('unitPrice');
  }
  
  const invalidNumbers = validateNumericFields(item, numericFields);
  if (invalidNumbers.length > 0) {
    return {
      isValid: false,
      error: `Các trường sau phải là số hợp lệ: ${invalidNumbers.join(', ')}`
    };
  }

  // Validate quantity
  if (item.quantity <= 0) {
    return {
      isValid: false,
      error: 'Số lượng phải lớn hơn 0'
    };
  }

  return { isValid: true };
};

const validateStockAvailability = async (items) => {
  for (const item of items) {
    const { productId, productUnitId, quantity, branchId } = item;

    // Check product exists
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
      include: { productunits: true }
    });

    if (!product) {
      return {
        isValid: false,
        error: `Sản phẩm không tồn tại`
      };
    }

    // Check product unit exists and belongs to product
    const productUnit = product.productunits.find(
      unit => unit.id === Number(productUnitId)
    );

    if (!productUnit) {
      return {
        isValid: false,
        error: `Đơn vị sản phẩm không hợp lệ`
      };
    }

    // Calculate base quantity needed using conversion factor
    const conversionFactor = Number(productUnit.conversion_factor);
    const baseQuantityNeeded = Number(quantity) * conversionFactor;

    // Check stock if branchId is provided
    if (branchId) {
      const stock = await prisma.branchinventory.findFirst({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId)
        }
      });

      if (!stock || stock.stock < baseQuantityNeeded) {
        return {
          isValid: false,
          error: `Sản phẩm ${product.name} không đủ số lượng trong kho (cần ${baseQuantityNeeded} đơn vị, còn ${stock?.stock || 0})`
        };
      }
    } else {
      // Check if product is available in any branch
      const availableBranch = await prisma.branchinventory.findFirst({
        where: {
          product_id: Number(productId),
          stock: {
            gte: baseQuantityNeeded
          }
        }
      });

      if (!availableBranch) {
        return {
          isValid: false,
          error: `Sản phẩm ${product.name} không đủ số lượng trong kho (cần ${baseQuantityNeeded} đơn vị)`
        };
      }
    }
  }

  return { isValid: true };
};

// Kiểm tra và lấy giá flashsale nếu có
const getFlashsalePrice = async (productId) => {
  try {
    const now = new Date();
    
    // Tìm flashsale đang active
    const flashsale = await prisma.flashsales.findFirst({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: 'active'
      },
      include: {
        flashsale_products: {
          where: {
            product_id: productId
          },
          select: {
            id: true,
            flash_price: true,
            stock_limit: true,
            sold_count: true
          }
        }
      }
    });

    if (!flashsale || !flashsale.flashsale_products.length) {
      return null;
    }

    const flashsaleProduct = flashsale.flashsale_products[0];
    
    // Kiểm tra còn hàng flashsale không
    if (flashsaleProduct.sold_count >= flashsaleProduct.stock_limit) {
      return null;
    }

    return flashsaleProduct;
  } catch (error) {
    console.error('Error checking flashsale:', error);
    return null;
  }
};

const calculateOrderTotals = async (items) => {
  let subtotal = 0;
  let totalQuantity = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const { quantity, unitPrice, productId } = item;
    
    // Kiểm tra giá flashsale
    const flashsaleProduct = await getFlashsalePrice(productId);
    
    if (flashsaleProduct) {
      // Tính giá với flashsale
      const flashPrice = Number(flashsaleProduct.flash_price);
      const regularPrice = quantity * unitPrice;
      const flashsalePrice = quantity * flashPrice;
      
      subtotal += flashsalePrice;
      totalDiscount += (regularPrice - flashsalePrice);
      
      // Cập nhật số lượng đã bán trong flashsale
      await prisma.flashsale_products.update({
        where: { id: flashsaleProduct.id },
        data: {
          sold_count: {
            increment: quantity
          }
        }
      });
    } else {
      // Tính giá bình thường
      subtotal += quantity * unitPrice;
    }
    
    totalQuantity += quantity;
  }

  return {
    subtotal,
    totalQuantity,
    totalDiscount,
    totalAmount: subtotal // Will be updated with other discounts/vouchers later
  };
};

export const getCart = async (customerId) => {
  try {
    // Check if customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy khách hàng'
      };
    }

    // Get or create cart
    let cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderitems: {
          select: {
            id: true,
            product_id: true,
            unit_id: true,
            quantity: true,
            price: true,
            subtotal: true,
            products: {
              select: {
                id: true,
                name: true,
                image_url: true,
                price: true
              }
            },
            productunits: {
              select: {
                id: true,
                unit_name: true,
                conversion_factor: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.orders.create({
        data: {
          customer_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date(),
          total_amount: 0,
          final_amount: 0
        },
        include: {
          orderitems: {
            select: {
              id: true,
              product_id: true,
              unit_id: true,
              quantity: true,
              price: true,
              subtotal: true,
              products: {
                select: {
                  id: true,
                  name: true,
                  image_url: true,
                  price: true
                }
              },
              productunits: {
                select: {
                  id: true,
                  unit_name: true,
                  conversion_factor: true
                }
              }
            }
          }
        }
      });
    }

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    throw error;
  }
};

export const addToCart = async (customerId, orderData) => {
  try {
    // Support both camelCase and snake_case
    const productId = orderData.productId || orderData.product_id;
    const productUnitId = orderData.productUnitId || orderData.unit_id || orderData.productUnitId;
    const quantity = orderData.quantity;
    const unitPrice = orderData.unitPrice || orderData.unit_price;
    const branchId = orderData.branchId || orderData.branch_id;

    // Validate order item (without unitPrice since we'll get it from DB)
    const validation = validateOrderItem({
      productId,
      productUnitId,
      quantity
    });

    if (!validation.isValid) {
      return {
        success: false,
        status: 400,
        error: validation.error
      };
    }

    // Validate quantity limits
    if (Number(quantity) > CART_LIMITS.MAX_QUANTITY_PER_ITEM) {
      return {
        success: false,
        status: 400,
        error: `Số lượng tối đa cho mỗi sản phẩm là ${CART_LIMITS.MAX_QUANTITY_PER_ITEM}`
      };
    }

    // Get product with unit
    const product = await prisma.products.findUnique({
      where: { id: Number(productId) },
      include: {
        productunits: {
          where: { id: Number(productUnitId) }
        }
      }
    });

    if (!product) {
      return {
        success: false,
        status: 404,
        error: 'Sản phẩm không tồn tại'
      };
    }

    if (product.productunits.length === 0) {
      return {
        success: false,
        status: 404,
        error: 'Đơn vị sản phẩm không tồn tại'
      };
    }

    // Get current price from product unit
    const productUnit = product.productunits[0];
    const currentPrice = Number(productUnit.price);

    // If unitPrice is provided, verify it matches current price
    if (unitPrice !== undefined && unitPrice !== null) {
      const providedPrice = Number(unitPrice);
      if (Math.abs(currentPrice - providedPrice) > 0.01) {
        return {
          success: false,
          status: 400,
          error: `Giá sản phẩm đã thay đổi. Giá hiện tại: ${currentPrice} VNĐ`,
          data: {
            currentPrice,
            providedPrice
          }
        };
      }
    }

    // Check branch inventory if branchId is provided
    if (branchId) {
      const branchInventory = await prisma.branchinventory.findFirst({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId)
        }
      });

      if (!branchInventory) {
        return {
          success: false,
          status: 404,
          error: 'Sản phẩm không có sẵn tại chi nhánh này'
        };
      }

      // Calculate total quantity needed (convert unit to base unit using conversion_factor)
      const conversionFactor = Number(productUnit.conversion_factor);
      const baseQuantityNeeded = Number(quantity) * conversionFactor;

      if (branchInventory.stock < baseQuantityNeeded) {
        return {
          success: false,
          status: 400,
          error: `Sản phẩm không đủ số lượng tại chi nhánh (còn ${branchInventory.stock} ${product.base_unit_id ? 'đơn vị cơ bản' : ''})`
        };
      }
    }

    // Check stock availability (general stock check)
    const stockValidation = await validateStockAvailability([{
      productId,
      productUnitId,
      quantity,
      branchId
    }]);

    if (!stockValidation.isValid) {
      return {
        success: false,
        status: 400,
        error: stockValidation.error
      };
    }

    // Get or create cart
    let cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderitems: true
      }
    });

    if (!cart) {
      cart = await prisma.orders.create({
        data: {
          customer_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date(),
          total_amount: 0,
          final_amount: 0
        },
        include: {
          orderitems: true
        }
      });
    }

    // Check cart item limit
    const currentItemCount = cart.orderitems.length;
    const existingItem = cart.orderitems.find(
      item => item.product_id === Number(productId) && item.unit_id === Number(productUnitId)
    );

    if (!existingItem && currentItemCount >= CART_LIMITS.MAX_ITEMS_PER_CART) {
      return {
        success: false,
        status: 400,
        error: `Giỏ hàng chỉ chứa tối đa ${CART_LIMITS.MAX_ITEMS_PER_CART} loại sản phẩm khác nhau`
      };
    }

    // Check if adding quantity exceeds limit
    if (existingItem) {
      const newQuantity = existingItem.quantity + Number(quantity);
      if (newQuantity > CART_LIMITS.MAX_QUANTITY_PER_ITEM) {
        return {
          success: false,
          status: 400,
          error: `Số lượng tối đa cho sản phẩm này là ${CART_LIMITS.MAX_QUANTITY_PER_ITEM}`
        };
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if item already exists in cart
      const existingCartItem = await tx.orderitems.findFirst({
        where: {
          order_id: cart.id,
          product_id: Number(productId),
          unit_id: Number(productUnitId)
        }
      });

      let item;
      if (existingCartItem) {
        // Update existing item
        const newQuantity = existingCartItem.quantity + Number(quantity);
        
        item = await tx.orderitems.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            price: currentPrice, // Update price to current price
            subtotal: newQuantity * currentPrice,
            updated_at: new Date()
          },
          include: {
            products: true,
            productunits: true
          }
        });
      } else {
        // Create new item
        item = await tx.orderitems.create({
          data: {
            order_id: cart.id,
            product_id: Number(productId),
            unit_id: Number(productUnitId),
            quantity: Number(quantity),
            price: currentPrice,
            subtotal: Number(quantity) * currentPrice
          },
          include: {
            products: true,
            productunits: true
          }
        });
      }

      // Recalculate cart totals
      const allItems = await tx.orderitems.findMany({
        where: { order_id: cart.id }
      });

      const total = allItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

      // Update order totals and timestamp
      await tx.orders.update({
        where: { id: cart.id },
        data: {
          total_amount: total,
          final_amount: total,
          updated_at: new Date()
        }
      });

      return item;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw error;
  }
};

export const updateCartItem = async (itemId, quantity) => {
  try {
    if (!quantity || quantity <= 0) {
      return {
        success: false,
        status: 400,
        error: 'Số lượng phải lớn hơn 0'
      };
    }

    // Validate quantity limits
    if (Number(quantity) > CART_LIMITS.MAX_QUANTITY_PER_ITEM) {
      return {
        success: false,
        status: 400,
        error: `Số lượng tối đa cho mỗi sản phẩm là ${CART_LIMITS.MAX_QUANTITY_PER_ITEM}`
      };
    }

    // Get current item
    const currentItem = await prisma.orderitems.findUnique({
      where: { id: Number(itemId) },
      include: {
        products: true,
        productunits: true,
        orders: true
      }
    });

    if (!currentItem) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      };
    }

    if (currentItem.orders.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Không thể cập nhật sản phẩm trong đơn hàng đã xử lý'
      };
    }

    // Check stock availability from branch inventory
    const conversionFactor = Number(currentItem.productunits.conversion_factor);
    const baseQuantityNeeded = Number(quantity) * conversionFactor;
    
    // Check if product is available in any branch
    const availableBranch = await prisma.branchinventory.findFirst({
      where: {
        product_id: currentItem.product_id,
        stock: {
          gte: baseQuantityNeeded
        }
      }
    });

    if (!availableBranch) {
      return {
        success: false,
        status: 400,
        error: `Sản phẩm "${currentItem.products.name}" không đủ số lượng trong kho (cần ${baseQuantityNeeded} đơn vị cơ bản)`
      };
    }

    // Verify current price hasn't changed significantly
    const currentPrice = Number(currentItem.productunits.price);
    const cartPrice = Number(currentItem.price);

    if (Math.abs(currentPrice - cartPrice) > 0.01) {
      return {
        success: false,
        status: 400,
        error: `Giá sản phẩm đã thay đổi. Vui lòng xóa và thêm lại sản phẩm`,
        data: {
          oldPrice: cartPrice,
          newPrice: currentPrice
        }
      };
    }

    // Calculate new subtotal
    const newSubtotal = Number(quantity) * cartPrice;
    const oldSubtotal = Number(currentItem.subtotal);
    const subtotalDiff = newSubtotal - oldSubtotal;

    // Update item and order totals in transaction
    const [item] = await prisma.$transaction([
      prisma.orderitems.update({
        where: { id: Number(itemId) },
        data: {
          quantity: Number(quantity),
          subtotal: newSubtotal
        },
        include: {
          products: true,
          productunits: true
        }
      }),
      prisma.orders.update({
        where: { id: currentItem.order_id },
        data: {
          total_amount: { increment: subtotalDiff },
          final_amount: { increment: subtotalDiff }
        }
      })
    ]);

    return {
      success: true,
      data: item
    };
  } catch (error) {
    throw error;
  }
};

export const removeCartItem = async (customerId, itemId) => {
  try {
    // Get customer's cart first
    const cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      }
    });

    if (!cart) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy giỏ hàng'
      };
    }

    // Get item and verify it belongs to this cart
    const currentItem = await prisma.orderitems.findUnique({
      where: { id: Number(itemId) },
      include: { orders: true }
    });

    if (!currentItem) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      };
    }

    // Verify item belongs to customer's cart
    if (currentItem.order_id !== cart.id) {
      return {
        success: false,
        status: 403,
        error: 'Sản phẩm không thuộc giỏ hàng của bạn'
      };
    }

    if (currentItem.orders.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa sản phẩm trong đơn hàng đã xử lý'
      };
    }

    const subtotal = Number(currentItem.subtotal);

    // Remove item and update order totals
    await prisma.$transaction([
      prisma.orderitems.delete({
        where: { id: Number(itemId) }
      }),
      prisma.orders.update({
        where: { id: currentItem.order_id },
        data: {
          total_amount: { decrement: subtotal },
          final_amount: { decrement: subtotal },
          updated_at: new Date()
        }
      })
    ]);

    return {
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    };
  } catch (error) {
    throw error;
  }
};

export const checkout = async (orderId) => {
  try {
    // Get current order
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy đơn hàng'
      };
    }

    if (order.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Đơn hàng đã được xử lý'
      };
    }

    if (order.orderitems.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng trống'
      };
    }

    // Get customer location for branch selection
    const customerLocation = await getCustomerLocation(order.customer_id);

    // Prepare order items for branch selection
    const orderItemsForBranch = order.orderitems.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      conversionFactor: Number(item.productunits.conversion_factor)
    }));

    // Find optimal branches to fulfill the order
    let branchAllocation;
    try {
      branchAllocation = await findOptimalBranchesForOrder(orderItemsForBranch, customerLocation);
    } catch (error) {
      return {
        success: false,
        status: 400,
        error: error.message
      };
    }

    // Process checkout in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.orders.update({
        where: { id: Number(orderId) },
        data: {
          status: ORDER_STATUS.PENDING,
          updated_at: new Date()
        },
        include: {
          orderitems: {
            include: {
              products: true,
              productunits: true
            }
          },
          customers: true
        }
      });

      // Reserve inventory from allocated branches
      for (const branchAlloc of branchAllocation.branches) {
        for (const item of branchAlloc.items) {
          const requiredQty = Number(item.quantity) * Number(item.conversionFactor);
          
          await tx.branchinventory.update({
            where: {
              branch_id_product_id: {
                branch_id: branchAlloc.branch.id,
                product_id: Number(item.productId)
              }
            },
            data: {
              stock: {
                decrement: requiredQty
              }
            }
          });

          // Log inventory decrease
          const inventoryLogEntry = await tx.inventoryLog.create({
            data: {
              branch_id: branchAlloc.branch.id,
              product_id: Number(item.productId),
              quantity: -requiredQty,
              type: 'sale',
              note: 'Checkout order',
              reference_id: orderId,
              reference_type: 'order',
              created_by: order.customer_id
            }
          });

          // Create junction table entry
          await tx.inventoryLog_Order.create({
            data: {
              inventory_log_id: inventoryLogEntry.id,
              order_id: orderId
            }
          });
        }

        // Create shipment record for this branch
        await tx.shipments.create({
          data: {
            order_id: updatedOrder.id,
            branch_id: branchAlloc.branch.id,
            tracking_number: `SHIP-${Date.now()}-${branchAlloc.branch.id}`,
            status: 'pending',
            shipped_date: null,
            estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        });
      }

      return {
        order: updatedOrder,
        branchAllocation
      };
    });

    return {
      success: true,
      data: {
        ...result.order,
        fulfillment: {
          strategy: result.branchAllocation.strategy,
          branches: result.branchAllocation.branches.map(b => ({
            branchId: b.branch.id,
            branchName: b.branch.name,
            distance: b.distance ? `${b.distance.toFixed(2)} km` : 'N/A',
            items: b.items.length
          }))
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const createOrder = async (customerId, orderData) => {
  try {
    const { items, branchId, voucherId } = orderData;

    // Validate order items
    for (const item of items) {
      const validation = validateOrderItem(item);
      if (!validation.isValid) {
        return {
          success: false,
          status: 400,
          error: validation.error
        };
      }
    }

    // Check stock availability
    const stockValidation = await validateStockAvailability(
      items.map(item => ({
        ...item,
        branchId
      }))
    );

    if (!stockValidation.isValid) {
      return {
        success: false,
        status: 400,
        error: stockValidation.error
      };
    }

    // Calculate order totals
    const totals = await calculateOrderTotals(items);

    // Create order and items in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.orders.create({
        data: {
          customer_id: Number(customerId),
          voucher_id: voucherId ? Number(voucherId) : undefined,
          status: ORDER_STATUS.PENDING,
          order_date: new Date(),
          total_amount: totals.totalAmount,
          final_amount: totals.totalAmount
        }
      });

      // Create order items
      await tx.orderitems.createMany({
        data: items.map(item => ({
          order_id: newOrder.id,
          product_id: Number(item.productId),
          unit_id: Number(item.productUnitId),
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
          subtotal: Number(item.quantity) * Number(item.unitPrice)
        }))
      });

      // Update branch inventory - use conversion factor
      for (const item of items) {
        const productUnit = await tx.productunits.findUnique({
          where: { id: Number(item.productUnitId) }
        });
        
        const conversionFactor = Number(productUnit.conversion_factor);
        const baseQuantity = Number(item.quantity) * conversionFactor;
        
        await tx.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: Number(branchId),
              product_id: Number(item.productId)
            }
          },
          data: {
            stock: { decrement: baseQuantity }
          }
        });
      }

      return newOrder;
    });

    // Get complete order with relations
    const completeOrder = await prisma.orders.findUnique({
      where: { id: order.id },
      include: {
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        },
        customers: true,
        vouchers: true
      }
    });

    return {
      success: true,
      data: completeOrder
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        status: 404,
        error: 'Chi nhánh hoặc sản phẩm không tồn tại'
      };
    }
    throw error;
  }
};

/**
 * Clear cart - Remove all items from cart
 */
export const clearCart = async (customerId) => {
  try {
    // Get cart
    const cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderitems: true
      }
    });

    if (!cart) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy giỏ hàng'
      };
    }

    // Delete all cart items and reset cart
    await prisma.$transaction([
      prisma.orderitems.deleteMany({
        where: { order_id: cart.id }
      }),
      prisma.orders.update({
        where: { id: cart.id },
        data: {
          total_amount: 0,
          final_amount: 0,
          discount_amount: 0,
          updated_at: new Date()
        }
      })
    ]);

    return {
      success: true,
      message: 'Đã xóa toàn bộ giỏ hàng'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get cart summary with totals and item count
 */
export const getCartSummary = async (customerId) => {
  try {
    // Get cart
    const cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderitems: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                price: true,
                image_url: true
              }
            },
            productunits: {
              select: {
                id: true,
                unit_name: true,
                conversion_factor: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return {
        success: true,
        data: {
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
          items: []
        }
      };
    }

    // Calculate totals
    let subtotal = 0;
    let itemCount = 0;

    const items = await Promise.all(cart.orderitems.map(async (item) => {
      const itemTotal = Number(item.price) * item.quantity;
      subtotal += itemTotal;
      itemCount += item.quantity;

      // Check if product has flashsale
      const flashsaleProduct = await getFlashsalePrice(item.product_id);
      const hasFlashsale = flashsaleProduct !== null;
      const flashPrice = hasFlashsale ? Number(flashsaleProduct.flash_price) : null;

      return {
        id: item.id,
        product: item.products,
        productUnit: item.productunits,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        subtotal: itemTotal,
        hasFlashsale,
        flashPrice
      };
    }));

    return {
      success: true,
      data: {
        cartId: cart.id,
        itemCount,
        subtotal,
        discount: 0, // Will be calculated when voucher is applied
        total: subtotal,
        items
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Preview voucher discount without applying it
 */
export const applyVoucherPreview = async (customerId, voucherCode) => {
  try {
    // Get cart summary
    const cartSummary = await getCartSummary(customerId);

    if (!cartSummary.success) {
      return cartSummary;
    }

    const { subtotal, itemCount } = cartSummary.data;

    if (itemCount === 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng trống'
      };
    }

    if (!voucherCode) {
      return {
        success: true,
        data: {
          subtotal,
          discount: 0,
          total: subtotal,
          voucher: null
        }
      };
    }

    // Find voucher
    const voucher = await prisma.vouchers.findUnique({
      where: { code: voucherCode }
    });

    if (!voucher) {
      return {
        success: false,
        status: 404,
        error: 'Mã voucher không tồn tại'
      };
    }

    // Validate voucher
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    endDate.setHours(23, 59, 59, 999);

    if (now < startDate || now > endDate) {
      return {
        success: false,
        status: 400,
        error: 'Mã voucher đã hết hạn hoặc chưa có hiệu lực'
      };
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return {
        success: false,
        status: 400,
        error: 'Mã voucher đã hết lượt sử dụng'
      };
    }

    if (voucher.min_order_value && subtotal < Number(voucher.min_order_value)) {
      return {
        success: false,
        status: 400,
        error: `Đơn hàng phải có giá trị tối thiểu ${voucher.min_order_value.toString()} VNĐ`
      };
    }

    // Check if customer has already used this voucher
    const existingUse = await prisma.uservouchers.findFirst({
      where: {
        customer_id: Number(customerId),
        voucher_id: voucher.id,
        is_used: true
      }
    });

    if (existingUse) {
      return {
        success: false,
        status: 400,
        error: 'Bạn đã sử dụng mã voucher này rồi'
      };
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discount_type === 'percentage') {
      discount = (subtotal * Number(voucher.discount_value)) / 100;
    } else if (voucher.discount_type === 'fixed') {
      discount = Number(voucher.discount_value);
    }

    discount = Math.min(discount, subtotal);

    return {
      success: true,
      data: {
        subtotal,
        discount,
        total: subtotal - discount,
        voucher: {
          code: voucher.code,
          discount_type: voucher.discount_type,
          discount_value: Number(voucher.discount_value),
          min_order_value: voucher.min_order_value ? Number(voucher.min_order_value) : null
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Merge guest cart into authenticated user's cart
 */
export const mergeGuestCart = async (guestCartId, customerId) => {
  try {
    // Get guest cart
    const guestCart = await prisma.orders.findUnique({
      where: {
        id: Number(guestCartId)
      },
      include: {
        orderitems: true
      }
    });

    if (!guestCart || guestCart.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 404,
        error: 'Giỏ hàng tạm không tồn tại'
      };
    }

    // Get or create customer cart
    let customerCart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      }
    });

    if (!customerCart) {
      customerCart = await prisma.orders.create({
        data: {
          customer_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date(),
          total_amount: 0,
          final_amount: 0
        }
      });
    }

    // Merge items
    for (const guestItem of guestCart.orderitems) {
      const existingItem = await prisma.orderitems.findFirst({
        where: {
          order_id: customerCart.id,
          product_id: guestItem.product_id,
          unit_id: guestItem.unit_id
        }
      });

      if (existingItem) {
        await prisma.orderitems.update({
          where: { id: existingItem.id },
          data: {
            quantity: { increment: guestItem.quantity },
            subtotal: { increment: guestItem.subtotal }
          }
        });
      } else {
        await prisma.orderitems.create({
          data: {
            order_id: customerCart.id,
            product_id: guestItem.product_id,
            unit_id: guestItem.unit_id,
            quantity: guestItem.quantity,
            price: guestItem.price,
            subtotal: guestItem.subtotal
          }
        });
      }
    }

    // Recalculate customer cart totals
    const items = await prisma.orderitems.findMany({
      where: { order_id: customerCart.id }
    });

    const total = items.reduce((sum, item) =>
      sum + Number(item.subtotal), 0
    );

    await prisma.orders.update({
      where: { id: customerCart.id },
      data: {
        total_amount: total,
        final_amount: total
      }
    });

    // Delete guest cart
    await prisma.orders.delete({
      where: { id: guestCart.id }
    });

    return {
      success: true,
      message: 'Đã hợp nhất giỏ hàng thành công',
      data: await getCart(customerId)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Validate cart before checkout
 */
export const validateCartBeforeCheckout = async (customerId) => {
  try {
    // Get cart
    const cart = await prisma.orders.findFirst({
      where: {
        customer_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderitems: {
          include: {
            products: true,
            productunits: true
          }
        }
      }
    });

    if (!cart) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy giỏ hàng'
      };
    }

    if (!cart.orderitems || cart.orderitems.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng trống'
      };
    }

    const errors = [];
    const warnings = [];

    // Validate each item
    for (const item of cart.orderitems) {
      // Check if product still exists and is active
      if (!item.products) {
        errors.push(`Sản phẩm ID ${item.product_id} không còn tồn tại`);
        continue;
      }

      // Check stock availability from branch inventory
      const conversionFactor = Number(item.productunits.conversion_factor);
      const baseQuantityNeeded = item.quantity * conversionFactor;
      
      const availableBranch = await prisma.branchinventory.findFirst({
        where: {
          product_id: item.product_id,
          stock: {
            gte: baseQuantityNeeded
          }
        }
      });

      if (!availableBranch) {
        errors.push(`Sản phẩm "${item.products.name}" không đủ số lượng trong kho (cần ${baseQuantityNeeded} đơn vị cơ bản)`);
      }

      // Check if price has changed
      const currentPrice = Number(item.productunits.price);
      const cartPrice = Number(item.price);

      if (currentPrice !== cartPrice) {
        warnings.push({
          productId: item.product_id,
          productName: item.products.name,
          oldPrice: cartPrice,
          newPrice: currentPrice,
          message: `Giá sản phẩm "${item.products.name}" đã thay đổi từ ${cartPrice} VNĐ thành ${currentPrice} VNĐ`
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng có sản phẩm không hợp lệ',
        errors,
        warnings
      };
    }

    return {
      success: true,
      data: {
        valid: true,
        warnings
      }
    };
  } catch (error) {
    throw error;
  }
};
