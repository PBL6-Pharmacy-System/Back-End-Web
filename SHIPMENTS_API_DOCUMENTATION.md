# Shipments API Documentation

## ✅ Module hoàn thành

Shipments Module đã được implement thành công với các tính năng:

- ✅ Tạo vận chuyển cho đơn hàng
- ✅ Auto generate tracking number
- ✅ Track shipment theo mã vận đơn (Public API)
- ✅ Cập nhật trạng thái vận chuyển
- ✅ Auto sync với order status
- ✅ Thống kê vận chuyển (Admin)
- ✅ Phân quyền theo role (Admin/Staff/Customer)

## 📂 Cấu trúc files

```
src/modules/order-management/shipments/
├── shipmentService.js      # Business logic (570+ lines)
├── shipmentController.js   # HTTP request handlers
└── shipmentRoutes.js       # Route definitions
```

## 🔐 Authentication

Hầu hết endpoints yêu cầu authentication token trong header:

```
Authorization: Bearer <access_token>
```

**Exception:** `/shipments/track/:trackingNumber` là public API (không cần auth)

## 📋 API Endpoints

### 1. Create Shipment

**Endpoint:** `POST /api/shipments`

**Access:** Admin, Staff only

**Request Body:**
```json
{
  "orderId": 123,
  "branchId": 5,
  "shippingAddressId": 10,
  "carrier": "Standard Delivery",
  "estimatedDelivery": "2025-01-20T00:00:00Z"
}
```

**Required Fields:**
- `orderId` (number) - ID của đơn hàng
- `branchId` (number) - Chi nhánh giao hàng
- `shippingAddressId` (number) - Địa chỉ giao hàng

**Optional Fields:**
- `carrier` (string) - Default: "Standard Delivery"
- `estimatedDelivery` (date) - Default: +3 days from now

**Example Request:**
```bash
POST /api/shipments
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "orderId": 123,
  "branchId": 5,
  "shippingAddressId": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 123,
    "branch_id": 5,
    "shipping_address_id": 10,
    "tracking_number": "VN1234567890ABCD",
    "carrier": "Standard Delivery",
    "status": "pending",
    "shipped_date": null,
    "estimated_delivery": "2025-01-20T00:00:00Z",
    "actual_delivery": null,
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T10:00:00Z",
    "orders": {
      "id": 123,
      "status": "shipping",
      "customers": {
        "full_name": "Nguyen Van A",
        "phone": "0901234567"
      }
    },
    "branches": {
      "name": "Chi nhánh Quận 1",
      "address": "123 Main St"
    },
    "shippingaddresses": {
      "address_line": "456 Customer St",
      "city": "TP.HCM"
    }
  },
  "message": "Tạo vận chuyển thành công"
}
```

**Business Logic:**
- ✅ **Auto generate tracking number** - Format: VN + timestamp + random (VN1234567890ABCD)
- ✅ **Validate order status** - Chỉ tạo cho orders có status `confirmed` hoặc `processing`
- ✅ **Prevent duplicates** - Không cho tạo shipment thứ 2 cho cùng order
- ✅ **Auto update order** - Order status → `shipping`
- ✅ **Create status history** - Log order status change
- ✅ **Default estimated delivery** - +3 days nếu không chỉ định

---

### 2. Get Shipment Statistics

**Endpoint:** `GET /api/shipments/statistics`

**Access:** Admin only

**Query Parameters:**
- `startDate` (optional) - YYYY-MM-DD
- `endDate` (optional) - YYYY-MM-DD
- `branchId` (optional) - Filter by branch

**Example Request:**
```bash
GET /api/shipments/statistics?startDate=2025-01-01&endDate=2025-01-31&branchId=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalShipments": 150,
    "shipmentsByStatus": {
      "pending": 10,
      "picked_up": 15,
      "in_transit": 25,
      "out_for_delivery": 20,
      "delivered": 75,
      "failed": 3,
      "returned": 2
    },
    "successRate": "95.00%",
    "shipmentsByBranch": [
      {
        "branchId": 1,
        "count": 50
      },
      {
        "branchId": 2,
        "count": 100
      }
    ]
  }
}
```

---

### 3. Track Shipment (Public API)

**Endpoint:** `GET /api/shipments/track/:trackingNumber`

**Access:** Public (NO AUTH REQUIRED)

**Example Request:**
```bash
GET /api/shipments/track/VN1234567890ABCD
# No Authorization header needed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 123,
    "tracking_number": "VN1234567890ABCD",
    "carrier": "Standard Delivery",
    "status": "in_transit",
    "shipped_date": "2025-01-17T14:00:00Z",
    "estimated_delivery": "2025-01-20T00:00:00Z",
    "actual_delivery": null,
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T15:00:00Z",
    "orders": {
      "id": 123,
      "status": "shipping",
      "order_date": "2025-01-15T10:00:00Z"
    },
    "branches": {
      "name": "Chi nhánh Quận 1",
      "address": "123 Main St",
      "phone": "0281234567"
    },
    "shippingaddresses": {
      "address_line": "456 Customer St",
      "city": "TP.HCM",
      "state": "Quận 7",
      "postal_code": "70000"
    }
  }
}
```

