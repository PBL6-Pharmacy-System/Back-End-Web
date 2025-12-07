/**
 * PayOS Controller
 * Controller xử lý các request liên quan đến PayOS
 */

import * as payosService from './payosService.js';

/**
 * Tạo link thanh toán PayOS
 */
export const createPaymentUrl = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu orderId'
            });
        }

        const result = await payosService.createPayOSPaymentUrl(orderId, req);
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        console.error('PayOS createPaymentUrl error:', error);
        next(error);
    }
};

/**
 * Xử lý callback từ PayOS (redirect URL)
 */
export const handleCallback = async (req, res, next) => {
    try {
        const result = await payosService.handlePayOSCallback(req.query);
        
        // Redirect về frontend với kết quả
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = result.success 
            ? `${frontendUrl}/payment/success?orderId=${result.orderId}&orderCode=${result.orderCode}`
            : `${frontendUrl}/payment/failed?error=${encodeURIComponent(result.error || 'Payment failed')}&orderCode=${result.orderCode}`;
        
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('PayOS callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment/failed?error=${encodeURIComponent('Lỗi xử lý thanh toán')}`);
    }
};

/**
 * Xử lý cancel từ PayOS
 */
export const handleCancel = async (req, res, next) => {
    try {
        const { orderCode } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment/cancelled?orderCode=${orderCode}`);
    } catch (error) {
        console.error('PayOS cancel error:', error);
        next(error);
    }
};

/**
 * Xử lý webhook từ PayOS (server-to-server)
 */
export const handleWebhook = async (req, res, next) => {
    try {
        // PayOS gửi signature trong header
        const signature = req.headers['x-payos-signature'] || req.headers['x-signature'];
        
        const result = await payosService.handlePayOSWebhook(req.body, signature);
        
        // PayOS yêu cầu trả về success để xác nhận đã nhận webhook
        res.status(200).json({
            success: true,
            message: result.message || 'Webhook processed'
        });
    } catch (error) {
        console.error('PayOS webhook error:', error);
        // Vẫn trả về 200 để PayOS không retry liên tục
        res.status(200).json({
            success: false,
            error: 'Webhook processing error'
        });
    }
};

/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkPaymentStatus = async (req, res, next) => {
    try {
        const { orderCode } = req.params;
        
        if (!orderCode) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu orderCode'
            });
        }

        const result = await payosService.checkPayOSPaymentStatus(orderCode);
        res.status(result.success ? 200 : result.status || 500).json(result);
    } catch (error) {
        console.error('PayOS checkPaymentStatus error:', error);
        next(error);
    }
};
