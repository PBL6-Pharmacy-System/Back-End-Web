
import * as branchInventoryService from './branchInventoryService.js';
import prisma from '../../../config/db.js';

// Helper function to get staff's branch_id
const getStaffBranchId = async (userId) => {
	const staff = await prisma.staff.findUnique({
		where: { user_id: userId },
		select: { branch_id: true }
	});
	return staff?.branch_id;
};

// Lấy tất cả tồn kho chi nhánh
export const getAllBranchInventory = async (req, res) => {
	try {
		let { branchId, productId, page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc' } = req.query;
		
		// Check permissions: staff can only view their own branch
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Override branchId for staff to their branch only
			branchId = staffBranchId;
		} else if (req.user.role_name !== 'admin') {
			// Only admin and staff can access inventory
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
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
		// Check permissions first
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Get inventory item and check if it belongs to staff's branch
			const inventory = await prisma.branchinventory.findUnique({
				where: { id: Number(req.params.id) },
				select: { branch_id: true }
			});
			if (!inventory || inventory.branch_id !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn không có quyền xem thông tin kho của chi nhánh khác'
				});
			}
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
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
		// Check permissions: staff can only import to their own branch
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Verify the branchId in request matches staff's branch
			if (req.body.branchId && Number(req.body.branchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể nhập hàng vào chi nhánh của mình'
				});
			}
			// Set branchId to staff's branch
			req.body.branchId = staffBranchId;
		}
		
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
		// Check permissions: staff can only export from their own branch
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Verify the branchId in request matches staff's branch
			if (req.body.branchId && Number(req.body.branchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể xuất hàng từ chi nhánh của mình'
				});
			}
			// Set branchId to staff's branch
			req.body.branchId = staffBranchId;
		}
		
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
		// Check permissions: staff can only update their own branch inventory
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Get inventory item and check if it belongs to staff's branch
			const inventory = await prisma.branchinventory.findUnique({
				where: { id: Number(req.params.id) },
				select: { branch_id: true }
			});
			if (!inventory || inventory.branch_id !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể cập nhật kho của chi nhánh mình'
				});
			}
		}
		
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

// Lấy tổng tồn kho của 1 sản phẩm trên tất cả chi nhánh
export const getProductTotalStock = async (req, res) => {
	try {
		// Check permissions
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Staff can only see their branch stock, not total
			const result = await branchInventoryService.getProductStockByBranch(req.params.productId, staffBranchId);
			if (!result.success) {
				return res.status(result.status).json(result);
			}
			return res.json(result);
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
		const result = await branchInventoryService.getProductTotalStock(req.params.productId);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getProductTotalStock:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy tổng tồn kho sản phẩm'
		});
	}
};

// Lấy tồn kho của 1 sản phẩm tại 1 chi nhánh cụ thể
export const getProductStockByBranch = async (req, res) => {
	try {
		let { productId, branchId } = req.params;
		
		// Check permissions: staff can only view their own branch
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Override branchId to staff's branch
			if (Number(branchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể xem tồn kho của chi nhánh mình'
				});
			}
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
		const result = await branchInventoryService.getProductStockByBranch(productId, branchId);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getProductStockByBranch:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy tồn kho sản phẩm theo chi nhánh'
		});
	}
};

// Lấy danh sách tất cả sản phẩm kèm thông tin tồn kho
export const getAllProductsWithStock = async (req, res) => {
	try {
		// Check permissions
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Staff can only see products in their branch
			req.query.branchId = staffBranchId;
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
		const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', categoryId, inStockOnly, branchId } = req.query;
		const result = await branchInventoryService.getAllProductsWithStock({
			page: Number(page),
			limit: Number(limit),
			sortBy,
			sortOrder,
			categoryId: categoryId ? Number(categoryId) : undefined,
			inStockOnly: inStockOnly === 'true',
			branchId: branchId ? Number(branchId) : undefined
		});
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getAllProductsWithStock:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy danh sách sản phẩm kèm tồn kho'
		});
	}
};

// Lấy danh sách sản phẩm tồn kho thấp trên tất cả chi nhánh
export const getAllLowStockProducts = async (req, res) => {
	try {
		// Check permissions
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Staff can only see low stock products in their branch
			const result = await branchInventoryService.getAllLowStockProducts(staffBranchId);
			if (!result.success) {
				return res.status(result.status).json(result);
			}
			return res.json(result);
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
		const result = await branchInventoryService.getAllLowStockProducts();
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getAllLowStockProducts:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy danh sách sản phẩm tồn kho thấp'
		});
	}
};

// Lấy thống kê tồn kho theo chi nhánh
export const getStockStatisticsByBranch = async (req, res) => {
	try {
		let { branchId } = req.params;
		
		// Check permissions: staff can only view their own branch stats
		if (req.user.role_name === 'staff') {
			const staffBranchId = await getStaffBranchId(req.user.id);
			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}
			// Override branchId to staff's branch
			if (Number(branchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể xem thống kê của chi nhánh mình'
				});
			}
		} else if (req.user.role_name !== 'admin') {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}
		
		const result = await branchInventoryService.getStockStatisticsByBranch(branchId);
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getStockStatisticsByBranch:', err);
		res.status(500).json({ 
			success: false,
			error: 'Lỗi khi lấy thống kê tồn kho chi nhánh'
		});
	}
};