import cron from 'node-cron';
import { cleanupExpiredOTPs } from '../modules/auth/otpService.js';
import { updateBestSellersCache } from '../modules/product-management/products/bestSellersService.js';

/**
 * Update best sellers cache every hour
 */
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Running best sellers cache update...');
    await updateBestSellersCache();
    console.log('✅ Best sellers cache updated:', new Date().toISOString());
  } catch (error) {
    console.error('❌ Error updating best sellers cache:', error);
  }
});

/**
 * Cleanup expired OTPs every 5 minutes
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    await cleanupExpiredOTPs();
  } catch (error) {
    console.error('❌ Error cleaning up OTPs:', error);
  }
});

console.log('✅ Cron jobs initialized');
console.log('   - Best sellers cache update: Every hour');
console.log('   - OTP cleanup: Every 5 minutes');
