# 📚 HỆ THỐNG QUẢN LÝ NHÀ THUỐC PBL6 - TÀI LIỆU KỸ THUẬT CHI TIẾT

> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2025-11-19  
> **Tech Stack:** Node.js + Express.js + Prisma ORM + PostgreSQL (Supabase)

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Business Logic](#6-business-logic)
7. [Cron Jobs & Background Tasks](#7-cron-jobs--background-tasks)
8. [Constants & Configurations](#8-constants--configurations)
9. [Error Handling](#9-error-handling)
10. [Deployment](#10-deployment)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả dự án

Hệ thống quản lý nhà thuốc trực tuyến với đầy đủ chức năng:

- **E-commerce**: Mua bán thuốc online
- **Inventory Management**: Quản lý kho chi nhánh
- **Order Processing**: Xử lý đơn hàng tự động
- **Promotion System**: Flash sale, voucher
- **Prescription Management**: Quản lý đơn thuốc
- **Review System**: Đánh giá sản phẩm

### 1.2 Tech Stack

```javascript
{
  "runtime": "Node.js v22.18.0",
  "framework": "Express.js v5.1.0",
  "database": "PostgreSQL (Supabase)",
  "orm": "Prisma ORM v6.16.2",
  "authentication": "JWT (jsonwebtoken)",
  "password_hashing": "bcrypt",
  "cron_jobs": "node-cron",
  "rate_limiting": "express-rate-limit"
}
```

### 1.3 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT Secrets
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN="*"
```

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Cấu trúc thư mục

```
Back-End-Web/
├── app.js                          # Entry point
├── package.json                    # Dependencies
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration files
├── src/
│   ├── config/
│   │   └── db.js                  # Prisma client config
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validate.middleware.js
│   ├── utils/
│   │   ├── constants.js           # App constants
│   │   ├── helpers.js             # Helper functions
│   │   └── validation.js          # Validation rules
│   ├── jobs/
│   │   └── flashsaleJob.js        # Cron job cho flashsale
│   └── modules/
│       ├── auth/                  # Authentication module
│       ├── user-management/       # Users & Customers
│       ├── product-management/    # Products, Categories, Suppliers
│       ├── inventory-management/  # Branches, Inventory
│       ├── order-management/      # Orders, Cart, Payments
│       ├── promotion-management/  # Vouchers, Flashsales
│       ├── review-management/     # Reviews
│       ├── medical/               # Prescriptions
│       └── notification-management/ # Notifications
```

### 2.2 Module Structure Pattern

Mỗi module tuân theo pattern:

```
module-name/
├── moduleController.js    # API handlers
├── moduleService.js       # Business logic
└── moduleRoutes.js        # Route definitions
```

### 2.3 Layered Architecture

```
┌─────────────────────────────────────┐
│         CLIENT (Frontend)           │
└─────────────────┬───────────────────┘
                  │ HTTP/HTTPS
┌─────────────────▼───────────────────┐
│     ROUTES LAYER (Express Router)   │  ← Định nghĩa endpoints
├─────────────────────────────────────┤
│   MIDDLEWARE LAYER                  │  ← Auth, Validation, Rate Limit
├─────────────────────────────────────┤
│   CONTROLLER LAYER                  │  ← Request/Response handling
├─────────────────────────────────────┤
│   SERVICE LAYER (Business Logic)    │  ← Core logic
├─────────────────────────────────────┤
│   DATA ACCESS LAYER (Prisma ORM)    │  ← Database queries
├─────────────────────────────────────┤
│   DATABASE (PostgreSQL/Supabase)    │  ← Data storage
└─────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA

### 3.1 Core Tables

#### 👤 **users** (Authentication)

```prisma
model users {
  id            Int       @id @default(autoincrement())
  username      String    @unique
  password_hash String
  email         String    @unique
  phone         String?   @unique
  role_id       Int       // FK → rolepermissions
  full_name     String?
  avatar_url    String?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @default(now())
}
```

**Mục đích:** Lưu thông tin đăng nhập, liên hệ chung cho tất cả user (Admin, Staff, Customer)

#### 👥 **customers** (Customer Profile)

```prisma
model customers {
  id         Int       @id @default(autoincrement())
  user_id    Int       @unique  // FK → users (One-to-One)
  dob        DateTime?
  gender     String?
  address    String?
  created_at DateTime  @default(now())
  updated_at DateTime  @default(now())
}
```

**Mục đích:** Lưu thông tin MỞ RỘNG riêng cho customer (sinh nhật, giới tính, địa chỉ)

**Quan hệ Users ↔ Customers:**

```
users (1) ←─── (1) customers
  ↑                   ↓
  │                   │
Thông tin chung    Thông tin riêng
(email, phone)     (dob, gender)
```

#### 🏢 **rolepermissions** (Roles)

```prisma
model rolepermissions {
  id        Int    @id @default(autoincrement())
  role_name String @unique  // 'admin', 'staff', 'customer'
}
```

**Roles mặc định:**

- `id=1`: Admin
- `id=2`: Staff
- `id=3`: Customer

#### 💊 **products** (Sản phẩm)

```prisma
model products {
  id                    Int      @id @default(autoincrement())
  name                  String
  description           String?
  price                 Decimal
  stock                 Int      @default(0)
  category_id           Int?     // FK → categories
  supplier_id           Int?     // FK → suppliers
  base_unit_id          Int?     // FK → unittype
  images                Json?    // Array URLs
  manufacturer          String?
  prescription_required Boolean? @default(false)
  sold_count            Int      @default(0)  // Cho best sellers
  // ... các trường khác
}
```

#### 📦 **productunits** (Đơn vị sản phẩm)

```prisma
model productunits {
  id                Int     @id @default(autoincrement())
  product_id        Int     // FK → products
  unit_name         String  // "Hộp", "Viên", "Chai"
  conversion_factor Decimal // Hệ số quy đổi
  price             Decimal
}
```

**Ví dụ:**

- Product: Paracetamol 500mg
  - Unit 1: Hộp (100 viên) - price: 50,000đ - factor: 100
  - Unit 2: Viên - price: 500đ - factor: 1

#### 🛒 **orders** (Đơn hàng & Giỏ hàng)

```prisma
model orders {
  id                  Int      @id @default(autoincrement())
  customer_id         Int      // FK → customers
  voucher_id          Int?     // FK → vouchers
  shipping_address_id Int?     // FK → shippingaddresses
  total_amount        Decimal
  discount_amount     Decimal  @default(0)
  final_amount        Decimal
  status              String   @default("pending")
  order_date          DateTime @default(now())
  updated_at          DateTime @default(now())
}
```

**Status flow:**

```
cart → pending → confirmed → processing → shipping → delivered
         ↓
     cancelled
```

#### 📋 **orderitems** (Chi tiết đơn hàng)

```prisma
model orderitems {
  id         Int     @id @default(autoincrement())
  order_id   Int     // FK → orders
  product_id Int     // FK → products
  unit_id    Int     // FK → productunits
  quantity   Int
  price      Decimal
  subtotal   Decimal
}
```

#### 🎟️ **vouchers** (Mã giảm giá)

```prisma
model vouchers {
  id              Int      @id @default(autoincrement())
  code            String   @unique
  discount_type   String   // 'percentage' | 'fixed_amount'
  discount_value  Decimal
  min_order_value Decimal?
  start_date      DateTime
  end_date        DateTime
  usage_limit     Int?
  used_count      Int      @default(0)
}
```

#### ⚡ **flashsales** & **flashsale_products**

```prisma
model flashsales {
  id          Int      @id @default(autoincrement())
  name        String
  start_time  DateTime
  end_time    DateTime
  status      String   @default("pending")  // 'pending' | 'active' | 'ended'
}

model flashsale_products {
  id           Int     @id @default(autoincrement())
  flashsale_id Int     // FK → flashsales
  product_id   Int     // FK → products
  flash_price  Decimal
  stock_limit  Int
  sold_count   Int     @default(0)
}
```

#### 🏥 **prescriptions** (Đơn thuốc)

```prisma
model prescriptions {
  id                  Int      @id @default(autoincrement())
  customer_id         Int      // FK → customers
  order_id            Int?     // FK → orders
  prescription_number String?  @unique
  doctor_name         String?
  image_url           String?
  pdf_url             String?
  status              String   @default("pending")  // 'pending' | 'verified' | 'rejected'
  verified_by         Int?     // FK → users (staff)
  verified_at         DateTime?
}
```

### 3.2 Quan hệ chính

```
users (1) ──── (1) customers
  │
  ├── (1) ──── (n) logs
  ├── (1) ──── (n) notifications
  └── (1) ──── (n) order_status_history

customers (1) ──── (n) orders
  │
  ├── (1) ──── (n) reviews
  ├── (1) ──── (n) prescriptions
  ├── (1) ──── (n) shippingaddresses
  └── (1) ──── (n) uservouchers

products (1) ──── (n) productunits
  │
  ├── (1) ──── (n) orderitems
  ├── (1) ──── (n) reviews
  ├── (1) ──── (n) branchinventory
  └── (1) ──── (n) flashsale_products

orders (1) ──── (n) orderitems
  │
  ├── (1) ──── (n) payments
  ├── (1) ──── (n) shipments
  └── (1) ──── (n) prescriptions
```

---

## 4. API ENDPOINTS

### 4.1 Authentication Module

#### **POST /api/auth/register**

```javascript
// Body
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567"
}

// Response
{
  "success": true,
  "data": {
    "user": { /* user info */ },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### **POST /api/auth/login**

```javascript
// Body
{
  "username": "user123",  // hoặc email
  "password": "password123"
}
```

#### **POST /api/auth/send-otp** (Customer login)

```javascript
// Body
{
  "phone": "0901234567"
}

// Response
{
  "success": true,
  "message": "Mã OTP đã được gửi",
  "data": {
    "phone": "+84901234567",
    "expiresIn": 300  // 5 phút
  }
}
```

#### **POST /api/auth/verify-otp**

```javascript
// Body
{
  "phone": "0901234567",
  "otpCode": "123456"
}

// Response - Auto tạo customer nếu chưa có
{
  "success": true,
  "data": {
    "user": { /* user info */ },
    "token": "...",
    "refreshToken": "..."
  }
}
```

#### **POST /api/auth/refresh-token**

```javascript
// Body
{
  "refreshToken": "eyJhbGc..."
}
```

---

### 4.2 Product Management Module

#### **GET /api/products**

```javascript
// Query params
?page=1
&limit=10
&category_id=1
&search=paracetamol
&sort=price_asc  // price_asc | price_desc | name_asc | name_desc
&min_price=10000
&max_price=100000

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paracetamol 500mg",
      "price": "50000",
      "stock": 100,
      "images": ["url1", "url2"],
      "categories": { "id": 1, "name": "Thuốc giảm đau" },
      "productunits": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalRecords": 50
  }
}
```

#### **GET /api/products/search**

```javascript
// Query params
?q=paracetamol

// Response - Full-text search
{
  "success": true,
  "data": [/* products matching search */]
}
```

#### **GET /api/products/best-sellers**

```javascript
// Query params
?limit=10

// Response
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "...",
      "rank": 1,
      "sold_count": 150,
      "average_rating": 4.5,
      "review_count": 20
    }
  ]
}
```

#### **GET /api/products/:id**

```javascript
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Paracetamol 500mg",
    "description": "...",
    "price": "50000",
    "stock": 100,
    "categories": {...},
    "suppliers": {...},
    "productunits": [
      {
        "id": 1,
        "unit_name": "Hộp",
        "conversion_factor": "100",
        "price": "50000"
      }
    ],
    "reviews": [...]
  }
}
```

#### **POST /api/products** (Admin only)

```javascript
// Headers
Authorization: Bearer <
  token >
  // Body
  {
    name: "Paracetamol 500mg",
    description: "Thuốc giảm đau hạ sốt",
    price: 50000,
    category_id: 1,
    supplier_id: 1,
    base_unit_id: 1,
    images: ["url1", "url2"],
    manufacturer: "Công ty ABC",
    prescription_required: false,
  };
