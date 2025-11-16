# Orders API Documentation

## ✅ Module hoàn thành

Orders Management Module đã được implement thành công với các tính năng:

- ✅ Quản lý đơn hàng (CRUD)
- ✅ Thống kê đơn hàng
- ✅ Lịch sử trạng thái đơn hàng
- ✅ Hủy đơn hàng (với restore inventory)
- ✅ Phân quyền theo role (Admin/Staff/Customer)

## 📂 Cấu trúc files

```
src/modules/order-management/orders/
├── orderService.js      # Business logic
├── orderController.js   # HTTP request handlers
└── orderRoutes.js       # Route definitions
```

## 🔐 Authentication

Tất cả endpoints đều yêu cầu authentication token trong header:

```
Authorization: Bearer <access_token>
```

## 📋 API Endpoints

### 1. Get All Orders (Admin/Staff)

**Endpoint:** `GET /api/orders`

**Access:** Admin, Staff

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items per page (default: 10)
- `status` (optional): Filter by status
- `customerId` (optional): Filter by customer
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `sortBy` (optional): Sort field (default: 'order_date')
- `sortOrder` (optional): asc/desc (default: 'desc')

**Example Request:**
```bash
GET /api/orders?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "customer_id": 5,
        "status": "pending",
        "total_amount": 500000,
        "discount_amount": 50000,
        "final_amount": 450000,
        "order_date": "2025-01-15T10:30:00Z",
        "customers": {
          "id": 5,
          "full_name": "Nguyen Van A",
          "email": "nguyenvana@email.com",
          "phone": "0901234567"
        },
        "orderitems": [
          {
            "id": 1,
            "product_id": 10,
            "quantity": 2,
            "price": 250000,
            "products": {
              "id": 10,
              "name": "Paracetamol 500mg",
              "image_url": "..."
            }
          }
        ],
        "vouchers": null,
        "shippingaddresses": {
          "address_line": "123 Đường ABC",
          "city": "TP.HCM"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### 2. Get Order Statistics (Admin)

**Endpoint:** `GET /api/orders/statistics`

**Access:** Admin only

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example Request:**
```bash
GET /api/orders/statistics?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 145,
    "ordersByStatus": {
      "pending": 12,
      "confirmed": 8,
      "processing": 15,
      "shipping": 20,
      "delivered": 85,
      "cancelled": 5
    },
    "totalRevenue": 125000000,
    "averageOrderValue": 1470588.24
  }
}
```

---

### 3. Get Order by ID

**Endpoint:** `GET /api/orders/:id`

**Access:** Admin, Staff, or Order owner

**Example Request:**
```bash
GET /api/orders/123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "customer_id": 5,
    "status": "shipping",
    "total_amount": 500000,
    "discount_amount": 50000,
    "final_amount": 450000,
    "order_date": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-16T08:20:00Z",
    "customers": {
      "id": 5,
      "full_name": "Nguyen Van A",
      "email": "nguyenvana@email.com",
      "phone": "0901234567",
      "address": "123 Street, City"
    },
    "orderitems": [...],
    "vouchers": {...},
    "shippingaddresses": {...},
    "payments": [...],
    "shipments": [...],
    "order_status_history": [
      {
        "id": 1,
        "order_id": 123,
        "status": "shipping",
        "changed_at": "2025-01-16T08:20:00Z",
        "changed_by": 2,
        "users": {
          "id": 2,
          "username": "admin",
          "full_name": "Admin User"
        }
      }
    ]
  }
}
```

---

### 4. Get Customer's Orders

**Endpoint:** `GET /api/customers/:customerId/orders`

**Access:** Admin, Staff, or the Customer

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items per page (default: 10)
- `status` (optional): Filter by status

**Example Request:**
```bash
GET /api/customers/5/orders?page=1&limit=5&status=delivered
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "status": "delivered",
        "total_amount": 500000,
        "final_amount": 450000,
        "order_date": "2025-01-15T10:30:00Z",
        "orderitems": [...],
        "vouchers": {...},
        "shipments": [
          {
            "tracking_number": "VN123456789",
            "status": "delivered",
            "estimated_delivery": "2025-01-20T00:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 12,
      "totalPages": 3
    }
  }
}
```

---

### 5. Update Order Status (Admin/Staff)

**Endpoint:** `PUT /api/orders/:id/status`

**Access:** Admin, Staff

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:**
- `pending` - Chờ xác nhận
- `confirmed` - Đã xác nhận
- `processing` - Đang xử lý
- `shipping` - Đang giao hàng
- `delivered` - Đã giao hàng
- `completed` - Hoàn thành
- `cancelled` - Đã hủy
- `returned` - Hoàn trả

**Example Request:**
```bash
PUT /api/orders/123/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "confirmed",
    "updated_at": "2025-01-16T10:00:00Z",
    "customers": {...},
    "orderitems": [...]
  }
}
```

**Notes:**
- Automatically creates a record in `order_status_history`
- Logs the user who made the change

---

### 6. Cancel Order

**Endpoint:** `POST /api/orders/:id/cancel`

**Access:** Admin, Staff, or Order owner

**Request Body (Optional):**
```json
{
  "reason": "Khách hàng yêu cầu hủy đơn"
}
```

**Example Request:**
```bash
POST /api/orders/123/cancel
Content-Type: application/json

