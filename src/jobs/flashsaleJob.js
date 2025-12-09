import cron from 'node-cron';
import { updateFlashsaleStatuses } from '../modules/promotion-management/flashsales/flashsaleService.js';

// Chạy mỗi phút
cron.schedule('* * * * *', async () => {
    try {
        console.log('[UPDATE STATUSES] Current UTC:', new Date().toISOString());
        await updateFlashsaleStatuses();
        console.log('Updated flashsale statuses:', new Date().toISOString());
    } catch (error) {
        // ✅ Chỉ log lỗi connection ngắn gọn, không in full stack trace
        if (error.code === 'P1001' || error.code === 'P1002') {
            console.warn('[FlashsaleJob] Database connection timeout, will retry next minute');
        } else {
            console.error('[FlashsaleJob] Error:', error.message || error);
        }
    }
});