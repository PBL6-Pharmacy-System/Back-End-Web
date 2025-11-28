-- =====================================================
-- RESET INVENTORY DATA - Safe SQL Script
-- Chỉ xóa và tạo lại inventory + batches
-- Không ảnh hưởng đến products, orders, users, etc.
-- =====================================================
-- Bước 1: Xóa dữ liệu cũ theo thứ tự (foreign key safe)
TRUNCATE TABLE "stockTakeItem" CASCADE;
TRUNCATE TABLE "stockTake" CASCADE;
TRUNCATE TABLE "inventoryLog_StockTake" CASCADE;
TRUNCATE TABLE "inventoryLog_SupplierOrder" CASCADE;
TRUNCATE TABLE "inventoryLog_Transfer" CASCADE;
TRUNCATE TABLE "inventoryLog_Order" CASCADE;
TRUNCATE TABLE "inventoryLog" CASCADE;
TRUNCATE TABLE "productBatch" CASCADE;
TRUNCATE TABLE "inventoryReservation" CASCADE;
TRUNCATE TABLE "branchinventory" CASCADE;
-- Verify deletion
SELECT 'branchinventory' as table_name,
    COUNT(*) as count
FROM "branchinventory"
UNION ALL
SELECT 'productBatch',
    COUNT(*)
FROM "productBatch"
UNION ALL
SELECT 'inventoryLog',
    COUNT(*)
FROM "inventoryLog";
-- =====================================================
-- Bước 2: Tạo lại Branch Inventory với stock = batch quantity
-- =====================================================
-- Tạo inventory cho tất cả products ở tất cả branches (70% chance)
INSERT INTO "branchinventory" (
        branch_id,
        product_id,
        stock,
        min_stock,
        max_stock,
        reorder_point,
        reorder_quantity,
        last_updated
    )
SELECT b.id as branch_id,
    p.id as product_id,
    -- Stock sẽ được set = batch quantity bên dưới
    floor(random() * 400 + 100)::int as stock,
    -- 100-500
    floor(random() * 15 + 5)::int as min_stock,
    -- 5-20
    floor(random() * 500 + 500)::int as max_stock,
    -- 500-1000
    floor(random() * 35 + 15)::int as reorder_point,
    -- 15-50
    floor(random() * 150 + 50)::int as reorder_quantity,
    -- 50-200
    now() as last_updated
FROM branches b
    CROSS JOIN products p
WHERE random() > 0.3 -- 70% chance
    AND p.id <= 100 -- Limit to first 100 products
ORDER BY b.id,
    p.id;
-- =====================================================
-- Bước 3: Tạo Product Batches với quantity = inventory stock
-- =====================================================
INSERT INTO "productBatch" (
        product_id,
        branch_id,
        batch_number,
        manufacture_date,
        expiry_date,
        quantity,
        cost_price,
        selling_price,
        supplier_id,
        status,
        note,
        created_at,
        updated_at
    )
SELECT bi.product_id,
    bi.branch_id,
    'LOT' || to_char(now(), 'YYMMDD') || '-' || bi.branch_id || '-' || bi.product_id as batch_number,
    (now() - interval '6 months' * random())::date as manufacture_date,
    (
        now() + interval '2 years' * random() + interval '6 months'
    )::date as expiry_date,
    bi.stock as quantity,
    -- ✅ KEY FIX: batch quantity = inventory stock
    (p.price * 0.6)::decimal(12, 2) as cost_price,
    p.price as selling_price,
    (
        SELECT id
        FROM suppliers
        ORDER BY random()
        LIMIT 1
    ) as supplier_id,
    'active' as status,
    'Initial batch from seed' as note,
    now() as created_at,
    now() as updated_at
FROM "branchinventory" bi
    JOIN products p ON p.id = bi.product_id;
-- =====================================================
-- Bước 4: Verify - Kiểm tra inventory và batches đã đồng bộ
-- =====================================================
SELECT 'Verification' as check_type,
    COUNT(*) as total_records,
    SUM(
        CASE
            WHEN bi.stock = COALESCE(batch_sum.total, 0) THEN 1
            ELSE 0
        END
    ) as matched,
    SUM(
        CASE
            WHEN bi.stock != COALESCE(batch_sum.total, 0) THEN 1
            ELSE 0
        END
    ) as mismatched
FROM "branchinventory" bi
    LEFT JOIN (
        SELECT branch_id,
            product_id,
            SUM(quantity) as total
        FROM "productBatch"
        WHERE status IN ('active', 'expired')
        GROUP BY branch_id,
            product_id
    ) batch_sum ON batch_sum.branch_id = bi.branch_id
    AND batch_sum.product_id = bi.product_id;
-- Show sample data
SELECT bi.branch_id,
    bi.product_id,
    bi.stock as inventory_stock,
    COALESCE(batch_sum.total, 0) as batch_total,
    CASE
        WHEN bi.stock = COALESCE(batch_sum.total, 0) THEN '✅'
        ELSE '❌'
    END as status
FROM "branchinventory" bi
    LEFT JOIN (
        SELECT branch_id,
            product_id,
            SUM(quantity) as total
        FROM "productBatch"
        WHERE status IN ('active', 'expired')
        GROUP BY branch_id,
            product_id
    ) batch_sum ON batch_sum.branch_id = bi.branch_id
    AND batch_sum.product_id = bi.product_id
LIMIT 20;
-- Final counts
SELECT 'Final Counts' as info;
SELECT 'branchinventory' as table_name,
    COUNT(*) as count
FROM "branchinventory"
UNION ALL
SELECT 'productBatch',
    COUNT(*)
FROM "productBatch"
UNION ALL
SELECT 'inventoryLog',
    COUNT(*)
FROM "inventoryLog";