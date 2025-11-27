# 📦 INVENTORY MANAGEMENT API ENDPOINTS

> **Version:** 5.1.0 (Batch Sync & Stock Consistency Enhancement)  
> **Last Updated:** November 27, 2025  
> **Base URL:** `http://localhost:3000/api`  
> **Security Status:** ✅ AUDITED & SECURED

---

## 📋 MỤC LỤC

1. [Overview & Security](#1-overview--security)
2. [Branches (Chi nhánh)](#2-branches-chi-nhánh)
3. [Branch Inventory (Nested Routes)](#3-branch-inventory-nested-routes)
4. [Branch Inventory (Global Routes)](#4-branch-inventory-global-routes)
5. [Product Batches (Lô hàng)](#5-product-batches-lô-hàng)
6. [🆕 FEFO Operations (Xuất kho theo hạn)](#6-fefo-operations-xuất-kho-theo-hạn)
7. [Inventory Transfers (Chuyển kho)](#7-inventory-transfers-chuyển-kho)
8. [Stock Takes (Kiểm kê)](#8-stock-takes-kiểm-kê)
9. [Authorization Matrix](#9-authorization-matrix)
10. [Data Masking Rules](#10-data-masking-rules)
11. [🆕 Utility Functions](#11-utility-functions)

---

## 1. OVERVIEW & SECURITY

### 1.1 Major Changes (v5.1.0)

#### 🆕 **New Features (v5.1.0)**
- **Auto Batch Creation on Import**: `importToBranchInventory` tự động tạo batch để đảm bảo đồng bộ
- **Enhanced Stock Consistency**: `validateStockConsistency` bao gồm cả batch `expired` (chưa tiêu hủy)
- **Stock Take Batch Adjustment**: `completeStockTake` điều chỉnh cả `productBatch.quantity` theo FEFO
- **Branch Permission Helpers**: Utility functions mới cho validation quyền staff trên branch

#### 🔧 **Bug Fixes (v5.1.0)**
- **Fix**: `importToBranchInventory` không tạo batch → Giờ tự động tạo batch với auto-generated batch number
- **Fix**: `validateStockConsistency` bỏ qua batch `expired` → Giờ tính cả expired, chỉ loại trừ `disposed`
- **Fix**: `completeStockTake` chỉ cập nhật inventory → Giờ điều chỉnh cả batch quantities theo FEFO

#### 🆕 **Previous Features (v5.0.0)**
- **FEFO Integration**: Xuất kho tự động theo nguyên tắc First Expired First Out
- **Batch Lifecycle Management**: Quy trình đầy đủ từ active → expired → disposed
- **Transfer with FEFO**: Chuyển kho tự động trừ từ lô hết hạn sớm nhất
- **Stock Reconciliation**: Đồng bộ tồn kho giữa batch và inventory

#### ✅ **Security Enhancements**
- **Data Masking**: Public/Customer chỉ xem `in_stock: true/false`, không thấy số lượng chính xác
- **Optional Auth**: Endpoints công khai hỗ trợ cả anonymous và authenticated users
- **Staff Branch Isolation**: Staff chỉ **WRITE** được own branch, nhưng **READ** cross-branch
- **JWT-based Authorization**: Branch ID được lưu trực tiếp trong JWT token

#### 🔐 **Authentication Methods**
1. **No Auth** (Public) - Xem được masked data
2. **Bearer Token** (Customer) - Xem được masked data
3. **Bearer Token** (Staff) - Xem được full data, WRITE own branch only
4. **Bearer Token** (Admin) - Full access

#### 📊 **Data Visibility Levels**

| User Type | Stock Quantity | Batch Details | Cost Price | Supplier | Min/Max Stock |
|-----------|----------------|---------------|------------|----------|---------------|
| Public    | ❌ (in_stock only) | ❌ **HIDDEN** | ❌ | ❌ | ❌ |
| Customer  | ❌ (in_stock only) | ❌ **HIDDEN** | ❌ | ❌ | ❌ |
| Staff     | ✅ Full | ✅ Full | ❌ | ✅ | ✅ |
| Admin     | ✅ Full | ✅ Full | ✅ | ✅ | ✅ |

---

## 2. BRANCHES (CHI NHÁNH)

### 2.1 GET `/api/branches`

**Mô tả:** Lấy danh sách tất cả chi nhánh

**Auth:** ❌ Public (No authentication required)

**Query Parameters:**
```
?page=1
&limit=10
&search=quận+1
&active=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "id": 1,
        "name": "Chi nhánh Quận 1",
        "address": "123 Lê Lợi, Quận 1, TP.HCM",
        "phone": "0281234567",
        "email": "q1@pharmacy.com",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "totalRecords": 25
    }
  }
}
```

---

### 2.2 GET `/api/branches/:id`

**Mô tả:** Lấy thông tin chi tiết 1 chi nhánh

**Auth:** ❌ Public

**URL Parameters:**
- `id` (integer): Branch ID

**Query Parameters:**
```
?includeInventory=true  // Bao gồm thông tin tồn kho (sẽ bị mask nếu không auth)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chi nhánh Quận 1",
    "address": "123 Lê Lợi, Quận 1, TP.HCM",
    "phone": "0281234567",
    "email": "q1@pharmacy.com",
    "is_active": true,
    "branchinventory": [
      {
        "id": 1,
        "product_id": 5,
        "in_stock": true,  // ⚠️ Public chỉ thấy boolean
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg"
        }
      }
    ]
  }
}
```

---

### 2.3 POST `/api/branches`

**Mô tả:** Tạo chi nhánh mới

**Auth:** 🔒 Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Chi nhánh Quận 2",
  "address": "456 Nguyễn Văn Linh, Quận 2, TP.HCM",
  "phone": "0282345678",
  "email": "q2@pharmacy.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Chi nhánh Quận 2",
    "address": "456 Nguyễn Văn Linh, Quận 2, TP.HCM",
    "phone": "0282345678",
    "email": "q2@pharmacy.com",
    "is_active": true,
    "created_at": "2025-11-24T10:00:00.000Z"
  }
}
```

---

### 2.4 PUT `/api/branches/:id`

**Mô tả:** Cập nhật thông tin chi nhánh

**Auth:** 🔒 Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Chi nhánh Quận 1 - Updated",
  "phone": "0281234999",
  "is_active": false
}
```

---

### 2.5 DELETE `/api/branches/:id`

**Mô tả:** Xóa chi nhánh

**Auth:** 🔒 Admin only

**Validation:**
- ❌ Không thể xóa nếu chi nhánh có tồn kho
- ❌ Không thể xóa nếu chi nhánh có đơn hàng

---

## 3. BRANCH INVENTORY (NESTED ROUTES)

### 3.1 GET `/api/branches/:branchId/inventory`

**Mô tả:** Xem tất cả tồn kho của 1 chi nhánh

**Auth:** 🔓 Optional Auth (Public/Customer/Staff/Admin)

**⚠️ IMPORTANT - Data Masking:**
- **Public/Customer**: Chỉ thấy `in_stock: true/false`, không thấy số lượng
- **Staff/Admin**: Xem full data (stock, min_stock, max_stock)

**URL Parameters:**
- `branchId` (integer): Branch ID

**Query Parameters:**
```
?page=1
&limit=20
&sortBy=stock
&sortOrder=desc
```

**Response (Public/Customer):**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 1,
        "branch_id": 1,
        "product_id": 5,
        "in_stock": true,  // ⚠️ MASKED: Chỉ boolean
        "last_updated": "2025-11-24T10:00:00.000Z",
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "price": "50000",
          "image_url": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalRecords": 100
    }
  }
}
```

**Response (Staff/Admin):**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 1,
        "branch_id": 1,
        "product_id": 5,
        "stock": 150,  // ✅ Full data
        "min_stock": 20,
        "max_stock": 500,
        "last_updated": "2025-11-24T10:00:00.000Z",
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "price": "50000",
          "image_url": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalRecords": 100
    }
  }
}
```

---

### 3.2 GET `/api/branches/:branchId/inventory/:productId`

**Mô tả:** Xem chi tiết các lô hàng của 1 sản phẩm tại chi nhánh

**Auth:** 🔓 Optional Auth

**⚠️ IMPORTANT - Data Masking:**
- **Public/Customer**: Chỉ thấy `in_stock` (boolean) - **KHÔNG** có batch information
- **Staff**: Xem được full batch details (quantity, supplier, expiry) nhưng **KHÔNG** thấy cost_price
- **Admin**: Xem full data bao gồm cost_price

**🔒 Security Rationale:**
Batch information là dữ liệu quản lý nội bộ không phục vụ mục đích mua sắm của customer. Public/Customer chỉ cần biết:
- ✅ Sản phẩm có sẵn hay không (`in_stock`)
- ✅ Giá bán, hình ảnh, mô tả sản phẩm
- ❌ **KHÔNG CẦN**: Batch number, expiry date, manufacture date, supplier

**URL Parameters:**
- `branchId` (integer): Branch ID
- `productId` (integer): Product ID

**Response (Public/Customer):**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 1",
      "address": "123 Lê Lợi, Quận 1, TP.HCM",
      "phone": "0281234567"
    },
    "product": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "price": "50000",
      "image_url": "https://...",
      "description": "Thuốc giảm đau hạ sốt"
    },
    "in_stock": true  // ⚠️ CHỈ BOOLEAN - Không có batch details
  }
}
```

**Response (Staff):**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 1",
      "address": "123 Lê Lợi"
    },
    "product": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "price": "50000",
      "image_url": "https://..."
    },
    "total_stock": 150,  // ✅ Staff thấy tổng tồn kho
    "last_updated": "2025-11-24T10:00:00.000Z",
    "batches": [
      {
        "id": 123,
        "batch_number": "BATCH-2025-001",
        "quantity": 50,  // ✅ Staff thấy
        "manufacture_date": "2025-01-01",
        "expiry_date": "2026-06-01",
        "selling_price": "50000",
        "status": "active",
        "supplier": {  // ✅ Staff thấy supplier
          "id": 1,
          "name": "Nhà cung cấp ABC"
        }
        // ❌ Staff KHÔNG thấy cost_price
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

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 1",
      "address": "123 Lê Lợi"
    },
    "product": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "price": "50000",
      "image_url": "https://..."
    },
    "total_stock": 150,
    "last_updated": "2025-11-24T10:00:00.000Z",
    "batches": [
      {
        "id": 123,
        "batch_number": "BATCH-2025-001",
        "quantity": 50,
        "manufacture_date": "2025-01-01",
        "expiry_date": "2026-06-01",
        "cost_price": "45000",  // ✅ Admin thấy
        "selling_price": "50000",
        "status": "active",
        "supplier": {
          "id": 1,
          "name": "Nhà cung cấp ABC"
        }
      }
    ],
    "summary": {
      "total_batches": 2,
      "total_stock": 150,
      "expiring_soon": 1,
      "total_cost_value": "6750000",  // ✅ Admin thấy
      "potential_profit": "750000"  // ✅ Admin thấy
    }
  }
}
```

---

### 3.3 GET `/api/branches/:branchId/inventory/alerts/expiring-soon`

**Mô tả:** Xem lô hàng sắp hết hạn của chi nhánh

**Auth:** 🔒 Staff/Admin only

**URL Parameters:**
- `branchId` (integer): Branch ID

**Query Parameters:**
```
?days=30  // Số ngày cảnh báo (default: 30)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 1"
    },
    "expiring_within_days": 30,
    "batches": [
      {
        "id": 123,
        "batch_number": "BATCH-2025-001",
        "product": {
          "id": 5,
          "name": "Paracetamol 500mg"
        },
        "quantity": 50,
        "expiry_date": "2025-12-25",
        "days_until_expiry": 7,
        "urgency": "critical"
      }
    ],
    "summary": {
      "critical": 2,  // <= 7 days
      "high": 5,      // <= 15 days
      "medium": 10,   // <= 30 days
      "total": 17
    }
  }
}
```

---

### 3.4 GET `/api/branches/:branchId/inventory/alerts/low-stock`

**Mô tả:** Xem tồn kho thấp của chi nhánh

**Auth:** 🔒 Staff/Admin only

**⚠️ SECURITY CHANGE v4.0:**
- Endpoint này đã chuyển từ Public sang **Staff/Admin ONLY**
- Public/Customer → **403 Forbidden**
- Lý do: Thông tin low stock là dữ liệu kinh doanh nội bộ

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `branchId` (integer): Branch ID

**Query Parameters:**
```
?threshold=10  // Ngưỡng tồn kho thấp (default: 10)
```

**Response (Staff/Admin):**
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Chi nhánh Quận 1"
    },
    "threshold": 10,
    "products": [
      {
        "id": 1,
        "product_id": 5,
        "product": {
          "id": 5,
          "name": "Paracetamol 500mg"
        },
        "current_stock": 5,
        "min_stock": 20,
        "shortage": 15,
        "urgency": "high",
        "reorder_point": 15,
        "reorder_quantity": 50
      }
    ],
    "summary": {
      "critical": 3,  // Out of stock
      "high": 5,      // < 30% min_stock
      "medium": 7,    // < 50% min_stock
      "low": 10,      // < 100% min_stock
      "total": 25
    }
  }
}
```

**Error Response (Public/Customer):**
```json
{
  "success": false,
  "error": "Bạn không có quyền truy cập thông tin cảnh báo tồn kho"
}
```

---

### 3.5 PUT `/api/branches/:branchId/inventory/:productId`

**Mô tả:** Cập nhật tồn kho thủ công của 1 sản phẩm tại chi nhánh

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ IMPORTANT - Authorization:**
- **Admin**: Có thể cập nhật bất kỳ chi nhánh nào
- **Staff**: CHỈ có thể cập nhật chi nhánh của mình (enforced by `authorizeStaffBranch` middleware)
- Staff cố gắng update chi nhánh khác → **403 Forbidden**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `branchId` (integer): Branch ID
- `productId` (integer): Product ID

**Request Body:**
```json
{
  "stock": 200,
  "note": "Điều chỉnh sau kiểm kê"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "branch_id": 1,
    "product_id": 5,
    "stock": 200,
    "last_updated": "2025-11-24T11:00:00.000Z"
  },
  "message": "Đã cập nhật tồn kho thành công"
}
```

**Error Response (Staff cross-branch):**
```json
{
  "success": false,
  "error": "Bạn chỉ có quyền thao tác trên chi nhánh của mình",
  "details": {
    "your_branch_id": 1,
    "requested_branch_id": 2
  }
}
```

---

## 4. BRANCH INVENTORY (GLOBAL ROUTES)

### 4.1 GET `/api/branch-inventory`

**Mô tả:** Xem tất cả tồn kho (cross-branch), có thể filter theo chi nhánh

**Auth:** 🔒 Staff/Admin

**⚠️ Authorization:**
- **Admin**: Xem tất cả chi nhánh
- **Staff**: Xem tất cả chi nhánh (READ cross-branch permission)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?branch_id=1
&product_id=5
&page=1
&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 1,
        "branch_id": 1,
        "product_id": 5,
        "stock": 150,
        "min_stock": 20,
        "max_stock": 500,
        "branches": {
          "id": 1,
          "name": "Chi nhánh Quận 1"
        },
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "price": "50000"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 10,
      "totalRecords": 200
    }
  }
}
```

