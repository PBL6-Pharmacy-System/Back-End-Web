# 📦 TÀI LIỆU API MODULE QUẢN LÝ TỒN KHO (Inventory Management)

> **Phiên bản:** 2.0.0  
> **Cập nhật:** Tháng 12/2024  
> **Dành cho:** Front-end Developer

---

## 📋 MỤC LỤC

1. [Tổng Quan Module](#1-tổng-quan-module)
2. [Chi Nhánh (Branches)](#2-chi-nhánh-branches)
3. [Tồn Kho Chi Nhánh (Branch Inventory)](#3-tồn-kho-chi-nhánh-branch-inventory)
4. [Lô Hàng (Product Batches)](#4-lô-hàng-product-batches)
5. [Chuyển Kho (Inventory Transfers)](#5-chuyển-kho-inventory-transfers)
6. [Kiểm Kê (Stock Takes)](#6-kiểm-kê-stock-takes)
7. [Đơn Đặt Hàng NCC (Supplier Orders)](#7-đơn-đặt-hàng-ncc-supplier-orders)
8. [Health Check & Monitoring](#8-health-check--monitoring)
9. [Phân Quyền](#9-phân-quyền)
10. [Mã Lỗi Thường Gặp](#10-mã-lỗi-thường-gặp)

---

## 1. TỔNG QUAN MODULE

### 1.1 Các Sub-module

| Sub-module | Chức năng |
|------------|-----------|
| **Branches** | Quản lý thông tin chi nhánh |
| **Branch Inventory** | Quản lý tồn kho theo chi nhánh |
| **Product Batches** | Quản lý lô hàng (FEFO - First Expired First Out) |
| **Inventory Transfers** | Chuyển kho giữa các chi nhánh |
| **Stock Takes** | Kiểm kê tồn kho |
| **Supplier Orders** | Đặt hàng từ nhà cung cấp |
| **Health Check** | Giám sát tình trạng tồn kho |

### 1.2 Quy tắc quan trọng

⚠️ **KHÔNG thể cập nhật số lượng stock thủ công** - Phải dùng các thao tác:
- Nhập kho (Import)
- Xuất kho (Export)
- Chuyển kho (Transfer)
- Kiểm kê (Stock Take)

---

## 2. CHI NHÁNH (BRANCHES)

### 2.1 Lấy danh sách chi nhánh

```
GET /api/branches
```

**Quyền truy cập:** Public (thông tin cơ bản)

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `includeInventory` | boolean | `true` | Bao gồm thông tin tồn kho |
| `search` | string | - | Tìm theo tên hoặc địa chỉ |
| `active` | boolean | - | Lọc chi nhánh đang hoạt động |
| `hasInventory` | boolean | - | Lọc chi nhánh có hàng |
| `page` | number | `1` | Số trang |
| `limit` | number | `10` | Số bản ghi/trang |
| `sortBy` | string | `id` | Trường sắp xếp |
| `sortOrder` | string | `asc` | Chiều sắp xếp (`asc`/`desc`) |

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "id": 1,
        "name": "Chi nhánh Quận 1",
        "address": "123 Nguyễn Huệ, Q1, TP.HCM",
        "phone": "0901234567",
        "email": "q1@company.com",
        "is_active": true,
        "stats": {
          "totalProducts": 50,
          "totalStock": 1200,
          "lowStockCount": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalRecords": 50
    }
  }
}
```

---

### 2.2 Lấy chi tiết chi nhánh

```
GET /api/branches/:id
```

**Quyền truy cập:** Public

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `includeInventory` | boolean | `true` | Bao gồm thông tin tồn kho |

---

### 2.3 Tạo chi nhánh mới

```
POST /api/branches
```

**Quyền truy cập:** 🔒 Admin only

**Request Body:**
```json
{
  "name": "Chi nhánh Quận 2",
  "address": "456 Xa Lộ Hà Nội, Q2, TP.HCM",
  "phone": "0901234568",
  "email": "q2@company.com",
  "is_active": true
}
```

**Validation:**
- `name`: Bắt buộc, tối đa 100 ký tự, không trùng
- `address`: Bắt buộc, tối đa 200 ký tự
- `phone`: Bắt buộc, đúng 10 số
- `email`: Tùy chọn, định dạng email hợp lệ

---

### 2.4 Cập nhật chi nhánh

```
PUT /api/branches/:id
```

**Quyền truy cập:** 🔒 Admin only

**Request Body:** (Các trường tùy chọn)
```json
{
  "name": "Chi nhánh Quận 2 - Mới",
  "address": "789 Xa Lộ Hà Nội, Q2",
  "phone": "0901234569",
  "email": "q2new@company.com",
  "is_active": false
}
```

⚠️ **Lưu ý:** Không thể vô hiệu hóa chi nhánh còn hàng tồn kho.

---

### 2.5 Xóa chi nhánh

```
DELETE /api/branches/:id
```

**Quyền truy cập:** 🔒 Admin only

⚠️ **Điều kiện:** Chi nhánh không có tồn kho hoặc đơn hàng.

---

### 2.6 Xem tồn kho của chi nhánh

```
GET /api/branches/:branchId/inventory
```

**Quyền truy cập:** 
- 👤 Public/Customer: Chỉ xem `in_stock` (có/không), không xem số lượng
- 👨‍💼 Staff/Admin: Xem đầy đủ thông tin

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `page` | number | `1` | Số trang |
| `limit` | number | `20` | Số bản ghi/trang |
| `sortBy` | string | `id` | Trường sắp xếp |
| `sortOrder` | string | `asc` | Chiều sắp xếp |

**Response cho Public:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "product": {
          "id": 1,
          "name": "Sản phẩm A",
          "price": 50000,
          "image_url": "/images/a.jpg"
        },
        "in_stock": true
      }
    ]
  }
}
```

**Response cho Staff/Admin:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 1,
        "branch_id": 1,
        "product_id": 1,
        "stock": 150,
        "min_stock": 20,
        "max_stock": 500,
        "last_updated": "2024-12-22T10:00:00Z",
        "branches": { "id": 1, "name": "Chi nhánh Q1" },
        "products": {
          "id": 1,
          "name": "Sản phẩm A",
          "unittype": { "name": "Hộp" }
        }
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2.7 Chi tiết lô hàng của sản phẩm tại chi nhánh

```
GET /api/branches/:branchId/inventory/:productId
```

**Quyền truy cập:**
- 👤 Public: Chỉ xem `in_stock`, thông tin cơ bản sản phẩm
- 👨‍💼 Staff/Admin: Xem đầy đủ chi tiết các lô hàng

**Response cho Staff/Admin:**
```json
{
  "success": true,
  "data": {
    "branch": { "id": 1, "name": "Chi nhánh Q1", "address": "..." },
    "product": { "id": 1, "name": "Sản phẩm A", "price": 50000 },
    "total_stock": 150,
    "last_updated": "2024-12-22T10:00:00Z",
    "batches": [
      {
        "id": 1,
        "batch_number": "BATCH-2024-001",
        "quantity": 100,
        "manufacture_date": "2024-01-01",
        "expiry_date": "2025-06-01",
        "cost_price": 35000,
        "selling_price": 50000,
        "status": "active",
        "supplier": { "id": 1, "name": "NCC ABC" }
      }
    ],
    "summary": {
      "total_batches": 2,
      "total_stock": 150,
      "expiring_soon": 1
    }
  }
}
```

---

### 2.8 Cảnh báo hàng sắp hết hạn

```
GET /api/branches/:branchId/inventory/alerts/expiring-soon
```

**Quyền truy cập:** 🔒 Staff/Admin only

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `days` | number | `30` | Số ngày để kiểm tra |

**Response:**
```json
{
  "success": true,
  "data": {
    "branch": { "id": 1, "name": "Chi nhánh Q1" },
    "expiring_within_days": 30,
    "batches": [
      {
        "id": 1,
        "batch_number": "BATCH-2024-001",
        "product": { "id": 1, "name": "Sản phẩm A" },
        "quantity": 50,
        "expiry_date": "2025-01-15",
        "days_until_expiry": 25,
        "urgency": "high",
        "supplier": { "id": 1, "name": "NCC ABC" }
      }
    ],
    "summary": {
      "critical": 2,
      "high": 5,
      "medium": 10,
      "total": 17
    }
  }
}
```

**Urgency levels:**
- `critical`: ≤ 7 ngày
- `high`: 8-15 ngày
- `medium`: 16-30 ngày

---

### 2.9 Cảnh báo hàng tồn kho thấp

```
GET /api/branches/:branchId/inventory/alerts/low-stock
```

**Quyền truy cập:** 🔒 Staff/Admin only

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `threshold` | number | `10` | Ngưỡng tồn kho thấp |

**Response:**
```json
{
  "success": true,
  "data": {
    "branch": { "id": 1, "name": "Chi nhánh Q1" },
    "threshold": 10,
    "products": [
      {
        "id": 1,
        "product_id": 5,
        "product": { "id": 5, "name": "Sản phẩm X" },
        "current_stock": 5,
        "min_stock": 20,
        "shortage": 15,
        "urgency": "critical",
        "reorder_quantity": 50
      }
    ],
    "summary": {
      "critical": 3,
      "high": 7,
      "medium": 5,
      "low": 2,
      "total": 17
    }
  }
}
```

---

### 2.10 Cập nhật cấu hình tồn kho

```
PUT /api/branches/:branchId/inventory/:productId
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ được cập nhật chi nhánh của mình)

**Request Body:**
```json
{
  "min_stock": 20,
  "max_stock": 500
}
```

⚠️ **LƯU Ý:** KHÔNG thể cập nhật `stock` trực tiếp. Phải dùng nhập/xuất/kiểm kê.

---

## 3. TỒN KHO CHI NHÁNH (BRANCH INVENTORY)

### 3.1 Lấy tất cả tồn kho

```
GET /api/branch-inventory
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branchId` hoặc `branch_id` | number | Lọc theo chi nhánh |
| `productId` hoặc `product_id` | number | Lọc theo sản phẩm |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |
| `sortBy` | string | Trường sắp xếp |
| `sortOrder` | string | Chiều sắp xếp |

---

### 3.2 Chi tiết một bản ghi tồn kho

```
GET /api/branch-inventory/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 3.3 Tạo bản ghi tồn kho mới

```
POST /api/branch-inventory
```

**Quyền truy cập:** 🔒 Admin only

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "stock": 100,
  "min_stock": 20,
  "max_stock": 500
}
```

---

### 3.4 Xóa bản ghi tồn kho

```
DELETE /api/branch-inventory/:id
```

**Quyền truy cập:** 🔒 Admin only

⚠️ **Điều kiện:** Không có giao dịch liên quan.

---

### 3.5 Cảnh báo tồn kho thấp (toàn hệ thống)

```
GET /api/branch-inventory/alerts/low-stock
```

**Quyền truy cập:** 🔒 Staff/Admin

---

## 4. LÔ HÀNG (PRODUCT BATCHES)

### 4.1 Lấy danh sách lô hàng

```
GET /api/product-batches
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branch_id` | number | Lọc theo chi nhánh |
| `product_id` | number | Lọc theo sản phẩm |
| `supplier_id` | number | Lọc theo nhà cung cấp |
| `status` | string | `active`, `expired`, `disposed` |
| `expiring_soon` | boolean | Lọc lô sắp hết hạn (30 ngày) |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |

---

### 4.2 Tạo lô hàng mới (Nhập kho)

```
POST /api/product-batches
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ nhập cho chi nhánh mình)

**Request Body:**
```json
{
  "product_id": 1,
  "branch_id": 1,
  "batch_number": "BATCH-2024-001",
  "quantity": 100,
  "manufacture_date": "2024-01-15",
  "expiry_date": "2025-06-15",
  "cost_price": 35000,
  "selling_price": 50000,
  "supplier_id": 1,
  "note": "Nhập từ NCC ABC"
}
```

**Validation:**
- `batch_number`: Chỉ chứa chữ, số, `-`, `_`, tối đa 50 ký tự
- `quantity`: Số nguyên dương, tối đa 100,000
- `expiry_date`: Phải sau `manufacture_date` và sau ngày hiện tại
- `cost_price` và `selling_price`: Số dương, selling_price >= cost_price

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": { ... },
    "summary": {
      "batch_id": 1,
      "batch_number": "BATCH-2024-001",
      "quantity_imported": 100,
      "product_name": "Sản phẩm A",
      "branch_name": "Chi nhánh Q1",
      "supplier_name": "NCC ABC",
      "imported_at": "2024-12-22T10:00:00Z"
    }
  },
  "message": "Tạo lô hàng thành công"
}
```

---

### 4.3 Chi tiết lô hàng

```
GET /api/product-batches/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 4.4 Cập nhật lô hàng

```
PUT /api/product-batches/:id
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ cập nhật lô của chi nhánh mình)

**Request Body:** (Các trường tùy chọn)
```json
{
  "manufacture_date": "2024-01-20",
  "expiry_date": "2025-07-01",
  "cost_price": 36000,
  "selling_price": 52000,
  "note": "Cập nhật thông tin"
}
```

---

### 4.5 Đánh dấu lô hàng hết hạn

```
POST /api/product-batches/:id/expire
```

**Quyền truy cập:** 🔒 Staff/Admin

⚠️ **Lưu ý:** Đánh dấu hết hạn KHÔNG tự động trừ stock. Cần tiêu hủy riêng.

---

### 4.6 Tiêu hủy lô hàng hết hạn

```
POST /api/product-batches/:id/dispose
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "note": "Tiêu hủy do hết hạn sử dụng"
}
```

⚠️ **Quan trọng:** Chỉ tiêu hủy được lô đã đánh dấu `expired`. Thao tác này sẽ trừ stock thực tế.

---

### 4.7 Xóa lô hàng

```
DELETE /api/product-batches/:id
```

**Quyền truy cập:** 🔒 Admin only

⚠️ **Điều kiện:** Lô hàng chưa có giao dịch.

---

### 4.8 Lấy lô hàng sắp hết hạn

```
GET /api/product-batches/expiring-soon
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `days` | number | `30` | Số ngày để kiểm tra |

---

### 4.9 Lấy lô hàng theo FEFO

```
GET /api/product-batches/fefo/:branchId/:productId
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ xem chi nhánh mình)

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": 1,
        "batch_number": "BATCH-2024-001",
        "quantity": 50,
        "expiry_date": "2025-01-15",
        "product": { "id": 1, "name": "Sản phẩm A" },
        "supplier": { "id": 1, "name": "NCC ABC" }
      }
    ],
    "totalAvailable": 150,
    "batchCount": 3
  }
}
```

---

### 4.10 Xem trước phân bổ FEFO

```
POST /api/product-batches/fefo/allocate
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 1,
  "quantity": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allocations": [
      {
        "batch_id": 1,
        "batch_number": "BATCH-2024-001",
        "expiry_date": "2025-01-15",
        "available_qty": 50,
        "allocated_qty": 30,
        "remaining_after": 20
      }
    ],
    "totalAllocated": 30,
    "batchesUsed": 1
  }
}
```

---

### 4.11 Xuất kho theo FEFO

```
POST /api/product-batches/fefo/export
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ xuất từ chi nhánh mình)

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 1,
  "quantity": 30,
  "reference_type": "order_fulfillment",
  "reference_id": 123,
  "note": "Xuất theo đơn hàng #123"
}
```

**reference_type hợp lệ:**
- `manual_export`: Xuất thủ công
- `order_fulfillment`: Xuất theo đơn hàng
- `transfer`: Chuyển kho
- `damage`: Hàng hỏng
- `sample`: Hàng mẫu
- `return_to_supplier`: Trả NCC

---

### 4.12 Nhập kho vào lô

```
POST /api/product-batches/import
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 1,
  "batch_number": "BATCH-2024-002",
  "quantity": 50,
  "manufacture_date": "2024-12-01",
  "expiry_date": "2026-06-01",
  "cost_price": 35000,
  "supplier_id": 1,
  "note": "Nhập bổ sung"
}
```

Hoặc nhập vào lô có sẵn:
```json
{
  "batch_id": 1,
  "quantity": 30
}
```

---

### 4.13 Nhập thêm vào lô hiện có

```
POST /api/product-batches/:id/add-stock
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "quantity": 50,
  "note": "Nhập bổ sung từ NCC"
}
```

---

### 4.14 Tổng quan lô hàng

```
GET /api/product-batches/summary/:branchId/:productId
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "total_batches": 5,
    "active_batches": 3,
    "expired_batches": 1,
    "expiring_soon_batches": 1,
    "total_quantity": 500,
    "active_quantity": 400,
    "expired_quantity": 50,
    "expiring_soon_quantity": 50,
    "batches_by_status": {
      "active": [...],
      "expired": [...],
      "expiring_soon": [...],
      "depleted": [...]
    }
  }
}
```

---

### 4.15 Kiểm tra đồng bộ tồn kho

```
GET /api/product-batches/validate/:branchId/:productId
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_total": 500,
    "active_batch_total": 400,
    "expired_batch_total": 100,
    "inventory_stock": 500,
    "is_consistent": true,
    "discrepancy": 0,
    "warning": "⚠️ Có 100 sản phẩm trong các lô hết hạn cần được xử lý tiêu hủy"
  }
}
```

---

### 4.16 Điều chỉnh đồng bộ tồn kho

```
POST /api/product-batches/reconcile/:branchId/:productId
```

**Quyền truy cập:** 🔒 Admin only

---

### 4.17 Tự động đánh dấu hết hạn

```
POST /api/product-batches/auto-expire
```

**Quyền truy cập:** 🔒 Admin only

---

### 4.18 Sinh mã lô hàng tự động

```
GET /api/product-batches/generate-number/:productId/:branchId
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_number": "BATCH-1-1-20241222-A1B2"
  }
}
```

---

### 4.19 Lấy lô hàng đã hết hàng

```
GET /api/product-batches/depleted
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branch_id` | number | Lọc theo chi nhánh |
| `product_id` | number | Lọc theo sản phẩm |
| `status` | string | Mặc định `active` |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |

---

## 5. CHUYỂN KHO (INVENTORY TRANSFERS)

### Workflow chuyển kho:
1. **pending** → Tạo phiếu chuyển
2. **approved** → Admin duyệt
3. **shipped** → Xuất kho từ chi nhánh nguồn
4. **completed** → Nhận kho tại chi nhánh đích

### 5.1 Lấy danh sách phiếu chuyển kho

```
GET /api/inventory-transfers
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branchId` | number | Lọc theo chi nhánh (nguồn hoặc đích) |
| `status` | string | `pending`, `approved`, `shipped`, `completed`, `cancelled` |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |

---

### 5.2 Chi tiết phiếu chuyển kho

```
GET /api/inventory-transfers/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 5.3 Tạo phiếu chuyển kho

```
POST /api/inventory-transfers
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ tạo từ chi nhánh mình)

**Request Body:**
```json
{
  "from_branch_id": 1,
  "to_branch_id": 2,
  "product_id": 5,
  "quantity": 50,
  "note": "Chuyển bổ sung hàng cho chi nhánh Q2"
}
```

**Validation:**
- `from_branch_id` ≠ `to_branch_id`
- `quantity`: Số nguyên dương, tối đa 100,000
- Phải đủ tồn kho tại chi nhánh nguồn

---

### 5.4 Duyệt phiếu chuyển kho

```
POST /api/inventory-transfers/:id/approve
```

**Quyền truy cập:** 🔒 Admin only

---

### 5.5 Xuất kho (Ship)

```
POST /api/inventory-transfers/:id/ship
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ xuất từ chi nhánh mình)

**Request Body:** (Tùy chọn)
```json
{
  "tracking_number": "VN123456789"
}
```

**Validation cho tracking_number:**
- Tối đa 100 ký tự
- Chỉ chứa chữ, số, dấu gạch ngang

⚠️ **Lưu ý:** Tự động xuất theo FEFO từ các lô hàng.

---

### 5.6 Nhận kho (Receive)

```
POST /api/inventory-transfers/:id/receive
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ nhận tại chi nhánh mình)

⚠️ **Lưu ý:** Tự động tạo lô hàng mới tại chi nhánh đích với thông tin từ lô nguồn.

---

### 5.7 Hủy phiếu chuyển kho

```
POST /api/inventory-transfers/:id/cancel
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ hủy phiếu từ chi nhánh mình)

**Request Body:**
```json
{
  "reason": "Hủy do thay đổi kế hoạch"
}
```

⚠️ **Điều kiện:** Chỉ hủy được phiếu ở trạng thái `pending` hoặc `approved`.

---

## 6. KIỂM KÊ (STOCK TAKES)

### Workflow kiểm kê:
1. **in_progress** → Tạo phiếu, tự động sinh danh sách sản phẩm
2. Cập nhật số lượng thực tế cho từng sản phẩm
3. **completed** → Hoàn thành, tự động điều chỉnh tồn kho
4. **cancelled** → Hủy (nếu cần)

### 6.1 Lấy danh sách phiếu kiểm kê

```
GET /api/stock-takes
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branch_id` | number | Lọc theo chi nhánh |
| `status` | string | `in_progress`, `completed`, `cancelled` |
| `start_date` | date | Lọc từ ngày |
| `end_date` | date | Lọc đến ngày |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |

---

### 6.2 Chi tiết phiếu kiểm kê

```
GET /api/stock-takes/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock_take_no": "ST202412001",
    "status": "in_progress",
    "branches": { "id": 1, "name": "Chi nhánh Q1" },
    "users_stockTake_started_byTousers": { "full_name": "Nguyễn Văn A" },
    "start_date": "2024-12-22T08:00:00Z",
    "stockTakeItem": [...],
    "stats": {
      "totalItems": 50,
      "completedItems": 30,
      "itemsWithVariance": 5,
      "totalVarianceValue": -150000
    }
  }
}
```

---

### 6.3 Tạo phiếu kiểm kê

```
POST /api/stock-takes
```

**Quyền truy cập:** 🔒 Staff/Admin (Staff chỉ tạo cho chi nhánh mình)

**Request Body:**
```json
{
  "branch_id": 1,
  "note": "Kiểm kê cuối tháng 12/2024"
}
```

⚠️ **Điều kiện:** Chi nhánh không được có phiếu kiểm kê đang thực hiện.

---

### 6.4 Lấy danh sách mục kiểm kê

```
GET /api/stock-takes/:id/items
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `has_variance` | boolean | Lọc mục có chênh lệch |
| `completed` | boolean | Lọc mục đã kiểm |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |

---

### 6.5 Cập nhật số lượng thực tế

```
PUT /api/stock-takes/:id/items/:itemId
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "actual_qty": 95,
  "reason": "Hàng hư hỏng",
  "note": "5 sản phẩm bị vỡ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 5,
    "system_qty": 100,
    "actual_qty": 95,
    "variance": -5,
    "variance_value": -250000,
    "reason": "Hàng hư hỏng",
    "products": { "name": "Sản phẩm X", "price": 50000 }
  }
}
```

---

### 6.6 Hoàn thành kiểm kê

```
POST /api/stock-takes/:id/complete
```

**Quyền truy cập:** 🔒 Staff/Admin

⚠️ **Điều kiện:** Tất cả sản phẩm phải được kiểm đếm.

⚠️ **Quan trọng:** Tự động điều chỉnh:
- `branchinventory.stock`
- `productBatch.quantity` (theo FEFO)
- Tạo `inventoryLog` ghi nhận điều chỉnh

---

### 6.7 Hủy phiếu kiểm kê

```
POST /api/stock-takes/:id/cancel
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "reason": "Hủy do cần kiểm kê lại"
}
```

---

### 6.8 Xóa phiếu kiểm kê

```
DELETE /api/stock-takes/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

⚠️ **Điều kiện:** Chỉ xóa được phiếu chưa có mục nào được cập nhật.

---

## 7. ĐƠN ĐẶT HÀNG NCC (SUPPLIER ORDERS)

### Workflow:
1. **draft** → Tạo đơn
2. **pending** → Gửi duyệt
3. **approved** → Đã duyệt
4. **shipped** → NCC đang giao
5. **received** → Đã nhận, tự động nhập kho
6. **cancelled** → Đã hủy

### 7.1 Lấy danh sách đơn hàng NCC

```
GET /api/supplier-orders
```

**Quyền truy cập:** 🔒 Staff/Admin

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `status` | string | Lọc theo trạng thái |
| `supplier_id` | number | Lọc theo NCC |
| `branch_id` | number | Lọc theo chi nhánh |
| `start_date` | date | Lọc từ ngày |
| `end_date` | date | Lọc đến ngày |
| `page` | number | Số trang |
| `limit` | number | Số bản ghi/trang |
| `sortBy` | string | Trường sắp xếp |
| `sortOrder` | string | Chiều sắp xếp |

---

### 7.2 Chi tiết đơn hàng NCC

```
GET /api/supplier-orders/:id
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 7.3 Tạo đơn hàng NCC

