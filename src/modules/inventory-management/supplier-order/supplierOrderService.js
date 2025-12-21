/**
 * Supplier Order Service
 * ✅ FIX ISSUE #10: Auto-import inventory khi supplier order được nhận hàng
 * 
 * @module modules/inventory-management/supplier-order/supplierOrderService
 */

import prisma from '../../../config/db.js';
import { INVENTORY_LOG_TYPE } from '../../../utils/constants.js';

/**
 * Valid status transitions cho supplier order
 */
const VALID_STATUS_TRANSITIONS = {
    'draft': ['pending', 'cancelled'],
    'pending': ['approved', 'cancelled'],
    'approved': ['shipped', 'cancelled'],
    'shipped': ['received', 'cancelled'],
    'received': [], // Terminal state - không thể thay đổi sau khi nhận hàng
    'cancelled': [] // Terminal state
};

/**
 * Kiểm tra transition có hợp lệ không
 */
const isValidTransition = (currentStatus, newStatus) => {
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validNextStatuses) return false;
    return validNextStatuses.includes(newStatus);
};

/**
 * Generate unique order number
 */
const generateOrderNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Count orders today
    const startOfDay = new Date(year, today.getMonth(), today.getDate());
    const endOfDay = new Date(year, today.getMonth(), today.getDate(), 23, 59, 59);

    const count = await prisma.supplierOrder.count({
        where: {
            order_date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `PO${year}${month}${day}${sequence}`;
};

/**
 * Generate batch number for imported products
 */
const generateBatchNumber = (supplierOrderNo, productId) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${supplierOrderNo}-P${productId}-${timestamp}`;
};

/**
 * Get all supplier orders with filters
 */
export const getAllSupplierOrders = async (filters = {}) => {
    try {
        console.log('📋 [getAllSupplierOrders] Called with filters:', filters);
        const {
            page = 1,
            limit = 20,
            status,
            supplier_id,
            branch_id,
            start_date,
            end_date,
            sortBy = 'order_date',
            sortOrder = 'desc'
        } = filters;

        const where = {};

        if (status) where.status = status;
        if (supplier_id) where.supplier_id = Number(supplier_id);
        if (branch_id) where.branch_id = Number(branch_id);

        if (start_date || end_date) {
            where.order_date = {};
            if (start_date) where.order_date.gte = new Date(start_date);
            if (end_date) where.order_date.lte = new Date(end_date);
        }

        const [orders, total] = await Promise.all([
            prisma.supplierOrder.findMany({
                where,
                select: {
                    id: true,
                    order_number: true,
                    status: true,
                    total_amount: true,
                    tax_amount: true,
                    discount_amount: true,
                    final_amount: true,
                    order_date: true,
                    expected_date: true,
                    received_date: true,
                    payment_status: true,
                    note: true,
                    created_at: true,
                    updated_at: true,
                    suppliers: { select: { id: true, name: true } },
                    branches: { select: { id: true, name: true } },
                    users_supplierOrder_ordered_byTousers: { select: { id: true, full_name: true } },
                    users_supplierOrder_approved_byTousers: { select: { id: true, full_name: true } },
                    users_supplierOrder_received_byTousers: { select: { id: true, full_name: true } },
                    supplierOrderItem: {
                        select: {
                            id: true,
                            quantity: true,
                            received_qty: true,
                            unit_price: true,
                            tax_rate: true,
                            discount: true,
                            subtotal: true,
                            products: { select: { id: true, name: true, price: true, image_url: true } }
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.supplierOrder.count({ where })
        ]);

        return {
            success: true,
            data: {
                orders,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        };
    } catch (error) {
        console.error('❌ [getAllSupplierOrders] Error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
};

/**
 * Get supplier order by ID
 */
export const getSupplierOrderById = async (id) => {
    try {
        console.log('🔍 [getSupplierOrderById] Called with id:', id, 'Type:', typeof id);
        
        // Validate id
        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ [getSupplierOrderById] Invalid id:', id);
            return {
                success: false,
                status: 400,
                error: 'ID không hợp lệ'
            };
        }
        
        const order = await prisma.supplierOrder.findUnique({
            where: { id: Number(id) },
            include: {
                suppliers: true,
                branches: true,
                users_supplierOrder_ordered_byTousers: { select: { id: true, full_name: true, email: true } },
                users_supplierOrder_approved_byTousers: { select: { id: true, full_name: true, email: true } },
                users_supplierOrder_received_byTousers: { select: { id: true, full_name: true, email: true } },
                supplierOrderItem: {
                    include: {
                        products: { select: { id: true, name: true, price: true, image_url: true } }
                    }
                }
            }
        });

        if (!order) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy đơn đặt hàng nhà cung cấp'
            };
        }

        return {
            success: true,
            data: order
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Create new supplier order
 */
export const createSupplierOrder = async (data, userId) => {
    try {
        console.log('📥 Backend received supplier order data:', JSON.stringify(data, null, 2));
        console.log('👤 User ID:', userId);
        
        const { supplier_id, branch_id, items, note, expected_date } = data;

        // Validate required fields
        if (!supplier_id || !branch_id || !items || items.length === 0) {
            return {
                success: false,
                status: 400,
                error: 'Thiếu thông tin bắt buộc: supplier_id, branch_id, items'
            };
        }

        // Verify supplier exists
        const supplier = await prisma.suppliers.findUnique({
            where: { id: Number(supplier_id) }
        });

        if (!supplier) {
            return {
                success: false,
                status: 404,
                error: 'Nhà cung cấp không tồn tại'
            };
        }

        // Verify branch exists
        const branch = await prisma.branches.findUnique({
            where: { id: Number(branch_id) }
        });

        if (!branch) {
            return {
                success: false,
                status: 404,
                error: 'Chi nhánh không tồn tại'
            };
        }
        // Verify all products exist
        const productIds = items.map(item => Number(item.product_id));
        const existingProducts = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true }
        });

        if (existingProducts.length !== productIds.length) {
            const existingIds = existingProducts.map(p => p.id);
            const missingIds = productIds.filter(id => !existingIds.includes(id));
            return {
                success: false,
                status: 404,
                error: `Các sản phẩm không tồn tại: ${missingIds.join(', ')}`
            };
        }

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Calculate totals
        let totalAmount = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        for (const item of items) {
            const subtotal = Number(item.quantity) * Number(item.unit_price);
            const itemTax = subtotal * (Number(item.tax_rate || 0) / 100);
            const itemDiscount = Number(item.discount || 0);

            totalAmount += subtotal;
            taxAmount += itemTax;
            discountAmount += itemDiscount;
        }

        const finalAmount = totalAmount + taxAmount - discountAmount;

        // Create order in transaction
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.supplierOrder.create({
                data: {
                    supplier_id: Number(supplier_id),
                    branch_id: Number(branch_id),
                    order_number: orderNumber,
                    status: 'draft',
                    total_amount: totalAmount,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    final_amount: finalAmount,
                    ordered_by: userId,
                    order_date: new Date(),
                    expected_date: expected_date ? new Date(expected_date) : null,
                    note
                }
            });

            // Create order items
            for (const item of items) {
                await tx.supplierOrderItem.create({
                    data: {
                        order_id: order.id,
                        product_id: Number(item.product_id),
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        tax_rate: Number(item.tax_rate || 0),
                        discount: Number(item.discount || 0),
                        subtotal: Number(item.quantity) * Number(item.unit_price),
                        batch_number: item.batch_number || null,
                        expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
                        note: item.note || null
                    }
                });
            }

            return order;
        });

        return {
            success: true,
            data: await getSupplierOrderById(result.id).then(r => r.data)
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Update supplier order status
 * ✅ FIX ISSUE #10: Auto-import inventory khi status = 'received'
 */
export const updateSupplierOrderStatus = async (id, newStatus, userId, receivedItems = null) => {
    try {
        const order = await prisma.supplierOrder.findUnique({
            where: { id: Number(id) },
            include: {
                supplierOrderItem: {
                    include: { products: true }
                },
                branches: true,
                suppliers: true
            }
        });

        if (!order) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy đơn đặt hàng nhà cung cấp'
            };
        }

        // Validate status transition
        if (!isValidTransition(order.status, newStatus)) {
            const validNextStatuses = VALID_STATUS_TRANSITIONS[order.status] || [];
            return {
                success: false,
                status: 400,
                error: `Không thể chuyển từ "${order.status}" sang "${newStatus}". Các trạng thái hợp lệ: ${validNextStatuses.join(', ') || 'Không có'}`,
                currentStatus: order.status,
                validTransitions: validNextStatuses
            };
        }

        // ✅ FIX ISSUE #10: Nếu chuyển sang 'received', tự động nhập kho
        if (newStatus === 'received') {
            return await receiveSupplierOrder(id, userId, receivedItems);
        }

        // Update other statuses normally
        const updateData = {
            status: newStatus,
            updated_at: new Date()
        };

        if (newStatus === 'approved') {
            updateData.approved_by = userId;
        }

        const updatedOrder = await prisma.supplierOrder.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                suppliers: true,
                branches: true,
                supplierOrderItem: true
            }
        });

        return {
            success: true,
            data: updatedOrder,
            message: `Đã cập nhật trạng thái thành "${newStatus}"`
        };
    } catch (error) {
        throw error;
    }
};

/**
 * ✅ FIX ISSUE #10: Nhận hàng và tự động nhập kho
 * - Cập nhật branchinventory
 * - Tạo productBatch cho từng sản phẩm
 * - Tạo inventoryLog
 */
export const receiveSupplierOrder = async (id, userId, receivedItems = null) => {
    try {
        console.log('[receiveSupplierOrder] Starting with params:', {
            id,
            userId,
            receivedItems: receivedItems ? JSON.stringify(receivedItems) : 'null',
            receivedItemsLength: receivedItems?.length
        });

        const order = await prisma.supplierOrder.findUnique({
            where: { id: Number(id) },
            include: {
                supplierOrderItem: {
                    include: { products: true }
                },
                branches: true,
                suppliers: true
            }
        });

        if (!order) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy đơn đặt hàng nhà cung cấp'
            };
        }

        console.log('[receiveSupplierOrder] Order found:', {
            order_id: order.id,
            order_number: order.order_number,
            status: order.status,
            items_count: order.supplierOrderItem.length,
            item_product_ids: order.supplierOrderItem.map(i => i.product_id)
        });

        // Validate receivedItems product_ids if provided
        if (receivedItems && Array.isArray(receivedItems)) {
            const orderProductIds = order.supplierOrderItem.map(i => i.product_id);
            const receivedProductIds = receivedItems.map(ri => Number(ri.product_id));
            
            console.log('[receiveSupplierOrder] Validating receivedItems:', {
                orderProductIds,
                receivedProductIds
            });

            for (const productId of receivedProductIds) {
                if (!orderProductIds.includes(productId)) {
                    console.error('[receiveSupplierOrder] Invalid product_id:', productId);
                    return {
                        success: false,
                        status: 400,
                        error: `Sản phẩm ID ${productId} không có trong đơn hàng này`
                    };
                }
            }
        }

        if (order.status === 'received') {
            return {
                success: false,
                status: 400,
                error: 'Đơn hàng đã được nhận trước đó'
            };
        }

        // ✅ CHỈ cho phép nhận hàng từ trạng thái 'approved'
        if (order.status !== 'approved') {
            return {
                success: false,
                status: 400,
                error: `Chỉ có thể nhập kho từ đơn đã duyệt (approved). Trạng thái hiện tại: ${order.status}. Vui lòng duyệt đơn hàng trước.`
            };
        }

        // ✅ IDEMPOTENCY CHECK: Kiểm tra xem đã có inventory log cho order này chưa
        const existingImportLog = await prisma.inventoryLog_SupplierOrder.findFirst({
            where: { supplier_order_id: Number(id) }
        });

        if (existingImportLog) {
            return {
                success: false,
                status: 400,
                error: 'Đơn hàng đã được nhập kho trước đó (idempotency check)'
            };
        }

        // Process receiving in transaction
        const result = await prisma.$transaction(async (tx) => {
            const importResults = [];
            const batchesCreated = [];

            for (const item of order.supplierOrderItem) {
                console.log(`[DEBUG] Processing item:`, {
                    product_id: item.product_id,
                    product_name: item.products.name,
                    ordered_qty: item.quantity
                });

                // Số lượng nhận thực tế (có thể khác với ordered quantity)
                let receivedQty = item.quantity; // Default: nhận đủ

                // Nếu có receivedItems, sử dụng số lượng thực nhận
                if (receivedItems && Array.isArray(receivedItems)) {
                    // ✅ FIX: Ensure both sides are Number for comparison
                    const receivedItem = receivedItems.find(ri => Number(ri.product_id) === Number(item.product_id));
                    if (receivedItem) {
                        // Support both received_qty and received_quantity
                        receivedQty = Number(receivedItem.received_qty || receivedItem.received_quantity || item.quantity);
                        console.log(`[DEBUG] Found receivedItem for product ${item.product_id}:`, {
                            received_qty: receivedQty,
                            original: receivedItem
                        });
                    } else {
                        console.log(`[DEBUG] No receivedItem found for product ${item.product_id}, using default qty: ${receivedQty}`);
                    }
                }

                // Update received_qty in order item
                await tx.supplierOrderItem.update({
                    where: { id: item.id },
                    data: { received_qty: receivedQty }
                });

                if (receivedQty <= 0) {
                    continue; // Skip nếu không nhận sản phẩm này
                }

                // ✅ FIX: Tạo branchinventory TRƯỚC productBatch vì productBatch có FK đến branchinventory
                // 1. Cập nhật hoặc tạo branchinventory TRƯỚC
                const existingInventory = await tx.branchinventory.findUnique({
                    where: {
                        branch_id_product_id: {
                            branch_id: order.branch_id,
                            product_id: item.product_id
                        }
                    }
                });

                if (existingInventory) {
                    await tx.branchinventory.update({
                        where: {
                            branch_id_product_id: {
                                branch_id: order.branch_id,
                                product_id: item.product_id
                            }
                        },
                        data: {
                            stock: { increment: receivedQty },
                            last_updated: new Date()
                        }
                    });
                    console.log(`[DEBUG] Updated existing branchinventory for product ${item.product_id}`);
                } else {
                    await tx.branchinventory.create({
                        data: {
                            branch_id: order.branch_id,
                            product_id: item.product_id,
                            stock: receivedQty,
                            last_updated: new Date()
                        }
                    });
                    console.log(`[DEBUG] Created new branchinventory for product ${item.product_id}`);
                }

                // Generate batch number nếu chưa có
                const batchNumber = item.batch_number || generateBatchNumber(order.order_number, item.product_id);

                // 2. SAU ĐÓ mới tạo hoặc cập nhật productBatch
                const existingBatch = await tx.productBatch.findFirst({
                    where: {
                        batch_number: batchNumber,
                        product_id: item.product_id,
                        branch_id: order.branch_id
                    }
                });

                let batch;
                if (existingBatch) {
                    batch = await tx.productBatch.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: receivedQty },
                            updated_at: new Date()
                        }
                    });
                    console.log(`[DEBUG] Updated existing batch ${batchNumber}`);
                } else {
                    batch = await tx.productBatch.create({
                        data: {
                            product_id: item.product_id,
                            branch_id: order.branch_id,
                            batch_number: batchNumber,
                            manufacture_date: null, // Có thể thêm vào supplierOrderItem nếu cần
                            expiry_date: item.expiry_date,
                            quantity: receivedQty,
                            cost_price: item.unit_price,
                            selling_price: item.products.price, // Dùng giá bán hiện tại
                            supplier_id: order.supplier_id,
                            status: 'active',
                            note: `Nhập từ PO ${order.order_number}`
                        }
                    });
                    console.log(`[DEBUG] Created new batch ${batchNumber}`);
                }

                batchesCreated.push({
                    batch_id: batch.id,
                    batch_number: batchNumber,
                    product_id: item.product_id,
                    quantity: receivedQty
                });

                // 3. Tạo inventory log
                const inventoryLog = await tx.inventoryLog.create({
                    data: {
                        branch_id: order.branch_id,
                        product_id: item.product_id,
                        batch_id: batch.id,
                        quantity: receivedQty, // ✅ Số dương (convention mới)
                        type: INVENTORY_LOG_TYPE.IMPORT,
                        reference_type: 'supplier_order',
                        reference_id: order.id,
                        note: `Nhập kho từ PO ${order.order_number} - Lô ${batchNumber}`,
                        created_by: userId,
                        date: new Date()
                    }
                });

                console.log(`[DEBUG] Created inventoryLog for product ${item.product_id}:`, {
                    inventoryLog_id: inventoryLog.id,
                    product_id: item.product_id,
                    batch_id: batch.id,
                    order_id: order.id
                });

                // 4. Tạo junction table entry
                try {
                    await tx.inventoryLog_SupplierOrder.create({
                        data: {
                            inventory_log_id: inventoryLog.id,
                            supplier_order_id: order.id
                        }
                    });
                    console.log(`[DEBUG] Created junction for inventoryLog ${inventoryLog.id} -> order ${order.id}`);
                } catch (junctionError) {
                    console.error(`[ERROR] Failed to create junction:`, {
                        inventory_log_id: inventoryLog.id,
                        supplier_order_id: order.id,
                        error: junctionError.message,
                        code: junctionError.code
                    });
                    throw junctionError;
                }

                importResults.push({
                    product_id: item.product_id,
                    product_name: item.products.name,
                    ordered_qty: item.quantity,
                    received_qty: receivedQty,
                    batch_number: batchNumber,
                    inventory_log_id: inventoryLog.id
                });
            }

            // Update order status
            const updatedOrder = await tx.supplierOrder.update({
                where: { id: Number(id) },
                data: {
                    status: 'received',
                    received_by: userId,
                    received_date: new Date(),
                    updated_at: new Date()
                },
                include: {
                    suppliers: true,
                    branches: true,
                    supplierOrderItem: {
                        include: { products: true }
                    }
                }
            });

            return {
                order: updatedOrder,
                importResults,
                batchesCreated
            };
        }, {
            timeout: 30000
        });

        return {
            success: true,
            data: result.order,
            importResults: result.importResults,
            batchesCreated: result.batchesCreated,
            message: `Đã nhận hàng và nhập kho ${result.importResults.length} sản phẩm từ PO ${order.order_number}`
        };
    } catch (error) {
        console.error('[SupplierOrderService] Error receiving order:', error);
        throw error;
    }
};

/**
 * Cancel supplier order
 */
export const cancelSupplierOrder = async (id, userId, reason = null) => {
    try {
        const order = await prisma.supplierOrder.findUnique({
            where: { id: Number(id) }
        });

        if (!order) {
            return {
                success: false,
                status: 404,
                error: 'Không tìm thấy đơn đặt hàng nhà cung cấp'
            };
        }

        if (order.status === 'received') {
            return {
                success: false,
                status: 400,
                error: 'Không thể hủy đơn hàng đã nhận. Vui lòng tạo đơn trả hàng nếu cần.'
            };
        }

        if (order.status === 'cancelled') {
            return {
                success: false,
                status: 400,
                error: 'Đơn hàng đã bị hủy trước đó'
            };
        }

        const updatedOrder = await prisma.supplierOrder.update({
            where: { id: Number(id) },
            data: {
                status: 'cancelled',
                note: reason ? `${order.note || ''}\n[Lý do hủy]: ${reason}`.trim() : order.note,
                updated_at: new Date()
            },
            include: {
                suppliers: true,
                branches: true
            }
        });

        return {
            success: true,
            data: updatedOrder,
            message: 'Đã hủy đơn đặt hàng nhà cung cấp'
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get supplier order statistics
 */
export const getSupplierOrderStatistics = async (filters = {}) => {
    try {
        const { branch_id, supplier_id, start_date, end_date } = filters;

        const where = {};
        if (branch_id) where.branch_id = Number(branch_id);
        if (supplier_id) where.supplier_id = Number(supplier_id);

        if (start_date || end_date) {
            where.order_date = {};
            if (start_date) where.order_date.gte = new Date(start_date);
            if (end_date) where.order_date.lte = new Date(end_date);
        }

        const [
            totalOrders,
            draftOrders,
            pendingOrders,
            approvedOrders,
            shippedOrders,
            receivedOrders,
            cancelledOrders,
            totalValue
        ] = await Promise.all([
            prisma.supplierOrder.count({ where }),
            prisma.supplierOrder.count({ where: { ...where, status: 'draft' } }),
            prisma.supplierOrder.count({ where: { ...where, status: 'pending' } }),
            prisma.supplierOrder.count({ where: { ...where, status: 'approved' } }),
            prisma.supplierOrder.count({ where: { ...where, status: 'shipped' } }),
            prisma.supplierOrder.count({ where: { ...where, status: 'received' } }),
            prisma.supplierOrder.count({ where: { ...where, status: 'cancelled' } }),
            prisma.supplierOrder.aggregate({
                where: { ...where, status: 'received' },
                _sum: { final_amount: true }
            })
        ]);

        return {
            success: true,
            data: {
                totalOrders,
                ordersByStatus: {
                    draft: draftOrders,
                    pending: pendingOrders,
                    approved: approvedOrders,
                    shipped: shippedOrders,
                    received: receivedOrders,
                    cancelled: cancelledOrders
                },
                totalReceivedValue: totalValue._sum.final_amount || 0,
                completionRate: totalOrders > 0
                    ? ((receivedOrders / (totalOrders - cancelledOrders)) * 100).toFixed(2) + '%'
                    : '0%'
            }
        };
    } catch (error) {
        throw error;
    }
};
