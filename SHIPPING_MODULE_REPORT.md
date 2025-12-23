# 📦 BÁO CÁO TỔNG HỢP MODULE SHIPPING-MANAGEMENT

> **Ngày tạo:** 28/11/2025  
> **Phiên bản:** 1.0  
> **Tác giả:** Development Team  

---

## 📋 MỤC LỤC

1. [Tổng quan Module](#1-tổng-quan-module)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Các tính năng đã triển khai](#5-các-tính-năng-đã-triển-khai)
6. [Các vấn đề đã phát hiện và sửa](#6-các-vấn-đề-đã-phát-hiện-và-sửa)
7. [Đề xuất cải tiến](#7-đề-xuất-cải-tiến)
8. [Hướng dẫn sử dụng](#8-hướng-dẫn-sử-dụng)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. TỔNG QUAN MODULE

### 1.1 Mô tả
Module **shipping-management** quản lý toàn bộ quy trình vận chuyển đơn hàng, bao gồm:
- Quản lý địa chỉ giao hàng (Shipping Addresses)
- Tính phí vận chuyển (Shipping Fees)
- Quản lý vận đơn (Shipments)

### 1.2 Dependencies
```
├── prisma (Database ORM)
├── uuid (Tracking number generation)
├── axios (GraphHopper API calls)
├── express-rate-limit (API rate limiting)
└── ../auth/auth.middleware.js (Authentication)
```

### 1.3 External APIs
- **GraphHopper API**: Geocoding, Reverse Geocoding, Distance Matrix, Routing
  - Base URL: `https://graphhopper.com/api/1`
  - Cần cấu hình `GRAPHHOPPER_API_KEY` trong `.env`

---

## 2. CẤU TRÚC THƯ MỤC

```
src/modules/shipping-management/
├── shipments/
│   ├── shipmentController.js    # Controller xử lý request
│   ├── shipmentRoutes.js        # Định nghĩa routes
│   └── shipmentService.js       # Business logic
│
├── shipping-addresses/
│   ├── shippingAddressController.js
│   ├── shippingAddressRoutes.js
│   └── shippingAddressService.js
│
└── shipping-fees/
    ├── shippingFeeController.js
    ├── shippingFeeRoutes.js
    └── shippingFeeService.js

src/utils/
├── constants.js              # SHIPMENT_STATUS, ORDER_STATUS
├── distanceCalculator.js     # Haversine, distance utilities
└── graphHopperService.js     # GraphHopper API integration
```

---

## 3. DATABASE SCHEMA

### 3.1 Bảng `shipments`
```sql
model shipments {
  id                  Int       @id @default(autoincrement())
  order_id            Int       -- FK to orders
  branch_id           Int       -- FK to branches (chi nhánh xuất hàng)
  shipping_address_id Int       -- FK to shippingaddresses
  tracking_number     String?   @unique @db.VarChar(100)
  carrier             String?   @db.VarChar(100)
  shipped_date        DateTime? -- Ngày lấy hàng
  estimated_delivery  DateTime? -- Ngày dự kiến giao
  actual_delivery     DateTime? -- Ngày giao thực tế
  status              String?   @default("pending")
  created_at          DateTime?
  updated_at          DateTime?
}
```

### 3.2 Bảng `shippingaddresses`
```sql
model shippingaddresses {
  id              Int       @id @default(autoincrement())
  customer_id     Int       -- FK to customers
  recipient_name  String?   -- Tên người nhận
  recipient_phone String?   -- SĐT người nhận
  address_line    String    -- Địa chỉ chi tiết
  ward            String?   -- Phường/Xã
  district        String?   -- Quận/Huyện
  city            String?   -- Thành phố
  city_id         Int?      -- FK to cities
  state           String?
  postal_code     String?
  country         String?   @default("Vietnam")
  is_default      Boolean?  @default(false)
  latitude        Decimal?  -- Tọa độ GPS
  longitude       Decimal?
  created_at      DateTime?
  updated_at      DateTime?
}
```

### 3.3 Bảng `shipping_zones`
```sql
model shipping_zones {
  id             Int       @id @default(autoincrement())
  name           String    -- Tên vùng (VD: "Nội thành", "Ngoại thành")
  min_distance   Decimal   -- Khoảng cách tối thiểu (km)
  max_distance   Decimal   -- Khoảng cách tối đa (km)
  base_fee       Decimal   -- Phí cơ bản
  fee_per_km     Decimal?  -- Phí mỗi km (phần vượt)
  min_order_free Decimal?  -- Giá trị đơn miễn ship
  estimated_days Int?      @default(1)
  is_active      Boolean?  @default(true)
}
```

### 3.4 Shipment Status Flow
```
┌─────────┐    ┌───────────┐    ┌────────────┐    ┌──────────────────┐    ┌───────────┐
│ PENDING │───▶│ PICKED_UP │───▶│ IN_TRANSIT │───▶│ OUT_FOR_DELIVERY │───▶│ DELIVERED │
└─────────┘    └───────────┘    └────────────┘    └──────────────────┘    └───────────┘
     │              │                 │                    │                    │
     │              │                 │                    │                    │
     ▼              ▼                 ▼                    ▼                    ▼
┌─────────┐    ┌─────────┐       ┌─────────┐          ┌─────────┐         ┌──────────┐
│ FAILED  │◀───│ FAILED  │◀──────│ FAILED  │◀─────────│ FAILED  │         │ RETURNED │
└─────────┘    └─────────┘       └─────────┘          └─────────┘         └──────────┘
     │                                                                          ▲
     │                                                                          │
     └──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API ENDPOINTS

### 4.1 Shipments API

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/api/shipments` | ✅ | Admin/Staff | Tạo vận đơn mới |
| GET | `/api/shipments` | ✅ | Admin/Staff | Danh sách vận đơn (có pagination, filter) |
| GET | `/api/shipments/:id` | ✅ | All | Chi tiết vận đơn (có ownership check) |
| GET | `/api/shipments/track/:trackingNumber` | ❌ | Public | Tra cứu mã vận đơn |
| GET | `/api/shipments/statistics` | ✅ | Admin | Thống kê vận chuyển |
| PUT | `/api/shipments/:id/status` | ✅ | Admin/Staff | Cập nhật trạng thái |
| GET | `/api/orders/:orderId/shipments` | ✅ | All | Vận đơn của đơn hàng |

### 4.2 Shipping Addresses API

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/api/customers/:customerId/shipping-addresses` | ✅ | All | Danh sách địa chỉ |
| GET | `/api/customers/:customerId/shipping-addresses/default` | ✅ | All | Địa chỉ mặc định |
| GET | `/api/shipping-addresses/:id` | ✅ | All | Chi tiết địa chỉ |
| POST | `/api/customers/:customerId/shipping-addresses` | ✅ | All | Thêm địa chỉ mới |
| PUT | `/api/shipping-addresses/:id` | ✅ | All | Cập nhật địa chỉ |
| DELETE | `/api/shipping-addresses/:id` | ✅ | All | Xóa địa chỉ |
| PUT | `/api/shipping-addresses/:id/set-default` | ✅ | All | Đặt làm mặc định |

### 4.3 Shipping Fees API

| Method | Endpoint | Auth | Rate Limit | Mô tả |
|--------|----------|------|------------|-------|
| GET | `/api/shipping/zones` | ❌ | - | Danh sách vùng vận chuyển |
| GET | `/api/shipping/calculate` | ❌ | 30/phút | Tính phí theo khoảng cách |
| POST | `/api/shipping/estimate` | ✅ | - | Ước tính phí từ địa chỉ |
| POST | `/api/shipping/estimate-by-coordinates` | ❌ | - | Ước tính phí từ tọa độ |
| POST | `/api/shipping/nearest-branch` | ❌ | - | Tìm chi nhánh gần nhất |
| POST | `/api/shipping/geocode` | ❌ | 10/phút | Chuyển địa chỉ → tọa độ |
| POST | `/api/shipping/reverse-geocode` | ❌ | 10/phút | Chuyển tọa độ → địa chỉ |
| POST | `/api/shipping/distance` | ❌ | 30/phút | Tính khoảng cách 2 điểm |
| POST | `/api/shipping/zones` | ✅ | Admin | Tạo vùng vận chuyển |
| PUT | `/api/shipping/zones/:id` | ✅ | Admin | Sửa vùng vận chuyển |
| DELETE | `/api/shipping/zones/:id` | ✅ | Admin | Xóa vùng vận chuyển |

---

## 5. CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI

### 5.1 Shipments Module

#### ✅ Tạo vận đơn (`createShipment`)
- Validate order status (chỉ cho phép `CONFIRMED`, `PROCESSING`)
- Kiểm tra branch, shipping address tồn tại
- Kiểm tra không trùng shipment cho cùng 1 order
- Tự động generate tracking number unique (UUID-based)
- Cập nhật order status thành `SHIPPING`
- Ghi lại order_status_history

#### ✅ Tracking number generation (FIX ISSUE #8)
```javascript
// Format: VN + timestamp_base36 + UUID_segment
// Ví dụ: VN1A2B3C4D5E6F7G8H
// Có retry mechanism (3 lần) nếu bị collision
```

#### ✅ Status transition validation
```javascript
const VALID_STATUS_TRANSITIONS = {
    PENDING: [PICKED_UP, FAILED],
    PICKED_UP: [IN_TRANSIT, FAILED],
    IN_TRANSIT: [OUT_FOR_DELIVERY, FAILED],
    OUT_FOR_DELIVERY: [DELIVERED, FAILED],
    DELIVERED: [RETURNED],
    FAILED: [PENDING, RETURNED],
    RETURNED: [] // Terminal state
};
```

#### ✅ Idempotency cho RETURNED status (FIX ISSUE #7)
- Kiểm tra xem đã có inventory log `shipment_return` chưa
- Nếu đã hoàn kho rồi → skip, không hoàn lần 2
- Hoàn cả branchinventory và productBatch

#### ✅ Public tracking API
- Sanitize thông tin nhạy cảm (không trả về địa chỉ chi tiết, số điện thoại)
- Chỉ trả về: tracking_number, status, carrier, dates, city-level info

### 5.2 Shipping Addresses Module

#### ✅ CRUD đầy đủ với ownership validation
- Customer chỉ xem/sửa/xóa địa chỉ của mình
- Admin/Staff có thể quản lý tất cả

#### ✅ Auto-geocoding
- Tự động geocode địa chỉ thành tọa độ GPS khi tạo/sửa
- Sử dụng GraphHopper Geocoding API

#### ✅ Default address management
- Tự động set default cho địa chỉ đầu tiên
- Khi xóa default → set địa chỉ mới nhất làm default

#### ✅ Xóa địa chỉ an toàn (FIX ISSUE #11)
- Kiểm tra orders đang sử dụng địa chỉ
- Kiểm tra shipments đang sử dụng địa chỉ
- Không cho xóa nếu đang có order/shipment active

### 5.3 Shipping Fees Module

#### ✅ Tính phí theo vùng (Zone-based pricing)
```javascript
// Ví dụ cấu hình zones:
// Nội thành (0-5km): base_fee=15000, fee_per_km=0
// Ngoại thành (5-15km): base_fee=20000, fee_per_km=500
// Tỉnh lẻ (15-50km): base_fee=30000, fee_per_km=300
```

#### ✅ Tính phí từ địa chỉ/tọa độ
- Tìm chi nhánh gần nhất có tọa độ
- Sử dụng GraphHopper để tính khoảng cách thực tế (đường đi)
- Fallback về Haversine * 1.3 nếu không có API key

#### ✅ Miễn phí ship theo giá trị đơn hàng
```javascript
// Nếu orderTotal >= zone.min_order_free → fee = 0
```

#### ✅ Rate limiting cho public endpoints
- Geocoding: 10 requests/phút
- Calculate/Distance: 30 requests/phút

---

## 6. CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN VÀ SỬA

### 🔴 ISSUE #7: Duplicate inventory restore on RETURNED
**Vấn đề:** Khi update shipment status thành `RETURNED` nhiều lần, inventory bị hoàn nhiều lần.

**Giải pháp đã áp dụng:**
```javascript
// Idempotency check trước khi hoàn kho
const existingReturnLog = await tx.inventoryLog.findFirst({
    where: {
        reference_type: 'shipment_return',
        reference_id: Number(shipmentId)
    }
});

if (existingReturnLog) {
    console.log(`Shipment #${shipmentId} already returned, skipping...`);
    return; // Skip inventory restore
}
```

**File:** `shipmentService.js` - function `updateShipmentStatus`

---

### 🔴 ISSUE #8: Tracking number collision
**Vấn đề:** Tracking number generate bằng timestamp có thể trùng khi tạo đồng thời.

**Giải pháp đã áp dụng:**
```javascript
// Sử dụng UUID + retry mechanism
const generateTrackingNumber = async (maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const prefix = 'VN';
        const timestamp = Date.now().toString(36).toUpperCase();
        const uuid = uuidv4().split('-')[0].toUpperCase();
        const trackingNumber = `${prefix}${timestamp}${uuid}`;
        
        // Check uniqueness
        const existing = await prisma.shipments.findUnique({...});
        if (!existing) return trackingNumber;
    }
    // Fallback với full UUID
    return `VN${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
};
```

**File:** `shipmentService.js` - function `generateTrackingNumber`

---

### 🔴 ISSUE #11: Xóa địa chỉ đang được sử dụng
**Vấn đề:** Có thể xóa địa chỉ đang được dùng trong shipments active.

**Giải pháp đã áp dụng:**
```javascript
// Kiểm tra cả orders VÀ shipments
const shipmentsUsingAddress = await prisma.shipments.count({
    where: {
        shipping_address_id: Number(addressId),
        status: { notIn: ['delivered', 'failed', 'returned'] }
    }
});

if (shipmentsUsingAddress > 0) {
    return { success: false, error: 'Không thể xóa địa chỉ...' };
}
```

**File:** `shippingAddressService.js` - function `deleteAddress`

---

### 🟡 ISSUE: Ownership validation thiếu ở middleware
**Vấn đề:** Một số routes thiếu kiểm tra ownership ở middleware level.

**Giải pháp đã áp dụng:**
- Thêm middleware `validateShipmentOwnership` trong `shipmentRoutes.js`
- Thêm middleware `validateAddressOwnership` trong `shippingAddressRoutes.js`

---

### 🟡 ISSUE: trackShipment trả về thông tin nhạy cảm
**Vấn đề:** Public API trả về địa chỉ chi tiết, số điện thoại người nhận.

**Giải pháp đã áp dụng:**
```javascript
// Chỉ trả về city-level information
shippingaddresses: {
    select: {
        city: true,
        district: true,
        // KHÔNG: address_line, recipient_phone, recipient_name
    }
}
```

**File:** `shipmentService.js` - function `trackShipment`

---

### 🟡 ISSUE: Input validation thiếu
**Vấn đề:** Một số controller không validate input đầy đủ.

**Giải pháp đã áp dụng:**
- Thêm validation cho `distance`, `orderTotal` trong `calculateFee`
- Thêm validation cho `address` length trong `geocodeAddress`
- Thêm validation cho coordinates trong `reverseGeocode`

**File:** `shippingFeeController.js`

---

## 7. ĐỀ XUẤT CẢI TIẾN

### 7.1 Ưu tiên cao (Nên làm sớm)

#### 🔶 Thêm Shipment Events/Timeline
```javascript
// Tạo bảng shipment_events để lưu lịch sử chi tiết
model shipment_events {
    id           Int      @id
    shipment_id  Int
    status       String
    location     String?
    note         String?
    created_by   Int?
    created_at   DateTime
}
```

#### 🔶 Webhook/Notification khi status thay đổi
```javascript
// Gửi notification cho customer khi:
// - PICKED_UP: "Đơn hàng đã được lấy"
// - IN_TRANSIT: "Đơn hàng đang trên đường giao"
// - OUT_FOR_DELIVERY: "Shipper đang giao hàng đến bạn"
// - DELIVERED: "Giao hàng thành công"
```

#### 🔶 Estimated delivery calculation
```javascript
// Tính ngày giao dự kiến dựa trên:
// - Khoảng cách
// - Shipping zone estimated_days
// - Ngày nghỉ lễ
// - Cutoff time (VD: đặt sau 17h → +1 ngày)
```

### 7.2 Ưu tiên trung bình

#### 🔷 Multiple carriers support
```javascript
// Tích hợp các đơn vị vận chuyển:
// - GHN (Giao Hàng Nhanh)
// - GHTK (Giao Hàng Tiết Kiệm)
// - VNPost
// - J&T Express

// Mỗi carrier có API riêng để:
// - Tạo vận đơn
// - Lấy tracking info
// - Webhook nhận status update
```

#### 🔷 Bulk shipment creation
```javascript
// Cho phép tạo nhiều shipment cùng lúc
POST /api/shipments/bulk
{
    "shipments": [
        { orderId: 1, branchId: 1, ... },
        { orderId: 2, branchId: 1, ... }
    ]
}
```

#### 🔷 Delivery slot booking
```javascript
// Cho phép chọn khung giờ giao hàng
// Sáng: 8h-12h
// Chiều: 14h-18h
// Tối: 18h-21h
```

### 7.3 Ưu tiên thấp (Nice to have)

#### 🔹 COD collection tracking
```javascript
// Theo dõi tiền thu hộ (COD)
// - Số tiền cần thu
// - Đã thu chưa
// - Đã đối soát chưa
```

#### 🔹 Return shipment management
```javascript
// Quản lý đổi trả
// - Tạo return request
// - Gửi shipper đến lấy hàng trả
// - Tracking hàng trả về kho
```

#### 🔹 Delivery area restrictions
```javascript
// Giới hạn vùng giao hàng
// - Vùng không giao (biển đảo, vùng sâu)
// - Phụ phí vùng xa
```

---

## 8. HƯỚNG DẪN SỬ DỤNG

### 8.1 Tạo vận đơn mới

```bash
POST /api/shipments
Authorization: Bearer <admin_or_staff_token>
Content-Type: application/json

{
    "orderId": 123,
    "branchId": 1,
    "shippingAddressId": 456,
    "carrier": "GHN",
    "estimatedDelivery": "2025-12-01T00:00:00Z"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "tracking_number": "VN1A2B3C4D5E6F7G8H",
        "status": "pending",
        ...
    },
    "message": "Tạo vận chuyển thành công"
}
```

### 8.2 Tra cứu vận đơn (Public)

```bash
GET /api/shipments/track/VN1A2B3C4D5E6F7G8H
```

**Response:**
```json
{
    "success": true,
    "data": {
        "tracking_number": "VN1A2B3C4D5E6F7G8H",
        "status": "in_transit",
        "carrier": "GHN",
        "shipped_date": "2025-11-28T10:00:00Z",
        "estimated_delivery": "2025-12-01T00:00:00Z",
        "from_branch": {
            "name": "Chi nhánh Quận 1",
            "city": "Hồ Chí Minh"
        },
        "destination": {
            "city": "Hồ Chí Minh",
            "district": "Quận 7"
        }
    }
}
```

### 8.3 Cập nhật trạng thái

```bash
PUT /api/shipments/1/status
Authorization: Bearer <admin_or_staff_token>
Content-Type: application/json

{
    "status": "picked_up"
}
```

**Các status hợp lệ:**
- `pending` → `picked_up` | `failed`
- `picked_up` → `in_transit` | `failed`
- `in_transit` → `out_for_delivery` | `failed`
- `out_for_delivery` → `delivered` | `failed`
- `delivered` → `returned`
- `failed` → `pending` | `returned`

### 8.4 Ước tính phí ship

```bash
# Từ địa chỉ đã lưu
POST /api/shipping/estimate
Authorization: Bearer <token>
{
    "shippingAddressId": 456,
    "orderTotal": 500000
}

# Từ tọa độ GPS
POST /api/shipping/estimate-by-coordinates
{
    "latitude": 10.7731,
    "longitude": 106.7030,
    "orderTotal": 500000
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "nearestBranch": {
            "id": 1,
            "name": "Chi nhánh Quận 1",
            "distance": "5.2 km",
            "estimatedTime": "15 phút"
        },
        "shipping": {
            "fee": 20000,
            "originalFee": 20000,
            "zoneName": "Ngoại thành",
            "estimatedDays": 2,
            "freeShipping": false,
            "freeShippingThreshold": 300000,
            "message": "Miễn phí ship khi đơn hàng từ 300.000đ"
        }
    }
}
```

---

## 9. TESTING CHECKLIST

### 9.1 Shipments

- [ ] Tạo shipment thành công với đầy đủ thông tin
- [ ] Tạo shipment thất bại khi order không tồn tại
- [ ] Tạo shipment thất bại khi order status không hợp lệ
- [ ] Tạo shipment thất bại khi đã có shipment active
- [ ] Tracking number là unique
- [ ] Update status theo đúng flow
- [ ] Update status thất bại khi transition không hợp lệ
- [ ] Khi DELIVERED → order status = DELIVERED
- [ ] Khi RETURNED → hoàn kho đúng số lượng (1 lần duy nhất)
- [ ] Customer chỉ xem được shipment của mình
- [ ] Admin/Staff xem được tất cả

### 9.2 Shipping Addresses

- [ ] Tạo địa chỉ với auto-geocoding
- [ ] Địa chỉ đầu tiên tự động là default
- [ ] Set default address hoạt động đúng
- [ ] Xóa địa chỉ thành công (không có order/shipment active)
- [ ] Xóa địa chỉ thất bại (có order/shipment active)
- [ ] Khi xóa default → địa chỉ mới nhất thành default
- [ ] Customer chỉ quản lý địa chỉ của mình
- [ ] Validate số điện thoại VN

### 9.3 Shipping Fees

- [ ] Tính phí đúng theo zone
- [ ] Free shipping khi đạt min_order_free
- [ ] Tính phí_per_km cho phần vượt min_distance
- [ ] GraphHopper API fallback về Haversine khi lỗi
- [ ] Rate limiting hoạt động đúng
- [ ] Input validation cho coordinates, distance

### 9.4 Security

- [ ] Public API không leak thông tin nhạy cảm
- [ ] Ownership validation hoạt động ở tất cả endpoints
- [ ] Rate limiting chống abuse

---

## 📎 PHỤ LỤC

### A. Environment Variables
```env
# GraphHopper API (bắt buộc cho geocoding/routing chính xác)
GRAPHHOPPER_API_KEY=your_api_key_here

# Database
DATABASE_URL=postgresql://...
```

### B. Constants Reference
```javascript
// src/utils/constants.js

export const SHIPMENT_STATUS = {
    PENDING: 'pending',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    RETURNED: 'returned'
};

export const ORDER_STATUS = {
    CART: 'cart',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RETURNED: 'returned'
};
```

### C. Related Files
- `src/modules/order-management/` - Quản lý đơn hàng
- `src/modules/inventory-management/` - Quản lý tồn kho
- `src/utils/distanceCalculator.js` - Tính khoảng cách
- `src/utils/graphHopperService.js` - GraphHopper API

---

> **📝 Ghi chú:** Báo cáo này được tạo tự động và sẽ được cập nhật khi có thay đổi lớn trong module.