---

### 4.2 GET `/api/branch-inventory/alerts/low-stock`

**Mô tả:** Cảnh báo tồn kho thấp toàn hệ thống (stock < min_stock)

**Auth:** 🔒 Staff/Admin

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_low_stock_items": 15,
    "products": [
      {
        "product_id": 5,
        "product_name": "Paracetamol 500mg",
        "unit_type": "Hộp",
        "branches": [
          {
            "branch_id": 1,
            "branch_name": "Chi nhánh Quận 1",
            "branch_address": "123 Lê Lợi",
            "current_stock": 10,
            "min_stock": 20,
            "shortage": 10,
            "reorder_point": 15,
            "reorder_quantity": 50
          }
        ]
      }
    ]
  }
}
```

---

### 4.3 GET `/api/branch-inventory/:id`

**Mô tả:** Xem chi tiết 1 record inventory

**Auth:** 🔒 Staff/Admin

---

### 4.4 POST `/api/branch-inventory`

**Mô tả:** Tạo bản ghi inventory mới

**Auth:** 🔒 Admin only

---

### 4.5 DELETE `/api/branch-inventory/:id`

**Mô tả:** Xóa bản ghi inventory

**Auth:** 🔒 Admin only

**Validation:**
- ❌ Không thể xóa nếu có giao dịch (inventoryLog)

---

### 4.6 🔄 POST `/api/branch-inventory/import`

**Mô tả:** Nhập kho với tự động tạo batch (🆕 v5.1.0 Enhanced)

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ v5.1.0 IMPORTANT CHANGES:**
- Tự động tạo `productBatch` khi nhập kho (đảm bảo đồng bộ inventory và batch)
- Hỗ trợ batch information tùy chọn
- Auto-generate `batch_number` nếu không cung cấp
- Flag `skip_batch` để tương thích ngược (mặc định: `false`)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Full - với batch info):**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "quantity": 100,
  "unit_id": 1,
  "note": "Nhập hàng từ NCC ABC",
  "batch_number": "BATCH-2025-001",
  "manufacture_date": "2025-01-01",
  "expiry_date": "2027-01-01",
  "cost_price": 45000,
  "selling_price": 50000,
  "supplier_id": 1
}
```