```
POST /api/supplier-orders
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "supplier_id": 1,
  "branch_id": 1,
  "expected_date": "2024-12-30",
  "note": "Đơn hàng tháng 12",
  "items": [
    {
      "product_id": 1,
      "quantity": 100,
      "unit_price": 35000,
      "tax_rate": 10,
      "discount": 0,
      "batch_number": "BATCH-NCC-001",
      "expiry_date": "2026-06-01",
      "note": "Sản phẩm A"
    },
    {
      "product_id": 2,
      "quantity": 50,
      "cost_price": 45000,
      "batch_number": "BATCH-NCC-002"
    }
  ]
}
```

**Lưu ý:** Hỗ trợ cả `unit_price` và `cost_price` cho giá đơn vị.

---

### 7.4 Cập nhật trạng thái đơn hàng

```
PATCH /api/supplier-orders/:id/status
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "status": "approved"
}
```

---

### 7.5 Nhận hàng từ NCC (Tự động nhập kho)

```
POST /api/supplier-orders/:id/receive
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:** (Tùy chọn - nếu số lượng nhận khác số lượng đặt)
```json
{
  "receivedItems": [
    { "product_id": 1, "received_qty": 95 },
    { "product_id": 2, "received_qty": 50 }
  ]
}
```

⚠️ **Quan trọng:** Tự động:
- Cập nhật `branchinventory.stock`
- Tạo `productBatch` cho từng sản phẩm
- Tạo `inventoryLog` ghi nhận nhập kho

---

### 7.6 Hủy đơn hàng NCC

```
POST /api/supplier-orders/:id/cancel
```

**Quyền truy cập:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "reason": "NCC không còn hàng"
}
```

