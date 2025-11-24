# 📊 ADMIN DASHBOARD API DOCUMENTATION

## 🎯 Tổng Quan

API Dashboard cung cấp các endpoint để admin xem thống kê và báo cáo về hoạt động của sàn thương mại điện tử dược phẩm.

### ✨ Tính Năng Chính

- ✅ **Custom Date Range** - Tùy chọn khoảng thời gian bất kỳ
- ✅ **Comparison Mode** - So sánh với kỳ trước đó
- ✅ **Filter by Branch** - Lọc theo chi nhánh
- ✅ **Real-time Data** - Dữ liệu thời gian thực
- ✅ **Performance Metrics** - Đánh giá hiệu suất

---

## 🔐 Authentication

**Tất cả các endpoint đều yêu cầu:**

```http
Authorization: Bearer <admin_access_token>
```

**Chỉ admin (role_id = 1) mới có quyền truy cập.**

---

## 📍 ENDPOINTS

### 1️⃣ **OVERVIEW DASHBOARD**

**GET** `/api/admin/dashboard/overview`

Lấy thống kê tổng quan toàn hệ thống.

#### Query Parameters:

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| branchId  | number | ❌       | Filter theo chi nhánh |

#### Response:

```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": 15000000,
      "thisMonth": 450000000,
      "lastMonth": 380000000,
      "growth": "+18.4%"
    },
    "orders": {
      "total": 1250,
      "pending": 45,
      "processing": 120,
      "completed": 1050,
      "cancelled": 35,
      "todayOrders": 28
    },
    "customers": {
      "total": 3420,
      "newThisMonth": 156,
      "activeToday": 89
    },
    "products": {
      "total": 850,
      "outOfStock": 12,
      "lowStock": 28,
      "expiringSoon": 15
    }
  }
}
```

#### Example Requests:

```bash
# Tổng quan toàn hệ thống
GET /api/admin/dashboard/overview

# Tổng quan chi nhánh cụ thể
GET /api/admin/dashboard/overview?branchId=1
```

---

### 2️⃣ **REVENUE ANALYTICS**

**GET** `/api/admin/dashboard/revenue`

Thống kê doanh thu chi tiết theo thời gian.

#### Query Parameters:

| Parameter  | Type    | Required | Description                | Default |
| ---------- | ------- | -------- | -------------------------- | ------- |
| period     | string  | ❌       | Khoảng thời gian định sẵn  | 30days  |
| startDate  | date    | ❌       | Ngày bắt đầu (YYYY-MM-DD)  | -       |
| endDate    | date    | ❌       | Ngày kết thúc (YYYY-MM-DD) | -       |
| branchId   | number  | ❌       | Filter theo chi nhánh      | -       |
| comparison | boolean | ❌       | Bật so sánh với kỳ trước   | true    |

**Period Options:**

- `today` - Hôm nay
- `yesterday` - Hôm qua
- `7days` / `week` - 7 ngày gần nhất
- `30days` / `month` - 30 ngày gần nhất
- `90days` / `quarter` - 90 ngày gần nhất
- `365days` / `year` - 365 ngày gần nhất
- `thisMonth` - Tháng này
- `lastMonth` - Tháng trước
- `thisYear` - Năm nay
- `lastYear` - Năm trước

#### Response:

```json
{
  "success": true,
  "data": {
    "period": "30days",
    "dateRange": {
      "startDate": "2025-10-25T00:00:00.000Z",
      "endDate": "2025-11-23T23:59:59.999Z",
      "days": 30
    },
    "current": {
      "totalRevenue": 450000000,
      "totalOrders": 892,
      "averageOrderValue": 504484
    },
    "chart": [
      {
        "date": "25/10",
        "revenue": 12500000,
        "orders": 28
      },
      {
        "date": "26/10",
        "revenue": 15200000,
        "orders": 32
      }
      // ... 30 ngày
    ],
    "comparison": {
      "previousPeriod": {
        "revenue": 380000000,
        "orders": 756,
        "averageOrderValue": 502645
      },
      "growth": {
        "revenue": "+18.4%",
        "orders": "+18.0%"
      }
    }
  }
}
```

