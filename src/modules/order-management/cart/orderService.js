import prisma from '../../../config/db.js';
import { ORDER_STATUS, CART_LIMITS } from '../../../utils/constants.js';
import { validateNumericFields } from '../../../utils/validation.js';

const validateOrderItem = (item) => {
  // Required fields
  if (!item.productId || !item.productUnitId || !item.quantity) {
    return {
      isValid: false,
      error: 'Thiếu thông tin sản phẩm hoặc số lượng'
    };
  }

  // Validate numeric fields
  const numericFields = ['productId', 'productUnitId', 'quantity', 'unitPrice'];
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
      include: { productUnits: true }
    });

    if (!product) {
      return {
        isValid: false,
        error: `Sản phẩm không tồn tại`
      };
    }

    // Check product unit exists and belongs to product
    const productUnit = product.productUnits.find(
      unit => unit.id === Number(productUnitId)
    );

    if (!productUnit) {
      return {
        isValid: false,
        error: `Đơn vị sản phẩm không hợp lệ`
      };
    }

    // Check stock if branchId is provided
    if (branchId) {
      const stock = await prisma.branchInventory.findFirst({
        where: {
          branch_id: Number(branchId),
          product_id: Number(productId)
        }
      });

      if (!stock || stock.quantity < quantity) {
        return {
          isValid: false,
          error: `Sản phẩm ${product.name} không đủ số lượng trong kho`
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
        products: {
          where: {
            product_id: productId
          }
        }
      }
    });

    if (!flashsale || !flashsale.products.length) {
      return null;
    }

    const flashsaleProduct = flashsale.products[0];
    
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
          include: {
            products: true,
            productunits: true
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
            include: {
              products: true,
              productunits: true
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
    const { productId, productUnitId, quantity, unitPrice } = orderData;

    // Validate order item
    const validation = validateOrderItem({
      productId,
      productUnitId,
      quantity,
      unitPrice
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

    // Verify price matches current product unit price
    const productUnit = product.productunits[0];
    const currentPrice = Number(productUnit.price);
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

    // Check stock availability
    const stockValidation = await validateStockAvailability([{
      productId,
      productUnitId,
      quantity
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

    // Add/update item in cart
    const item = await prisma.orderitems.upsert({
      where: {
        order_id_product_id_unit_id: {
          order_id: cart.id,
          product_id: Number(productId),
          unit_id: Number(productUnitId)
        }
      },
      update: {
        quantity: { increment: Number(quantity) },
        subtotal: {
          increment: Number(quantity) * currentPrice
        }
      },
      create: {
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

    // Recalculate cart totals
    const allItems = await prisma.orderitems.findMany({
      where: { order_id: cart.id }
    });

    const total = allItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    await prisma.orders.update({
      where: { id: cart.id },
      data: {
        total_amount: total,
        final_amount: total
      }
    });

    return {
      success: true,
      data: item
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

    // Check stock availability
    if (currentItem.products.stock < Number(quantity)) {
      return {
        success: false,
        status: 400,
        error: `Sản phẩm "${currentItem.products.name}" không đủ số lượng trong kho (còn ${currentItem.products.stock})`
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

export const removeCartItem = async (itemId) => {
  try {
    // Get current item
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
          final_amount: { decrement: subtotal }
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
        orderItems: {
          include: {
            product: true,
            productUnit: true
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

    if (order.orderItems.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng trống'
      };
    }

    // Check stock availability
    const stockValidation = await validateStockAvailability(
      order.orderItems.map(item => ({
        productId: item.product_id,
        productUnitId: item.product_unit_id,
        quantity: item.quantity
      }))
    );

    if (!stockValidation.isValid) {
      return {
        success: false,
        status: 400,
        error: stockValidation.error
      };
    }

    // Process checkout
    const updatedOrder = await prisma.orders.update({
      where: { id: Number(orderId) },
      data: {
        status: ORDER_STATUS.PENDING,
        checkout_date: new Date()
      },
      include: {
        orderItems: {
          include: {
            product: true,
            productUnit: true
          }
        },
        user: true
      }
    });

    return {
      success: true,
      data: updatedOrder
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
    const order = await prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.orders.create({
        data: {
          user_id: Number(customerId),
          branch_id: Number(branchId),
          voucher_id: voucherId ? Number(voucherId) : undefined,
          status: ORDER_STATUS.PENDING,
          order_date: new Date(),
          total_quantity: totals.totalQuantity,
          total_amount: totals.totalAmount
        }
      });

      // Create order items
      await prisma.orderItems.createMany({
        data: items.map(item => ({
          order_id: newOrder.id,
          product_id: Number(item.productId),
          product_unit_id: Number(item.productUnitId),
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          base_qty_total: Number(item.quantity)
        }))
      });

      // Update branch inventory
      for (const item of items) {
        await prisma.branchInventory.update({
          where: {
            branch_id_product_id: {
              branch_id: Number(branchId),
              product_id: Number(item.productId)
            }
          },
          data: {
            quantity: { decrement: Number(item.quantity) }
          }
        });
      }

      return newOrder;
    });

    // Get complete order with relations
    const completeOrder = await prisma.orders.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: true,
            productUnit: true
          }
        },
        user: true,
        branch: true,
        voucher: true
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
        user_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderItems: true
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
      prisma.orderItems.deleteMany({
        where: { order_id: cart.id }
      }),
      prisma.orders.update({
        where: { id: cart.id },
        data: {
          total_amount: 0,
          total_quantity: 0
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
        user_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image_url: true,
                stock: true
              }
            },
            productUnit: {
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

    const items = await Promise.all(cart.orderItems.map(async (item) => {
      const itemTotal = Number(item.unit_price) * item.quantity;
      subtotal += itemTotal;
      itemCount += item.quantity;

      // Check if product has flashsale
      const flashsaleProduct = await getFlashsalePrice(item.product_id);
      const hasFlashsale = flashsaleProduct !== null;
      const flashPrice = hasFlashsale ? Number(flashsaleProduct.flash_price) : null;

      return {
        id: item.id,
        product: item.product,
        productUnit: item.productUnit,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
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
        id: Number(guestCartId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderItems: true
      }
    });

    if (!guestCart) {
      return {
        success: false,
        status: 404,
        error: 'Giỏ hàng tạm không tồn tại'
      };
    }

    // Get or create customer cart
    let customerCart = await prisma.orders.findFirst({
      where: {
        user_id: Number(customerId),
        status: ORDER_STATUS.CART
      }
    });

    if (!customerCart) {
      customerCart = await prisma.orders.create({
        data: {
          user_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date(),
          total_amount: 0,
          total_quantity: 0
        }
      });
    }

    // Merge items
    for (const guestItem of guestCart.orderItems) {
      await prisma.orderItems.upsert({
        where: {
          order_id_product_id_product_unit_id: {
            order_id: customerCart.id,
            product_id: guestItem.product_id,
            product_unit_id: guestItem.product_unit_id
          }
        },
        update: {
          quantity: { increment: guestItem.quantity },
          base_qty_total: { increment: guestItem.quantity }
        },
        create: {
          order_id: customerCart.id,
          product_id: guestItem.product_id,
          product_unit_id: guestItem.product_unit_id,
          quantity: guestItem.quantity,
          unit_price: guestItem.unit_price,
          base_qty_total: guestItem.quantity
        }
      });
    }

    // Recalculate customer cart totals
    const items = await prisma.orderItems.findMany({
      where: { order_id: customerCart.id }
    });

    const total = items.reduce((sum, item) =>
      sum + (Number(item.unit_price) * item.quantity), 0
    );

    const totalQuantity = items.reduce((sum, item) =>
      sum + item.quantity, 0
    );

    await prisma.orders.update({
      where: { id: customerCart.id },
      data: {
        total_amount: total,
        total_quantity: totalQuantity
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
        user_id: Number(customerId),
        status: ORDER_STATUS.CART
      },
      include: {
        orderItems: {
          include: {
            product: true,
            productUnit: true
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

    if (!cart.orderItems || cart.orderItems.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'Giỏ hàng trống'
      };
    }

    const errors = [];
    const warnings = [];

    // Validate each item
    for (const item of cart.orderItems) {
      // Check if product still exists and is active
      if (!item.product) {
        errors.push(`Sản phẩm ID ${item.product_id} không còn tồn tại`);
        continue;
      }

      // Check stock availability
      if (item.product.stock < item.quantity) {
        errors.push(`Sản phẩm "${item.product.name}" không đủ số lượng trong kho (còn ${item.product.stock})`);
      }

      // Check if price has changed
      const currentPrice = Number(item.productUnit.price);
      const cartPrice = Number(item.unit_price);

      if (currentPrice !== cartPrice) {
        warnings.push({
          productId: item.product_id,
          productName: item.product.name,
          oldPrice: cartPrice,
          newPrice: currentPrice,
          message: `Giá sản phẩm "${item.product.name}" đã thay đổi từ ${cartPrice} VNĐ thành ${currentPrice} VNĐ`
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