⚠️ **Điều kiện:** Không thể hủy đơn đã nhận hàng.

---

### 7.7 Thống kê đơn hàng NCC

```
GET /api/supplier-orders/statistics
```

**Quyền truy cập:** 🔒 Admin only

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `branch_id` | number | Lọc theo chi nhánh |
| `supplier_id` | number | Lọc theo NCC |
| `start_date` | date | Lọc từ ngày |
| `end_date` | date | Lọc đến ngày |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 100,
    "ordersByStatus": {
      "draft": 5,
      "pending": 10,
      "approved": 15,
      "shipped": 8,
      "received": 55,
      "cancelled": 7
    },
    "totalReceivedValue": 150000000,
    "completionRate": "59.14%"
  }
}
```

---

## 8. HEALTH CHECK & MONITORING

### 8.1 Tổng quan tình trạng tồn kho

```
GET /api/inventory/health
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "good",
    "health_score": 85,
    "summary": {
      "total_branches": 5,
      "total_products": 200,
      "total_inventory_records": 800
    },
    "issues": {
      "out_of_stock": 12,
      "low_stock": 25,
      "expired_batches": 3,
      "expiring_soon_batches": 15,
      "stuck_reservations": 0,
      "active_reservations": 5
    },
    "recommendations": [
      {
        "priority": "high",
        "type": "expired_batches",
        "message": "Có 3 lô hàng hết hạn cần xử lý tiêu hủy.",
        "action": "GET /api/inventory/batches?status=expired"
      }
    ],
    "checked_at": "2024-12-22T10:00:00Z"
  }
}
```

**Health Score:**
- 90-100: `healthy`
- 70-89: `good`
- 50-69: `warning`
- 0-49: `critical`

---

### 8.2 Kiểm tra đồng bộ chi nhánh

```
GET /api/inventory/health/branch/:branchId
```

**Quyền truy cập:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "branch_id": 1,
    "total_products": 50,
    "consistent_products": 48,
    "inconsistent_products": 2,
    "discrepancies": [
      {
        "product_id": 5,
        "product_name": "Sản phẩm X",
        "inventory_stock": 100,
        "batch_total": 95,
        "difference": 5,
        "is_consistent": false
      }
    ],
    "checked_at": "2024-12-22T10:00:00Z"
  }
}
```

