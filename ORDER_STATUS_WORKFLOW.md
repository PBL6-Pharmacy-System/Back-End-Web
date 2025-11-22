# QUY TRÌNH CHUYỂN TRẠNG THÁI ĐỚN HÀNG

## Tổng Quan
Hệ thống quản lý đơn hàng có 9 trạng thái khác nhau, mỗi trạng thái đại diện cho một giai đoạn trong vòng đời của đơn hàng.

---

## CÁC TRẠNG THÁI ĐƠN HÀNG

### 1. CART (Giỏ hàng)
- **Mô tả**: Trạng thái đầu tiên khi khách hàng thêm sản phẩm vào giỏ
- **Đặc điểm**:
  - Chưa phải đơn hàng thực sự
  - Khách hàng có thể thay đổi số lượng, xóa sản phẩm tự do
  - Không giữ hàng trong kho
  - Không tính vào thống kê đơn hàng

### 2. PENDING (Chờ xác nhận)
- **Mô tả**: Đơn hàng đã được tạo, đang chờ xử lý
- **Chuyển từ**: CART (khi checkout thành công)
- **Đặc điểm**:
  - Đơn hàng chính thức được tạo
  - Thông tin khách hàng, địa chỉ giao hàng đã được lưu
  - Chưa giảm tồn kho
  - Khách hàng có thể hủy đơn tự do

### 3. CONFIRMED (Đã xác nhận)
- **Mô tả**: Admin/Staff đã xác nhận đơn hàng
- **Chuyển từ**: PENDING
- **Hành động khi chuyển trạng thái**:
  - Giảm số lượng tồn kho trong `branchinventory`
  - Ghi log vào `inventoryLog` (type: 'OUT', reference_type: 'order')
  - Tạo bản ghi trong `inventoryLog_Order` để liên kết
  - Ghi lịch sử vào `order_status_history`
- **Quyền thực hiện**: Admin hoặc Staff
- **Đặc điểm**:
  - Kho đã được giữ hàng
  - Đơn hàng đang được chuẩn bị
  - Khách hàng vẫn có thể hủy (nhưng cần hoàn kho)

### 4. PROCESSING (Đang xử lý)
- **Mô tả**: Đơn hàng đang được đóng gói, chuẩn bị xuất kho
- **Chuyển từ**: CONFIRMED
- **Hành động**:
  - Nhân viên kho đóng gói sản phẩm
  - Kiểm tra chất lượng sản phẩm
  - In phiếu giao hàng
- **Quyền thực hiện**: Admin hoặc Staff
- **Đặc điểm**:
  - Hàng đã được lấy từ kho
  - Đang trong quá trình đóng gói
  - Khó hủy đơn (cần quy trình phức tạp hơn)

### 5. SHIPPING (Đang giao hàng)
- **Mô tả**: Đơn hàng đã được chuyển cho đơn vị vận chuyển
- **Chuyển từ**: PROCESSING
- **Hành động**:
  - Tạo bản ghi trong bảng `shipments`
  - Gán `tracking_number` (mã vận đơn)
  - Cập nhật thông tin đơn vị vận chuyển
  - Gửi thông báo cho khách hàng
- **Quyền thực hiện**: Admin hoặc Staff
- **Đặc điểm**:
  - Hàng đang trên đường vận chuyển
  - Có mã tracking để theo dõi
  - Không thể hủy đơn (chỉ có thể hoàn hàng sau khi nhận)

### 6. DELIVERED (Đã giao hàng)
- **Mô tả**: Khách hàng đã nhận được hàng
- **Chuyển từ**: SHIPPING
- **Hành động**:
  - Cập nhật trạng thái giao hàng trong `shipments`
  - Ghi nhận thời gian giao hàng thành công
  - Xác nhận thanh toán nếu là COD
  - Tạo bản ghi trong `payments` (nếu COD)
- **Quyền thực hiện**: Shipper/Staff hoặc tự động từ đơn vị vận chuyển
- **Đặc điểm**:
  - Đơn hàng thành công
  - Được tính vào doanh thu
  - Khách hàng có thể đánh giá sản phẩm
  - Có thể yêu cầu đổi/trả hàng trong thời gian quy định

