import express from 'express';
import { authenticateToken, authorizeAdminOrStaff, authorizeStaffBranch } from '../../auth/auth.middleware.js';

const router = express.Router();

/**
 * 🎯 STOCK OPERATIONS MODULE - Centralized API
 * 
 * Mục đích: Tập trung tất cả các thao tác kho vào 1 module
 * Redirect đến các module chuyên biệt:
 * - Import → /product-batches
 * - Transfer → /inventory-transfers  
 * - StockTake → /stock-takes
 */

// ===============================================
// 📋 DOCUMENTATION ENDPOINT
// ===============================================
router.get('/stock-operations',
  authenticateToken,
  authorizeAdminOrStaff,
  async (req, res) => {
    res.json({
      success: true,
      message: 'Stock Operations API - Centralized Inventory Management',
      version: '2.0.0',
      endpoints: {
        import: {
          description: 'Nhập hàng từ nhà cung cấp',
          method: 'POST',
          endpoint: '/api/product-batches',
          auth: 'Admin/Staff + Branch Authorization',
          body_example: {
            product_id: 1,
            branch_id: 1,
            batch_number: 'BATCH-2025-001',
            quantity: 100,
            expiry_date: '2027-01-01',
            cost_price: 50000,
            supplier_id: 1
          }
        },
        transfer: {
          description: 'Chuyển kho giữa các chi nhánh',
          workflow: [
            '1. POST /api/inventory-transfers - Tạo phiếu chuyển',
            '2. POST /api/inventory-transfers/:id/approve - Duyệt phiếu',
            '3. POST /api/inventory-transfers/:id/ship - Xuất kho',
            '4. POST /api/inventory-transfers/:id/receive - Nhận kho'
          ],
          auth: 'Admin/Staff + Branch Authorization'
        },
        stockTake: {
          description: 'Kiểm kê tồn kho',
          workflow: [
            '1. POST /api/stock-takes - Tạo phiếu kiểm kê',
            '2. PUT /api/stock-takes/:id/items/:itemId - Cập nhật số lượng thực tế',
            '3. POST /api/stock-takes/:id/complete - Hoàn thành kiểm kê'
          ],
          auth: 'Admin/Staff'
        },
        inventory: {
          description: 'Xem tồn kho và chi tiết lô hàng',
          endpoints: {
            view_inventory: 'GET /api/branch-inventory?branch_id={id}',
            view_batches: 'GET /api/product-batches?branch_id={b}&product_id={p}',
            batch_details: 'GET /api/branches/:id/inventory/details?productId={p}'
          }
        }
      },
      note: 'Module này là documentation hub. Sử dụng các endpoint cụ thể ở trên.'
    });
  }
);

// ===============================================
// 🔄 DEPRECATED ENDPOINTS (Backward Compatibility)
// ===============================================

// Redirect import endpoint
router.post('/stock-operations/import',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeStaffBranch,
  (req, res) => {
    res.status(301).json({
      success: false,
      deprecated: true,
      message: 'Endpoint này đã deprecated. Vui lòng sử dụng POST /api/product-batches',
      redirect_to: 'POST /api/product-batches',
      body_format: {
        product_id: 'number',
        branch_id: 'number',
        batch_number: 'string',
        quantity: 'number',
        expiry_date: 'date (YYYY-MM-DD)',
        cost_price: 'number (optional)',
        supplier_id: 'number (optional)'
      }
    });
  }
);

// Redirect transfer endpoint
router.post('/stock-operations/transfer',
  authenticateToken,
  authorizeAdminOrStaff,
  authorizeStaffBranch,
  (req, res) => {
    res.status(301).json({
      success: false,
      deprecated: true,
      message: 'Endpoint này đã deprecated. Vui lòng sử dụng POST /api/inventory-transfers',
      redirect_to: 'POST /api/inventory-transfers',
      workflow: [
        'Step 1: POST /api/inventory-transfers (status=pending)',
        'Step 2: POST /api/inventory-transfers/:id/approve (status=approved)',
        'Step 3: POST /api/inventory-transfers/:id/ship (status=shipped)',
        'Step 4: POST /api/inventory-transfers/:id/receive (status=completed)'
      ]
    });
  }
);

export default router;