**Use Cases:**
- 🔥 Customer tracking (không cần login)
- 🔥 Public tracking page
- 🔥 SMS/Email tracking links

---

### 4. Get All Shipments

**Endpoint:** `GET /api/shipments`

**Access:** Admin, Staff only

**Query Parameters:**
- `page` (optional) - Default: 1
- `limit` (optional) - Default: 10
- `status` (optional) - Filter by status
- `branchId` (optional) - Filter by branch
- `startDate` (optional) - YYYY-MM-DD
- `endDate` (optional) - YYYY-MM-DD
- `sortBy` (optional) - Default: created_at
- `sortOrder` (optional) - asc/desc (default: desc)

**Example Request:**
```bash
GET /api/shipments?page=1&limit=20&status=in_transit&branchId=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipments": [
      {
        "id": 1,
        "tracking_number": "VN1234567890ABCD",
        "status": "in_transit",
        "estimated_delivery": "2025-01-20T00:00:00Z",
        "orders": {
          "id": 123,
          "status": "shipping",
          "total_amount": 500000,
          "customers": {
            "full_name": "Nguyen Van A",
            "phone": "0901234567"
          }
        },
        "branches": {
          "name": "Chi nhánh Quận 1"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 5. Get Shipment by ID

**Endpoint:** `GET /api/shipments/:id`

**Access:** Admin, Staff, or Customer who owns the order

**Example Request:**
```bash
GET /api/shipments/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 123,
    "branch_id": 5,
    "shipping_address_id": 10,
    "tracking_number": "VN1234567890ABCD",
    "carrier": "Standard Delivery",
    "status": "delivered",
    "shipped_date": "2025-01-17T14:00:00Z",
    "estimated_delivery": "2025-01-20T00:00:00Z",
    "actual_delivery": "2025-01-19T16:30:00Z",
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-19T16:30:00Z",
    "orders": {
      "id": 123,
      "status": "delivered",
      "customers": {
        "full_name": "Nguyen Van A",
        "email": "nguyenvana@email.com",
        "phone": "0901234567"
      },
      "orderitems": [
        {
          "product_id": 10,
          "quantity": 2,
          "products": {
            "name": "Paracetamol 500mg",
            "image_url": "..."
          }
        }
      ]
    },
    "branches": {...},
    "shippingaddresses": {...}
  }
}
```

---

### 6. Get Order Shipments

**Endpoint:** `GET /api/orders/:orderId/shipments`

**Access:** Admin, Staff, or Customer who owns the order

**Example Request:**
```bash
GET /api/orders/123/shipments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 123,
      "tracking_number": "VN1234567890ABCD",
      "carrier": "Standard Delivery",
      "status": "delivered",
      "shipped_date": "2025-01-17T14:00:00Z",
      "estimated_delivery": "2025-01-20T00:00:00Z",
      "actual_delivery": "2025-01-19T16:30:00Z",
      "branches": {
        "name": "Chi nhánh Quận 1",
        "address": "123 Main St"
      },
      "shippingaddresses": {
        "address_line": "456 Customer St",
        "city": "TP.HCM"
      }
    }
  ]
}
```

---

### 7. Update Shipment Status

**Endpoint:** `PUT /api/shipments/:id/status`

**Access:** Admin, Staff only

**Request Body:**
```json
{
  "status": "in_transit"
}
```

**Valid Statuses:**
- `pending` - Chờ lấy hàng
- `picked_up` - Đã lấy hàng
- `in_transit` - Đang vận chuyển
- `out_for_delivery` - Đang giao hàng
- `delivered` - Đã giao hàng
- `failed` - Giao thất bại
- `returned` - Hoàn về

**Example Request:**
```bash
PUT /api/shipments/1/status
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "status": "delivered"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "delivered",
    "actual_delivery": "2025-01-19T16:30:00Z",
    "updated_at": "2025-01-19T16:30:00Z",
    "orders": {
      "id": 123,
      "status": "delivered"
    }
  },
  "message": "Cập nhật trạng thái vận chuyển thành công"
}
```

**Business Logic:**
- ✅ **Auto set `shipped_date`** - Khi status = `picked_up`
- ✅ **Auto set `actual_delivery`** - Khi status = `delivered`
- ✅ **Auto update order status** - Delivered → order.status = `delivered`
- ✅ **Auto update order status** - Failed → order.status = `processing`
- ✅ **Create status history** - Log order status change
- ✅ **Cannot update delivered** - Không thể update nếu đã delivered

---

## 🔄 Shipment Status Flow

```
pending → picked_up → in_transit → out_for_delivery → delivered
    ↓                                    ↓
  failed                              failed
    ↓                                    ↓
returned                            returned
```

### Status Transitions:

| From | To | Auto Actions |
|------|-----|--------------|
| `pending` | `picked_up` | Set `shipped_date` |
| `picked_up` | `in_transit` | None |
| `in_transit` | `out_for_delivery` | None |
| `out_for_delivery` | `delivered` | Set `actual_delivery`, Order → `delivered` |
| Any | `failed` | Order → `processing` |
| `failed` | `returned` | None |

---

## 🔗 Integration with Order Lifecycle

### Complete Order Flow:

```
1. Customer creates order
   POST /api/cart/:customerId/checkout
   → Order status: pending

