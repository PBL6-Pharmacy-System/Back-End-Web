import cron from 'node-cron';
import { updateFlashsaleStatuses } from '../modules/promotion-management/flashsales/flashsaleService.js';

// Chạy mỗi phút
cron.schedule('* * * * *', async () => {
    try {
        await updateFlashsaleStatuses();
        console.log('Updated flashsale statuses:', new Date().toISOString());
    } catch (error) {
        console.error('Error updating flashsale statuses:', error);
    }
});