```

#### **PUT /api/products/:id** (Admin only)

#### **DELETE /api/products/:id** (Admin only)

---

### 4.3 Cart & Checkout Module

#### **GET /api/cart/:customerId**

```javascript
// Headers
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "customer_id": 1,
    "status": "cart",
    "total_amount": "150000",
    "orderItems": [
      {
        "id": 1,
        "product_id": 5,
        "unit_id": 10,
        "quantity": 2,
        "price": "50000",
        "subtotal": "100000",
        "product": {...},
        "productUnit": {...}
      }
    ]
  }
}
```

#### **POST /api/cart/:customerId/add**

```javascript
// Body
{
  "productId": 5,
  "productUnitId": 10,
  "quantity": 2,
  "unitPrice": 50000
}

// Response
{
  "success": true,
  "data": {
    /* orderitem added/updated */
  }
}
```

#### **DELETE /api/cart/:customerId/remove/:itemId**

#### **POST /api/cart/checkout**

```javascript
// Body
{
  "customerId": 1,
  "voucherCode": "SALE50",  // optional
  "shippingAddressId": 1,
  "paymentMethod": "bank_transfer"
}

// Response
{
  "success": true,
  "data": {
    "order": {
      "id": 456,
      "status": "pending",
      "total_amount": "150000",
      "discount_amount": "15000",
      "final_amount": "135000"
    },
    "payment": {
      "id": 789,
      "transaction_id": "TXN-1700123456-456",
      "status": "pending"
    },
    "summary": {
      "subtotal": "150000",
      "discount": "15000",
      "final": "135000"
    }
  }
}
```

#### **POST /api/orders/:id/confirm-payment**

```javascript
// Body
{
  "transactionId": "TXN-1700123456-456"
}

