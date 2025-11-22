# TÓM TẮT HỆ THỐNG QUẢN LÝ KHO - INVENTORY SYSTEM

## TỔNG QUAN NHANH

Hệ thống quản lý kho được thiết kế để theo dõi tồn kho theo từng chi nhánh, ghi nhận mọi giao dịch xuất nhập kho, và thực hiện kiểm kê định kỳ.

---

## CÁC BẢNG CHÍNH

### 1. Core Tables (Bảng cốt lõi)

| Bảng | Mục đích | Trạng thái |
|------|----------|-----------|
| **branchinventory** | Tồn kho thực tế tại từng chi nhánh | ✅ Đang dùng |
| **inventoryLog** | Lịch sử mọi giao dịch kho | ✅ Đang dùng |
| **products** | Thông tin sản phẩm | ✅ Đang dùng |
| **productunits** | Đơn vị quy đổi sản phẩm | ✅ Đang dùng |
| **branches** | Thông tin chi nhánh | ✅ Đang dùng |

### 2. Related Tables (Bảng liên quan)

| Bảng | Mục đích | Trạng thái |
|------|----------|-----------|
| **orders** | Đơn hàng (bao gồm cart) | ✅ Đang dùng |
| **orderitems** | Chi tiết đơn hàng | ✅ Đang dùng |
| **stockTake** | Phiếu kiểm kê | ⚠️ Chưa implement |
| **stockTakeItem** | Chi tiết kiểm kê | ⚠️ Chưa implement |
| **inventoryTransfer** | Chuyển kho giữa chi nhánh | ⚠️ Chưa implement đầy đủ |
| **productBatch** | Quản lý lô hàng, hạn dùng | ⚠️ Chưa implement |

### 3. Bảng KHÔNG sử dụng

| Bảng/Trường | Lý do | Thay thế bằng |
|-------------|-------|---------------|
| **products.stock** | Không phản ánh đúng tồn kho nhiều chi nhánh | **branchinventory.stock** |

---

## LUỒNG NGHIỆP VỤ CHÍNH

### 🛒 Quy trình mua hàng

```
1. Add to Cart
   ├─ Kiểm tra branchinventory.stock
   ├─ Tạo/cập nhật orderitems (status='cart')
   └─ CHƯA trừ tồn kho

2. Checkout
   ├─ Transaction START
   ├─ Trừ branchinventory.stock
   ├─ Tạo inventoryLog (type='EXPORT')
   ├─ Đổi status: cart → pending
   ├─ Tạo payment record
   └─ Transaction COMMIT

3. Confirm Payment
   ├─ Transaction START
   ├─ Update payment status → completed
   ├─ Update order status → confirmed
   ├─ Cập nhật products.sold_count
   └─ Transaction COMMIT

4. Cancel Order
   ├─ Transaction START
   ├─ Hoàn branchinventory.stock
   ├─ Tạo inventoryLog (type='RETURN')
   ├─ Giảm products.sold_count (nếu đã confirmed)
   ├─ Update order status → cancelled
   └─ Transaction COMMIT
```

### 📦 Quy trình nhập/xuất kho

```
1. Import (Nhập kho)
   ├─ Transaction START
   ├─ Tạo inventoryLog (type='IMPORT')
   ├─ Cộng branchinventory.stock
   └─ Transaction COMMIT

2. Export (Xuất kho)
   ├─ Transaction START
   ├─ Tạo inventoryLog (type='EXPORT')
   ├─ Trừ branchinventory.stock
   └─ Transaction COMMIT
```

### 📋 Quy trình kiểm kê (Chưa implement)

```
1. Tạo phiếu kiểm kê
   └─ Tạo stockTake + stockTakeItem

2. Nhập kết quả
   └─ Cập nhật actual_qty, tính variance

3. Hoàn thành kiểm kê
   ├─ Transaction START
   ├─ Điều chỉnh branchinventory.stock
   ├─ Tạo inventoryLog (type='ADJUSTMENT')
   └─ Transaction COMMIT
```

---

## INVENTORYLOG TYPES

| Type | Ý nghĩa | Quantity | Khi nào dùng |
|------|---------|----------|--------------|
| **IMPORT** | Nhập từ nhà cung cấp | Dương | Nhập hàng mới |
| **EXPORT** | Xuất kho (bán, hủy) | Dương | Checkout, xuất kho thủ công |
| **RETURN** | Trả hàng, hoàn kho | Dương | Cancel order, trả hàng |
| **TRANSFER** | Chuyển kho | Dương/Âm | Chuyển giữa chi nhánh |
| **ADJUSTMENT** | Điều chỉnh kiểm kê | Dương/Âm | Sau khi kiểm kê |
| **DAMAGE** | Hàng hỏng | Dương | Hàng hỏng, hết hạn |