{
  "reason": "Đặt nhầm sản phẩm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "cancelled",
    "updated_at": "2025-01-16T11:00:00Z"
  },
  "message": "Đơn hàng đã được hủy thành công"
}
```

**Business Logic:**
- ❌ Cannot cancel if status is `delivered` or `completed`
- ✅ Automatically restores inventory if order was `confirmed` or later
- ✅ Creates status history record
- ✅ Can include cancellation reason

---

## 🔄 Order Status Flow

```
cart → pending → confirmed → processing → shipping → delivered → completed
                     ↓
                 cancelled ← (can cancel from pending/confirmed/processing)
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Trạng thái đơn hàng không hợp lệ"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Chưa xác thực"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Không tìm thấy đơn hàng"
}
```

---

## 🧪 Testing với Postman/cURL

### 1. Login để lấy token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

### 2. Get all orders
```bash
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Update order status
```bash
curl -X PUT http://localhost:3000/api/orders/123/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### 4. Cancel order
```bash
curl -X POST http://localhost:3000/api/orders/123/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer request"}'
```

---

## 📊 Database Tables Used

- `orders` - Main order table
- `orderitems` - Order line items
- `customers` - Customer information
- `products` - Product details
- `productunits` - Product units
- `vouchers` - Discount vouchers
- `shippingaddresses` - Shipping addresses
- `payments` - Payment records
- `shipments` - Shipment tracking
- `order_status_history` - Order status change log
- `branchinventory` - Inventory management

---

## 🎯 Next Steps

Tiếp theo trong roadmap:

1. ✅ **Orders Module** - HOÀN THÀNH
2. ⏭️ **Shipping Addresses Module** - Tiếp theo
3. ⏭️ **Payments Module (COD)** - Sau đó
4. ⏭️ **Shipments Module** - Cuối cùng

---

## 💡 Tips

1. **Pagination**: Luôn sử dụng pagination cho performance tốt
2. **Filtering**: Combine multiple filters để query chính xác
3. **Status History**: Check order_status_history để audit trail
4. **Inventory**: Cancel order sẽ tự động restore stock
5. **Permissions**: Customer chỉ xem được orders của mình

---

## 🐛 Troubleshooting

### Lỗi "Cannot find module"
```bash
npm install
```

### Lỗi database connection
Kiểm tra `.env` file và DATABASE_URL

### Lỗi permission
Kiểm tra role của user trong JWT token

---

**Created:** 2025-01-16
**Version:** 1.0.0
**Status:** ✅ Production Ready
