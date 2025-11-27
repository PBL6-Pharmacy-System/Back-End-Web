# 📦 SHIPPING API - Hướng dẫn sử dụng

## 📋 Tổng quan

Hệ thống tính phí vận chuyển dựa trên:
- **Công thức Haversine**: Tính khoảng cách GPS giữa chi nhánh và địa chỉ giao hàng
- **Shipping Zones**: Phí ship theo từng vùng khoảng cách
- **Miễn phí ship**: Tự động áp dụng khi đơn hàng đạt giá trị tối thiểu

---

## 🚀 API Endpoints

### 1. Lấy danh sách vùng vận chuyển (Public)
```
GET /api/shipping/zones
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nội thành",
      "min_distance": 0,
      "max_distance": 10,
      "base_fee": 15000,
      "fee_per_km": null,
      "min_order_free": 500000,
      "estimated_days": 1
    },
    {
      "id": 2,
      "name": "Ngoại thành",
      "min_distance": 10,
      "max_distance": 30,
      "base_fee": 25000,
      "fee_per_km": 500,
      "min_order_free": 800000,
      "estimated_days": 2
    }
  ]
}
```

---

### 2. Tính phí ship nhanh theo khoảng cách (Public)
```
GET /api/shipping/calculate?distance=15&orderTotal=600000
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| distance | number | ✅ | Khoảng cách (km) |
| orderTotal | number | ❌ | Tổng đơn hàng (VNĐ) - để check miễn phí ship |

**Response:**
```json
{
  "success": true,
  "data": {
    "fee": 27500,
    "originalFee": 27500,
    "estimatedDays": 2,
    "zoneName": "Ngoại thành",
    "distance": "15.00 km",
    "distanceKm": 15,
    "freeShipping": false,
    "minOrderFree": 800000
  }
}
```

---

### 3. Ước tính phí ship từ địa chỉ giao hàng (Auth required)
```
POST /api/shipping/estimate
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddressId": 1,
  "orderTotal": 750000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingAddress": {
      "id": 1,
      "addressLine": "123 Nguyễn Văn Linh",
      "city": "Hồ Chí Minh",
      "coordinates": {
        "latitude": 10.8231,
        "longitude": 106.6297
      }
    },
    "nearestBranch": {
      "id": 1,
      "name": "Chi nhánh Quận 7",
      "address": "456 Nguyễn Thị Thập",
      "city": "Hồ Chí Minh",
      "distance": "5.23 km"
    },
    "shipping": {
      "fee": 15000,
      "originalFee": 15000,
      "estimatedDays": 1,
      "zoneName": "Nội thành",
      "freeShipping": false,
      "minOrderFree": 500000
    },
    "alternativeBranches": [
      { "id": 2, "name": "Chi nhánh Quận 1", "distance": "8.15 km" }
    ]
  }
}
```

---

### 4. Ước tính phí ship từ tọa độ GPS (Public)
```
POST /api/shipping/estimate-by-coordinates
Content-Type: application/json

{
  "latitude": 10.8231,
  "longitude": 106.6297,
  "orderTotal": 500000
}
```

**Response:** Tương tự endpoint #3

---

### 5. Tìm chi nhánh gần nhất có đủ hàng (Public)
```
POST /api/shipping/nearest-branch
Content-Type: application/json

{
  "productId": 123,
  "quantity": 5,
  "latitude": 10.8231,
  "longitude": 106.6297
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 7",
      "address": "456 Nguyễn Thị Thập",
      "city": "Hồ Chí Minh",
      "distance": 5.23,
      "distanceText": "5.23 km",
      "stock": 100
    },
    "alternativeBranches": [
      { "id": 2, "name": "Chi nhánh Quận 1", "distance": 8.15, "stock": 50 }
    ]
  }
}
```

---

## 🔐 Admin Endpoints

### 6. Tạo vùng vận chuyển mới
```
POST /api/shipping/zones
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Nội thành",
  "minDistance": 0,
  "maxDistance": 10,
  "baseFee": 15000,
  "feePerKm": null,
  "minOrderFree": 500000,
  "estimatedDays": 1,
  "isActive": true
}
```

### 7. Cập nhật vùng vận chuyển
```
PUT /api/shipping/zones/:id
Authorization: Bearer <admin_token>
```

### 8. Xóa vùng vận chuyển
```
DELETE /api/shipping/zones/:id
Authorization: Bearer <admin_token>
```

---

## 📊 Bảng phí vận chuyển mặc định

| Vùng | Khoảng cách | Phí cơ bản | Phí/km | Miễn phí từ | Ngày giao |
|------|-------------|------------|--------|-------------|-----------|
| Nội thành | 0-10 km | 15,000đ | - | 500,000đ | 1 ngày |
| Ngoại thành | 10-30 km | 25,000đ | 500đ/km | 800,000đ | 2 ngày |
| Cận tỉnh | 30-100 km | 35,000đ | 300đ/km | 1,000,000đ | 3 ngày |
| Liên tỉnh gần | 100-300 km | 45,000đ | 200đ/km | 1,500,000đ | 4 ngày |
| Liên tỉnh xa | 300-1000 km | 60,000đ | 100đ/km | 2,000,000đ | 5 ngày |
| Vùng sâu xa | >1000 km | 80,000đ | 50đ/km | - | 7 ngày |

---

## 🗄️ Database Setup

### 1. Chạy Prisma Migration
```bash
cd Back-End-Web
npx prisma db push
```

### 2. Seed dữ liệu shipping zones và tọa độ
```bash
# Chạy file SQL seed
psql -U postgres -d your_database -f prisma/migrations/seed_shipping_data.sql
```

Hoặc dùng Prisma:
```bash
npx prisma db seed
```

---

## 🧮 Công thức tính khoảng cách

### Haversine Formula
```javascript
// Tính khoảng cách đường chim bay (km)
const R = 6371; // Bán kính Trái Đất
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);

const a = Math.sin(dLat/2)² + 
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
          Math.sin(dLon/2)²;

const c = 2 * Math.atan2(√a, √(1-a));
const distance = R * c;

// Ước tính đường đi thực tế (x1.3)
const roadDistance = distance * 1.3;
```

---

## 📍 Ví dụ khoảng cách

| Từ | Đến | Đường chim bay | Ước tính đường đi |
|----|-----|----------------|-------------------|
| Hà Nội | Hồ Chí Minh | ~1,138 km | ~1,480 km |
| Hà Nội | Đà Nẵng | ~764 km | ~993 km |
| HCM | Cần Thơ | ~148 km | ~192 km |
| HCM | Vũng Tàu | ~95 km | ~124 km |

---

## ✅ Checklist triển khai

- [x] Schema Prisma đã cập nhật (branches, cities, shippingaddresses, shipping_zones)
- [x] Distance Calculator utility (`src/utils/distanceCalculator.js`)
- [x] Shipping Service (`src/modules/shipping/shippingService.js`)
- [x] Shipping Controller (`src/modules/shipping/shippingController.js`)
- [x] Shipping Routes (`src/modules/shipping/shippingRoutes.js`)
- [x] Đăng ký routes trong `app.js`
- [ ] Chạy `npx prisma db push` để cập nhật database
- [ ] Chạy SQL seed để thêm shipping zones và tọa độ cities
- [ ] Cập nhật tọa độ GPS cho các branches
- [ ] Test API endpoints

---

*Cập nhật: November 2025*