### 7. COMPLETED (Hoàn thành)
- **Mô tả**: Đơn hàng đã hoàn tất, không còn khiếu nại
- **Chuyển từ**: DELIVERED (sau khoảng thời gian nhất định)
- **Hành động**:
  - Tự động chuyển sau X ngày kể từ DELIVERED (ví dụ: 7-14 ngày)
  - Hoặc khách hàng xác nhận đã nhận hàng đầy đủ
  - Kết thúc quyền đổi/trả hàng
- **Đặc điểm**:
  - Trạng thái cuối cùng của đơn hàng thành công
  - Không thể thay đổi nữa
  - Dữ liệu được dùng cho phân tích, thống kê

### 8. CANCELLED (Đã hủy)
- **Mô tả**: Đơn hàng bị hủy bởi khách hàng hoặc admin
- **Chuyển từ**: PENDING, CONFIRMED, PROCESSING
- **Hành động khi hủy**:
  - Nếu từ trạng thái CONFIRMED trở đi: Hoàn trả kho
    - Tăng lại `branchinventory.stock`
    - Ghi log vào `inventoryLog` (type: 'IN', reference_type: 'order_cancel')
  - Hủy thanh toán (nếu đã thanh toán online)
  - Ghi lý do hủy vào `order_status_history.note`
- **Quyền thực hiện**:
  - PENDING: Khách hàng hoặc Admin/Staff
  - CONFIRMED/PROCESSING: Chỉ Admin/Staff
  - SHIPPING/DELIVERED: Không thể hủy
- **Đặc điểm**:
  - Không tính vào doanh thu
  - Có thể thống kê để phân tích lý do hủy

### 9. RETURNED (Đã hoàn trả)
- **Mô tả**: Khách hàng đã trả hàng
- **Chuyển từ**: DELIVERED
- **Hành động**:
  - Khách hàng yêu cầu đổi/trả hàng
  - Admin/Staff xác nhận lý do hợp lệ
  - Hoàn tiền cho khách hàng
  - Nhận hàng trả về kho:
    - Kiểm tra chất lượng sản phẩm
    - Nếu OK: Tăng `branchinventory.stock`
    - Ghi log vào `inventoryLog` (type: 'IN', reference_type: 'order_return')
- **Quyền thực hiện**: Admin hoặc Staff (sau khi nhận yêu cầu từ khách hàng)
- **Đặc điểm**:
  - Phải trong thời hạn đổi/trả (thường 7-30 ngày)
  - Trừ doanh thu đã tính trước đó
  - Có thể thống kê tỷ lệ trả hàng

---

## SƠ ĐỒ CHUYỂN TRẠNG THÁI

```
                    [CART]
                      ↓ (Checkout)
                  [PENDING]
                      ↓ (Admin/Staff xác nhận)
                      ↓ (Trừ tồn kho)
                  [CONFIRMED]
                      ↓ (Bắt đầu đóng gói)
                  [PROCESSING]
                      ↓ (Chuyển cho shipper)
                   [SHIPPING]
                      ↓ (Giao thành công)
                  [DELIVERED]
                      ↓ (Sau X ngày)
                  [COMPLETED]

            ═══ Luồng hủy/trả hàng ═══
            
PENDING/CONFIRMED/PROCESSING ──→ [CANCELLED] (Hủy đơn)
                                    ↑ (Hoàn kho nếu đã trừ)
                                    
         DELIVERED ──→ [RETURNED] (Trả hàng)
                         ↑ (Hoàn kho + Hoàn tiền)
```

---

## QUY TẮC CHUYỂN TRẠNG THÁI

### Các chuyển đổi được phép:

| Từ trạng thái | Đến trạng thái | Điều kiện |
|---------------|----------------|-----------|
| CART | PENDING | Checkout thành công |
| PENDING | CONFIRMED | Admin/Staff xác nhận |
| PENDING | CANCELLED | Hủy trước khi xác nhận |
| CONFIRMED | PROCESSING | Bắt đầu xử lý |
| CONFIRMED | CANCELLED | Admin hủy (hoàn kho) |
| PROCESSING | SHIPPING | Chuyển cho shipper |
| PROCESSING | CANCELLED | Admin hủy (hoàn kho) |
| SHIPPING | DELIVERED | Giao thành công |
| DELIVERED | COMPLETED | Sau thời gian đổi/trả |
| DELIVERED | RETURNED | Khách yêu cầu trả hàng |