#### Example Requests:

```bash
# 30 ngày gần nhất
GET /api/admin/dashboard/revenue?period=30days

# Custom date range
GET /api/admin/dashboard/revenue?startDate=2025-10-01&endDate=2025-10-31

# Theo chi nhánh, không so sánh
GET /api/admin/dashboard/revenue?branchId=1&comparison=false

# Tháng này
GET /api/admin/dashboard/revenue?period=thisMonth
```

---

### 3️⃣ **TOP PRODUCTS**

**GET** `/api/admin/dashboard/top-products`

Lấy danh sách sản phẩm bán chạy nhất và chậm nhất.

#### Query Parameters:

| Parameter | Type   | Required | Description           | Default |
| --------- | ------ | -------- | --------------------- | ------- |
| period    | string | ❌       | Khoảng thời gian      | 30days  |
| startDate | date   | ❌       | Ngày bắt đầu          | -       |
| endDate   | date   | ❌       | Ngày kết thúc         | -       |
| branchId  | number | ❌       | Filter theo chi nhánh | -       |
| limit     | number | ❌       | Số lượng sản phẩm     | 10      |

#### Response:

```json
{
  "success": true,
  "data": {
    "period": "30days",
    "bestSellers": [
      {
        "productId": 123,
        "name": "Paracetamol 500mg",
        "category": "Thuốc giảm đau",
        "image": "...",
        "soldQuantity": 1250,
        "revenue": 25000000
      }
      // ... top 10
    ],
    "worstSellers": [
      // 10 sản phẩm bán chậm nhất
    ],
    "totalProducts": 156
  }
}
```

#### Example Requests:

```bash
# Top 10 sản phẩm bán chạy 30 ngày
GET /api/admin/dashboard/top-products?period=30days&limit=10

# Top 20 theo chi nhánh
GET /api/admin/dashboard/top-products?branchId=1&limit=20

# Custom date range
GET /api/admin/dashboard/top-products?startDate=2025-10-01&endDate=2025-10-31
```

---

### 4️⃣ **ORDERS STATISTICS**

**GET** `/api/admin/dashboard/orders-stats`

Thống kê chi tiết về đơn hàng.

#### Query Parameters:

Same as Revenue Analytics (period, startDate, endDate, branchId, comparison)

#### Response:

```json
{
  "success": true,
  "data": {
    "period": "30days",
    "current": {
      "total": 892,
      "statusBreakdown": {
        "pending": 45,
        "processing": 120,
        "shipping": 85,
        "completed": 620,
        "cancelled": 22
      },
      "ordersByHour": [
        { "hour": "00:00", "count": 5 },
        { "hour": "01:00", "count": 2 }
        // ... 24 giờ
      ],
      "averageProcessingTime": "2.5 giờ",
      "cancellationRate": "2.5%"
    },
    "comparison": {
      "previousPeriod": {
        "total": 756,
        "statusBreakdown": { ... }
      },
      "growth": "+18.0%"
    }
  }
}
```

#### Example Requests:

```bash
# Thống kê đơn hàng 7 ngày
GET /api/admin/dashboard/orders-stats?period=7days

# Theo chi nhánh với so sánh
GET /api/admin/dashboard/orders-stats?branchId=1&comparison=true
```

---

### 5️⃣ **CUSTOMERS STATISTICS**

**GET** `/api/admin/dashboard/customers-stats`

Thống kê khách hàng.

#### Query Parameters:

| Parameter | Type   | Required | Description            | Default |
| --------- | ------ | -------- | ---------------------- | ------- |
| period    | string | ❌       | Khoảng thời gian       | 30days  |
| startDate | date   | ❌       | Ngày bắt đầu           | -       |
| endDate   | date   | ❌       | Ngày kết thúc          | -       |
| limit     | number | ❌       | Số lượng top customers | 10      |

#### Response:

```json
{
  "success": true,
  "data": {
    "totalCustomers": 3420,
    "newCustomers": {
      "today": 12,
      "thisWeek": 45,
      "thisMonth": 156
    },
    "topCustomers": [
      {
        "customerId": 456,
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@gmail.com",
        "phone": "+84912345678",
        "totalOrders": 45,
        "totalSpent": 35000000,
        "lastOrder": "2025-11-23T10:30:00.000Z"
      }
      // ... top 10
    ],
    "retentionRate": "68.5%"
  }
}
```

#### Example Requests:

```bash
# Khách hàng trong 30 ngày
GET /api/admin/dashboard/customers-stats?period=30days

# Top 20 khách hàng
GET /api/admin/dashboard/customers-stats?limit=20
```

---

### 6️⃣ **INVENTORY STATISTICS**

**GET** `/api/admin/dashboard/inventory-stats`

Thống kê tồn kho và cảnh báo.

#### Query Parameters:

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| branchId  | number | ❌       | Filter theo chi nhánh |

#### Response:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 850,
      "totalStock": 125000,
      "lowStock": 28,
      "outOfStock": 12
    },
    "alerts": [
      {
        "type": "LOW_STOCK",
        "productId": 789,
        "name": "Vitamin C 1000mg",
        "currentStock": 15,
        "minimumStock": 50,
        "branchId": 1,
        "branchName": "Chi nhánh Quận 1"
      },
      {
        "type": "EXPIRING_SOON",
        "productId": 234,
        "name": "Amoxicillin 500mg",
        "expiryDate": "2025-12-15T00:00:00.000Z",
        "daysRemaining": 21,
        "stock": 120,
        "batchNumber": "BATCH-2025-001"
      }
    ]
  }
}
```

#### Example Requests:

```bash
# Tồn kho toàn hệ thống
GET /api/admin/dashboard/inventory-stats

# Tồn kho chi nhánh cụ thể
GET /api/admin/dashboard/inventory-stats?branchId=1
```

---

### 7️⃣ **BRANCHES PERFORMANCE**

**GET** `/api/admin/dashboard/branches-performance`

So sánh hiệu suất các chi nhánh.

#### Query Parameters:

Same as Revenue Analytics (period, startDate, endDate, comparison)

#### Response:

```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "branchId": 1,
        "name": "Chi nhánh Quận 1",
        "city": "Hồ Chí Minh",
        "revenue": 250000000,
        "orders": 450,
        "customers": 890,
        "staff": 12,
        "performance": "Xuất sắc",
        "performanceScore": "85.5",
        "comparison": {
          "previousRevenue": 200000000,
          "growth": "+25.0%"
        }
      }
      // ... tất cả chi nhánh
    ],
    "comparison": {
      "topBranch": {
        "name": "Chi nhánh Quận 1",
        "revenue": 250000000
      },
      "lowestBranch": {
        "name": "Chi nhánh Quận 7",
        "revenue": 85000000
      }
    }
  }
}
```

**Performance Levels:**

- **Xuất sắc** - Score >= 80
- **Tốt** - Score >= 60
- **Trung bình** - Score >= 40
- **Cần cải thiện** - Score < 40

#### Example Requests:

```bash
# Hiệu suất 30 ngày
GET /api/admin/dashboard/branches-performance?period=30days

# Tháng này với so sánh
GET /api/admin/dashboard/branches-performance?period=thisMonth&comparison=true
```

---

### 8️⃣ **PROMOTIONS STATISTICS**

**GET** `/api/admin/dashboard/promotions-stats`

Thống kê khuyến mãi và vouchers.

#### Query Parameters:

| Parameter | Type   | Required | Description      | Default |
| --------- | ------ | -------- | ---------------- | ------- |
| period    | string | ❌       | Khoảng thời gian | 30days  |
| startDate | date   | ❌       | Ngày bắt đầu     | -       |
| endDate   | date   | ❌       | Ngày kết thúc    | -       |

#### Response:

```json
{
  "success": true,
  "data": {
    "activePromotions": 10,
    "flashSales": {
      "active": 2,
      "upcomingSoon": 3
    },
    "vouchers": {
      "issued": 1250,
      "used": 820,
      "usageRate": "65.6%"
    },
    "topVouchers": [
      {
        "voucherId": 123,
        "code": "FREESHIP50K",
        "used": 450,
        "discountGiven": 22500000
      }
    ],
    "totalDiscount": 85000000
  }
}
```

#### Example Requests:

```bash
# Khuyến mãi 30 ngày
GET /api/admin/dashboard/promotions-stats?period=30days

