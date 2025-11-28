# INVENTORY LOG CONVENTION GUIDE

## ⚠️ TRẠNG THÁI: CHƯA MIGRATE - GIỮ NGUYÊN SETUP CŨ

> **Lưu ý quan trọng**: Hệ thống hiện tại đang hỗ trợ **CẢ 2 convention** (cũ và mới).
> Team có thể tiếp tục test API bình thường mà không cần chạy migration.
> Migration sẽ được thực hiện sau khi tất cả tests pass và team đồng ý.

---

## 📋 Tổng quan

Hệ thống hiện tại hỗ trợ **2 convention** cho `inventoryLog`:

### Convention CŨ (đang hoạt động)
- **Quantity**: Số **ÂM** cho xuất kho, số **DƯƠNG** cho nhập kho
- **Type**: `OUT`, `sale` cho xuất kho

### Convention MỚI (đã chuẩn bị, chưa áp dụng)
- **Quantity**: Luôn là số **DƯƠNG**
- **Type**: Xác định chiều di chuyển (`EXPORT`, `IMPORT`, v.v.)

---

## ✅ HIỆN TẠI: Code đã hỗ trợ Backward Compatibility

Các file sau đã được cập nhật để **hỗ trợ CẢ 2 convention**:
- `orderService.js` - Query hỗ trợ cả `OUT`/`sale` (qty âm) và `EXPORT` (qty dương)
- `shipmentService.js` - Tương tự

**→ Team có thể test bình thường mà KHÔNG cần migrate database.**

---

## 📊 Inventory Log Types (Tham khảo)

### Types làm TĂNG stock (Nhập kho)
| Type | Mô tả | Quantity Convention |
|------|-------|---------------------|
| `IMPORT` | Nhập kho từ NCC | DƯƠNG (mới) |
| `RETURN` | Hoàn trả từ khách hàng | DƯƠNG (mới) |
| `CANCEL_RETURN` | Hoàn kho do hủy đơn | DƯƠNG (mới) |
| `TRANSFER_IN` | Nhận chuyển kho | DƯƠNG (mới) |

### Types làm GIẢM stock (Xuất kho)
| Type | Mô tả | Quantity Convention |
|------|-------|---------------------|
| `OUT` | Xuất kho (cũ) | ÂM (cũ) |
| `sale` | Bán hàng (cũ) | ÂM (cũ) |
| `EXPORT` | Xuất kho (mới) | DƯƠNG (mới) |
| `TRANSFER_OUT` | Chuyển kho đi | DƯƠNG (mới) |
| `DISPOSAL` | Tiêu hủy | DƯƠNG (mới) |

---

## 🚫 CHƯA THỰC HIỆN - Migration Script

Các file sau đã được tạo nhưng **CHƯA CHẠY**:
- `prisma/migrations/inventory_log_convention_migration.sql`
- `scripts/migrate-inventory-log-convention.js`

**→ KHÔNG chạy các script này cho đến khi team quyết định migrate.**

---

## 📅 KẾ HOẠCH MIGRATE (Sau này)

### Điều kiện để migrate:
1. ✅ Tất cả API tests pass
2. ✅ Team review và đồng ý
3. ✅ Backup database hoàn tất
4. ✅ Chọn thời điểm ít traffic

### Quy trình migrate (khi sẵn sàng):
```bash
# Bước 1: Dry run (an toàn, chỉ xem preview)
node scripts/migrate-inventory-log-convention.js

# Bước 2: Backup database từ Supabase

# Bước 3: Execute migration
node scripts/migrate-inventory-log-convention.js --execute

# Bước 4: Verify
node scripts/migrate-inventory-log-convention.js --verify
```

---

## 💻 Code Examples (Cho lập trình viên mới)

### Khi tạo inventory log MỚI (khuyến nghị dùng convention mới)

```javascript
import { INVENTORY_LOG_TYPE } from '../utils/constants.js';

// Xuất kho - dùng convention mới
await tx.inventoryLog.create({
  data: {
    branch_id: branchId,
    product_id: productId,
    quantity: 10,                    // Số DƯƠNG
    type: INVENTORY_LOG_TYPE.EXPORT, // Type mới
    note: 'Xuất kho cho đơn hàng'
  }
});
```

### Khi query inventory log (hỗ trợ cả 2 convention)

```javascript
// ✅ Query hỗ trợ backward compatibility
const logs = await tx.inventoryLog.findMany({
  where: {
    reference_type: 'order',
    reference_id: orderId,
    OR: [
      // Convention cũ: số âm
      { type: { in: ['OUT', 'sale'] }, quantity: { lt: 0 } },
      // Convention mới: số dương
      { type: 'EXPORT', quantity: { gt: 0 } }
    ]
  }
});

// Xử lý cả 2 convention
for (const log of logs) {
  const qtyToRestore = log.quantity < 0 ? Math.abs(log.quantity) : log.quantity;
  // ...
}
```

---

## 📞 Liên hệ

Nếu có câu hỏi về inventory log convention, liên hệ team backend.

---

**Cập nhật lần cuối:** 28/11/2025
**Trạng thái:** Backward compatible - Chưa migrate