// Response
{
  "success": true,
  "message": "Thanh toán thành công",
  "data": {
    "order": {
      "status": "confirmed",
      "payment_status": "paid"
    }
  }
}
```

---

### 4.4 Order Management Module

#### **GET /api/orders** (Admin/Staff only)

```javascript
// Query params
?page=1
&limit=10
&status=pending
&customerId=1
&startDate=2025-01-01
&endDate=2025-12-31

// Response
{
  "success": true,
  "data": [
    {
      "id": 456,
      "customer_id": 1,
      "status": "confirmed",
      "total_amount": "150000",
      "customers": {...},
      "orderitems": [...],
      "payments": [...]
    }
  ],
  "pagination": {...}
}
```

#### **GET /api/orders/:id**

```javascript
// Headers
Authorization: Bearer <token>

// Response - Chi tiết đầy đủ
{
  "success": true,
  "data": {
    "id": 456,
    "customer_id": 1,
    "status": "confirmed",
    "total_amount": "150000",
    "discount_amount": "15000",
    "final_amount": "135000",
    "order_date": "2025-11-19T10:00:00Z",
    "customers": {
      "id": 1,
      "users": {
        "full_name": "Nguyễn Văn A",
        "phone": "0901234567"
      }
    },
    "orderitems": [
      {
        "id": 1,
        "product_id": 5,
        "quantity": 2,
        "price": "50000",
        "subtotal": "100000",
        "products": {...},
        "productunits": {...}
      }
    ],
    "vouchers": {...},
    "shippingaddresses": {...},
    "payments": [...],
    "shipments": [...],
    "order_status_history": [
      {
        "status": "pending",
        "changed_at": "2025-11-19T10:00:00Z",
        "users": { "full_name": "Admin" }
      }
    ]
  }
}
```

#### **GET /api/customers/:customerId/orders**

```javascript
// Query params
?page=1&limit=10&status=delivered