---

### 8.3 Kiểm tra đồng bộ theo log

```
GET /api/inventory/health/logs/:branchId/:productId
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 8.4 Kiểm tra reservation bị stuck

```
GET /api/inventory/health/reservations
```

**Quyền truy cập:** 🔒 Staff/Admin

---

### 8.5 Fix reservation bị stuck

```
POST /api/inventory/health/reservations/fix
```

**Quyền truy cập:** 🔒 Admin only

---

## 9. PHÂN QUYỀN

### 9.1 Tổng quan phân quyền

| Vai trò | Mô tả |
|---------|-------|
| **Public** | Xem thông tin cơ bản chi nhánh, `in_stock` (có/không) |
| **Customer** | Như Public |
| **Staff** | Quản lý tồn kho chi nhánh của mình |
| **Admin** | Toàn quyền |

### 9.2 Chi tiết phân quyền Staff

| Hành động | Quyền Staff |
|-----------|-------------|
| Xem tồn kho | ✅ Tất cả chi nhánh (cross-branch) |
| Nhập kho | ✅ Chỉ chi nhánh của mình |
| Xuất kho | ✅ Chỉ chi nhánh của mình |
| Tạo chuyển kho | ✅ Chỉ từ chi nhánh của mình |
| Ship chuyển kho | ✅ Chỉ chi nhánh nguồn của mình |
| Nhận chuyển kho | ✅ Chỉ chi nhánh đích của mình |
| Kiểm kê | ✅ Chỉ chi nhánh của mình |
| Cập nhật min/max stock | ✅ Chỉ chi nhánh của mình |
| Xóa chi nhánh | ❌ |
| Tạo chi nhánh | ❌ |

### 9.3 Data Masking

**Dữ liệu bị ẩn với Staff:**
- `cost_price` (giá nhập)

**Dữ liệu bị ẩn với Public/Customer:**
- Số lượng chính xác (`stock`)
- Chi tiết lô hàng
- Thông tin nhà cung cấp
- Giá nhập, giá bán

---

## 10. MÃ LỖI THƯỜNG GẶP

### 10.1 HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Dữ liệu không hợp lệ |
| `403` | Không có quyền |
| `404` | Không tìm thấy |
| `409` | Xung đột (đã tồn tại) |
| `500` | Lỗi server |

### 10.2 Response Format

**Thành công:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo (nếu có)"
}
```

