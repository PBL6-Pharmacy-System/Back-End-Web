# Voucher APIs Documentation

## Public APIs (Customer)

### 1. Get Customer Vouchers
Lấy danh sách vouchers của customer hiện tại (đã được assign cho customer)

**Endpoint:** `GET /api/vouchers`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số lượng vouchers mỗi trang, mặc định = 10
- `isUsed` (optional): Filter theo trạng thái
  - `true`: Chỉ lấy vouchers đã dùng
  - `false`: Chỉ lấy vouchers chưa dùng
  - Không truyền: Lấy tất cả

**Response:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "id": 1,
        "code": "SUMMER2024",
        "discount_type": "percentage",
        "discount_value": "20",
        "min_order_value": "100000",
        "start_date": "2024-06-01T00:00:00.000Z",
        "end_date": "2024-08-31T23:59:59.999Z",
        "usage_limit": 100,
        "used_count": 45,
        "is_used": false,
        "assigned_at": "2024-06-15T10:30:00.000Z",
        "order_id": null,
        "is_expired": false,
        "can_use": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalRecords": 3
    }
  }
}
```

---

### 2. Check Voucher by Code
Kiểm tra voucher có hợp lệ không trước khi checkout

**Endpoint:** `GET /api/vouchers/check/:code`

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `code`: Mã voucher (VD: SUMMER2024)

**Query Parameters:**
- `orderAmount` (optional): Giá trị đơn hàng để tính discount ước lượng

**Example:**
```
GET /api/vouchers/check/SUMMER2024?orderAmount=500000
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "voucher": {
      "id": 1,
      "code": "SUMMER2024",
      "discount_type": "percentage",
      "discount_value": "20",
      "min_order_value": "100000",
      "start_date": "2024-06-01T00:00:00.000Z",
      "end_date": "2024-08-31T23:59:59.999Z"
    },
    "isValid": true,
    "estimatedDiscount": 100000,
    "message": "Voucher hợp lệ"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "Mã voucher đã hết hạn"
}
```

**Possible Errors:**
- `404`: Mã voucher không tồn tại
- `400`: Voucher chưa có hiệu lực
- `400`: Mã voucher đã hết hạn
- `400`: Mã voucher đã hết lượt sử dụng
- `400`: Bạn đã sử dụng mã voucher này rồi
- `400`: Đơn hàng phải có giá trị tối thiểu X VNĐ

---

### 3. Get Voucher by ID
Lấy thông tin chi tiết voucher theo ID

**Endpoint:** `GET /api/vouchers/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `id`: ID của voucher

**Example:**
```
GET /api/vouchers/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "SUMMER2024",
    "discount_type": "percentage",
    "discount_value": "20",
    "min_order_value": "100000",
    "start_date": "2024-06-01T00:00:00.000Z",
    "end_date": "2024-08-31T23:59:59.999Z",
    "usage_limit": 100,
    "used_count": 45,
    "created_at": "2024-05-20T10:00:00.000Z",
    "updated_at": "2024-06-15T14:30:00.000Z",
    "orders": [
      {
        "id": 123,
        "order_date": "2024-06-15T10:30:00.000Z",
        "total_amount": "450000"
      }
    ]
  }
}
```

---

### 4. Get Available Vouchers
Lấy danh sách vouchers đang active (tất cả vouchers còn hạn và còn lượt dùng)

**Endpoint:** `GET /api/vouchers/available`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số lượng vouchers mỗi trang, mặc định = 10
- `search` (optional): Tìm kiếm theo code
- `sortBy` (optional): Sắp xếp theo field, mặc định = created_at
- `sortOrder` (optional): asc hoặc desc, mặc định = desc

**Example:**
```
GET /api/vouchers/available?page=1&limit=10&search=SUMMER
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "id": 1,
        "code": "SUMMER2024",
        "discount_type": "percentage",
        "discount_value": "20",
        "min_order_value": "100000",
        "start_date": "2024-06-01T00:00:00.000Z",
        "end_date": "2024-08-31T23:59:59.999Z",
        "usage_limit": 100,
        "used_count": 45,
        "created_at": "2024-05-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalRecords": 5
    }
  }
}
```

---

## Testing

Sử dụng file test:
```bash
# Cập nhật CUSTOMER_TOKEN trong file
node scripts/test-voucher-apis.js
```

Hoặc test bằng curl:
```bash
# 1. Get customer vouchers
curl -X GET "http://localhost:3000/api/vouchers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check voucher by code
curl -X GET "http://localhost:3000/api/vouchers/check/SUMMER2024?orderAmount=500000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get voucher by ID
curl -X GET "http://localhost:3000/api/vouchers/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **Route Order**: Route `/vouchers` PHẢI đặt trước `/vouchers/available` và `/vouchers/:id` để tránh xung đột
2. **Authentication**: Tất cả APIs yêu cầu authentication token
3. **Customer Only**: API `/vouchers` chỉ dành cho customer (role_id = 3)
4. **Admin Routes**: Các API admin đã được chuyển sang prefix `/admin/vouchers`