### Các chuyển đổi KHÔNG được phép:

- Từ CART → bất kỳ trạng thái nào khác ngoài PENDING
- Từ SHIPPING/DELIVERED → CANCELLED
- Từ CANCELLED/COMPLETED/RETURNED → bất kỳ trạng thái nào
- Bỏ qua các bước trung gian (ví dụ: PENDING → SHIPPING)

---

## TÁC ĐỘNG ĐẾN HỆ THỐNG KHO

### Khi chuyển sang CONFIRMED:
```javascript
// 1. Giảm tồn kho
await prisma.branchinventory.update({
  where: { branch_id_product_id: { branch_id, product_id } },
  data: { 
    stock: { decrement: quantity },
    last_updated: new Date()
  }
});

// 2. Ghi log inventory
const log = await prisma.inventoryLog.create({
  data: {
    branch_id,
    product_id,
    type: 'OUT',
    quantity: -quantity,
    reference_type: 'order',
    reference_id: orderId,
    date: new Date()
  }
});

// 3. Liên kết với order
await prisma.inventoryLog_Order.create({
  data: {
    inventory_log_id: log.id,
    order_id: orderId
  }
});
```

### Khi HỦY đơn (từ CONFIRMED/PROCESSING):
```javascript
// 1. Hoàn trả kho
await prisma.branchinventory.update({
  where: { branch_id_product_id: { branch_id, product_id } },
  data: { 
    stock: { increment: quantity },
    last_updated: new Date()
  }
});

// 2. Ghi log hoàn trả
await prisma.inventoryLog.create({
  data: {
    branch_id,
    product_id,
    type: 'IN',
    quantity: quantity,
    reference_type: 'order_cancel',
    reference_id: orderId,
    note: cancelReason
  }
});
```

### Khi TRẢ hàng (RETURNED):
```javascript
// 1. Nhận hàng về kho
await prisma.branchinventory.update({
  where: { branch_id_product_id: { branch_id, product_id } },
  data: { 
    stock: { increment: returnQuantity },
    last_updated: new Date()
  }
});

// 2. Ghi log trả hàng
await prisma.inventoryLog.create({
  data: {
    branch_id,
    product_id,
    type: 'IN',
    quantity: returnQuantity,
    reference_type: 'order_return',
    reference_id: orderId
  }
});
```

---

## BẢNG LIÊN QUAN

### 1. `orders` - Bảng chính lưu đơn hàng
```
- id
- customer_id
- status (cart/pending/confirmed/processing/shipping/delivered/completed/cancelled/returned)
- total_amount
- discount_amount
- final_amount
- shipping_fee
- shipping_address_id
- payment_method
- order_date
- created_at
- updated_at
```

### 2. `order_status_history` - Lịch sử thay đổi trạng thái
```
- id
- order_id (FK → orders.id)
- status
- changed_by (FK → users.id)
- changed_at
- note (lý do thay đổi)
```

### 3. `orderitems` - Chi tiết sản phẩm trong đơn
```
- id
- order_id (FK → orders.id)
- product_id (FK → products.id)
- unit_id (FK → productunits.id)
- quantity
- unit_price
- total_price
```

### 4. `shipments` - Thông tin vận chuyển
```
- id
- order_id (FK → orders.id)
- branch_id (FK → branches.id)
- tracking_number
- carrier
- status
- shipped_date
- estimated_delivery
- actual_delivery
```

### 5. `payments` - Thông tin thanh toán
```
- id
- order_id (FK → orders.id)
- payment_method
- payment_status
- amount
- transaction_id
- payment_date
```

### 6. `branchinventory` - Tồn kho chi nhánh
```
- id
- branch_id (FK → branches.id)
- product_id (FK → products.id)
- stock (số lượng tồn)
- last_updated
```

