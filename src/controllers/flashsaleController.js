import * as flashsaleService from '../services/flashsaleService.js';

// Lấy tất cả flashsale với phân trang
export const getAllFlashsales = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await flashsaleService.getAllFlashsales({ 
            page: Number(page), 
            limit: Number(limit) 
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi lấy danh sách flashsale' 
        });
    }
};

// Lấy flashsale đang hoạt động
export const getActiveFlashsale = async (req, res) => {
    try {
        const result = await flashsaleService.getActiveFlashsale();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi lấy flashsale đang hoạt động' 
        });
    }
};

// Tạo flashsale mới
export const createFlashsale = async (req, res) => {
    try {
        const result = await flashsaleService.createFlashsale(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi tạo flashsale' 
        });
    }
};

// Cập nhật flashsale
export const updateFlashsale = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await flashsaleService.updateFlashsale(Number(id), req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi cập nhật flashsale' 
        });
    }
};

// Xóa flashsale
export const deleteFlashsale = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await flashsaleService.deleteFlashsale(Number(id));
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi xóa flashsale' 
        });
    }
};