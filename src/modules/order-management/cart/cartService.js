import prisma from '../../../config/db.js';


export const getOrCreateCart = async (customerId) => {
  let cart = await prisma.orders.findFirst({
    where: { 
      customer_id: Number(customerId), 
      status: 'cart' 
    },
    include: { 
      orderItems: { 
        include: { 
          product: true,
          productUnit: true
        } 
      } 
    },
  });
  if (!cart) {
    cart = await prisma.orders.create({
      data: {
        customer_id: Number(customerId),
        total_amount: 0,
        final_amount: 0,
        status: 'cart',
      },
      include: { 
        orderItems: { 
          include: { 
            product: true,
            productUnit: true
          } 
        } 
      },
    });
  }
  return cart;
};


export const addToCart = async (orderId, productId, productUnitId, quantity = 1, unitPrice) => {
  const cart = await prisma.orders.findUnique({ 
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
  if (!cart) throw new Error('Giỏ hàng không tồn tại');

  const product = await prisma.products.findUnique({ 
    where: { id: Number(productId) }
  });
  if (!product) throw new Error('Sản phẩm không tồn tại');

  const productUnit = await prisma.productUnits.findUnique({
    where: { id: Number(productUnitId) }
  });
  if (!productUnit) throw new Error('Đơn vị sản phẩm không tồn tại');

  return prisma.orderItems.upsert({
    where: {
      order_id_product_id_product_unit_id: {
        order_id: Number(orderId),
        product_id: Number(productId),
        product_unit_id: Number(productUnitId),
      }
    },
    update: {
      quantity: {
        increment: Number(quantity)
      },
      base_qty_total: {
        increment: Number(quantity)
      },
      unit_price: unitPrice,
    },
    create: {
      order_id: Number(orderId),
      product_id: Number(productId),
      product_unit_id: Number(productUnitId),
      quantity: Number(quantity),
      base_qty_total: Number(quantity),
      unit_price: unitPrice,
    },
    include: {
      product: true,
      productUnit: true
    }
  });
};


export const updateCartTotal = async (orderId) => {
  const items = await prisma.orderItems.findMany({
    where: { order_id: Number(orderId) }
  });
  
  const total = items.reduce((sum, item) => 
    sum + (parseFloat(item.unit_price) * item.quantity), 0
  );

  return prisma.orders.update({
    where: { id: Number(orderId) },
    data: { 
      total_amount: total,
      final_amount: total // Có thể thêm logic giảm giá ở đây
    },
    include: { 
      orderItems: { 
        include: { 
          product: true,
          productUnit: true
        } 
      } 
    },
  });
};

export const removeCartItem = async (itemId) => {
  return prisma.orderItems.delete({
    where: { id: Number(itemId) },
    include: {
      product: true,
      productUnit: true
    }
  });
};

export const checkout = async (orderId) => {
  const cart = await prisma.orders.findUnique({
    where: { 
      id: Number(orderId),
      status: 'cart'
    }
  });
  
  if (!cart) throw new Error('Không có giỏ hàng để thanh toán');
  
  return prisma.orders.update({
    where: { id: Number(orderId) },
    data: { 
      status: 'pending',
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
};
