/**
 * DATA MASKING UTILITY
 * Bảo mật thông tin kinh doanh - Che giấu dữ liệu nhạy cảm khỏi Public/Customer
 * 
 * Security Requirements (v4.0 - ENHANCED):
 * 1. Public/Customer: Chỉ xem được in_stock (boolean), KHÔNG XEM batch information
 * 2. Staff: Xem được toàn bộ chi tiết tồn kho, lô hàng (trừ cost_price)
 * 3. Admin: Xem được TẤT CẢ bao gồm cost_price
 * 4. Staff: READ cross-branch (tất cả chi nhánh), WRITE only own branch
 * 
 * 🔒 SECURITY RATIONALE:
 * Batch information (batch_number, expiry_date, manufacture_date, supplier) là dữ liệu
 * quản lý NỘI BỘ và không phục vụ mục đích mua sắm của customer. Việc tiết lộ thông tin này:
 * - ❌ Cho competitor biết chu kỳ nhập hàng
 * - ❌ Tiết lộ hệ thống quản lý kho nội bộ
 * - ❌ Không cần thiết cho việc mua hàng
 * - ✅ Customer chỉ cần biết "có hàng" hay "hết hàng"
 */

import prisma from '../config/db.js';

// ============================================
// PERMISSION CHECKING FUNCTIONS
// ============================================

/**
 * Kiểm tra user có quyền xem chi tiết inventory không
 * @param {Object} user - User từ JWT token
 * @returns {boolean}
 */
export const canViewDetailedInventory = (user) => {
    if (!user) return false;
    return ['admin', 'staff'].includes(user.role_name);
};

/**
 * Kiểm tra Staff có thể WRITE vào branch này không
 * @param {Object} user - User từ JWT token
 * @param {number} targetBranchId - Branch ID muốn thao tác
 * @returns {boolean}
 */
export const canWriteToBranch = (user, targetBranchId) => {
    if (!user) return false;

    // Admin: Full quyền mọi branch
    if (user.role_name === 'admin') return true;

    // Staff: Chỉ được write vào branch của mình
    if (user.role_name === 'staff') {
        // ✅ Fixed: Dùng branch_id từ JWT token (snake_case)
        return user.branch_id && user.branch_id === Number(targetBranchId);
    }

    return false;
};

/**
 * Kiểm tra Staff có thể READ từ branch này không
 * @param {Object} user - User từ JWT token
 * @param {number} targetBranchId - Branch ID muốn xem
 * @returns {boolean}
 */
export const canReadFromBranch = (user, targetBranchId) => {
    if (!user) return false;

    // Admin/Staff: Có thể read bất kỳ branch nào (cross-branch checking)
    return ['admin', 'staff'].includes(user.role_name);
};

// ============================================
// DATA MASKING FUNCTIONS
// ============================================

/**
 * Helper function: Tính stock_status từ số lượng tồn kho
 * @param {number} stock - Số lượng tồn kho
 * @returns {string} - 'available' | 'low_stock' | 'out_of_stock'
 */
const getStockStatus = (stock) => {
    if (stock > 20) return 'available';
    if (stock > 0) return 'low_stock';
    return 'out_of_stock';
};

/**
 * Mask thông tin Product Inventory cho Public/Customer
 * @param {Object} product - Product object với stock info
 * @returns {Object} - Product với thông tin đã được mask
 */
export const maskProductInventory = (product) => {
    if (!product) return product;

    // Tính stock_status
    const stock = product.stock || 0;

    // Return masked product
    return {
        ...product,
        // Replace stock với boolean
        in_stock: stock > 0,
        stock_status: getStockStatus(stock), // ✅ Use helper function
        stock: undefined, // Remove exact quantity

        // Remove sensitive branch inventory data
        branchinventory: product.branchinventory
            ? product.branchinventory.map(inv => ({
                branch_id: inv.branch_id,
                in_stock: inv.stock > 0,
                stock_status: getStockStatus(inv.stock), // ✅ Use helper function
                // Remove exact quantities
                stock: undefined,
                min_stock: undefined,
                max_stock: undefined,
                reorder_point: undefined,
                reorder_quantity: undefined,
            }))
            : undefined,
    };
};

/**
 * Mask thông tin Branch Inventory cho Public/Customer
 * @param {Object} inventory - Branch inventory record
 * @returns {Object} - Inventory với thông tin đã được mask
 */
export const maskBranchInventory = (inventory) => {
    if (!inventory) return inventory;

    const stock = inventory.stock || 0;

    return {
        id: inventory.id,
        branch_id: inventory.branch_id,
        product_id: inventory.product_id,
        in_stock: stock > 0,
        stock_status: getStockStatus(stock), // ✅ Use helper function
        // Keep product info nếu có
        products: inventory.products ? {
            id: inventory.products.id,
            name: inventory.products.name,
            price: inventory.products.price,
            images: inventory.products.images,
        } : undefined,
        branches: inventory.branches ? {
            id: inventory.branches.id,
            name: inventory.branches.name,
            address: inventory.branches.address,
            phone: inventory.branches.phone,
        } : undefined,
        // Remove ALL sensitive fields
        stock: undefined,
        min_stock: undefined,
        max_stock: undefined,
        reorder_point: undefined,
        reorder_quantity: undefined,
        last_import_date: undefined,
        last_export_date: undefined,
        note: undefined,
    };
};

/**
 * Mask thông tin Batch/Lô hàng cho Public/Customer
 * 🔒 SECURITY v4.0: Public/Customer KHÔNG ĐƯỢC xem batch information
 * @param {Object} batch - Batch info
 * @param {Object} user - User từ JWT token
 * @returns {Object|undefined} - Batch với thông tin đã được mask hoặc undefined nếu không có quyền
 */