**Request Body (Minimal - auto-generate batch):**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "quantity": 100
}
```

**Request Body (Legacy - không tạo batch):**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "quantity": 100,
  "skip_batch": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "branch_id": 1,
    "product_id": 5,
    "stock": 250,
    "last_updated": "2025-11-27T10:00:00.000Z",
    "branches": { "id": 1, "name": "Chi nhánh Quận 1" },
    "products": { "id": 5, "name": "Paracetamol 500mg" }
  },
  "batch": {
    "id": 123,
    "batch_number": "AUTO-5-1-20251127103045-A1B2",
    "quantity": 100,
    "status": "active"
  },
  "message": "Đã nhập 100 sản phẩm vào lô AUTO-5-1-20251127103045-A1B2"
}
```

**Auto-generated Batch Number Format:**
```
AUTO-{product_id}-{branch_id}-{YYYYMMDDHHMMSS}-{random_4_chars}
Example: AUTO-5-1-20251127103045-A1B2
```

---

## 5. PRODUCT BATCHES (LÔ HÀNG)

### 5.1 GET `/api/product-batches`

**Mô tả:** Lấy danh sách lô hàng với filters

**Auth:** 🔒 Staff/Admin

**Query Parameters:**
```
?branch_id=1
&product_id=5
&status=active|expired|disposed
&expiring_soon=true
&page=1
&limit=20
```