// Response - Đơn hàng của customer
{
  "success": true,
  "data": [/* orders */],
  "pagination": {...}
}
```

#### **PUT /api/orders/:id/status** (Admin/Staff only)

```javascript
// Body
{
  "status": "confirmed"  // pending | confirmed | processing | shipping | delivered | cancelled
}

// Response
{
  "success": true,
  "data": {
    "order": {...},
    "history": {
      "status": "confirmed",
      "changed_by": 1,
      "changed_at": "2025-11-19T10:30:00Z"
    }
  }
}
```

#### **POST /api/orders/:id/cancel**

```javascript
// Body
{
  "reason": "Khách hàng hủy đơn"
}

// Response
{
  "success": true,
  "message": "Hủy đơn hàng thành công",
  "data": {
    "order": {
      "status": "cancelled",
      "payment_status": "refunded"
    },
    "restoredInventory": true
  }
}
```

#### **GET /api/orders/statistics** (Admin only)

```javascript
// Query params
?startDate=2025-01-01&endDate=2025-12-31

// Response
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "pendingOrders": 50,
    "confirmedOrders": 100,
    "deliveredOrders": 800,
    "cancelledOrders": 50,
    "totalRevenue": "50000000",
    "averageOrderValue": "62500"
  }
}
```

---

### 4.5 Voucher & Flashsale Module

#### **GET /api/vouchers**

```javascript
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "SALE50",
      "discount_type": "percentage",
      "discount_value": "10",
      "min_order_value": "100000",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "usage_limit": 100,
      "used_count": 20
    }
  ]
}
```

#### **POST /api/vouchers** (Admin only)

```javascript
// Body
{
  "code": "SALE50",
  "discount_type": "percentage",  // 'percentage' | 'fixed_amount'
  "discount_value": 10,
  "min_order_value": 100000,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "usage_limit": 100
}
```

#### **GET /api/flashsales**

```javascript
// Query params
?status=active

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Flash Sale Cuối Tuần",
      "start_time": "2025-11-19T00:00:00Z",
      "end_time": "2025-11-19T23:59:59Z",
      "status": "active",
      "products": [
        {
          "id": 1,
          "product_id": 5,
          "flash_price": "40000",
          "stock_limit": 50,
          "sold_count": 10,
          "product": {...}
        }
      ]
    }
  ]
}
```

#### **POST /api/flashsales** (Admin only)

```javascript
// Body
{
  "name": "Flash Sale Cuối Tuần",
  "description": "Giảm giá sốc",
  "start_time": "2025-11-19T00:00:00Z",
  "end_time": "2025-11-19T23:59:59Z",
  "products": [
    {
      "product_id": 5,
      "flash_price": 40000,
      "stock_limit": 50
    }
  ]
}
```

---

### 4.6 Review Module

#### **GET /api/reviews**

```javascript
// Query params
?product_id=5

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_id": 1,
      "product_id": 5,
      "rating": 5,
      "comment": "Sản phẩm tốt",
      "created_at": "2025-11-19T10:00:00Z",
      "customers": {
        "users": {
          "full_name": "Nguyễn Văn A"
        }
      }
    }
  ]
}
```

#### **POST /api/reviews**

```javascript
// Body
{
  "product_id": 5,
  "rating": 5,
  "comment": "Sản phẩm rất tốt"
}