2. Admin/Staff confirms order & creates payment
   PUT /api/orders/:id/status {status: "confirmed"}
   POST /api/payments {orderId, paymentMethod: "COD"}
   → Order status: confirmed

3. Admin/Staff creates shipment
   POST /api/shipments {orderId, branchId, shippingAddressId}
   → Order status: shipping
   → Tracking number generated

4. Shipper picks up package
   PUT /api/shipments/:id/status {status: "picked_up"}
   → shipped_date set

5. In transit → Out for delivery
   PUT /api/shipments/:id/status {status: "in_transit"}
   PUT /api/shipments/:id/status {status: "out_for_delivery"}

6. Delivered
   PUT /api/shipments/:id/status {status: "delivered"}
   → Order status: delivered
   → actual_delivery set

7. Process COD payment (if applicable)
   POST /api/payments/:id/process-cod
   → Payment status: completed
   → Order status: completed
```

---

## ⚠️ Error Responses

### 400 Bad Request - Missing Fields
```json
{
  "success": false,
  "error": "Order ID, Branch ID và Shipping Address ID là bắt buộc"
}
```

### 400 Bad Request - Invalid Order Status
```json
{
  "success": false,
  "error": "Chỉ có thể tạo vận chuyển cho đơn hàng đã xác nhận hoặc đang xử lý"
}
```

### 400 Bad Request - Duplicate Shipment
```json
{
  "success": false,
  "error": "Đơn hàng đã có vận chuyển"
}
```

### 400 Bad Request - Cannot Update Delivered
```json
{
  "success": false,
  "error": "Không thể cập nhật vận chuyển đã giao"
}
```

### 404 Not Found - Order
```json
{
  "success": false,
  "error": "Không tìm thấy đơn hàng"
}
```

### 404 Not Found - Shipment
```json
{
  "success": false,
  "error": "Không tìm thấy vận chuyển"
}
```

### 404 Not Found - Tracking Number
```json
{
  "success": false,
  "error": "Không tìm thấy mã vận đơn"
}
```

---

## 🧪 Testing với Postman/cURL

### 1. Create shipment
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "branchId": 5,
    "shippingAddressId": 10
  }'
```

### 2. Track shipment (Public - no auth)
```bash
curl -X GET http://localhost:3000/api/shipments/track/VN1234567890ABCD
```

### 3. Update shipment status
```bash
curl -X PUT http://localhost:3000/api/shipments/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}'
```

### 4. Get shipment statistics
```bash
curl -X GET "http://localhost:3000/api/shipments/statistics?startDate=2025-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Table

```sql
-- shipments table structure
CREATE TABLE shipments (
  id                  SERIAL PRIMARY KEY,
  order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  branch_id           INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  shipping_address_id INTEGER NOT NULL REFERENCES shippingaddresses(id),
  tracking_number     VARCHAR(100) UNIQUE,
  carrier             VARCHAR(100),
  shipped_date        TIMESTAMP,
  estimated_delivery  TIMESTAMP,
  actual_delivery     TIMESTAMP,
  status              VARCHAR(50) DEFAULT 'pending',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);
```

---

## 💡 Best Practices

### 1. Tracking Number
- ✅ Auto-generated unique format: `VN + timestamp + random`
- ✅ Always unique (database constraint)
- ✅ Easy to remember and communicate

### 2. Status Management
- ✅ Validate status transitions
- ✅ Auto-sync with order status
- ✅ Set timestamps automatically (shipped_date, actual_delivery)

### 3. Public Tracking
- ✅ No authentication required
- ✅ Customer-friendly
- ✅ Can be shared via SMS/Email

### 4. Order Integration
- ✅ One shipment per order (business rule)
- ✅ Auto update order when shipped/delivered
- ✅ Create audit trail via order_status_history

---

## 🎯 Use Cases

### Customer Perspective:
1. Receive tracking number via email/SMS
2. Track shipment without login
3. See estimated delivery date
4. Get real-time status updates

### Admin/Staff Perspective:
1. Create shipment after order confirmation
2. Update status as package moves
3. View all shipments by branch
4. Monitor delivery success rate
5. Handle failed deliveries

---

## 📋 API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/shipments` | Admin, Staff | Create shipment |
| GET | `/shipments/statistics` | Admin | Get statistics |
| GET | `/shipments/track/:trackingNumber` | **Public** | Track shipment |
| GET | `/shipments` | Admin, Staff | List all shipments |
| GET | `/shipments/:id` | Admin, Staff, Owner | Get details |
| GET | `/orders/:orderId/shipments` | Admin, Staff, Owner | Order shipments |
| PUT | `/shipments/:id/status` | Admin, Staff | Update status |

---

**Created:** 2025-01-16
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

## ⏭️ Next Module

**Medical Features** - Prescription Management & Insurance Claims