---

### 5.2 GET `/api/product-batches/expiring-soon`

**Mô tả:** Lấy lô hàng sắp hết hạn (cross-branch)

**Auth:** 🔒 Staff/Admin

**Query Parameters:**
```
?days=30
```

---

### 5.3 POST `/api/product-batches`

**Mô tả:** Nhập hàng từ nhà cung cấp (tạo lô hàng mới)

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**Request Body:**
```json
{
  "product_id": 5,
  "branch_id": 1,
  "batch_number": "BATCH-2025-001",
  "manufacture_date": "2025-01-01",
  "expiry_date": "2027-01-01",
  "quantity": 100,
  "cost_price": 45000,
  "selling_price": 50000,
  "supplier_id": 1,
  "note": "Lô hàng tháng 1"
}
```

**Logic tự động:**
1. ✅ Tạo record `productBatch`
2. ✅ Tăng `branchinventory.stock` (+=quantity)
3. ✅ Tạo `inventoryLog` (type='IMPORT')

---

### 5.4 POST `/api/product-batches/:id/expire`

**Mô tả:** Đánh dấu lô hàng hết hạn (⚠️ KHÔNG tự động trừ stock)

**Auth:** 🔒 Staff/Admin

**🆕 v5.0 Logic Change:**
- ✅ Update `productBatch.status = 'expired'`
- ✅ Tạo `inventoryLog` với `quantity = 0` (chỉ ghi nhận, không trừ stock)
- ⚠️ **KHÔNG** tự động trừ `branchinventory.stock`
- 📌 Hàng hết hạn vẫn còn trong kho, cần xử lý riêng (tiêu hủy/trả NCC)

**Response:**
```json
{
  "success": true,
  "data": { "id": 123, "status": "expired", "quantity": 50 },
  "message": "Đã đánh dấu lô hàng hết hạn. Số lượng 50 cần được xử lý (tiêu hủy/trả hàng).",
  "warning": "Còn 50 sản phẩm trong lô cần xử lý"
}
```

---

### 5.5 🆕 POST `/api/product-batches/:id/dispose`

**Mô tả:** Tiêu hủy lô hàng hết hạn (trừ stock thực tế)

**Auth:** 🔒 Staff/Admin

**⚠️ Điều kiện:**
- Chỉ tiêu hủy được lô có `status = 'expired'`
- Lô phải còn `quantity > 0`

**Request Body:**
```json
{
  "note": "Tiêu hủy theo quy định - Biên bản số 123"
}
```

**Logic:**
1. ✅ Update `productBatch.quantity = 0`
2. ✅ Update `productBatch.status = 'disposed'`
3. ✅ Trừ `branchinventory.stock` (thực sự xuất kho)
4. ✅ Tạo `inventoryLog` (type='DISPOSAL')

**Response:**
```json
{
  "success": true,
  "data": { "id": 123, "status": "disposed", "quantity": 0 },
  "message": "Đã tiêu hủy 50 sản phẩm từ lô BATCH-2025-001"
}
```

---

### 5.6 POST `/api/product-batches/:id/add-stock`

**Mô tả:** Nhập thêm số lượng vào lô hàng đã có