**Lưu ý**: Quantity luôn lưu giá trị dương, type cho biết loại giao dịch

---

## CÔNG THỨC QUAN TRỌNG

### 1. Conversion Factor (Hệ số quy đổi)

```javascript
// Khách mua 2 hộp (1 hộp = 100 viên)
const quantity = 2; // 2 hộp
const conversion_factor = 100; // 1 hộp = 100 viên

const baseQuantity = quantity * conversion_factor; // 2 * 100 = 200 viên

// Trừ 200 viên từ branchinventory.stock
```

### 2. Kiểm tra tồn kho

```javascript
// Lấy conversion_factor từ productunits
const productUnit = await prisma.productunits.findUnique({
  where: { id: productUnitId }
});

// Tính số lượng cần (theo đơn vị cơ bản)
const baseQuantityNeeded = quantity * productUnit.conversion_factor;

// Kiểm tra tồn kho
const inventory = await prisma.branchinventory.findFirst({
  where: {
    branch_id: branchId,
    product_id: productId,
    stock: { gte: baseQuantityNeeded }
  }
});

if (!inventory) {
  throw new Error('Không đủ hàng trong kho');
}
```

### 3. Cập nhật tồn kho (với transaction)

```javascript
await prisma.$transaction(async (tx) => {
  // 1. Tạo log trước
  await tx.inventoryLog.create({
    data: {
      branch_id: branchId,
      product_id: productId,
      quantity: baseQuantity,
      type: 'EXPORT', // hoặc IMPORT, RETURN...
      reference_type: 'order',
      reference_id: orderId,
      note: 'Xuất kho cho đơn hàng',
      date: new Date()
    }
  });

  // 2. Cập nhật inventory sau
  await tx.branchinventory.update({
    where: {
      branch_id_product_id: {
        branch_id: branchId,
        product_id: productId
      }
    },
    data: {
      stock: { decrement: baseQuantity }, // hoặc increment
      last_updated: new Date()
    }
  });
});
```

---

## NGUYÊN TẮC QUAN TRỌNG

### ✅ BẮT BUỘC

1. **Luôn dùng branchinventory.stock**, KHÔNG dùng products.stock
2. **Luôn dùng transaction** khi cập nhật inventory và log
3. **Luôn tính baseQuantity** = quantity × conversion_factor
4. **Luôn ghi inventoryLog** trước khi cập nhật branchinventory
5. **Kiểm tra stock** trước khi trừ kho

### ❌ KHÔNG ĐƯỢC

1. ❌ Cập nhật branchinventory mà không ghi inventoryLog
2. ❌ Xóa hoặc sửa inventoryLog (chỉ được thêm mới)
3. ❌ Trừ kho mà không kiểm tra stock trước
4. ❌ Cập nhật inventory mà không dùng transaction
5. ❌ Sử dụng products.stock trong logic nghiệp vụ

---

## API ENDPOINTS

### Cart APIs (✅ Đã implement)
- `GET /api/cart/:customerId` - Xem giỏ hàng
- `POST /api/cart/:customerId/items` - Thêm sản phẩm
- `PUT /api/cart/:customerId/items/:itemId` - Cập nhật số lượng
- `DELETE /api/cart/:customerId/items/:itemId` - Xóa sản phẩm
- `POST /api/cart/:customerId/checkout` - Thanh toán

### Order APIs (✅ Đã implement)
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `POST /api/orders/:id/cancel` - Hủy đơn hàng

### Branch Inventory APIs (✅ Đã implement)
- `GET /api/branch-inventory` - Danh sách tồn kho
- `GET /api/branch-inventory/:id` - Chi tiết tồn kho
- `POST /api/branch-inventory/import` - Nhập kho
- `POST /api/branch-inventory/export` - Xuất kho
- `GET /api/branch-inventory/low-stock` - Sản phẩm sắp hết

### Stock Take APIs (⚠️ Chưa implement)
- `POST /api/stock-takes` - Tạo phiếu kiểm kê
- `PUT /api/stock-takes/:id/items/:itemId` - Nhập kết quả
- `POST /api/stock-takes/:id/complete` - Hoàn thành

