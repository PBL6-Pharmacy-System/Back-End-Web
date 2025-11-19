import cron from 'node-cron';
import prisma from '../config/db.js';
import { ORDER_STATUS, CART_LIMITS } from '../utils/constants.js';

/**
 * Clean up expired carts
 * Deletes carts that haven't been updated for CART_EXPIRATION_DAYS
 */
const cleanExpiredCarts = async () => {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - CART_LIMITS.CART_EXPIRATION_DAYS);

    // Find expired carts
    const expiredCarts = await prisma.orders.findMany({
      where: {
        status: ORDER_STATUS.CART,
        updated_at: {
          lt: expirationDate
        }
      },
      select: {
        id: true
      }
    });

    if (expiredCarts.length === 0) {
      console.log('[Cart Expiration] No expired carts found');
      return;
    }

    // Delete cart items and carts
    const deletedCount = await prisma.$transaction(async (tx) => {
      // Delete all items in expired carts
      await tx.orderitems.deleteMany({
        where: {
          order_id: {
            in: expiredCarts.map(cart => cart.id)
          }
        }
      });

      // Delete expired carts
      const result = await tx.orders.deleteMany({
        where: {
          id: {
            in: expiredCarts.map(cart => cart.id)
          }
        }
      });

      return result.count;
    });

    console.log(`[Cart Expiration] Deleted ${deletedCount} expired carts at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[Cart Expiration] Error cleaning expired carts:', error);
  }
};

// Run daily at 2:00 AM to clean up expired carts
cron.schedule('0 2 * * *', async () => {
  console.log('[Cart Expiration] Starting cart cleanup job...');
  await cleanExpiredCarts();
});

console.log('[Cart Expiration] Cart expiration job initialized - runs daily at 2:00 AM');