**Auth:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "quantity": 50,
  "note": "Nhập bổ sung"
}
```

---

### 5.7 DELETE `/api/product-batches/:id`

**Mô tả:** Xóa lô hàng (chỉ khi chưa có giao dịch)

**Auth:** 🔒 Admin only

---

### 5.8 🔄 GET `/api/product-batches/validate/:branchId/:productId`

**Mô tả:** Kiểm tra đồng bộ giữa tổng batch và inventory (🆕 v5.1.0 Enhanced)

**Auth:** 🔒 Staff/Admin

**⚠️ v5.1.0 IMPORTANT CHANGES:**
- Giờ tính cả batch `expired` có quantity > 0 (chưa tiêu hủy)
- Chỉ loại trừ batch `disposed` (đã tiêu hủy thực sự)
- Cung cấp chi tiết breakdown theo status

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_total": 150,
    "inventory_stock": 150,
    "is_consistent": true,
    "discrepancy": 0,
    "breakdown": {
      "active_quantity": 120,
      "expired_quantity": 30,
      "disposed_quantity": 0
    },
    "note": "Batch total bao gồm cả lô expired chưa tiêu hủy"
  }
}
```

**Inconsistent Response:**
```json
{
  "success": true,
  "data": {
    "batch_total": 140,
    "inventory_stock": 150,
    "is_consistent": false,
    "discrepancy": 10,
    "breakdown": {
      "active_quantity": 110,
      "expired_quantity": 30,
      "disposed_quantity": 0
    },
    "warning": "Tồn kho không khớp với tổng batch. Cần kiểm kê hoặc reconcile."
  }
}
```

---

## 6. 🆕 FEFO OPERATIONS (XUẤT KHO THEO HẠN)

> **FEFO = First Expired First Out**  
> Lô hết hạn sớm nhất sẽ được xuất trước

### 6.1 GET `/api/product-batches/fefo/:branchId/:productId`

**Mô tả:** Lấy danh sách lô hàng theo thứ tự FEFO

**Auth:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": 101,
        "batch_number": "BATCH-2025-001",
        "quantity": 30,
        "expiry_date": "2025-12-15",  // Hết hạn sớm nhất → xuất trước
        "status": "active"
      },
      {
        "id": 102,
        "batch_number": "BATCH-2025-002",
        "quantity": 50,
        "expiry_date": "2026-03-01",
        "status": "active"
      },
      {
        "id": 103,
        "batch_number": "BATCH-2025-003",
        "quantity": 100,
        "expiry_date": null,  // Không có HSD → xuất cuối cùng
        "status": "active"
      }
    ],
    "totalAvailable": 180,
    "batchCount": 3
  }
}
```

---

### 6.2 POST `/api/product-batches/fefo/allocate`

**Mô tả:** Xem trước phân bổ xuất kho theo FEFO (không thực sự xuất)

**Auth:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "quantity": 70
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allocations": [
      {
        "batch_id": 101,
        "batch_number": "BATCH-2025-001",
        "expiry_date": "2025-12-15",
        "available_qty": 30,
        "allocated_qty": 30,  // Lấy hết lô này
        "remaining_after": 0
      },
      {
        "batch_id": 102,
        "batch_number": "BATCH-2025-002",
        "expiry_date": "2026-03-01",
        "available_qty": 50,
        "allocated_qty": 40,  // Lấy 40 từ lô này
        "remaining_after": 10
      }
    ],
    "totalAllocated": 70,
    "batchesUsed": 2
  }
}
```

---

### 6.3 POST `/api/product-batches/fefo/export`

**Mô tả:** Xuất kho theo FEFO (thực sự trừ stock)

**Auth:** 🔒 Staff/Admin + Branch Authorization

**Request Body:**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "quantity": 70,
  "reference_type": "sale",
  "reference_id": 12345,
  "note": "Xuất bán đơn hàng #12345"
}
```

**Logic:**
1. ✅ Phân bổ từ các lô theo FEFO
2. ✅ Trừ `productBatch.quantity` cho từng lô
3. ✅ Trừ `branchinventory.stock`
4. ✅ Tạo `inventoryLog` cho mỗi lô được xuất

**Response:**
```json
{
  "success": true,
  "data": {
    "allocations": [...],
    "logs": [...],
    "totalExported": 70
  },
  "message": "Đã xuất 70 sản phẩm từ 2 lô theo FEFO"
}
```

---

### 6.4 POST `/api/product-batches/import`

**Mô tả:** Nhập kho (tạo lô mới hoặc thêm vào lô có sẵn)

**Auth:** 🔒 Staff/Admin + Branch Authorization

**Request Body (tạo lô mới):**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "batch_number": "BATCH-2025-004",
  "quantity": 100,
  "expiry_date": "2027-01-01",
  "supplier_id": 1
}
```

**Request Body (thêm vào lô có sẵn):**
```json
{
  "branch_id": 1,
  "product_id": 5,
  "batch_id": 101,  // ID lô đã có
  "quantity": 50
}
```

---

### 6.5 GET `/api/product-batches/summary/:branchId/:productId`

**Mô tả:** Tổng quan lô hàng của 1 sản phẩm tại chi nhánh

**Auth:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "total_batches": 5,
    "active_batches": 3,
    "expired_batches": 1,
    "expiring_soon_batches": 1,
    "total_quantity": 200,
    "active_quantity": 150,
    "expired_quantity": 30,
    "expiring_soon_quantity": 20,
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

### 6.6 GET `/api/product-batches/validate/:branchId/:productId`

**Mô tả:** Kiểm tra đồng bộ giữa tổng batch và inventory

**Auth:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_total": 150,
    "inventory_stock": 150,
    "is_consistent": true,
    "discrepancy": 0
  }
}
```

---

### 6.7 POST `/api/product-batches/reconcile/:branchId/:productId`

**Mô tả:** Đồng bộ inventory với tổng batch

**Auth:** 🔒 Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "previous_stock": 160,
    "new_stock": 150,
    "adjustment": -10
  },
  "message": "Đã điều chỉnh tồn kho từ 160 thành 150"
}
```