**Lỗi:**
```json
{
  "success": false,
  "error": "Mô tả lỗi",
  "status": 400,
  "details": { ... }
}
```

### 10.3 Các lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Không thể cập nhật số lượng tồn kho thủ công" | Cố gắng update `stock` trực tiếp | Sử dụng nhập/xuất/kiểm kê |
| "Chi nhánh này đang có phiếu kiểm kê chưa hoàn thành" | Tạo kiểm kê mới khi còn kiểm kê đang thực hiện | Hoàn thành hoặc hủy phiếu kiểm kê hiện tại |
| "Không đủ hàng trong kho" | Xuất/chuyển vượt quá tồn kho | Kiểm tra số lượng trước khi thao tác |
| "Bạn chỉ có quyền ... chi nhánh của mình" | Staff thao tác trên chi nhánh khác | Đảm bảo `branch_id` đúng với chi nhánh được phân công |
| "Số lô hàng đã tồn tại" | Tạo lô với `batch_number` trùng | Dùng mã lô khác hoặc nhập thêm vào lô hiện có |

---

## 📝 GHI CHÚ CUỐI

1. **Tất cả request cần có Authentication** (trừ các endpoint Public)
2. **Header yêu cầu:** `Authorization: Bearer <token>`
3. **Content-Type:** `application/json`
4. **Thời gian:** ISO 8601 format (VD: `2024-12-22T10:00:00Z`)
5. **Số tiền:** Đơn vị VNĐ, không có phần thập phân

---

**Tài liệu được tạo tự động từ source code.**  
**Liên hệ hỗ trợ:** Backend Team
