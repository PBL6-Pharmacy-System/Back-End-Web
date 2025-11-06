import prisma from '../../../config/db.js';
import { ORDER_STATUS } from '../../../utils/constants.js';
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
      cart = await prisma.orders.create({
        data: {
          user_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date()
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
        user_id: Number(customerId), 
        status: ORDER_STATUS.CART 
      }
    });

    if (!cart) {
      cart = await prisma.orders.create({
        data: {
          user_id: Number(customerId),
          status: ORDER_STATUS.CART,
          order_date: new Date()
        }
      });
    }

    // Add/update item in cart
    const item = await prisma.orderItems.upsert({
      where: {
        order_id_product_id_product_unit_id: {
          order_id: cart.id,
          product_id: Number(productId),
          product_unit_id: Number(productUnitId)
        }
      },
      update: {
        quantity: { increment: Number(quantity) },
        base_qty_total: { increment: Number(quantity) }
      },
      create: {
        order_id: cart.id,
        product_id: Number(productId),
        product_unit_id: Number(productUnitId),
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        base_qty_total: Number(quantity)
      },
      include: {
        product: true,
        productUnit: true
      }
    });

    // Recalculate cart totals
    const totals = await calculateOrderTotals([{
      quantity: Number(quantity),
      unitPrice: Number(unitPrice)
    }]);

    await prisma.orders.update({
      where: { id: cart.id },
      data: {
        total_amount: { increment: totals.subtotal },
        total_quantity: { increment: totals.totalQuantity }
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

    // Get current item
    const currentItem = await prisma.orderItems.findUnique({
      where: { id: Number(itemId) },
      include: {
        product: true,
        productUnit: true,
        order: true
      }
    });

    if (!currentItem) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      };
    }

    if (currentItem.order.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Không thể cập nhật sản phẩm trong đơn hàng đã xử lý'
      };
    }

    // Check stock availability
    const stockValidation = await validateStockAvailability([{
      productId: currentItem.product_id,
      productUnitId: currentItem.product_unit_id,
      quantity: Number(quantity)
    }]);

    if (!stockValidation.isValid) {
      return {
        success: false,
        status: 400,
        error: stockValidation.error
      };
    }

    // Calculate difference in totals
    const quantityDiff = Number(quantity) - currentItem.quantity;
    const amountDiff = quantityDiff * currentItem.unit_price;

    // Update item and order totals
    const [item] = await prisma.$transaction([
      prisma.orderItems.update({
        where: { id: Number(itemId) },
        data: {
          quantity: Number(quantity),
          base_qty_total: Number(quantity)
        },
        include: {
          product: true,
          productUnit: true
        }
      }),
      prisma.orders.update({
        where: { id: currentItem.order_id },
        data: {
          total_amount: { increment: amountDiff },
          total_quantity: { increment: quantityDiff }
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
    const currentItem = await prisma.orderItems.findUnique({
      where: { id: Number(itemId) },
      include: { order: true }
    });

    if (!currentItem) {
      return {
        success: false,
        status: 404,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      };
    }

    if (currentItem.order.status !== ORDER_STATUS.CART) {
      return {
        success: false,
        status: 400,
        error: 'Không thể xóa sản phẩm trong đơn hàng đã xử lý'
      };
    }

    // Remove item and update order totals
    const [item] = await prisma.$transaction([
      prisma.orderItems.delete({
        where: { id: Number(itemId) }
      }),
      prisma.orders.update({
        where: { id: currentItem.order_id },
        data: {
          total_amount: { decrement: currentItem.quantity * currentItem.unit_price },
          total_quantity: { decrement: currentItem.quantity }
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
