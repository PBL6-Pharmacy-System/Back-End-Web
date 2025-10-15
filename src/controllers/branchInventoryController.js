
import * as branchInventoryService from '../services/branchInventoryService.js';

// Lấy tất cả tồn kho chi nhánh
export const getAllBranchInventory = async (req, res) => {
	try {
		const { branchId, productId, page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc' } = req.query;
		const result = await branchInventoryService.getAllBranchInventory({
			branchId: branchId ? Number(branchId) : undefined,
			productId: productId ? Number(productId) : undefined,
			page: Number(page),
			limit: Number(limit),
			sortBy,
			sortOrder
		});
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getAllBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy danh sách tồn kho'
		});
	}
};

// Lấy chi tiết tồn kho
export const getBranchInventoryById = async (req, res) => {
	try {
		const result = await branchInventoryService.getBranchInventoryById(req.params.id);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getBranchInventoryById:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy thông tin tồn kho'
		});
	}
};

// Nhập hàng vào kho chi nhánh
export const importToBranchInventory = async (req, res) => {
	try {
		const result = await branchInventoryService.importToBranchInventory(req.body);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in importToBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi nhập hàng vào kho'
		});
	}
};

// Xuất hàng khỏi kho chi nhánh
export const exportFromBranchInventory = async (req, res) => {
	try {
		const result = await branchInventoryService.exportFromBranchInventory(req.body);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in exportFromBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi xuất hàng khỏi kho'
		});
	}
};

// Tạo mới tồn kho
export const createBranchInventory = async (req, res) => {
	try {
		const result = await branchInventoryService.createBranchInventory(req.body);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.status(201).json(result);
	} catch (err) {
		console.error('Error in createBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi tạo tồn kho mới'
		});
	}
};

// Cập nhật tồn kho
export const updateBranchInventory = async (req, res) => {
	try {
		const result = await branchInventoryService.updateBranchInventory(req.params.id, req.body);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in updateBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi cập nhật tồn kho'
		});
	}
};

// Xóa tồn kho
export const deleteBranchInventory = async (req, res) => {
	try {
		const result = await branchInventoryService.deleteBranchInventory(req.params.id);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in deleteBranchInventory:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi xóa tồn kho'
		});
	}
};