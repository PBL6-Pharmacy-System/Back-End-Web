import cron from 'node-cron';
import prisma from '../config/db.js';

const PAYMENT_TIMEOUT_MINUTES = 15;

export const startPaymentExpirationJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🔍 Checking for expired payments...');

      const expiredTime = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

      const expiredPayments = await prisma.payments.findMany({
        where: {
          status: 'pending',
          payment_method: { not: 'COD' },
          created_at: { lt: expiredTime }
        },
        select: {
          id: true,
          order_id: true,
          payment_method: true,
          created_at: true
        }
      });

      if (expiredPayments.length > 0) {
        const updatedCount = await prisma.$transaction(async (tx) => {
          let count = 0;
          
          for (const payment of expiredPayments) {
            await tx.payments.update({
              where: { id: payment.id },
              data: {
                status: 'cancelled',
                updated_at: new Date()
              }
            });

            await tx.payment_logs.create({
              data: {
                payment_id: payment.id,
                action: 'auto_cancelled',
                old_status: 'pending',
                new_status: 'cancelled',
                metadata: {
                  reason: 'Payment timeout',
                  timeout_minutes: PAYMENT_TIMEOUT_MINUTES,
                  expired_at: new Date()
                },
                created_at: new Date()
              }
            });

            count++;
          }

          return count;
        });

        console.log(`✅ Auto-cancelled ${updatedCount} expired payments (older than ${PAYMENT_TIMEOUT_MINUTES} minutes)`);
      }
    } catch (error) {
      // ✅ Handle database connection errors gracefully
      if (error.code === 'P1001' || error.code === 'P1002') {
        console.warn('[PaymentExpiration] Database connection timeout, will retry next cycle');
      } else {
        console.error('❌ Payment expiration job error:', error.message || error);
      }
    }
  });

  console.log(`🚀 Payment expiration job started (runs every 5 minutes, timeout: ${PAYMENT_TIMEOUT_MINUTES} minutes)`);
};
