# API CHUYỂN TRẠNG THÁI ĐƠN HÀNG

## Tổng Quan

Hệ thống cung cấp các API riêng biệt cho từng bước chuyển trạng thái đơn hàng, đảm bảo quy trình xử lý đơn hàng rõ ràng và an toàn.

---

## DANH SÁCH API

### 1. XÁC NHẬN ĐƠN HÀNG (Confirm Order)

**Chức năng**: Chuyển đơn hàng từ PENDING → CONFIRMED và trừ tồn kho

**Endpoint**: `POST /api/orders/:id/confirm`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "note": "Đơn hàng đã được kiểm tra và xác nhận" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã được xác nhận thành công",
  "data": {
    "orderId": 123,
    "status": "confirmed"
  }
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Không đủ hàng cho sản phẩm: Laptop Dell XPS 15"
}
```

**Các hành động được thực hiện**:
- Kiểm tra tồn kho cho tất cả sản phẩm trong đơn
- Trừ số lượng trong `branchinventory`
- Tạo `inventorylog` với type='OUT'
- Tạo liên kết `inventorylog_order`
- Cập nhật trạng thái đơn hàng
- Ghi lịch sử vào `order_status_history`

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Đơn hàng đã được xác nhận"
  }'
```

---

### 2. BẮT ĐẦU XỬ LÝ (Start Processing)

**Chức năng**: Chuyển đơn hàng từ CONFIRMED → PROCESSING (Bắt đầu đóng gói)

**Endpoint**: `POST /api/orders/:id/process`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "note": "Bắt đầu đóng gói đơn hàng" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã chuyển sang trạng thái xử lý",
  "data": {
    "orderId": 123,
    "status": "processing"
  }
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Không thể chuyển sang xử lý từ trạng thái pending"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Bắt đầu đóng gói"
  }'
```

---

### 3. BẮT ĐẦU GIAO HÀNG (Start Shipping)

**Chức năng**: Chuyển đơn hàng từ PROCESSING → SHIPPING và tạo thông tin vận chuyển

**Endpoint**: `POST /api/orders/:id/ship`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "trackingNumber": "VN123456789",
  "carrier": "Giao Hàng Nhanh",
  "branchId": 1,
  "estimatedDelivery": "2024-01-20T10:00:00Z",
  "note": "Đã giao cho shipper" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã chuyển sang trạng thái giao hàng",
  "data": {
    "orderId": 123,
    "status": "shipping",
    "trackingNumber": "VN123456789"
  }
}
```

**Các hành động được thực hiện**:
- Cập nhật trạng thái đơn hàng
- Tạo bản ghi trong bảng `shipments`
- Lưu mã vận đơn, đơn vị vận chuyển
- Ghi lịch sử

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/ship \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "VN123456789",
    "carrier": "Giao Hàng Nhanh",
    "branchId": 1,
    "estimatedDelivery": "2024-01-20T10:00:00Z"
  }'
```

---

### 4. XÁC NHẬN ĐÃ GIAO (Mark as Delivered)

**Chức năng**: Chuyển đơn hàng từ SHIPPING → DELIVERED

**Endpoint**: `POST /api/orders/:id/deliver`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "note": "Khách hàng đã nhận hàng và thanh toán" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã được giao thành công",
  "data": {
    "orderId": 123,
    "status": "delivered"
  }
}
```

**Các hành động được thực hiện**:
- Cập nhật trạng thái đơn hàng
- Cập nhật trạng thái `shipments` thành 'delivered'
- Lưu thời gian giao hàng thực tế
- Tạo bản ghi thanh toán nếu là COD
- Ghi lịch sử

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/deliver \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Đã giao hàng thành công"
  }'
```

---

### 5. HOÀN THÀNH ĐƠN HÀNG (Mark as Completed)

**Chức năng**: Chuyển đơn hàng từ DELIVERED → COMPLETED

**Endpoint**: `POST /api/orders/:id/complete`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "note": "Khách hàng xác nhận hài lòng, kết thúc đơn hàng" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã hoàn thành",
  "data": {
    "orderId": 123,
    "status": "completed"
  }
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Đơn hàng hoàn thành"
  }'
```

---

### 6. TRẢ HÀNG (Return Order)

**Chức năng**: Chuyển đơn hàng từ DELIVERED → RETURNED và hoàn trả kho

**Endpoint**: `POST /api/orders/:id/return`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "reason": "Sản phẩm không đúng mô tả, khách hàng yêu cầu trả hàng"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã được xử lý trả hàng thành công",
  "data": {
    "orderId": 123,
    "status": "returned"
  }
}
```

**Các hành động được thực hiện**:
- Cập nhật trạng thái đơn hàng
- Hoàn trả số lượng vào `branchinventory`
- Tạo `inventorylog` với type='IN' và reference_type='order_return'
- Tạo liên kết `inventorylog_order`
- Ghi lý do trả hàng vào lịch sử

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Sản phẩm không đúng mô tả"
  }'
```

---

### 7. HỦY ĐƠN HÀNG (Cancel Order)

**Chức năng**: Hủy đơn hàng từ PENDING/CONFIRMED/PROCESSING → CANCELLED

**Endpoint**: `POST /api/orders/:id/cancel`

**Quyền**: Admin, Staff

**Request Body**:
```json
{
  "reason": "Khách hàng yêu cầu hủy đơn" // Optional
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Đơn hàng đã được hủy thành công",
  "data": {
    "orderId": 123,
    "status": "cancelled"
  }
}
```