---

### 6.8 POST `/api/product-batches/auto-expire`

**Mô tả:** Tự động đánh dấu các lô đã quá hạn (dùng cho cron job)

**Auth:** 🔒 Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "results": [
      { "batch_id": 101, "batch_number": "BATCH-2024-001", "success": true },
      { "batch_id": 102, "batch_number": "BATCH-2024-002", "success": true }
    ]
  },
  "message": "Đã xử lý 5 lô hàng hết hạn"
}
```

---

### 6.9 GET `/api/product-batches/generate-number/:productId/:branchId`

**Mô tả:** Tạo mã lô hàng tự động

**Auth:** 🔒 Staff/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_number": "BATCH-5-1-20251127-A1B2"
  }
}
```

---

## 7. INVENTORY TRANSFERS (CHUYỂN KHO)

### 7.1 Workflow 4 bước (🆕 với FEFO)

```
Step 1: PENDING   → Staff tạo phiếu chuyển
Step 2: APPROVED  → Admin/Manager duyệt  
Step 3: SHIPPED   → Xuất kho theo FEFO (trừ từ lô hết hạn sớm nhất)
Step 4: COMPLETED → Nhận kho (tạo lô mới tại chi nhánh đích)
```

### 7.2 🆕 POST `/api/inventory-transfers/:id/ship`

**Mô tả:** Xuất kho - Trừ stock theo FEFO

**Auth:** 🔒 Staff/Admin + Branch Authorization

**🆕 v5.0 Logic:**
1. ✅ Tự động phân bổ từ các lô theo FEFO
2. ✅ Trừ `productBatch.quantity` cho từng lô
3. ✅ Trừ `branchinventory.stock` chi nhánh nguồn
4. ✅ Lưu thông tin allocation vào transfer note

**Response:**
```json
{
  "success": true,
  "data": { "id": 1, "status": "shipped" },
  "fefo_allocations": [
    { "batch_id": 101, "batch_number": "BATCH-2025-001", "allocated_qty": 30 },
    { "batch_id": 102, "batch_number": "BATCH-2025-002", "allocated_qty": 20 }
  ],
  "message": "Đã xuất 50 sản phẩm từ 2 lô theo FEFO"
}
```

---

### 7.3 🆕 POST `/api/inventory-transfers/:id/receive`

**Mô tả:** Nhận kho - Tạo lô mới tại chi nhánh đích

**Auth:** 🔒 Staff/Admin + Branch Authorization

**🆕 v5.0 Logic:**
1. ✅ Cộng `branchinventory.stock` chi nhánh đích
2. ✅ Tạo `productBatch` mới với thông tin từ lô nguồn (giữ nguyên expiry_date)
3. ✅ Batch number format: `TRF-{transfer_id}-{original_batch_number}`

**Response:**
```json
{
  "success": true,
  "data": { "id": 1, "status": "completed" },
  "created_batches": [
    { "id": 201, "batch_number": "TRF-1-BATCH-2025-001", "quantity": 30 },
    { "id": 202, "batch_number": "TRF-1-BATCH-2025-002", "quantity": 20 }
  ],
  "message": "Đã nhận 50 sản phẩm và tạo 2 lô hàng mới"
}
```

---

## 8. STOCK TAKES (KIỂM KÊ)

### 8.1 Overview

Stock Take (Kiểm kê) là quy trình kiểm tra và điều chỉnh tồn kho thực tế so với hệ thống.

**🆕 v5.1.0 Enhancement:**
- `completeStockTake` giờ điều chỉnh cả `productBatch.quantity` theo FEFO
- Đảm bảo đồng bộ giữa `branchinventory.stock` và tổng `productBatch.quantity`

### 8.2 Workflow

```
Step 1: CREATE    → Tạo phiên kiểm kê (status: draft)
Step 2: ADD ITEMS → Thêm sản phẩm cần kiểm kê
Step 3: COUNT     → Nhập số lượng thực tế
Step 4: COMPLETE  → Hoàn thành và điều chỉnh tồn kho + batch
```

---

### 8.3 POST `/api/stock-takes`

**Mô tả:** Tạo phiên kiểm kê mới

**Auth:** 🔒 Staff/Admin + Branch Authorization

**Request Body:**
```json
{
  "branch_id": 1,
  "note": "Kiểm kê định kỳ tháng 11"
}
```

---

### 8.4 POST `/api/stock-takes/:id/items`

**Mô tả:** Thêm sản phẩm vào phiên kiểm kê