// Constraint: 1 customer chỉ review 1 sản phẩm 1 lần
```

---

### 4.7 Prescription Module

#### **GET /api/prescriptions** (Customer: own prescriptions, Staff/Admin: all)

#### **POST /api/prescriptions**

```javascript
// Body
{
  "prescription_number": "RX123456",
  "doctor_name": "Dr. Nguyễn Văn B",
  "doctor_license": "12345",
  "hospital_name": "Bệnh viện ABC",
  "image_url": "https://...",
  "pdf_url": "https://..."
}
```

#### **PUT /api/prescriptions/:id/verify** (Staff only)

```javascript
// Body
{
  "status": "verified",  // 'verified' | 'rejected'
  "verification_notes": "Đơn thuốc hợp lệ"
}
```

---

### 4.8 Inventory Management Module

#### **GET /api/branches**

```javascript
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chi nhánh Quận 1",
      "address": "123 Lê Lợi, Q1, TP.HCM",
      "phone": "0281234567",
      "is_active": true
    }
  ]
}
```

#### **GET /api/branch-inventory**

```javascript
// Query params
?branch_id=1
&product_id=5

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "branch_id": 1,
      "product_id": 5,
      "stock": 100,
      "branches": {...},
      "products": {...}
    }
  ]
}
```

#### **PUT /api/branch-inventory/:id** (Admin/Staff only)

```javascript
// Body
{
  "stock": 150
}
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 JWT Token Structure

#### Access Token (15 minutes)

```javascript
{
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "phone": "0901234567",
  "role_id": 3,
  "role_name": "customer",
  "customer_id": 1,  // Chỉ có khi role = customer
  "iat": 1700123456,
  "exp": 1700124356
}
```

#### Refresh Token (7 days)

```javascript
{
  "userId": 1,
  "iat": 1700123456,
  "exp": 1700728256
}
```

### 5.2 Middleware: authenticateToken

**File:** `src/modules/auth/auth.middleware.js`

```javascript
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token không được cung cấp" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
```

### 5.3 Authorization Middlewares

#### authorizeAdmin

```javascript
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role_name !== "admin") {
    return res.status(403).json({ error: "Chỉ admin mới có quyền truy cập" });
  }
  next();
};
```

#### authorizeAdminOrStaff

```javascript
export const authorizeAdminOrStaff = (req, res, next) => {
  if (!["admin", "staff"].includes(req.user.role_name)) {
    return res.status(403).json({ error: "Không có quyền truy cập" });
  }
  next();
};
```

### 5.4 Permission Matrix