**Các hành động được thực hiện**:
- Cập nhật trạng thái đơn hàng
- Hoàn trả kho nếu đơn đã CONFIRMED
- Tạo `inventorylog` với type='IN' và reference_type='order_cancel'
- Ghi lý do hủy

**Lưu ý**: Không thể hủy đơn hàng ở trạng thái SHIPPING, DELIVERED, CANCELLED

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/orders/123/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Khách hàng yêu cầu hủy"
  }'
```

---

## QUY TẮC CHUYỂN TRẠNG THÁI

### Các chuyển đổi hợp lệ:

| API Endpoint | Từ trạng thái | Đến trạng thái | Trừ kho | Hoàn kho |
|--------------|---------------|----------------|---------|----------|
| `/orders/:id/confirm` | PENDING | CONFIRMED | ✅ | ❌ |
| `/orders/:id/process` | CONFIRMED | PROCESSING | ❌ | ❌ |
| `/orders/:id/ship` | PROCESSING | SHIPPING | ❌ | ❌ |
| `/orders/:id/deliver` | SHIPPING | DELIVERED | ❌ | ❌ |
| `/orders/:id/complete` | DELIVERED | COMPLETED | ❌ | ❌ |
| `/orders/:id/return` | DELIVERED | RETURNED | ❌ | ✅ |
| `/orders/:id/cancel` | PENDING/CONFIRMED/PROCESSING | CANCELLED | ❌ | ✅ (nếu đã CONFIRMED) |

### Validation Rules:

1. **Không thể bỏ qua bước**: Phải đi theo đúng thứ tự workflow
2. **Không thể quay lại**: Không thể chuyển từ trạng thái cao về trạng thái thấp (trừ CANCEL và RETURN)
3. **Kiểm tra tồn kho**: Trước khi CONFIRM phải có đủ hàng
4. **Quyền hạn**: Chỉ Admin/Staff mới được thực hiện các thao tác này

---

## LƯU Ý QUAN TRỌNG

### 1. Transaction Safety
Mọi thao tác đều được thực hiện trong transaction để đảm bảo tính toàn vẹn dữ liệu. Nếu một bước thất bại, toàn bộ quá trình sẽ rollback.

### 2. Inventory Management
- Khi **CONFIRM**: Trừ tồn kho
- Khi **CANCEL** (từ CONFIRMED trở lên): Hoàn trả kho
- Khi **RETURN**: Hoàn trả kho

### 3. Audit Trail
Mỗi lần chuyển trạng thái đều được ghi vào bảng `order_status_history` với thông tin:
- Trạng thái mới
- Người thực hiện
- Thời gian
- Ghi chú (nếu có)

### 4. Inventory Logging
Mọi thay đổi tồn kho đều được ghi vào:
- Bảng `inventorylog`: Log chi tiết
- Bảng `inventorylog_order`: Liên kết log với đơn hàng

---

## POSTMAN COLLECTION

### Environment Variables
```
base_url: http://localhost:3000
token: YOUR_AUTH_TOKEN
orderId: 123
```

### Test Workflow

1. **Xác nhận đơn hàng**:
   ```
   POST {{base_url}}/api/orders/{{orderId}}/confirm
   Headers: Authorization: Bearer {{token}}
   Body: { "note": "Xác nhận đơn" }
   ```

2. **Bắt đầu xử lý**:
   ```
   POST {{base_url}}/api/orders/{{orderId}}/process
   Headers: Authorization: Bearer {{token}}
   Body: { "note": "Bắt đầu đóng gói" }
   ```

3. **Bắt đầu giao hàng**:
   ```
   POST {{base_url}}/api/orders/{{orderId}}/ship
   Headers: Authorization: Bearer {{token}}
   Body: {
     "trackingNumber": "VN123456",
     "carrier": "GHN",
     "branchId": 1,
     "estimatedDelivery": "2024-01-20T10:00:00Z"
   }
   ```

4. **Xác nhận đã giao**:
   ```
   POST {{base_url}}/api/orders/{{orderId}}/deliver
   Headers: Authorization: Bearer {{token}}
   Body: { "note": "Đã giao hàng" }
   ```

5. **Hoàn thành**:
   ```
   POST {{base_url}}/api/orders/{{orderId}}/complete
   Headers: Authorization: Bearer {{token}}
   Body: { "note": "Hoàn thành" }
   ```

---

## ERROR CODES

| Status Code | Ý nghĩa |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (sai trạng thái, không đủ hàng, v.v.) |
| 401 | Unauthorized (chưa đăng nhập) |
| 403 | Forbidden (không có quyền) |
| 404 | Not Found (không tìm thấy đơn hàng) |
| 500 | Internal Server Error |

---

## COMMON ERROR MESSAGES

```json
// Không đủ hàng
{
  "success": false,
  "error": "Không đủ hàng cho sản phẩm: Laptop Dell XPS 15"
}

// Sai trạng thái
{
  "success": false,
  "error": "Không thể xác nhận đơn hàng từ trạng thái shipping"
}

// Không tìm thấy đơn hàng
{
  "success": false,
  "error": "Không tìm thấy đơn hàng"
}

// Không có quyền
{
  "success": false,
  "error": "Bạn không có quyền thực hiện hành động này"
}
```

---

## CHANGELOG

### Version 1.0.0 (2024-01-15)
- Tạo API riêng cho từng bước chuyển trạng thái
- Tích hợp quản lý tồn kho
- Thêm inventory logging
- Thêm validation và error handling

---

## HỖ TRỢ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team phát triển.