**Auth:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "product_id": 5,
  "system_quantity": 150
}
```

---

### 8.5 PUT `/api/stock-takes/:id/items/:itemId`

**Mô tả:** Cập nhật số lượng thực tế

**Auth:** 🔒 Staff/Admin

**Request Body:**
```json
{
  "actual_quantity": 145,
  "note": "Thiếu 5 do hư hỏng"
}
```

---

### 8.6 🔄 POST `/api/stock-takes/:id/complete`

**Mô tả:** Hoàn thành kiểm kê và điều chỉnh tồn kho (🆕 v5.1.0 Enhanced)

**Auth:** 🔒 Staff/Admin + Branch Authorization

**⚠️ v5.1.0 IMPORTANT CHANGES:**
- Điều chỉnh cả `branchinventory.stock` VÀ `productBatch.quantity`
- Sử dụng FEFO để xác định batch nào cần điều chỉnh
- Tạo `inventoryLog` với chi tiết batch adjustments

**Logic điều chỉnh batch (FEFO):**

**Trường hợp 1: Thừa hàng (actual > system)**
```
- Tạo batch mới với số lượng = difference
- Batch number format: STOCKTAKE-{stocktake_id}-{product_id}-{timestamp}
```

**Trường hợp 2: Thiếu hàng (actual < system)**
```
- Trừ từ các batch theo FEFO (hết hạn sớm nhất trước)
- Nếu thiếu > tổng batch → Tạo adjustment batch với quantity âm (ghi nhận)
```

**Request Body:**
```json
{
  "note": "Hoàn thành kiểm kê, đã xác nhận chênh lệch"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "completed_at": "2025-11-27T15:00:00.000Z",
    "completed_by": 5
  },
  "adjustments": [
    {
      "product_id": 5,
      "product_name": "Paracetamol 500mg",
      "system_quantity": 150,
      "actual_quantity": 145,
      "difference": -5,
      "batch_adjustments": [
        {
          "batch_id": 101,
          "batch_number": "BATCH-2025-001",
          "previous_quantity": 30,
          "adjusted_quantity": 25,
          "change": -5
        }
      ]
    },
    {
      "product_id": 10,
      "product_name": "Vitamin C 500mg",
      "system_quantity": 100,
      "actual_quantity": 110,
      "difference": 10,
      "batch_adjustments": [
        {
          "batch_id": null,
          "batch_number": "STOCKTAKE-1-10-20251127150000",
          "previous_quantity": 0,
          "adjusted_quantity": 10,
          "change": 10,
          "note": "Batch mới tạo từ kiểm kê"
        }
      ]
    }
  ],
  "summary": {
    "total_items": 2,
    "items_with_difference": 2,
    "total_surplus": 10,
    "total_shortage": 5,
    "net_adjustment": 5
  },
  "message": "Đã hoàn thành kiểm kê và điều chỉnh 2 sản phẩm"
}
```

---

## 9. AUTHORIZATION MATRIX

| Endpoint | Public | Customer | Staff (Read) | Staff (Write) | Admin |
|----------|--------|----------|--------------|---------------|-------|
| **Branches** |
| GET /branches | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /branches/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /branches | ❌ | ❌ | ❌ | ❌ | ✅ |
| PUT /branches/:id | ❌ | ❌ | ❌ | ❌ | ✅ |
| DELETE /branches/:id | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Branch Inventory (Nested)** |
| GET /branches/:id/inventory | ✅ Masked | ✅ Masked | ✅ Full (Cross-branch) | N/A | ✅ Full |
| GET /branches/:id/inventory/:productId | ✅ Masked | ✅ Masked | ✅ Full (Cross-branch) | N/A | ✅ Full w/ cost |
| GET /branches/:id/inventory/alerts/* | ❌ | ❌ | ✅ Cross-branch | N/A | ✅ |
| PUT /branches/:id/inventory/:productId | ❌ | ❌ | ❌ | ✅ Own branch only | ✅ All |
| **Branch Inventory (Global)** |
| GET /branch-inventory | ❌ | ❌ | ✅ Cross-branch | N/A | ✅ |
| POST /branch-inventory | ❌ | ❌ | ❌ | ❌ | ✅ |
| DELETE /branch-inventory/:id | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Product Batches** |
| GET /product-batches | ❌ | ❌ | ✅ (no cost_price) | N/A | ✅ (w/ cost_price) |
| POST /product-batches | ❌ | ❌ | ❌ | ✅ Own branch only | ✅ All |
| PUT /product-batches/:id | ❌ | ❌ | ✅ | ✅ | ✅ |
| DELETE /product-batches/:id | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Inventory Transfers** |
| GET /inventory-transfers | ❌ | ❌ | ✅ | ✅ | ✅ |
| POST /inventory-transfers | ❌ | ❌ | ❌ | ✅ From own branch | ✅ |
| POST /:id/approve | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /:id/ship | ❌ | ❌ | ❌ | ✅ From own branch | ✅ |
| POST /:id/receive | ❌ | ❌ | ❌ | ✅ To own branch | ✅ |
| **Stock Takes** |
| GET /stock-takes | ❌ | ❌ | ✅ | ✅ | ✅ |
| POST /stock-takes | ❌ | ❌ | ❌ | ✅ Own branch only | ✅ |
| PUT /:id/items/:itemId | ❌ | ❌ | ✅ | ✅ | ✅ |
| POST /:id/complete | ❌ | ❌ | ✅ | ✅ | ✅ |

**Legend:**
- **Read**: Staff can view across all branches (for customer support)
- **Write**: Staff can only modify their own branch
- **Masked**: Data is masked (see section 10)

---

## 10. DATA MASKING RULES

### 10.1 Inventory Data Masking (Public/Customer)

**Original Data:**
```json
{
  "id": 1,
  "branch_id": 1,
  "product_id": 5,
  "stock": 150,
  "min_stock": 20,
  "max_stock": 500,
  "last_updated": "2025-11-24T10:00:00Z"
}
```

**Masked Data (Public/Customer):**
```json
{
  "id": 1,
  "branch_id": 1,
  "product_id": 5,
  "in_stock": true,  // ✅ Derived from stock > 0
  "last_updated": "2025-11-24T10:00:00Z"
  // ❌ stock, min_stock, max_stock removed
}
```

### 10.2 Batch Data Masking

**Staff Response:**
```json
{
  "id": 123,
  "batch_number": "BATCH-2025-001",
  "quantity": 50,
  "expiry_date": "2026-06-01",
  "selling_price": "50000",
  "supplier": {
    "id": 1,
    "name": "Nhà cung cấp ABC"
  }
  // ❌ cost_price removed for staff
}
```

**Public/Customer Response:**
```json
{
  "batch_number": "BATCH-2025-001",
  "expiry_date": "2026-06-01"
  // ❌ quantity, cost_price, selling_price, supplier removed
}
```

### 10.3 Implementation

Data masking được thực hiện trong **Controller layer** dựa trên `req.user`:

```javascript
// branchInventoryController.js
export const getBranchInventoryByBranchId = async (req, res) => {
  // ...fetch data...
  
  // Data masking logic
  if (!req.user || req.user.role_name === 'customer') {
    // Mask sensitive data
    inventory = inventory.map(item => ({
      id: item.id,
      branch_id: item.branch_id,
      product_id: item.product_id,
      in_stock: item.stock > 0,  // ✅ Boolean only
      last_updated: item.last_updated,
      products: item.products
    }));
  }
  
  // Staff/Admin see full data
  return res.json({ success: true, data: inventory });
};
```

---

## 11. 🆕 UTILITY FUNCTIONS

### 11.1 Overview

Các utility functions mới được thêm vào `src/utils/validation.js` để hỗ trợ validation quyền branch cho staff.

### 11.2 `validateStaffBranchPermission(user, requestedBranchId)`

**Mô tả:** Validate quyền staff trên branch cho inventory operations

**Parameters:**
- `user` (Object): User object từ `req.user` (JWT decoded)
- `requestedBranchId` (number): Branch ID đang được truy cập

**Returns:**
```javascript
{
  allowed: boolean,
  error?: string,
  userBranchId?: number,
  requestedBranchId?: number,
  autoAssigned?: boolean
}
```

**Usage Example:**
```javascript
import { validateStaffBranchPermission } from '../../../utils/validation.js';