# Tháng này
GET /api/admin/dashboard/promotions-stats?period=thisMonth
```

---

### 9️⃣ **REVIEWS STATISTICS**

**GET** `/api/admin/dashboard/reviews-stats`

Thống kê đánh giá sản phẩm.

#### Query Parameters:

| Parameter | Type   | Required | Description          | Default |
| --------- | ------ | -------- | -------------------- | ------- |
| period    | string | ❌       | Khoảng thời gian     | 30days  |
| startDate | date   | ❌       | Ngày bắt đầu         | -       |
| endDate   | date   | ❌       | Ngày kết thúc        | -       |
| productId | number | ❌       | Filter theo sản phẩm | -       |

#### Response:

```json
{
  "success": true,
  "data": {
    "averageRating": "4.6",
    "totalReviews": 2840,
    "ratingDistribution": {
      "5stars": 1820,
      "4stars": 680,
      "3stars": 220,
      "2stars": 85,
      "1star": 35
    },
    "recentReviews": [
      {
        "id": 1234,
        "productId": 456,
        "productName": "Paracetamol 500mg",
        "customerName": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Sản phẩm tốt, giao hàng nhanh",
        "createdAt": "2025-11-23T10:30:00.000Z"
      }
      // ... 10 đánh giá mới nhất
    ],
    "pendingModeration": 0
  }
}
```

#### Example Requests:

```bash
# Đánh giá 30 ngày
GET /api/admin/dashboard/reviews-stats?period=30days

# Đánh giá của sản phẩm cụ thể
GET /api/admin/dashboard/reviews-stats?productId=123
```

---

### 🔟 **RECENT ACTIVITIES**

**GET** `/api/admin/dashboard/recent-activities`

Hoạt động gần đây trên hệ thống.

#### Query Parameters:

| Parameter | Type   | Required | Description           | Default |
| --------- | ------ | -------- | --------------------- | ------- |
| limit     | number | ❌       | Số lượng hoạt động    | 20      |
| branchId  | number | ❌       | Filter theo chi nhánh | -       |

#### Response:

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "ORDER_CREATED",
        "message": "Đơn hàng #12345 vừa được tạo",
        "orderId": 12345,
        "customer": "Nguyễn Văn A",
        "amount": 850000,
        "timestamp": "2025-11-24T10:30:00.000Z"
      },
      {
        "type": "LOW_STOCK_ALERT",
        "message": "Paracetamol 500mg sắp hết hàng",
        "productId": 456,
        "currentStock": 12,
        "timestamp": "2025-11-24T10:15:00.000Z"
      },
      {
        "type": "NEW_CUSTOMER",
        "message": "Khách hàng mới đăng ký",
        "customerId": 789,
        "name": "Trần Thị B",
        "timestamp": "2025-11-24T10:00:00.000Z"
      }
    ]
  }
}
```

**Activity Types:**

- `ORDER_CREATED` - Đơn hàng mới
- `LOW_STOCK_ALERT` - Cảnh báo sắp hết hàng
- `NEW_CUSTOMER` - Khách hàng mới đăng ký

#### Example Requests:

```bash
# 20 hoạt động mới nhất
GET /api/admin/dashboard/recent-activities?limit=20

# Hoạt động của chi nhánh
GET /api/admin/dashboard/recent-activities?branchId=1&limit=50
```

---

## 📊 USE CASES

### Case 1: Dashboard Tổng Quan Admin

```javascript
// Khi admin mở dashboard, gọi:
const overview = await fetch("/api/admin/dashboard/overview");
const recentActivities = await fetch(
  "/api/admin/dashboard/recent-activities?limit=10"
);
const inventoryAlerts = await fetch("/api/admin/dashboard/inventory-stats");
```

