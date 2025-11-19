import cron from 'node-cron';
import { cleanupExpiredOTPs } from '../modules/auth/otpService.js';

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
console.log('   - OTP cleanup: Every 5 minutes');