// Trong controller:
const validation = validateStaffBranchPermission(req.user, req.body.branch_id);
if (!validation.allowed) {
  return res.status(403).json({ 
    success: false, 
    error: validation.error 
  });
}
```

**Logic:**
| User Role | Requested Branch | Result |
|-----------|------------------|--------|
| Admin | Any | ✅ Allowed |
| Customer | Any | ❌ Forbidden |
| Staff (no branch assigned) | Any | ❌ Forbidden |
| Staff | Own branch | ✅ Allowed |
| Staff | Other branch | ❌ Forbidden |
| Staff | Not specified | ✅ Allowed (auto-assign own branch) |

---

### 11.3 `getEffectiveBranchId(user, requestedBranchId)`

**Mô tả:** Lấy branch_id hiệu quả cho inventory operations

**Parameters:**
- `user` (Object): User object từ `req.user`
- `requestedBranchId` (number|null): Branch ID từ request

**Returns:**
```javascript
{
  branchId: number | null,
  error?: string
}
```

**Usage Example:**
```javascript
import { getEffectiveBranchId } from '../../../utils/validation.js';

// Trong service hoặc controller:
const { branchId, error } = getEffectiveBranchId(req.user, req.body.branch_id);
if (error) {
  return res.status(400).json({ success: false, error });

// Sử dụng branchId cho operations
const result = await importToBranchInventory({ 
  branch_id: branchId, 
  ...otherData 
});
```

**Logic:**
| User Role | Requested Branch | Effective Branch |
|-----------|------------------|------------------|
| Admin | Specified | Requested branch |
| Admin | Not specified | ❌ Error: "Admin phải chỉ định branch_id" |
| Staff | Specified (own) | Own branch |
| Staff | Specified (other) | ❌ Error: "Bạn chỉ có quyền thao tác trên chi nhánh của mình" |
| Staff | Not specified | Own branch (auto-assigned) |

---

### 11.4 Implementation Location

```
Back-End-Web/
└── src/
    └── utils/
        └── validation.js  ← Utility functions
```

**Exported Functions:**
```javascript
export {
  validateRequiredFields,
  validateNumericFields,
  isValidEmail,
  isValidPhone,
  isValidBirthdate,
  isValidDateRange,
  validateStaffBranchPermission,  // 🆕 v5.1.0
  getEffectiveBranchId            // 🆕 v5.1.0
};
```

---

## 📝 CHANGELOG

### v5.1.0 (November 27, 2025)
- 🆕 **Auto Batch on Import**: `importToBranchInventory` tự động tạo batch
- 🆕 **Batch Number Auto-generation**: Format `AUTO-{productId}-{branchId}-{timestamp}-{random}`
- 🔧 **Fix**: `validateStockConsistency` giờ tính cả batch `expired`, chỉ loại trừ `disposed`
- 🔧 **Fix**: `completeStockTake` điều chỉnh cả `productBatch.quantity` theo FEFO
- 🆕 **Utility Functions**: `validateStaffBranchPermission()`, `getEffectiveBranchId()`
- 📝 **Documentation**: Cập nhật chi tiết các thay đổi và ví dụ sử dụng

### v5.0.0 (November 27, 2025)
- 🆕 **FEFO Integration**: Xuất kho tự động theo First Expired First Out
- 🆕 **Batch Lifecycle**: active → expired → disposed
- 🆕 **Dispose Endpoint**: `POST /product-batches/:id/dispose`
- 🔧 **Fix**: `markBatchAsExpired` không còn tự động trừ stock
- 🔧 **Fix**: Transfer ship/receive tích hợp FEFO và tạo batch tại destination
- 🆕 **Stock Reconciliation**: Đồng bộ batch total với inventory stock
- 🆕 **Auto-expire**: Cron job endpoint để tự động đánh dấu lô hết hạn

### v4.0.1 (November 25, 2025)
- Security audit completed
- Data masking for Public/Customer

---

**Document Version:** 5.1.0  
**Last Updated:** November 27, 2025  
**Security Audit:** ✅ COMPLETED  
**Code Review:** ✅ VERIFIED  
**Status:** 🟢 PRODUCTION READY