### 7. `inventoryLog` - Log mọi thay đổi tồn kho
```
- id
- branch_id
- product_id
- type ('IN'/'OUT')
- quantity (+/-)
- reference_type ('order'/'order_cancel'/'order_return'/'transfer'/'stocktake'...)
- reference_id
- date
```

### 8. `inventoryLog_Order` - Junction table liên kết log với order
```
- id
- inventory_log_id (FK → inventoryLog.id)
- order_id (FK → orders.id)
```

---

## QUYỀN HẠN XỬ LÝ

### Customer (Khách hàng):
- Xem đơn hàng của mình
- Hủy đơn hàng ở trạng thái PENDING
- Yêu cầu trả hàng (tạo ticket, không trực tiếp chuyển trạng thái)

### Staff (Nhân viên):
- Xem tất cả đơn hàng
- Xác nhận đơn: PENDING → CONFIRMED
- Xử lý đơn: CONFIRMED → PROCESSING → SHIPPING
- Cập nhật trạng thái giao hàng: SHIPPING → DELIVERED
- Hủy đơn: PENDING/CONFIRMED/PROCESSING → CANCELLED
- Xử lý trả hàng: DELIVERED → RETURNED

### Admin (Quản trị viên):
- Tất cả quyền của Staff
- Xem thống kê tổng quan
- Quản lý cấu hình hệ thống
- Xử lý các trường hợp đặc biệt

---

## LƯU Ý QUAN TRỌNG

### 1. Transaction Safety (An toàn giao dịch)
- Mọi thao tác thay đổi trạng thái + cập nhật kho phải trong transaction
- Nếu một bước thất bại → rollback toàn bộ

### 2. Lưu lịch sử
- Mỗi lần chuyển trạng thái phải ghi vào `order_status_history`
- Lưu người thực hiện, thời gian, lý do (nếu có)

### 3. Kiểm tra điều kiện
- Validate trạng thái hiện tại trước khi chuyển
- Kiểm tra quyền của user
- Kiểm tra tồn kho trước khi CONFIRMED

### 4. Thông báo
- Gửi email/notification cho khách hàng khi trạng thái thay đổi
- Đặc biệt quan trọng: CONFIRMED, SHIPPING, DELIVERED, CANCELLED

### 5. Tự động hóa
- Tự động chuyển DELIVERED → COMPLETED sau X ngày
- Tự động hủy đơn PENDING quá lâu không xác nhận
- Tự động cập nhật từ API đơn vị vận chuyển

---

## API ENDPOINTS LIÊN QUAN

### 1. Xem đơn hàng
```
GET /api/orders (Admin - tất cả đơn)
GET /api/orders/customer/:customerId (Customer - đơn của mình)
GET /api/orders/:orderId (Chi tiết đơn)
```

### 2. Cập nhật trạng thái
```
PUT /api/orders/:orderId/status
Body: { status: "confirmed", note: "..." }
Permission: Admin/Staff
```

### 3. Hủy đơn
```
POST /api/orders/:orderId/cancel
Body: { reason: "..." }
Permission: Customer (nếu PENDING), Admin/Staff (các trạng thái khác)
```

### 4. Trả hàng
```
POST /api/orders/:orderId/return-request
Body: { reason: "...", images: [...] }
Permission: Customer

PUT /api/orders/:orderId/approve-return
Permission: Admin/Staff
```

### 5. Thống kê
```
GET /api/orders/statistics
Query: ?startDate=...&endDate=...
Permission: Admin
```

---

## KẾT LUẬN

Quy trình chuyển trạng thái đơn hàng được thiết kế để:
1. **Rõ ràng**: Mỗi trạng thái có ý nghĩa cụ thể
2. **An toàn**: Có validation và transaction
3. **Linh hoạt**: Xử lý được cả trường hợp hủy/trả hàng
4. **Truy vết**: Lưu đầy đủ lịch sử thay đổi
5. **Đồng bộ**: Cập nhật kho chính xác theo đơn hàng

Hệ thống đảm bảo tính toàn vẹn dữ liệu và tồn kho trong mọi tình huống.
