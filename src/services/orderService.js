import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const getCart = async (customerId) => {
  return prisma.order.findFirst({
    where: { user_id: Number(customerId), status: "cart" },
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


export const addToCart = async (orderId, productId, productUnitId, quantity, unitPrice) => {
  return prisma.orderItem.upsert({
    where: {
      order_id_product_id_product_unit_id: {
        order_id: Number(orderId),       // ép string -> int
        product_id: Number(productId),
        product_unit_id: Number(productUnitId),
      },
    },
    update: {
      quantity: { increment: Number(quantity) },
      base_qty_total: { increment: Number(quantity) },
    },
    create: {
      order_id: Number(orderId),
      product_id: Number(productId),
      product_unit_id: Number(productUnitId),
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      base_qty_total: Number(quantity),
    },
  });
};



export const updateCartItem = async (itemId, quantity) => {
  return prisma.orderItem.update({
    where: { id: Number(itemId) },
    data: { quantity, base_qty_total: quantity }
  });
};


export const removeCartItem = async (itemId) => {
  return prisma.orderItem.delete({ where: { id: Number(itemId) } });
};


export const checkout = async (orderId) => {
  return prisma.order.update({
    where: { id: Number(orderId) },
    data: { status: "completed" }
  });
};
