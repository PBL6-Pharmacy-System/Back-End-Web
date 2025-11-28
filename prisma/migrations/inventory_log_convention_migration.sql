-- ============================================================
-- MIGRATION: Inventory Log Convention Migration
-- Date: 2025-11-28
-- Description: Migrate từ convention cũ (số âm) sang convention mới (số dương + type)
-- ============================================================
-- ============================================================
-- BACKUP TRƯỚC KHI MIGRATE (QUAN TRỌNG!)
-- ============================================================
-- Chạy lệnh này trước khi migrate:
-- pg_dump -t "inventoryLog" your_database > inventoryLog_backup_$(date +%Y%m%d).sql
-- ============================================================
-- STEP 1: Kiểm tra dữ liệu hiện tại
-- ============================================================
-- Đếm số records theo convention cũ (quantity < 0)
SELECT type,
    COUNT(*) as count,
    SUM(
        CASE
            WHEN quantity < 0 THEN 1
            ELSE 0
        END
    ) as negative_qty_count,
    SUM(
        CASE
            WHEN quantity > 0 THEN 1
            ELSE 0
        END
    ) as positive_qty_count
FROM "inventoryLog"
GROUP BY type
ORDER BY type;
-- ============================================================
-- STEP 2: Migrate type 'OUT' với quantity âm → 'EXPORT' với quantity dương
-- ============================================================
UPDATE "inventoryLog"
SET type = 'EXPORT',
    quantity = ABS(quantity),
    note = CONCAT(
        note,
        ' [Migrated from OUT on ',
        NOW()::date,
        ']'
    )
WHERE type = 'OUT'
    AND quantity < 0;
-- ============================================================
-- STEP 3: Migrate type 'sale' với quantity âm → 'EXPORT' với quantity dương
-- ============================================================
UPDATE "inventoryLog"
SET type = 'EXPORT',
    quantity = ABS(quantity),
    note = CONCAT(
        note,
        ' [Migrated from sale on ',
        NOW()::date,
        ']'
    )
WHERE type = 'sale'
    AND quantity < 0;
-- ============================================================
-- STEP 4: Migrate các type khác có quantity âm (nếu có)
-- ============================================================
-- TRANSFER_OUT với quantity âm → giữ nguyên type, đổi quantity thành dương
UPDATE "inventoryLog"
SET quantity = ABS(quantity),
    note = CONCAT(
        note,
        ' [Migrated: qty sign fixed on ',
        NOW()::date,
        ']'
    )
WHERE type = 'TRANSFER_OUT'
    AND quantity < 0;
-- DAMAGE với quantity âm → giữ nguyên type, đổi quantity thành dương
UPDATE "inventoryLog"
SET quantity = ABS(quantity),
    note = CONCAT(
        note,
        ' [Migrated: qty sign fixed on ',
        NOW()::date,
        ']'
    )
WHERE type = 'DAMAGE'
    AND quantity < 0;
-- DISPOSAL với quantity âm → giữ nguyên type, đổi quantity thành dương
UPDATE "inventoryLog"
SET quantity = ABS(quantity),
    note = CONCAT(
        note,
        ' [Migrated: qty sign fixed on ',
        NOW()::date,
        ']'
    )
WHERE type = 'DISPOSAL'
    AND quantity < 0;
-- ============================================================
-- STEP 5: Verify migration
-- ============================================================
-- Kiểm tra không còn record nào với quantity âm (trừ ADJUSTMENT)
SELECT type,
    COUNT(*) as count,
    MIN(quantity) as min_qty,
    MAX(quantity) as max_qty
FROM "inventoryLog"
WHERE type NOT IN ('ADJUSTMENT', 'STOCK_TAKE') -- Các type này có thể có qty âm/dương
GROUP BY type
ORDER BY type;
-- Đảm bảo không còn type 'OUT' hoặc 'sale'
SELECT COUNT(*) as legacy_type_count
FROM "inventoryLog"
WHERE type IN ('OUT', 'sale');
-- ============================================================
-- STEP 6: Add check constraint (Optional - sau khi verify)
-- ============================================================
-- Uncomment sau khi đã verify migration thành công
-- ALTER TABLE "inventoryLog" 
-- ADD CONSTRAINT check_quantity_positive 
-- CHECK (
--     (type IN ('ADJUSTMENT', 'STOCK_TAKE')) -- Có thể âm/dương
--     OR quantity >= 0 -- Các type khác phải dương
-- );
-- ============================================================
-- ROLLBACK SCRIPT (nếu cần)
-- ============================================================
-- Chỉ dùng nếu cần rollback về convention cũ
-- UPDATE "inventoryLog"
-- SET 
--     type = 'OUT',
--     quantity = -ABS(quantity)
-- WHERE type = 'EXPORT' AND note LIKE '%Migrated from OUT%';
-- UPDATE "inventoryLog"
-- SET 
--     type = 'sale',
--     quantity = -ABS(quantity)
-- WHERE type = 'EXPORT' AND note LIKE '%Migrated from sale%';