### Case 2: Báo Cáo Doanh Thu Tháng

```javascript
// Xem doanh thu tháng này và so sánh với tháng trước
const revenue = await fetch(
  "/api/admin/dashboard/revenue?period=thisMonth&comparison=true"
);
```

### Case 3: Phân Tích Chi Nhánh

```javascript
// So sánh hiệu suất các chi nhánh trong quý
const branches = await fetch(
  "/api/admin/dashboard/branches-performance?period=90days&comparison=true"
);
```

### Case 4: Theo Dõi Sản Phẩm

```javascript
// Top 20 sản phẩm bán chạy 30 ngày của chi nhánh 1
const topProducts = await fetch(
  "/api/admin/dashboard/top-products?period=30days&branchId=1&limit=20"
);
```

### Case 5: Custom Report

```javascript
// Báo cáo doanh thu từ 01/10 đến 31/10 của tất cả chi nhánh
const customReport = await fetch(
  "/api/admin/dashboard/revenue?startDate=2025-10-01&endDate=2025-10-31&comparison=true"
);
```

---

## 🎨 Frontend Integration Example

```javascript
// React Component Example
import { useState, useEffect } from "react";

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [period, setPeriod] = useState("30days");
  const [branchId, setBranchId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period, branchId]);

  const fetchDashboardData = async () => {
    const params = new URLSearchParams({
      ...(branchId && { branchId }),
    });

    const [overviewRes, revenueRes, ordersRes] = await Promise.all([
      fetch(`/api/admin/dashboard/overview?${params}`),
      fetch(`/api/admin/dashboard/revenue?period=${period}&${params}`),
      fetch(`/api/admin/dashboard/orders-stats?period=${period}&${params}`),
    ]);

    const overviewData = await overviewRes.json();
    const revenueData = await revenueRes.json();
    const ordersData = await ordersRes.json();

    setOverview({
      ...overviewData.data,
      revenue: revenueData.data,
      orders: ordersData.data,
    });
  };

  return (
    <div>
      {/* Dashboard UI */}
      <select onChange={(e) => setPeriod(e.target.value)}>
        <option value="7days">7 ngày</option>
        <option value="30days">30 ngày</option>
        <option value="90days">90 ngày</option>
      </select>

      <select onChange={(e) => setBranchId(e.target.value)}>
        <option value="">Tất cả chi nhánh</option>
        <option value="1">Chi nhánh 1</option>
        <option value="2">Chi nhánh 2</option>
      </select>

      {/* Charts and Stats */}
    </div>
  );
}
```

---

## 🔧 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Lỗi khi lấy thống kê tổng quan"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `401` - Unauthorized (No token)
- `403` - Forbidden (Not admin)
- `500` - Internal Server Error

---

## 📝 Notes

1. **Date Format:** Sử dụng ISO 8601 format (YYYY-MM-DD) cho startDate/endDate
2. **Timezone:** Tất cả datetime đều UTC
3. **Performance:** Các query phức tạp có thể mất 1-3 giây
4. **Caching:** Nên cache kết quả ở frontend 30-60 giây
5. **Rate Limiting:** API có rate limit, tránh gọi quá nhiều request đồng thời

---

## 🚀 Best Practices

1. **Parallel Requests:** Gọi nhiều endpoint cùng lúc bằng `Promise.all()`
2. **Loading States:** Hiển thị loading khi fetch data
3. **Error Handling:** Luôn xử lý lỗi và hiển thị message cho user
4. **Data Refresh:** Tự động refresh data mỗi 5-10 phút
5. **Responsive Charts:** Sử dụng thư viện chart (Chart.js, Recharts) để visualize data

---

## 📚 Related Documentation

- [Authentication API](./AUTH_API_DOCUMENTATION.md)
- [Order Management API](./ORDER_API_DOCUMENTATION.md)
- [Product Management API](./PRODUCT_API_DOCUMENTATION.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-24  
**Author:** PBL6 Development Team