### Inventory Transfer APIs (⚠️ Chưa implement đầy đủ)
- `POST /api/inventory-transfers` - Tạo yêu cầu chuyển kho
- `POST /api/inventory-transfers/:id/approve` - Phê duyệt
- `POST /api/inventory-transfers/:id/ship` - Xuất hàng
- `POST /api/inventory-transfers/:id/receive` - Nhận hàng

---

## TRẠNG THÁI HIỆN TẠI

### ✅ Đã hoàn thành (Đánh giá: 8/10)

1. **Cart System**
   - ✅ Add to cart (kiểm tra stock, không trừ kho)
   - ✅ Remove from cart
   - ✅ Update quantity
   - ✅ Checkout (trừ kho, ghi log)

2. **Order System**
   - ✅ Confirm payment (cập nhật sold_count)
   - ✅ Cancel order (hoàn kho, ghi log, giảm sold_count)
   - ✅ Order status tracking

3. **Branch Inventory**
   - ✅ Import inventory (có transaction)
   - ✅ Export inventory (có transaction)
   - ✅ View inventory
   - ✅ Low stock warning

4. **Inventory Log**
   - ✅ Ghi nhận mọi giao dịch
   - ✅ Chuẩn hóa type (IMPORT, EXPORT, RETURN)
   - ✅ Reference tracking

### ⚠️ Chưa hoàn thành

1. **Stock Take Module** (Priority 2)
   - ❌ Tạo phiếu kiểm kê
   - ❌ Nhập kết quả kiểm kê
   - ❌ Điều chỉnh tồn kho sau kiểm kê

2. **Inventory Transfer Module** (Priority 3)
   - ⚠️ Có schema nhưng chưa có code đầy đủ
   - ❌ API tạo/phê duyệt/xuất/nhận chuyển kho

3. **Product Batch Management** (Priority 3)
   - ⚠️ Có schema nhưng chưa có code
   - ❌ Quản lý lô hàng theo FEFO
   - ❌ Cảnh báo hàng sắp hết hạn

---

## CÁC FIX ĐÃ ÁP DỤNG (2024-11-22)

### 1. Chuẩn hóa inventoryLog type
- ✅ OUT → EXPORT
- ✅ IN → RETURN

### 2. Bổ sung giảm sold_count
- ✅ Cancel order đã confirmed → giảm sold_count

### 3. Thêm transaction
- ✅ Import inventory → có transaction
- ✅ Export inventory → có transaction

Chi tiết xem file: `INVENTORY_FIXES_APPLIED.md`

---

## TESTING CHECKLIST

### Kiểm tra Cart Flow
- [ ] Add to cart → không trừ tồn kho
- [ ] Checkout → trừ tồn kho đúng
- [ ] inventoryLog type='EXPORT'
- [ ] branchinventory.stock giảm đúng

### Kiểm tra Cancel Order
- [ ] Cancel pending → hoàn kho, không giảm sold_count
- [ ] Cancel confirmed → hoàn kho, giảm sold_count
- [ ] inventoryLog type='RETURN'
- [ ] branchinventory.stock tăng lại

### Kiểm tra Import/Export
- [ ] Import → transaction hoạt động
- [ ] Export → transaction hoạt động
- [ ] Rollback khi có lỗi

---

## ROADMAP

### Phase 1 (Đã xong) ✅
- Cart và Order system
- Branch inventory CRUD
- Inventory log tracking
- Transaction cho các thao tác quan trọng

### Phase 2 (Cần làm) ⚠️
- Stock Take module
- Cảnh báo tồn kho thấp
- Báo cáo xuất nhập tồn

### Phase 3 (Tương lai) 
- Inventory Transfer hoàn chỉnh
- Product Batch management (FEFO)
- Tích hợp với hệ thống ERP

---

## TÀI LIỆU THAM KHẢO

1. **INVENTORY_STOCK_STOCKTAKE_SYSTEM.md**
   - Mô tả chi tiết toàn bộ hệ thống
   - Mối quan hệ giữa các bảng
   - Luồng nghiệp vụ chi tiết

2. **INVENTORY_LOGIC_ANALYSIS.md**
   - Phân tích logic hiện tại
   - Đánh giá từng module
   - Đề xuất cải thiện

3. **INVENTORY_FIXES_APPLIED.md**
   - Chi tiết các thay đổi đã thực hiện
   - Before/After code
   - Impact analysis

---

## LIÊN HỆ & HỖ TRỢ

- **Team**: Backend Development Team
- **Email**: dev@example.com
- **Docs**: `/docs/inventory-system`

---

**Version**: 1.0.0  
**Last Updated**: 2024-11-22  
**Status**: ✅ Stable (Core features complete)