export const maskBatchInfo = (batch, user) => {
    if (!batch) return batch;

    // ✅ Staff/Admin: Xem được batch details
    if (canViewDetailedInventory(user)) {
        // Staff: Remove cost_price
        if (user.role_name === 'staff') {
            return {
                ...batch,
                cost_price: undefined, // ❌ Staff không xem được giá nhập
            };
        }

        // Admin: Full access
        return batch;
    }

    // ✅ FIXED Issue #11: Return undefined instead of null
    // undefined doesn't appear in JSON, better for frontend
    return undefined;
};

/**
 * Mask array of batches cho Public/Customer
 * 🔒 SECURITY v4.0: Public/Customer không nhận được batch array
 * @param {Array} batches - Array of batch objects
 * @param {Object} user - User từ JWT token
 * @returns {Array|undefined} - Masked batches hoặc undefined
 */
export const maskBatchArray = (batches, user) => {
    if (!batches || !Array.isArray(batches)) return batches;

    // ✅ Staff/Admin: Xem được batches (với masking tương ứng)
    if (canViewDetailedInventory(user)) {
        return batches.map(batch => maskBatchInfo(batch, user)).filter(b => b !== undefined);
    }

    // ✅ FIXED Issue #11: Return undefined instead of empty array
    // Public/Customer: KHÔNG trả về batch array
    return undefined;
};

/**
 * Mask thông tin Order Item cho Customer (không cho xem giá nhập, supplier,...)
 * Note: Customer được xem số lượng của ORDER họ đặt, nhưng không được xem tồn kho
 * @param {Object} orderItem - Order item
 * @returns {Object} - Order item với thông tin đã được mask
 */
export const maskOrderItemForCustomer = (orderItem) => {
    if (!orderItem) return orderItem;

    return {
        ...orderItem,
        // Customer được xem quantity của order họ đặt
        quantity: orderItem.quantity,
        price: orderItem.price,
        subtotal: orderItem.subtotal,
        // Mask product inventory info
        products: orderItem.products
            ? maskProductInventory(orderItem.products)
            : undefined,
    };
};

// ============================================
// RESPONSE MASKING HELPERS
// ============================================

/**
 * Mask toàn bộ inventory response cho Public/Customer
 * @param {Object} response - API response object
 * @param {Object} user - User từ JWT token
 * @returns {Object} - Response đã được mask
 */
export const maskInventoryResponse = (response, user) => {
    if (!response) return response;

    // Nếu là Admin/Staff → không mask
    if (canViewDetailedInventory(user)) {
        return response;
    }

    // Public/Customer → Mask data
    if (response.data) {
        if (Array.isArray(response.data)) {
            response.data = response.data.map(item => maskBranchInventory(item));
        } else if (response.data.inventory && Array.isArray(response.data.inventory)) {
            response.data.inventory = response.data.inventory.map(inv =>
                maskBranchInventory(inv)
            );
        } else {
            response.data = maskBranchInventory(response.data);
        }
    }

    return response;
};

/**
 * Mask product list response cho Public/Customer
 * @param {Object} response - API response object
 * @param {Object} user - User từ JWT token
 * @returns {Object} - Response đã được mask
 */
export const maskProductListResponse = (response, user) => {
    if (!response) return response;

    // Nếu là Admin/Staff → không mask
    if (canViewDetailedInventory(user)) {
        return response;
    }

    // Public/Customer → Mask data
    if (response.data) {
        if (Array.isArray(response.data)) {
            response.data = response.data.map(product => maskProductInventory(product));
        } else if (response.data.products && Array.isArray(response.data.products)) {
            response.data.products = response.data.products.map(product =>
                maskProductInventory(product)
            );
        } else if (response.data.id) {
            response.data = maskProductInventory(response.data);
        }
    }

    return response;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate Staff có quyền thao tác trên branch không
 * Throw error nếu không có quyền
 * @param {Object} user - User từ JWT token
 * @param {number} targetBranchId - Branch ID muốn thao tác
 * @param {string} operation - 'read' hoặc 'write'
 * @throws {Error}
 */
export const validateBranchPermission = (user, targetBranchId, operation = 'write') => {
    if (!user) {
        throw new Error('Unauthorized: User not authenticated');
    }

    // Admin: Full quyền
    if (user.role_name === 'admin') {
        return true;
    }

    // Staff
    if (user.role_name === 'staff') {
        // READ: Staff có thể xem mọi branch (cross-branch)
        if (operation === 'read') {
            return true;
        }

        // WRITE: Staff chỉ được thao tác trên branch của mình
        if (operation === 'write') {
            // ✅ Fixed: Dùng branch_id từ JWT token (snake_case)
            if (!user.branch_id) {
                throw new Error('Forbidden: Nhân viên không thuộc chi nhánh nào');
            }
            if (user.branch_id !== Number(targetBranchId)) {
                throw new Error('Forbidden: Bạn chỉ có thể thao tác trên chi nhánh của mình');
            }
            return true;
        }
    }

    throw new Error('Forbidden: Bạn không có quyền truy cập');
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
    canViewDetailedInventory,
    canWriteToBranch,
    canReadFromBranch,
    maskProductInventory,
    maskBranchInventory,
    maskBatchInfo,
    maskBatchArray,
    maskOrderItemForCustomer,
    maskInventoryResponse,
    maskProductListResponse,
    validateBranchPermission,
};