| Endpoint                      | Customer | Staff | Admin |
| ----------------------------- | -------- | ----- | ----- |
| **Products**                  |
| GET /api/products             | ✅       | ✅    | ✅    |
| POST /api/products            | ❌       | ❌    | ✅    |
| PUT /api/products/:id         | ❌       | ❌    | ✅    |
| DELETE /api/products/:id      | ❌       | ❌    | ✅    |
| **Cart & Orders**             |
| GET /api/cart/:customerId     | ✅ (own) | ✅    | ✅    |
| POST /api/cart/checkout       | ✅       | ✅    | ✅    |
| GET /api/orders               | ❌       | ✅    | ✅    |
| GET /api/orders/:id           | ✅ (own) | ✅    | ✅    |
| PUT /api/orders/:id/status    | ❌       | ✅    | ✅    |
| **Inventory**                 |
| GET /api/branch-inventory     | ❌       | ✅    | ✅    |
| PUT /api/branch-inventory/:id | ❌       | ✅    | ✅    |
| **Promotions**                |
| GET /api/vouchers             | ✅       | ✅    | ✅    |
| POST /api/vouchers            | ❌       | ❌    | ✅    |
| **Reviews**                   |
| GET /api/reviews              | ✅       | ✅    | ✅    |
| POST /api/reviews             | ✅       | ❌    | ❌    |

---

## 6. BUSINESS LOGIC

### 6.1 Cart → Order Flow

```
1. Customer thêm sản phẩm vào giỏ
   POST /api/cart/{customerId}/add
   ├── Tạo order với status='cart' nếu chưa có
   ├── UPSERT orderitem (nếu đã có → increment quantity)
   └── Cập nhật total_amount của order

2. Customer xem giỏ hàng
   GET /api/cart/{customerId}
   └── Lấy order với status='cart' + orderitems

3. Customer checkout
   POST /api/cart/checkout
   ├── Validate: Cart không empty
   ├── Check stock availability
   ├── Apply voucher (nếu có):
   │   ├── Check date range
   │   ├── Check usage_limit
   │   ├── Check min_order_value
   │   └── Calculate discount
   ├── Update order:
   │   ├── status: 'cart' → 'pending'
   │   ├── discount_amount, final_amount
   │   └── voucher_id, shipping_address_id
   ├── Create payment record (status='pending')
   ├── Update voucher.used_count
   └── Decrease product.stock

4. Customer xác nhận thanh toán
   POST /api/orders/{id}/confirm-payment
   ├── Update payment.status = 'completed'
   ├── Update order.status = 'confirmed'
   ├── Update order.payment_status = 'paid'
   └── Increment product.sold_count

5. Staff/Admin cập nhật trạng thái
   PUT /api/orders/{id}/status
   ├── Update order.status
   └── Create order_status_history record

6. Giao hàng thành công
   PUT /api/orders/{id}/status → 'delivered'
   └── Order hoàn thành
```

### 6.2 Voucher Application Logic

**File:** `src/modules/order-management/cart/checkoutService.js`

```javascript
const applyVoucher = async (voucherCode, totalAmount, customerId) => {
  // 1. Tìm voucher
  const voucher = await prisma.vouchers.findUnique({
    where: { code: voucherCode },
  });

  if (!voucher) {
    throw new Error("Voucher không tồn tại");
  }

  // 2. Check ngày hiệu lực
  const now = new Date();
  if (now < voucher.start_date || now > voucher.end_date) {
    throw new Error("Voucher đã hết hạn hoặc chưa có hiệu lực");
  }

  // 3. Check usage limit
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    throw new Error("Voucher đã hết lượt sử dụng");
  }

  // 4. Check min order value
  if (voucher.min_order_value && totalAmount < voucher.min_order_value) {
    throw new Error(`Đơn hàng tối thiểu ${voucher.min_order_value}đ`);
  }

  // 5. Check customer đã dùng chưa
  const used = await prisma.uservouchers.findFirst({
    where: {
      customer_id: customerId,
      voucher_id: voucher.id,
      is_used: true,
    },
  });

  if (used) {
    throw new Error("Bạn đã sử dụng voucher này rồi");
  }

  // 6. Calculate discount
  let discount = 0;
  if (voucher.discount_type === "percentage") {
    discount = (totalAmount * voucher.discount_value) / 100;
  } else {
    discount = voucher.discount_value;
  }

  return {
    voucher_id: voucher.id,
    discount_amount: discount,
  };
};
```

### 6.3 Flashsale Logic

**Khi customer thêm sản phẩm flashsale vào giỏ:**

