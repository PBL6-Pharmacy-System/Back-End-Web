# 📦 INVENTORY MANAGEMENT API ENDPOINTS

> **Version:** 4.0.1 (With Data Masking & Enhanced RBAC)  
> **Last Updated:** November 25, 2025  
> **Base URL:** `http://localhost:3000/api`  
> **Security Status:** ✅ AUDITED & SECURED

---

## 📋 MỤC LỤC

1. [Overview & Security](#1-overview--security)
2. [Branches (Chi nhánh)](#2-branches-chi-nhánh)
3. [Branch Inventory (Nested Routes)](#3-branch-inventory-nested-routes)
4. [Branch Inventory (Global Routes)](#4-branch-inventory-global-routes)
5. [Product Batches (Lô hàng)](#5-product-batches-lô-hàng)
6. [Inventory Transfers (Chuyển kho)](#6-inventory-transfers-chuyển-kho)
7. [Stock Takes (Kiểm kê)](#7-stock-takes-kiểm-kê)
8. [Authorization Matrix](#8-authorization-matrix)
9. [Data Masking Rules](#9-data-masking-rules)

---

## 1. OVERVIEW & SECURITY

### 1.1 Major Changes (v4.0.0)

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

**🔒 Security Note:** Batch information (batch_number, expiry_date, manufacture_date) là thông tin **quản lý nội bộ** và chỉ dành cho Staff/Admin. Public/Customer **KHÔNG** cần và **KHÔNG NÊN** thấy thông tin này vì:
- ❌ Tiết lộ hệ thống quản lý kho nội bộ
- ❌ Cho competitor biết chu kỳ nhập hàng
- ❌ Không cần thiết cho việc mua sắm
- ✅ Chỉ cần biết sản phẩm "có hàng" hay "hết hàng"

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

## 5. PRODUCT BATCHES (LÔ HÀNG)

### 5.1 GET `/api/product-batches`

**Mô tả:** Lấy danh sách lô hàng với filters

**Auth:** 🔒 Staff/Admin

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?branch_id=1
&product_id=5
&status=active
&expiring_soon=true
&page=1
&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": 123,
        "batch_number": "BATCH-2025-001",
        "product_id": 5,
        "branch_id": 1,
        "quantity": 50,
        "manufacture_date": "2025-01-01",
        "expiry_date": "2026-06-01",
        "cost_price": "45000",  // ⚠️ Staff không thấy field này
        "selling_price": "50000",
        "status": "active",
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg"
        },
        "branches": {
          "id": 1,
          "name": "Chi nhánh Quận 1"
        },
        "suppliers": {
          "id": 1,
          "name": "Nhà cung cấp ABC"
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

**⚠️ Authorization:**
- **Admin**: Nhập hàng cho bất kỳ chi nhánh nào
- **Staff**: CHỈ nhập hàng cho chi nhánh của mình (enforced by `authorizeStaffBranch`)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

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
2. ✅ Tăng `branchinventory.stock` (+=100)
3. ✅ Tạo `inventoryLog` (type='IMPORT')

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": 123,
      "batch_number": "BATCH-2025-001",
      "quantity": 100,
      "expiry_date": "2027-01-01",
      "status": "active"
    },
    "inventory_updated": {
      "branch_id": 1,
      "product_id": 5,
      "old_stock": 50,
      "new_stock": 150
    }
  }
}
```

---

### 5.4 PUT `/api/product-batches/:id`

**Mô tả:** Cập nhật thông tin lô hàng

**Auth:** 🔒 Staff/Admin

---

### 5.5 POST `/api/product-batches/:id/expire`

**Mô tả:** Đánh dấu lô hàng hết hạn

**Auth:** 🔒 Staff/Admin

**Logic:**
1. ✅ Update `productBatch.status = 'expired'`
2. ✅ Trừ `branchinventory.stock`
3. ✅ Tạo `inventoryLog` (type='DAMAGE')

---

### 5.6 DELETE `/api/product-batches/:id`

**Mô tả:** Xóa lô hàng

**Auth:** 🔒 Admin only

---

## 6. INVENTORY TRANSFERS (CHUYỂN KHO)

### 6.1 Workflow 4 bước

```
Step 1: PENDING   → Staff tạo phiếu chuyển
Step 2: APPROVED  → Admin/Manager duyệt
Step 3: SHIPPED   → Xuất kho (trừ stock chi nhánh nguồn)
Step 4: COMPLETED → Nhận kho (cộng stock chi nhánh đích)
```

### 6.2 GET `/api/inventory-transfers`

**Mô tả:** Lấy danh sách phiếu chuyển kho

**Auth:** 🔒 Staff/Admin

**Query Parameters:**
```
?status=pending
&from_branch_id=1
&to_branch_id=2
&page=1
&limit=20
```

---

### 6.3 POST `/api/inventory-transfers`

**Mô tả:** Tạo phiếu chuyển kho (PENDING)

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ Authorization:**
- **Admin**: Chuyển từ bất kỳ chi nhánh nào
- **Staff**: CHỈ chuyển từ chi nhánh của mình (`from_branch_id` = staff's branch)

**Request Body:**
```json
{
  "from_branch_id": 1,
  "to_branch_id": 2,
  "product_id": 5,
  "quantity": 50,
  "note": "Chuyển kho bổ sung"
}
```

**Validation:**
- ✅ `from_branch_id ≠ to_branch_id`
- ✅ Chi nhánh nguồn có đủ tồn kho

---

### 6.4 POST `/api/inventory-transfers/:id/approve`

**Mô tả:** Duyệt phiếu chuyển kho (APPROVED)

**Auth:** 🔒 Admin only

---

### 6.5 POST `/api/inventory-transfers/:id/ship`

**Mô tả:** Xuất kho - Trừ stock chi nhánh nguồn (SHIPPED)

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ Authorization:**
- Staff CHỈ xuất kho từ chi nhánh của mình

---

### 6.6 POST `/api/inventory-transfers/:id/receive`

**Mô tả:** Nhận kho - Cộng stock chi nhánh đích (COMPLETED)

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ Authorization:**
- Staff CHỈ nhận kho tại chi nhánh của mình

---

### 6.7 POST `/api/inventory-transfers/:id/cancel`

**Mô tả:** Hủy phiếu chuyển kho

**Auth:** 🔒 Staff/Admin

**Validation:**
- ⚠️ Chỉ hủy được khi: `status ∈ ['pending', 'approved']`

---

## 7. STOCK TAKES (KIỂM KÊ)

### 7.1 GET `/api/stock-takes`

**Mô tả:** Lấy danh sách phiếu kiểm kê

**Auth:** 🔒 Staff/Admin

---

### 7.2 POST `/api/stock-takes`

**Mô tả:** Tạo phiếu kiểm kê

**Auth:** 🔒 Staff/Admin + **Branch Authorization**

**⚠️ Authorization:**
- **Admin**: Kiểm kê bất kỳ chi nhánh nào
- **Staff**: CHỈ kiểm kê chi nhánh của mình

**Request Body:**
```json
{
  "branch_id": 1,
  "note": "Kiểm kê cuối tháng"
}
```

---

### 7.3 PUT `/api/stock-takes/:id/items/:itemId`

**Mô tả:** Cập nhật số lượng thực tế

**Auth:** 🔒 Staff/Admin

---

### 7.4 POST `/api/stock-takes/:id/complete`

**Mô tả:** Hoàn thành kiểm kê - Cập nhật tồn kho

**Auth:** 🔒 Staff/Admin

**Transaction:**
1. ✅ Update `stockTake.status = 'completed'`
2. ✅ Update `branchinventory.stock` theo `actual_qty`
3. ✅ Tạo `inventoryLog` cho từng chênh lệch (type='ADJUSTMENT')

---

## 8. AUTHORIZATION MATRIX

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
- **Masked**: Data is masked (see section 9)

---

## 9. DATA MASKING RULES

### 9.1 Inventory Data Masking (Public/Customer)

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

### 9.2 Batch Data Masking

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

### 9.3 Implementation

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

## 📝 NOTES

### Security Best Practices

1. **Data Masking**: Luôn áp dụng cho Public/Customer endpoints
2. **JWT Validation**: Token được verify tại middleware layer
3. **Branch Isolation**: Staff chỉ WRITE own branch (enforced tại middleware)
4. **Cost Price Protection**: Chỉ Admin mới xem được giá nhập
5. **Batch Information Protection v4.0**: Public/Customer KHÔNG XEM được batch details

### Performance Optimizations

1. **Lazy Loading**: Batch details chỉ load khi cần
2. **Pagination**: Tất cả list endpoints đều có pagination
3. **Caching**: Consider caching cho branch list (ít thay đổi)

### Technical Notes

1. **Async Permission Checks**: `canWriteToBranch()` là async function để hỗ trợ database queries trong tương lai
2. **Data Masking Helpers**: `maskBatchArray()` và `maskBatchInfo()` được thiết kế để hoàn toàn ẩn batch info cho Public/Customer
3. **Controller Layer Masking**: Data masking được thực hiện tại controller layer, không phải middleware

### Audit & Compliance

1. **Inventory Logs**: Mọi thay đổi tồn kho đều được log
2. **FEFO Enforcement**: Xuất lô hết hạn sớm nhất trước
3. **Transaction Integrity**: Dùng database transactions cho critical operations
4. **Security Audit v4.0**: Đã loại bỏ hoàn toàn batch information cho Public/Customer

---

**Document Version:** 4.0.1  
**Last Updated:** November 24, 2025  
**Security Audit:** ✅ COMPLETED  
**Code Review:** ✅ VERIFIED  
**Status:** 🟢 PRODUCTION READY
