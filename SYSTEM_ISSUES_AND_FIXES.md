# 🔍 TỔNG HỢP CÁC VẤN ĐỀ LOGIC TRONG HỆ THỐNG VÀ GIẢI PHÁP

> **Ngày tạo**: 28/11/2025  
> **Cập nhật**: 28/11/2025  
> **Trạng thái**: ✅ TẤT CẢ PHASES HOÀN THÀNH

---

## 📋 MỤC LỤC

1. [Vấn đề Nghiêm trọng (Critical)](#-vấn-đề-nghiêm-trọng-critical)
2. [Vấn đề Trung bình (Medium)](#-vấn-đề-trung-bình-medium)
3. [Vấn đề Nhẹ (Minor)](#-vấn-đề-nhẹ-minor)
4. [Kế hoạch Fix](#-kế-hoạch-fix)
5. [Tiến độ](#-tiến-độ)

---

## 🔴 Vấn đề Nghiêm trọng (Critical)

### ISSUE #1: Inventory không gắn với Branch khi đặt hàng ✅ FIXED

**Mô tả:**
```
Order → OrderItems chỉ có product_id, KHÔNG có branch_id
```

**Hệ quả:**
- Khi khách đặt hàng, không xác định trừ kho từ chi nhánh nào
- Phải dựa vào `shipments.branch_id` được tạo SAU khi đặt hàng → Race condition
- Có thể xảy ra overselling

**Giải pháp đã áp dụng:**
- [x] Đã có `inventoryReservation` table với logic tự động reserve khi checkout
- [x] `cartService.js` - Checkout flow đã tích hợp reservation
- [x] `checkoutService.js` - Sử dụng `findOptimalBranchesForOrder()` để chọn branch trước
- [x] Tạo shipment với `branch_id` ngay trong transaction checkout

**Files đã sửa:**
- `src/modules/order-management/cart/cartService.js`
- `src/modules/inventory-management/reservations/inventoryReservationService.js`

---

### ISSUE #2: Chênh lệch giữa BranchInventory và ProductBatch ✅ FIXED

**Mô tả:**
```javascript
branchinventory.stock có thể ≠ SUM(productBatch.quantity)
```

**Hệ quả:**
- 2 nguồn truth cho cùng 1 số liệu
- Báo cáo tồn kho không chính xác

**Giải pháp đã áp dụng:**
- [x] `reconcileInventoryWithBatches()` trong branchInventoryService
- [x] `inventoryReconciliationJob.js` - Scheduled job chạy lúc 2:00 AM hàng ngày
- [x] Log cảnh báo khi phát hiện chênh lệch với severity level (HIGH/MEDIUM)

**Files đã tạo/sửa:**
- `src/jobs/inventoryReconciliationJob.js`
- `src/modules/inventory-management/branch-inventory/branchInventoryService.js`

---

### ISSUE #3: Order không reserve inventory ngay ✅ FIXED

**Mô tả:**
- Có `inventoryReservation` table nhưng không có logic tự động reserve khi checkout
- 2 khách có thể mua cùng sản phẩm cuối cùng → Overselling

**Giải pháp đã áp dụng:**
- [x] `createInventoryReservations()` trong cartService.js
- [x] Expiry time 15 phút cho reservation
- [x] `reservationCleanupJob.js` - Chạy mỗi 5 phút để cleanup expired reservations
- [x] Serializable isolation level trong checkout transaction

**Files đã tạo/sửa:**
- `src/modules/order-management/cart/cartService.js`
- `src/modules/inventory-management/reservations/inventoryReservationService.js`
- `src/jobs/reservationCleanupJob.js`

---

## 🟠 Vấn đề Trung bình (Medium)

### ISSUE #4: Voucher rollback không đủ robust ✅ FIXED

**Mô tả:**
```javascript
// Trong cancelOrder
if (voucher && voucher.used_count > 0) {
  await tx.vouchers.update({ used_count: { decrement: 1 } });
}
```

**Giải pháp đã áp dụng:**
- [x] Đã có check `used_count > 0` trước khi decrement
- [x] Rollback cả `uservouchers.is_used` về false

---

### ISSUE #5: Flash Sale sold_count dựa vào order_date ✅ FIXED

**Mô tả:**
- Nếu flash sale kết thúc trước khi order bị cancel, việc rollback `sold_count` có thể sai

**Giải pháp đã áp dụng:**
- [x] Đã fix trong orderService - tìm flashsale dựa vào `order_date` thay vì current time

---

### ISSUE #6: Seed data tạo Orders không trừ inventory ✅ FIXED

**Mô tả:**
```javascript
// Trong seed script
const order = await prisma.orders.create({...});
// Không có logic trừ branchinventory
```

**Giải pháp đã áp dụng:**
- [x] Seed script giờ chọn branch trước khi tạo order
- [x] Chỉ chọn sản phẩm có trong inventory của branch đã chọn
- [x] Trừ inventory cho orders với status != pending/cancelled
- [x] Tạo inventory log với `reference_type: 'order'` và `reference_id`
- [x] Cập nhật `sold_count` cho delivered orders
- [x] Shipments sử dụng đúng `branch_id` từ inventory log

**Files đã sửa:**
- `prisma/seed-inventory-shipment.cjs`

---

### ISSUE #7: ProductUnits conversion không được validate khi order ✅ FIXED

**Mô tả:**
- Order có thể dùng `unit_id` với `conversion_factor` khác với product gốc
- Không có validation để đảm bảo unit thuộc về product

**Giải pháp đã áp dụng:**
- [x] Tạo file `src/utils/unitConversionValidation.js` với các functions:
  - `validateProductUnit()` - Kiểm tra unit thuộc product
  - `calculateBaseQuantity()` - Tính quantity theo base unit
  - `validateOrderItemWithConversion()` - Validate đầy đủ order item
  - `validateOrderItemsWithConversion()` - Validate nhiều items cùng lúc
  - `getProductUnitsWithConversion()` - Lấy danh sách units với conversion info
  - `convertBetweenUnits()` - Chuyển đổi giữa các đơn vị
- [x] Logic validation đảm bảo:
  1. Product tồn tại
  2. Unit thuộc về product
  3. Conversion factor > 0
  4. Stock đủ (tính theo base unit)

**Files đã tạo:**
- `src/utils/unitConversionValidation.js`

---

## 🟡 Vấn đề Nhẹ (Minor)

### ISSUE #8: Tracking Number có thể trùng ✅ FIXED

**Mô tả:**
```javascript
const generateTrackingNumber = () => {
  // Random-based, có xác suất trùng dù thấp
}
```

**Giải pháp đã áp dụng:**
- [x] Sử dụng UUID v4 kết hợp timestamp (base36)
- [x] Thêm retry logic (3 lần) khi check unique trong DB
- [x] Fallback sử dụng full UUID nếu vẫn collision
- [x] Recursive retry khi gặp P2002 (unique constraint violation)

**Files đã sửa:**
- `src/modules/shipping-management/shipments/shipmentService.js`

---

### ISSUE #9: Cities không có unique constraint trên code ⚠️ LOW PRIORITY

**Mô tả:**
```prisma
model cities {
  name String @unique
  code String? // Không unique!
}
```

**Giải pháp:**
- [ ] Thêm unique constraint cho code trong schema.prisma
- ⚠️ **Lưu ý**: Cần kiểm tra dữ liệu hiện tại trước khi thêm constraint

**Đánh giá**: Low priority - không ảnh hưởng critical đến hệ thống, code chủ yếu dùng để display

---

### ISSUE #10: Supplier Order không tự động cập nhật inventory ✅ FIXED

**Mô tả:**
- `supplierOrder` có status `received` nhưng không có logic tự động nhập kho

**Giải pháp đã áp dụng:**
- [x] Tạo file `src/modules/inventory-management/supplier-order/supplierOrderService.js`
- [x] Function `receiveSupplierOrder()` tự động:
  1. Tạo/cập nhật `productBatch` cho từng sản phẩm
  2. Cập nhật `branchinventory` 
  3. Tạo `inventoryLog` với type `IMPORT`
  4. Tạo junction table `inventoryLog_SupplierOrder`
- [x] Idempotency check để tránh nhập kho nhiều lần
- [x] State machine cho supplier order status transitions
- [x] Hỗ trợ nhận hàng một phần (partial receiving)

**Files đã tạo:**
- `src/modules/inventory-management/supplier-order/supplierOrderService.js`
- `src/modules/inventory-management/supplier-order/supplierOrderRoutes.js`

**API mới:**
```
GET    /api/supplier-orders              - Danh sách đơn đặt hàng NCC
GET    /api/supplier-orders/statistics   - Thống kê
GET    /api/supplier-orders/:id          - Chi tiết đơn
POST   /api/supplier-orders              - Tạo đơn mới
PATCH  /api/supplier-orders/:id/status   - Cập nhật trạng thái
POST   /api/supplier-orders/:id/receive  - Nhận hàng và tự động nhập kho
POST   /api/supplier-orders/:id/cancel   - Hủy đơn
```

---

### ISSUE #11: Stock Take không tự động điều chỉnh inventory ✅ FIXED (ĐÃ CÓ SẴN)

**Mô tả:**
- Sau khi kiểm kê xong, phải manually update `branchinventory`

**Giải pháp:**
- ✅ **ĐÃ CÓ SẴN** trong `stockTakeService.js`
- Function `completeStockTake()` đã có logic:
  1. Cập nhật `branchinventory.stock = actual_qty`
  2. Điều chỉnh `productBatch` quantities theo FEFO
  3. Tạo `inventoryLog` với type `ADJUSTMENT`
  4. Tạo junction table `inventoryLog_StockTake`

**Files đã có:**
- `src/modules/inventory-management/stock-take/stockTakeService.js`

---

### ISSUE #12: Expired Batches vẫn tính trong stock API ✅ FIXED

**Mô tả:**
- API `getProductTotalStock` có thể trả về số bao gồm hàng expired
- Customer thấy "còn hàng" nhưng không mua được

**Giải pháp đã áp dụng:**
- [x] Tạo function mới `getProductAvailableStock()` với các field:
  - `total_stock`: Tổng tồn kho (bao gồm cả hàng expired)
  - `available_stock`: Tồn kho có thể bán (loại trừ expired + reserved)
  - `expired_stock`: Hàng đã hết hạn (cần tiêu hủy)
  - `reserved_stock`: Hàng đang được giữ chỗ
  - `active_stock`: Hàng active từ batches
- [x] Tạo `getMultipleProductsAvailableStock()` cho batch query (optimized cho catalog)
- [x] Thêm warnings khi có expired items hoặc reservations

**Files đã sửa:**
- `src/modules/inventory-management/branch-inventory/branchInventoryService.js`

---

## 🔧 Kế hoạch Fix

### Phase 1: Critical Issues (Ưu tiên cao) ✅ HOÀN THÀNH

| # | Issue | File | Status |
|---|-------|------|--------|
| 1 | Reserve inventory khi checkout | `cartService.js` | ✅ Đã có |
| 2 | Tạo inventory reconcile job | `inventoryReconciliationJob.js` | ✅ Đã có |
| 3 | Reservation cleanup job | `reservationCleanupJob.js` | ✅ Đã có |
| 6 | Seed script không trừ inventory | `seed-inventory-shipment.cjs` | ✅ Đã fix |

### Phase 2: Medium Issues ✅ HOÀN THÀNH

| # | Issue | File | Status |
|---|-------|------|--------|
| 8 | UUID cho tracking number | `shipmentService.js` | ✅ Đã fix |
| 7 | Validate unit conversion | `unitConversionValidation.js` | ✅ Đã fix |
| 10 | Auto-import từ supplier order | `supplierOrderService.js` | ✅ Đã fix |

### Phase 3: Minor Issues ✅ HOÀN THÀNH

| # | Issue | File | Status |
|---|-------|------|--------|
| 11 | Auto-adjust stock take | `stockTakeService.js` | ✅ Đã có sẵn |
| 12 | Separate available/total stock | `branchInventoryService.js` | ✅ Đã fix |
| 9 | Cities code unique | Schema migration | ⚠️ Low priority |

---

## 📈 Tiến độ

- [x] Phân tích và document các issues
- [x] Fix seed script (ISSUE #6)
- [x] Kiểm tra inventory reconcile job (ISSUE #2)
- [x] Kiểm tra reserve inventory logic (ISSUE #1, #3)
- [x] UUID cho tracking number (ISSUE #8)
- [x] Stock availability separation (ISSUE #12)
- [x] Unit conversion validation (ISSUE #7)
- [x] Auto-import supplier order (ISSUE #10)
- [x] Stock take auto-adjust (ISSUE #11 - đã có sẵn)
- [ ] Cities code unique constraint (ISSUE #9) - Low priority

---

## 📝 Ghi chú

### Convention đã áp dụng:

1. **Inventory Log quantity**: Sử dụng số **DƯƠNG** cho tất cả operations
   - `type = 'IMPORT'` → nhập kho
   - `type = 'EXPORT'` → xuất kho  
   - `type = 'ADJUSTMENT'` → điều chỉnh
   - `type = 'DISPOSAL'` → tiêu hủy
   - `type = 'TRANSFER_IN'` → nhận chuyển kho
   - `type = 'TRANSFER_OUT'` → xuất chuyển kho
   - `type = 'CANCEL_RETURN'` → hoàn kho do hủy đơn

2. **FEFO (First Expired First Out)**: Đã implement trong:
   - `productBatchService.js`
   - `branchInventoryService.js`
   - `inventoryTransferService.js`
   - `stockTakeService.js` (khi điều chỉnh batch)

3. **State Machine**: Đã implement cho:
   - Order status transitions
   - Shipment status transitions
   - Inventory transfer status transitions
   - **Supplier order status transitions** (mới)

4. **Reservation System**:
   - Thời gian giữ chỗ: 15 phút
   - Cleanup job: mỗi 5 phút
   - Status: `active` → `completed` | `cancelled` | `expired`

5. **Unit Conversion**:
   - `conversion_factor` = số đơn vị cơ bản trong 1 đơn vị bán
   - Base quantity = ordered_quantity × conversion_factor
   - Validation: Unit phải thuộc về product

---

## 🔗 Files liên quan

### Inventory Management
- `src/modules/inventory-management/branch-inventory/branchInventoryService.js`
- `src/modules/inventory-management/product-batch/productBatchService.js`
- `src/modules/inventory-management/reservations/inventoryReservationService.js`
- `src/modules/inventory-management/inventory-transfer/inventoryTransferService.js`
- `src/modules/inventory-management/stock-take/stockTakeService.js`
- `src/modules/inventory-management/supplier-order/supplierOrderService.js` ✨ NEW
- `src/modules/inventory-management/supplier-order/supplierOrderRoutes.js` ✨ NEW

### Order Management
- `src/modules/order-management/orders/orderService.js`
- `src/modules/order-management/cart/cartService.js`

### Shipping Management
- `src/modules/shipping-management/shipments/shipmentService.js`

### Utils
- `src/utils/unitConversionValidation.js` ✨ NEW
- `src/utils/constants.js`
- `src/utils/branchSelection.js`

### Jobs
- `src/jobs/inventoryReconciliationJob.js`
- `src/jobs/reservationCleanupJob.js`

### Seed Scripts
- `prisma/seed-inventory-shipment.cjs`

---

## 🚀 Cách chạy các Jobs

### Inventory Reconciliation (chạy manual)
```javascript
import { reconcileInventory } from './src/jobs/inventoryReconciliationJob.js';
await reconcileInventory();
```

### Reservation Cleanup (chạy manual)
```javascript
import { runManualCleanup } from './src/jobs/reservationCleanupJob.js';
await runManualCleanup();
```

### Re-seed dữ liệu (sau khi fix)
```bash
# Clear database trước nếu cần
node prisma/seed-inventory-shipment.cjs
```

---

## 🆕 API mới được thêm

### Supplier Order APIs (Issue #10)
```javascript
// Tạo đơn đặt hàng nhà cung cấp
POST /api/supplier-orders
Body: {
  supplier_id: 1,
  branch_id: 1,
  items: [
    { product_id: 1, quantity: 100, unit_price: 50000, expiry_date: "2026-12-31" }
  ],
  expected_date: "2025-12-01",
  note: "Đơn hàng tháng 12"
}

// Nhận hàng và tự động nhập kho
POST /api/supplier-orders/:id/receive
Body: {
  receivedItems: [
    { product_id: 1, received_qty: 95 } // Nhận thiếu 5 so với đặt
  ]
}
// Response bao gồm:
// - importResults: Chi tiết sản phẩm đã nhập
// - batchesCreated: Các batch được tạo
```

### Unit Conversion Validation (Issue #7)
```javascript
import { 
  validateOrderItemWithConversion,
  validateOrderItemsWithConversion,
  getProductUnitsWithConversion
} from './utils/unitConversionValidation.js';

// Validate 1 item
const result = await validateOrderItemWithConversion({
  productId: 1,
  unitId: 5,
  quantity: 10
}, branchId);
// Returns: { isValid, error?, details? }

// Validate nhiều items
const results = await validateOrderItemsWithConversion(items, branchId);
// Returns: { isValid, errors?, validatedItems? }
```

### Get Product Available Stock (Issue #12)
```javascript
import { getProductAvailableStock } from './branchInventoryService.js';

const result = await getProductAvailableStock(productId, branchId);
// Returns:
// {
//   total_stock: 100,
//   available_stock: 85,
//   expired_stock: 10,
//   reserved_stock: 5,
//   active_stock: 90,
//   warnings: [...]
// }
```

### Generate Unique Tracking Number (Issue #8)
```javascript
// Tracking number format: VN{base36_timestamp}{uuid_segment}
// Example: VNLX5K3Z8A1B2C3D
// Features:
// - UUID v4 + timestamp
// - Retry 3 lần nếu collision
// - Fallback to full UUID
```