```javascript
// File: src/modules/order-management/cart/orderService.js
const getFlashsalePrice = async (productId) => {
  const now = new Date();

  // Tìm flashsale đang active
  const flashsale = await prisma.flashsales.findFirst({
    where: {
      start_time: { lte: now },
      end_time: { gte: now },
      status: "active",
    },
    include: {
      products: {
        where: { product_id: productId },
      },
    },
  });

  if (!flashsale || !flashsale.products.length) {
    return null;
  }

  const flashProduct = flashsale.products[0];

  // Check còn hàng flashsale không
  if (flashProduct.sold_count >= flashProduct.stock_limit) {
    return null;
  }

  return flashProduct;
};

// Khi checkout
const calculateOrderTotals = async (items) => {
  let subtotal = 0;

  for (const item of items) {
    const flashProduct = await getFlashsalePrice(item.productId);

    if (flashProduct) {
      // Giá flashsale
      subtotal += item.quantity * flashProduct.flash_price;

      // Tăng sold_count
      await prisma.flashsale_products.update({
        where: { id: flashProduct.id },
        data: {
          sold_count: { increment: item.quantity },
        },
      });
    } else {
      // Giá thường
      subtotal += item.quantity * item.unitPrice;
    }
  }

  return subtotal;
};
```

### 6.4 Best Sellers Logic

**Không dùng cache, tính real-time từ orderitems:**

```javascript
// File: src/modules/product-management/products/bestSellersService.js
export const getBestSellers = async (limit = 10) => {
  // 1. Group by product_id và tính tổng quantity
  const productSales = await prisma.orderitems.groupBy({
    by: ["product_id"],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  // 2. Lấy thông tin products
  const productIds = productSales.map((item) => item.product_id);

  const products = await prisma.products.findMany({
    where: { id: { in: productIds } },
    include: {
      categories: true,
      reviews: true,
    },
  });

  // 3. Map với rank và sold_count
  const productsMap = new Map(products.map((p) => [p.id, p]));

  const bestSellers = productSales.map((sale, index) => {
    const product = productsMap.get(sale.product_id);

    return {
      ...product,
      rank: index + 1,
      sold_count: sale._sum.quantity || 0,
      average_rating: calculateAvgRating(product.reviews),
    };
  });

  return bestSellers;
};
```

### 6.5 Stock Management

**Khi checkout:**

```javascript
// Decrease stock
await prisma.products.update({
  where: { id: productId },
  data: {
    stock: { decrement: quantity },
  },
});
```

**Khi cancel order:**

```javascript
// Restore stock
for (const item of orderItems) {
  await prisma.products.update({
    where: { id: item.product_id },
    data: {
      stock: { increment: item.quantity },
    },
  });
}
```

---

## 7. CRON JOBS & BACKGROUND TASKS

### 7.1 Flashsale Status Update Job

**File:** `src/jobs/flashsaleJob.js`

```javascript
import cron from "node-cron";
import prisma from "../config/db.js";

// Chạy mỗi phút
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Update flashsales started
    await prisma.flashsales.updateMany({
      where: {
        start_time: { lte: now },
        end_time: { gte: now },
        status: "pending",
      },
      data: {
        status: "active",
      },
    });

    // Update flashsales ended
    await prisma.flashsales.updateMany({
      where: {
        end_time: { lt: now },
        status: "active",
      },
      data: {
        status: "ended",
      },
    });

    console.log("Updated flashsale statuses:", now.toISOString());
  } catch (error) {
    console.error("Error updating flashsale statuses:", error);
  }
});
```

### 7.2 OTP Cleanup Job (Đã xóa)

Trước đây có job cleanup OTP expired mỗi 5 phút, nhưng đã xóa do không cần cache.

---

## 8. CONSTANTS & CONFIGURATIONS

### 8.1 Order Status Constants

```javascript
export const ORDER_STATUS = {
  CART: "cart",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};
```

### 8.2 Payment Methods

```javascript
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  E_WALLET: "e_wallet",
};
```

### 8.3 User Roles

```javascript
export const USER_ROLES = {
  ADMIN: "admin", // role_id = 1
  STAFF: "staff", // role_id = 2
  CUSTOMER: "customer", // role_id = 3
};
```

### 8.4 Rate Limiting Configuration

**File:** `src/middlewares/rateLimit.middleware.js`

```javascript
import rateLimit from "express-rate-limit";

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Quá nhiều request, vui lòng thử lại sau",
});

// Search limiter (stricter)
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: "Quá nhiều tìm kiếm, vui lòng thử lại sau",
});

// Write operations limiter
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Quá nhiều thao tác ghi, vui lòng thử lại sau",
});
```

---

## 9. ERROR HANDLING

### 9.1 Global Error Handler

**File:** `src/middlewares/errorHandler.middleware.js`

