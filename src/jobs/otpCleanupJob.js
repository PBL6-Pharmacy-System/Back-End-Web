/**
 * OTP Cleanup Job
 * 
 * Dọn dẹp các OTP đã hết hạn - Chạy mỗi 5 phút
 */

import cron from 'node-cron';
import { cleanupExpiredOTPs } from '../modules/auth/otpService.js';

// Chạy mỗi 5 phút
cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await cleanupExpiredOTPs();
    if (result && result.count > 0) {
      console.log(`[OTPCleanup] Cleaned up ${result.count} expired OTPs`);
    }
  } catch (error) {
    console.error('[OTPCleanup] Error cleaning up OTPs:', error);
  }
});

console.log('[OTPCleanup] Job initialized - runs every 5 minutes');
