import * as branchInventoryService from './branchInventoryService.js';
import prisma from '../../../config/db.js';
import {
	maskBranchInventory,
	maskBranchInventoryForPublic,
	canViewDetailedInventory,
	canWriteToBranch,
	canReadFromBranch
} from '../../../utils/dataMasking.js';

// Lấy tất cả tồn kho chi nhánh
export const getAllBranchInventory = async (req, res) => {
	try {
		// ✅ FIX: Support both camelCase and snake_case parameter names
		let { 
			branchId, 
			branch_id, 
			productId, 
			product_id, 
			page = 1, 
			limit = 10, 
			sortBy = 'id', 
			sortOrder = 'asc' 
		} = req.query;

		// Use snake_case if camelCase not provided (backward compatibility)
		branchId = branchId || branch_id;
		productId = productId || product_id;

		// NEW LOGIC: Staff có thể xem CROSS-BRANCH (để hỗ trợ khách hàng tìm hàng)
		// Nhưng chỉ Admin/Staff mới được xem detailed inventory
		if (!canViewDetailedInventory(req.user)) {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}

		// Staff can view any branch (cross-branch checking)
		// branchId từ query không bị override nữa

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
		// Check permissions: Staff có thể xem bất kỳ inventory record nào (cross-branch)
		if (!canViewDetailedInventory(req.user)) {
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
// ✅ FIX #2, #3: Fixed field naming (branch_id) and added userId parameter
export const importToBranchInventory = async (req, res) => {
	try {
		// ✅ FIXED: Use branch_id from JWT token directly
		if (req.user.role_name === 'staff') {
			const staffBranchId = req.user.branch_id; // ✅ From JWT, no DB query needed

			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}

			// Verify the branch_id in request matches staff's branch
			// ✅ FIX: Check both branchId (legacy) and branch_id (correct)
			const requestBranchId = req.body.branch_id || req.body.branchId;
			if (requestBranchId && Number(requestBranchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể nhập hàng vào chi nhánh của mình'
				});
			}

			// ✅ FIX: Set branch_id (with underscore) to match service expectation
			req.body.branch_id = staffBranchId;
		}

		// ✅ FIX #3: Pass userId for audit trail
		const result = await branchInventoryService.importToBranchInventory(req.body, req.user.userId);
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
// ✅ FIX #2, #4: Fixed field naming (branch_id) and added userId parameter
export const exportFromBranchInventory = async (req, res) => {
	try {
		// ✅ FIXED: Use branch_id from JWT token directly
		if (req.user.role_name === 'staff') {
			const staffBranchId = req.user.branch_id; // ✅ From JWT, no DB query needed

			if (!staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Nhân viên không thuộc chi nhánh nào'
				});
			}

			// Verify the branch_id in request matches staff's branch
			// ✅ FIX: Check both branchId (legacy) and branch_id (correct)
			const requestBranchId = req.body.branch_id || req.body.branchId;
			if (requestBranchId && Number(requestBranchId) !== staffBranchId) {
				return res.status(403).json({
					success: false,
					error: 'Bạn chỉ có thể xuất hàng từ chi nhánh của mình'
				});
			}

			// ✅ FIX: Set branch_id (with underscore) to match service expectation
			req.body.branch_id = staffBranchId;
		}

		// ✅ FIX #4: Pass userId for audit trail
		const result = await branchInventoryService.exportFromBranchInventory(req.body, req.user.userId);
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
		// ✅ FIXED: Use branch_id from JWT token directly
		if (req.user.role_name === 'staff') {
			const staffBranchId = req.user.branch_id; // ✅ From JWT, no DB query needed

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
		// Check permissions: Admin và Staff đều có thể xem (cross-branch)
		if (!canViewDetailedInventory(req.user)) {
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
		const { productId, branchId } = req.params;

		// Check permissions: Staff có thể xem bất kỳ branch nào (cross-branch)
		if (!canViewDetailedInventory(req.user)) {
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
		// Check permissions: Staff có thể xem tất cả branches (cross-branch)
		if (!canViewDetailedInventory(req.user)) {
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
		if (!canViewDetailedInventory(req.user)) {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}

		// Staff có thể xem low stock của TẤT CẢ branches (cross-branch checking)
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
		const { branchId } = req.params;

		// Check permissions: Staff có thể xem stats của bất kỳ branch nào (cross-branch)
		if (!canViewDetailedInventory(req.user)) {
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

// ===============================================
// NEW: NESTED ROUTES CONTROLLERS (RESTful)
// ===============================================

/**
 * GET /api/branches/:branchId/inventory
 * PUBLIC hoặc STAFF/ADMIN với data masking
 * 🔒 SECURITY v4.1: Public chỉ xem product list + in_stock, KHÔNG xem batch/supplier info
 */
export const getBranchInventoryByBranchId = async (req, res) => {
	try {
		const { branchId } = req.params;
		const { page = 1, limit = 20, sortBy = 'id', sortOrder = 'asc' } = req.query;

		// Lấy dữ liệu từ service
		const result = await branchInventoryService.getAllBranchInventory({
			branchId: Number(branchId),
			page: Number(page),
			limit: Number(limit),
			sortBy,
			sortOrder
		});

		if (!result.success) {
			return res.status(result.status).json(result);
		}

		// DATA MASKING: Phân biệt Staff/Admin vs Public/Customer
		const hasDetailedAccess = canViewDetailedInventory(req.user);

		if (!hasDetailedAccess && result.data.inventory) {
			// ✅ Public/Customer: Sử dụng maskBranchInventoryForPublic (siêu nghiêm ngặt)
			// Chỉ trả về: product info + in_stock boolean
			result.data.inventory = result.data.inventory.map(inv =>
				maskBranchInventoryForPublic(inv)
			);
		}

		res.json(result);
	} catch (err) {
		console.error('Error in getBranchInventoryByBranchId:', err);
		res.status(500).json({
			success: false,
			error: 'Lỗi khi lấy tồn kho chi nhánh'
		});
	}
};

/**
 * PUT /api/branches/:branchId/inventory/:productId
 * Cập nhật tồn kho (WRITE permission: Staff chỉ update branch của mình)
 */
export const updateBranchInventoryByBranchProduct = async (req, res) => {
	try {
		const { branchId, productId } = req.params;
		const { stock, note } = req.body;

		// ✅ FIXED: canWriteToBranch is now sync, no await needed
		const canWrite = canWriteToBranch(req.user, branchId);
		if (!canWrite) {
			return res.status(403).json({
				success: false,
				error: 'Bạn chỉ có thể cập nhật kho của chi nhánh mình'
			});
		}

		// Tìm inventory record theo branch_id và product_id
		const inventory = await prisma.branchinventory.findFirst({
			where: {
				branch_id: Number(branchId),
				product_id: Number(productId)
			}
		});

		if (!inventory) {
			return res.status(404).json({
				success: false,
				error: 'Không tìm thấy sản phẩm trong kho chi nhánh này'
			});
		}

		// Update inventory
		const result = await branchInventoryService.updateBranchInventory(inventory.id, {
			stock,
			note
		});

		if (!result.success) {
			return res.status(result.status).json(result);
		}

		res.json(result);
	} catch (err) {
		console.error('Error in updateBranchInventoryByBranchProduct:', err);
		res.status(500).json({
			success: false,
			error: 'Lỗi khi cập nhật tồn kho'
		});
	}
};

/**
 * GET /api/branch-inventory/alerts/low-stock
 * Admin: xem tất cả branches, Staff: xem tất cả branches (cross-branch)
 */
export const getLowStockItems = async (req, res) => {
	try {
		// Check permissions
		if (!canViewDetailedInventory(req.user)) {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin kho hàng'
			});
		}

		// Staff có thể xem low stock của TẤT CẢ branches (cross-branch checking)
		const result = await branchInventoryService.getAllLowStockProducts();
		if (!result.success) {
			return res.status(result.status).json(result);
		}
		res.json(result);
	} catch (err) {
		console.error('Error in getLowStockItems:', err);
		res.status(500).json({
			success: false,
			error: 'Lỗi khi lấy danh sách tồn kho thấp'
		});
	}
};

/**
 * GET /api/branches/:branchId/inventory/alerts/low-stock
 * 🔒 SECURITY v4.0: Staff/Admin ONLY - Public KHÔNG ĐƯỢC xem
 */
export const getBranchLowStockItems = async (req, res) => {
	try {
		const { branchId } = req.params;
		const { threshold = 10 } = req.query;

		// ❌ Chặn luôn Public/Customer - endpoint này chỉ cho nội bộ
		if (!canViewDetailedInventory(req.user)) {
			return res.status(403).json({
				success: false,
				error: 'Bạn không có quyền truy cập thông tin cảnh báo tồn kho'
			});
		}

		const result = await branchInventoryService.getBranchLowStockProducts(
			branchId,
			Number(threshold)
		);

		if (!result.success) {
			return res.status(result.status).json(result);
		}

		// ✅ Staff/Admin: Không cần masking, trả về full data
		res.json(result);
	} catch (err) {
		console.error('Error in getBranchLowStockItems:', err);
		res.status(500).json({
			success: false,
			error: 'Lỗi khi lấy danh sách tồn kho thấp của chi nhánh'
		});
	}
};