```javascript
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          success: false,
          error: "Dữ liệu đã tồn tại",
        });
      case "P2025":
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy dữ liệu",
        });
      // ... other Prisma error codes
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Token không hợp lệ",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token đã hết hạn",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Lỗi server",
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} không tồn tại`,
  });
};
```

### 9.2 Error Response Format

```javascript
// Success response
{
  "success": true,
  "data": { /* data */ },
  "message": "Success message"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}

// Validation error
{
  "success": false,
  "error": "Dữ liệu không hợp lệ",
  "details": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

---

## 10. DEPLOYMENT

### 10.1 Environment Setup

```bash
# Production .env
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/db"

JWT_SECRET="your-production-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

CORS_ORIGIN="https://your-frontend-domain.com"
```

### 10.2 Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### 10.3 Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 10.4 Health Check

```bash
# Check server health
curl http://localhost:3000/health

# Expected response
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-19T10:00:00.000Z"
}
```

---

## 11. TESTING APIs

### 11.1 Postman Collection

Import file: `PBL6_Pharmacy_API.postman_collection.json`

Hoặc test thủ công:

```bash
# 1. Register customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "email": "customer1@example.com",
    "password": "password123",
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "password": "password123"
  }'

# Response → Copy token

# 3. Get products
curl http://localhost:3000/api/products?page=1&limit=10

# 4. Add to cart (with token)
curl -X POST http://localhost:3000/api/cart/1/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "productUnitId": 1,
    "quantity": 2,
    "unitPrice": 50000
  }'

# 5. Checkout
curl -X POST http://localhost:3000/api/cart/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "shippingAddressId": 1,
    "paymentMethod": "bank_transfer"
  }'
```

---

## 12. TROUBLESHOOTING

### 12.1 Common Errors

#### Error: "Cannot read properties of undefined (reading 'count')"

**Nguyên nhân:** `prisma.count()` trả về number, không phải object
**Giải pháp:**

```javascript
// ❌ Wrong
const count = await prisma.orderitems.count();
if (count.count > 0) { ... }

// ✅ Correct
const count = await prisma.orderitems.count();
if (count > 0) { ... }
```

#### Error: "EPERM: operation not permitted"

**Nguyên nhân:** File đang được sử dụng bởi process khác
**Giải pháp:**

```bash
# Dừng tất cả Node processes
taskkill /F /IM node.exe

# Generate lại Prisma Client
npx prisma generate
```

#### Error: "Table does not exist"

**Nguyên nhân:** Chưa chạy migration
**Giải pháp:**

```bash
npx prisma migrate dev
# hoặc
npx prisma db push
```

### 12.2 Debug Tips

```javascript
// Enable Prisma query logging
// File: src/config/db.js
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

---

## 13. FUTURE IMPROVEMENTS

### 13.1 Features cần thêm

- [ ] Email notifications (Nodemailer)
- [ ] SMS OTP (Twilio/SMSAPI)
- [ ] Payment gateway integration (VNPay, Momo)
- [ ] Real-time notifications (Socket.io)
- [ ] File upload (Cloudinary/AWS S3)
- [ ] Advanced search (Elasticsearch)
- [ ] AI chatbot (OpenAI API)
- [ ] Analytics dashboard

### 13.2 Performance Optimization

- [ ] Redis caching
- [ ] Database indexing optimization
- [ ] Query optimization (N+1 problem)
- [ ] CDN for static assets
- [ ] Load balancing

### 13.3 Security Enhancements

- [ ] Rate limiting per user
- [ ] Input sanitization
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CORS configuration
- [ ] Security headers (Helmet.js)

---

## 📝 CHANGELOG

### Version 1.0.0 (2025-11-19)

- ✅ Initial system setup
- ✅ Authentication (JWT + OTP)
- ✅ Product management (CRUD)
- ✅ Cart & Checkout flow
- ✅ Order management
- ✅ Voucher & Flashsale
- ✅ Review system
- ✅ Prescription management
- ✅ Best sellers (real-time calculation)
- ✅ Inventory management
- ✅ Cron jobs (Flashsale auto-update)

---

## 👥 TEAM

- **Backend Developer:** [Your Name]
- **Database Designer:** [Your Name]
- **API Documentation:** Generated by GitHub Copilot

---

## 📞 SUPPORT

Nếu có vấn đề, vui lòng tạo issue tại:
https://github.com/PBL6-Pharmacy-System/Back-End-Web/issues

---

**Last Updated:** November 19, 2025  
**Document Version:** 1.0.0
