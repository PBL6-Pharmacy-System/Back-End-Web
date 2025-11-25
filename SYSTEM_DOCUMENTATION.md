# 📚 HỆ THỐNG QUẢN LÝ NHÀ THUỐC PBL6 - TÀI LIỆU KỸ THUẬT CHI TIẾT

> **Phiên bản:** 4.0.1 (Data Masking & Enhanced Security)  
> **Ngày cập nhật:** 2025-11-24  
> **Tech Stack:** Node.js + Express.js + Prisma ORM + PostgreSQL (Supabase)  
> **Security Status:** ✅ AUDITED & PRODUCTION READY

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Business Logic](#6-business-logic)
7. [Data Masking & Security (NEW v4.0)](#7-data-masking--security-v40)
8. [Cron Jobs & Background Tasks](#8-cron-jobs--background-tasks)
9. [Constants & Configurations](#9-constants--configurations)
10. [Error Handling](#10-error-handling)
11. [Deployment](#11-deployment)
12. [Testing APIs](#12-testing-apis)
13. [Troubleshooting](#13-troubleshooting)
14. [Future Improvements](#14-future-improvements)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả dự án

Hệ thống quản lý nhà thuốc trực tuyến với đầy đủ chức năng:

- **E-commerce**: Mua bán thuốc online
- **Inventory Management**: Quản lý kho chi nhánh (với Data Masking v4.0)
- **Order Processing**: Xử lý đơn hàng tự động
- **Promotion System**: Flash sale, voucher
- **Prescription Management**: Quản lý đơn thuốc
- **Review System**: Đánh giá sản phẩm
- **🔒 Security**: Multi-layer data protection với RBAC & data masking

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
  "rate_limiting": "express-rate-limit",
  "security": "Data Masking v4.0 + RBAC"
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
  role_id       Int       // FK → roles
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

#### 🏢 **roles** (Roles)

```prisma
model roles {
  id          Int       @id @default(autoincrement())
  role_name   String    @unique @db.VarChar(100)
  description String?
  created_at  DateTime? @default(now()) @db.Timestamp(6)
  updated_at  DateTime? @default(now()) @db.Timestamp(6)
  users       users[]
}
```

**Roles mặc định:**

- `id=1`: Admin
- `id=2`: Staff
- `id=3`: Customer

### 3.3 Database Seeding

Để khởi tạo dữ liệu mặc định cho hệ thống:

```sql
-- Insert default roles
INSERT INTO roles (id, role_name, description) VALUES
  (1, 'admin', 'Administrator - Full system access'),
  (2, 'staff', 'Staff - Branch management'),
  (3, 'customer', 'Customer - Shopping and orders')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence nếu cần
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
```

**Hoặc sử dụng Prisma seed:**

```javascript
// prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  await prisma.roles.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, role_name: 'admin', description: 'Administrator' }
  });
  
  await prisma.roles.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, role_name: 'staff', description: 'Staff' }
  });
  
  await prisma.roles.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, role_name: 'customer', description: 'Customer' }
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

```bash
# Run seed
npx prisma db seed
```

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
Authorization: Bearer <token>

// Body
{
  "name": "Paracetamol 500mg",
  "description": "Thuốc giảm đau hạ sốt",
  "price": 50000,
  "category_id": 1,
  "supplier_id": 1,
  "base_unit_id": 1,
  "images": ["url1", "url2"],
  "manufacturer": "Công ty ABC",
  "prescription_required": false
}
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

---

## 7. DATA MASKING & SECURITY (v4.0)

### 7.1 Overview - Security Philosophy

**🔒 Core Principle:** Chỉ tiết lộ thông tin cần thiết cho từng user role, bảo vệ dữ liệu kinh doanh nhạy cảm.

**Security Layers:**
```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Route Level (Public/Auth/Staff/Admin)         │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Middleware (authenticateToken, optionalAuth)  │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Controller (Permission checks + Data Masking) │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Service (Business logic validation)           │
└─────────────────────────────────────────────────────────┘
```

---

### 7.2 Data Visibility Matrix

#### 📊 Inventory Data Visibility

| Data Field | Public | Customer | Staff | Admin |
|-----------|--------|----------|-------|-------|
| **Basic Info** |
| Product ID | ✅ | ✅ | ✅ | ✅ |
| Product Name | ✅ | ✅ | ✅ | ✅ |
| Branch ID | ✅ | ✅ | ✅ | ✅ |
| **Stock Information** |
| `in_stock` (boolean) | ✅ | ✅ | ❌ | ❌ |
| `stock_status` | ✅ | ✅ | ❌ | ❌ |
| Exact Stock Quantity | ❌ | ❌ | ✅ | ✅ |
| Min/Max Stock | ❌ | ❌ | ✅ | ✅ |
| Reorder Point | ❌ | ❌ | ✅ | ✅ |
| **Batch Information** |
| Batch Number | ❌ | ❌ | ✅ | ✅ |
| Expiry Date | ❌ | ❌ | ✅ | ✅ |
| Manufacture Date | ❌ | ❌ | ✅ | ✅ |
| Quantity per Batch | ❌ | ❌ | ✅ | ✅ |
| **Financial Data** |
| Selling Price | ✅ | ✅ | ✅ | ✅ |
| Cost Price | ❌ | ❌ | ❌ | ✅ |
| Supplier Info | ❌ | ❌ | ✅ | ✅ |

**🔒 Security Rationale:**

**WHY hide batch information from Public/Customer?**
- ❌ Tiết lộ hệ thống quản lý kho nội bộ
- ❌ Cho competitor biết chu kỳ nhập hàng
- ❌ Không cần thiết cho việc mua sắm
- ✅ Customer chỉ cần biết "có hàng" hay "hết hàng"

**WHY hide cost_price from Staff?**
- ❌ Ngăn staff leak giá nhập cho competitor
- ❌ Bảo vệ lợi nhuận và chiến lược pricing
- ✅ Staff không cần biết để làm việc

---

### 7.3 Implementation - Data Masking Helpers

**File:** `src/utils/dataMasking.js`

#### 7.3.1 Permission Check Functions

```javascript
/**
 * Kiểm tra user có quyền xem detailed inventory không
 */
export const canViewDetailedInventory = (user) => {
    if (!user) return false;
    return ['admin', 'staff'].includes(user.role_name);
};

/**
 * Kiểm tra Staff có thể WRITE vào branch không
 * @param {Object} user - User từ JWT token
 * @param {number} targetBranchId - Branch ID muốn thao tác
 * @returns {Promise<boolean>}
 */
export const canWriteToBranch = async (user, targetBranchId) => {
    if (!user) return false;
    if (user.role_name === 'admin') return true;
    
    if (user.role_name === 'staff') {
        // Staff chỉ WRITE own branch (branch_id từ JWT)
        return user.branch_id && user.branch_id === Number(targetBranchId);
    }
    
    return false;
};

/**
 * Kiểm tra Staff có thể READ từ branch không
 * Staff có thể READ cross-branch (để hỗ trợ customer tìm hàng)
 */
export const canReadFromBranch = (user, targetBranchId) => {
    if (!user) return false;
    // Admin/Staff: Cross-branch READ permission
    return ['admin', 'staff'].includes(user.role_name);
};
```

#### 7.3.2 Data Masking Functions

```javascript
/**
 * Mask Branch Inventory cho Public/Customer
 * Chỉ trả về in_stock (boolean) và stock_status
 */
export const maskBranchInventory = (inventory) => {
    if (!inventory) return inventory;
    
    const stock = inventory.stock || 0;
    
    return {
        id: inventory.id,
        branch_id: inventory.branch_id,
        product_id: inventory.product_id,
        
        // ✅ Public/Customer chỉ thấy boolean
        in_stock: stock > 0,
        stock_status: stock > 20 ? 'available' :
                     stock > 0 ? 'low_stock' : 'out_of_stock',
        
        // Keep product info (cần cho shopping)
        products: inventory.products ? {
            id: inventory.products.id,
            name: inventory.products.name,
            price: inventory.products.price,
            images: inventory.products.images,
        } : undefined,
        
        // ❌ Remove ALL sensitive fields
        stock: undefined,
        min_stock: undefined,
        max_stock: undefined,
        reorder_point: undefined,
        reorder_quantity: undefined,
        last_import_date: undefined,
        last_export_date: undefined,
        note: undefined,
    };
};

/**
 * Mask Batch Information
 * Public/Customer: KHÔNG XEM ĐƯỢC batch info
 * Staff: Xem được nhưng không có cost_price
 * Admin: Full access
 */
export const maskBatchInfo = (batch, user) => {
    if (!batch) return batch;
    
    // ✅ Staff/Admin: Xem được batch details
    if (canViewDetailedInventory(user)) {
        // Staff: Remove cost_price
        if (user.role_name === 'staff') {
            return {
                ...batch,
                cost_price: undefined, // ❌ Staff không xem được giá nhập
            };
        }
        
        // Admin: Full access
        return batch;
    }
    
    // ❌ Public/Customer: KHÔNG XEM được batch information
    return null;
};

/**
 * Mask Product Inventory cho Public/Customer
 */
export const maskProductInventory = (product) => {
    if (!product) return product;
    
    const stock = product.stock || 0;
    let stockStatus = 'out_of_stock';
    
    if (stock > 20) {
        stockStatus = 'available';
    } else if (stock > 0) {
        stockStatus = 'low_stock';
    }
    
    return {
        ...product,
        // Replace stock với boolean
        in_stock: stock > 0,
        stock_status: stockStatus,
        stock: undefined, // ❌ Remove exact quantity
        
        // Remove branch inventory details
        branchinventory: product.branchinventory
            ? product.branchinventory.map(inv => maskBranchInventory(inv))
            : undefined,
    };
};
```

---

### 7.4 Controller Layer Implementation

#### Example 1: Public Endpoint với Optional Auth + Masking

**Endpoint:** `GET /api/branches/:branchId/inventory`

```javascript
/**
 * Route: optionalAuth (cho phép cả Public và Authenticated)
 * Data masking: Conditional based on user role
 */
export const getBranchInventoryByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        // ✅ Lấy dữ liệu từ service (không filter by role)
        const result = await branchInventoryService.getAllBranchInventory({
            branchId: Number(branchId),
            page: Number(page),
            limit: Number(limit),
        });
        
        if (!result.success) {
            return res.status(result.status).json(result);
        }
        
        // 🔒 DATA MASKING: Check user role
        const hasDetailedAccess = canViewDetailedInventory(req.user);
        
        if (!hasDetailedAccess && result.data.inventory) {
            // ❌ Public/Customer → Mask sensitive data
            result.data.inventory = result.data.inventory.map(inv =>
                maskBranchInventory(inv)
            );
        }
        // ✅ Staff/Admin → Full data (không mask)
        
        res.json(result);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy tồn kho chi nhánh'
        });
    }
};
```

#### Example 2: Staff-Only Endpoint (No Public Access)

**Endpoint:** `GET /api/branches/:branchId/inventory/alerts/low-stock`

```javascript
/**
 * Route: authenticateToken (CHỈ Staff/Admin)
 * No masking needed vì chỉ internal users
 */
export const getBranchLowStockItems = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { threshold = 10 } = req.query;
        
        // ❌ Chặn luôn Public/Customer
        if (!canViewDetailedInventory(req.user)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền truy cập thông tin cảnh báo tồn kho'
            });
        }
        
        const result = await branchInventoryService.getBranchLowStockProducts(
            branchId,
            Number(threshold)
        );
        
        if (!result.success) {
            return res.status(result.status).json(result);
        }
        
        // ✅ Staff/Admin: Không cần masking, trả về full data
        res.json(result);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy danh sách tồn kho thấp'
        });
    }
};
```

#### Example 3: Write Operation với Branch Authorization

**Endpoint:** `PUT /api/branches/:branchId/inventory/:productId`

```javascript
/**
 * Route: authenticateToken + authorizeAdminOrStaff
 * Authorization: Staff chỉ update own branch
 */
export const updateBranchInventoryByBranchProduct = async (req, res) => {
    try {
        const { branchId, productId } = req.params;
        const { stock, note } = req.body;
        
        // 🔒 Check WRITE permission (async function)
        const canWrite = await canWriteToBranch(req.user, branchId);
        if (!canWrite) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chỉ có thể cập nhật kho của chi nhánh mình'
            });
        }
        
        // Find inventory record
        const inventory = await prisma.branchinventory.findFirst({
            where: {
                branch_id: Number(branchId),
                product_id: Number(productId)
            }
        });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy sản phẩm trong kho'
            });
        }
        
        // Update inventory
        const result = await branchInventoryService.updateBranchInventory(
            inventory.id,
            { stock, note }
        );
        
        res.json(result);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi cập nhật tồn kho'
        });
    }
};
```

---

### 7.5 Route Configuration Patterns

**File:** `src/modules/inventory-management/branch/branchRoutes.js`

```javascript
import express from 'express';
import { authenticateToken, optionalAuth } from '../../../middlewares/auth.middleware.js';
import { authorizeAdmin, authorizeAdminOrStaff } from '../../../middlewares/auth.middleware.js';
import * as controller from './branchInventoryController.js';

const router = express.Router();

// =====================================
// PUBLIC ROUTES (với Data Masking)
// =====================================

// ✅ Public: Xem danh sách chi nhánh
router.get('/', controller.getAllBranches);

// ✅ Public: Xem chi tiết 1 chi nhánh
router.get('/:id', controller.getBranchById);

// =====================================
// NESTED ROUTES: /branches/:branchId/inventory
// =====================================

// ✅ Optional Auth: Public có thể xem nhưng data bị mask
router.get(
    '/:branchId/inventory',
    optionalAuth,  // ← Cho phép cả anonymous và authenticated
    controller.getBranchInventoryByBranchId
);

// ✅ Optional Auth: Xem batch details của 1 product
router.get(
    '/:branchId/inventory/:productId',
    optionalAuth,
    controller.getProductBatchesByBranch
);

// =====================================
// STAFF/ADMIN ONLY ROUTES
// =====================================

// 🔒 Staff/Admin: Xem low stock alerts
router.get(
    '/:branchId/inventory/alerts/low-stock',
    authenticateToken,  // ← Bắt buộc auth
    authorizeAdminOrStaff,
    controller.getBranchLowStockItems
);

// 🔒 Staff/Admin: Xem expiring batches
router.get(
    '/:branchId/inventory/alerts/expiring-soon',
    authenticateToken,
    authorizeAdminOrStaff,
    controller.getExpiringBatches
);

// 🔒 Staff (own branch) / Admin: Update inventory
router.put(
    '/:branchId/inventory/:productId',
    authenticateToken,
    authorizeAdminOrStaff,
    controller.updateBranchInventoryByBranchProduct
);

// =====================================
// ADMIN ONLY ROUTES
// =====================================

// 🔒 Admin: Create branch
router.post('/', authenticateToken, authorizeAdmin, controller.createBranch);

// 🔒 Admin: Delete branch
router.delete('/:id', authenticateToken, authorizeAdmin, controller.deleteBranch);

export default router;
```

---

### 7.6 Middleware: Optional Authentication

**File:** `src/middlewares/auth.middleware.js`

```javascript
/**
 * Optional Authentication Middleware
 * Cho phép request đi qua dù không có token
 * Nếu có token → decode và attach vào req.user
 * Nếu không có token → req.user = null
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Không có token → OK, req.user = null
    if (!token) {
        req.user = null;
        return next();
    }
    
    // Có token → Verify
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // Token invalid → Vẫn cho qua nhưng req.user = null
        req.user = null;
        next();
    }
};
```

---

### 7.7 JWT Token với Branch ID (for Staff)

**Enhanced JWT Payload:**

```javascript
// generateToken in authService.js
export const generateToken = (user) => {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: user.roles.role_name,  // ✅ Fixed: roles thay vì rolepermissions
    };
    
    // ✅ Add customer_id for customer role
    if (user.roles.role_name === 'customer' && user.customers) {  // ✅ Fixed
        payload.customer_id = user.customers.id;
    }
    
    // ✅ Add branch_id for staff role
    if (user.roles.role_name === 'staff' && user.staff) {  // ✅ Fixed
        payload.branch_id = user.staff.branch_id;
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};
```

**Staff JWT Token Example:**

```json
{
  "userId": 5,
  "username": "staff01",
  "email": "staff01@pharmacy.com",
  "phone": "0901234567",
  "role_id": 2,
  "role_name": "staff",
  "branch_id": 1,
  "iat": 1732435200,
  "exp": 1732436100
}
```

---

### 7.8 Security Testing Scenarios

#### Scenario 1: Public User xem inventory

```bash
# Request: No Authorization header
curl http://localhost:3000/api/branches/1/inventory

# Expected Response: Masked data
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 1,
        "branch_id": 1,
        "product_id": 5,
        "in_stock": true,  // ✅ Boolean only
        "stock_status": "available",
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "price": "50000"
        }
        // ❌ NO: stock, min_stock, batches, etc.
      }
    ]
  }
}
```

#### Scenario 2: Staff xem cross-branch inventory (READ)

```bash
# Staff at Branch 1 viewing Branch 2
curl -H "Authorization: Bearer <staff_token>" \
  http://localhost:3000/api/branches/2/inventory

# Expected: ✅ SUCCESS - Full data (Staff có READ cross-branch)
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": 10,
        "branch_id": 2,
        "product_id": 5,
        "stock": 150,  // ✅ Full quantity
        "min_stock": 20,
        "max_stock": 500
        // ✅ Full inventory details
      }
    ]
  }
}
```

#### Scenario 3: Staff cố update cross-branch (WRITE) → FAIL

```bash
# Staff at Branch 1 trying to update Branch 2
curl -X PUT \
  -H "Authorization: Bearer <staff_token>" \
  -H "Content-Type: application/json" \
  -d '{"stock": 200}' \
  http://localhost:3000/api/branches/2/inventory/5

# Expected: ❌ 403 FORBIDDEN
{
  "success": false,
  "error": "Bạn chỉ có thể cập nhật kho của chi nhánh mình"
}
```

#### Scenario 4: Public User cố xem low-stock alerts → FAIL

```bash
# Request: No token
curl http://localhost:3000/api/branches/1/inventory/alerts/low-stock

# Expected: ❌ 401 Unauthorized (vì route dùng authenticateToken)
{
  "error": "Token không được cung cấp"
}
```

#### Scenario 5: Customer cố xem low-stock alerts → FAIL

```bash
# Request: Customer token
curl -H "Authorization: Bearer <customer_token>" \
  http://localhost:3000/api/branches/1/inventory/alerts/low-stock

# Expected: ❌ 403 Forbidden (fail at authorizeAdminOrStaff)
{
  "error": "Không có quyền truy cập"
}
```

---

### 7.9 Security Checklist

**✅ Implementation Checklist:**

- [x] **Route Level Protection**
  - [x] Public routes: `optionalAuth` middleware
  - [x] Staff routes: `authenticateToken` + `authorizeAdminOrStaff`
  - [x] Admin routes: `authenticateToken` + `authorizeAdmin`
  - [x] Alert endpoints: Staff/Admin ONLY (no public access)

- [x] **Data Masking**
  - [x] `maskBranchInventory()` - Remove stock quantities for Public/Customer
  - [x] `maskBatchInfo()` - Hide batch details from Public/Customer
  - [x] `maskProductInventory()` - Mask product stock data
  - [x] Controller layer applies masking based on `req.user.role_name`

- [x] **Permission Checks**
  - [x] `canViewDetailedInventory()` - Check Admin/Staff
  - [x] `canWriteToBranch()` - Async check for WRITE permissions
  - [x] `canReadFromBranch()` - Cross-branch READ for Staff

- [x] **JWT Token Enhancement**
  - [x] `branch_id` included in Staff token payload
  - [x] `customer_id` included in Customer token payload
  - [x] Token refresh maintains all claims

- [x] **Documentation**
  - [x] INVENTORY_API_ENDPOINTS.md updated với v4.0.1
  - [x] SYSTEM_DOCUMENTATION.md updated
  - [x] Security rationale documented
  - [x] Use cases với cURL examples

---

### 7.10 Breaking Changes (v3.x → v4.0)

**⚠️ IMPORTANT - Breaking Changes:**

1. **Endpoint `/branches/:branchId/inventory/alerts/low-stock`**
   - **Before (v3.x):** Public access với data masking
   - **After (v4.0):** Staff/Admin ONLY - Public gets 401/403
   - **Reason:** Low stock là dữ liệu kinh doanh nội bộ

2. **Batch Information Visibility**
   - **Before (v3.x):** Public có thể xem batch_number, expiry_date
   - **After (v4.0):** Public KHÔNG XEM được batch info
   - **Reason:** Bảo vệ hệ thống quản lý kho nội bộ

3. **Permission Function Signature**
   - **Before:** `canWriteToBranch(user, branchId)` - sync
   - **After:** `async canWriteToBranch(user, branchId)` - async
   - **Reason:** Support future database queries

---

### 7.11 Migration Guide (v3.x → v4.0)

**For Frontend Developers:**

```javascript
// ❌ OLD CODE (v3.x) - Expect batch info from public endpoint
const response = await fetch('/api/branches/1/inventory/5');
const data = await response.json();
console.log(data.batches); // ❌ Will be null/undefined in v4.0

// ✅ NEW CODE (v4.0) - Check user role first
if (userRole === 'staff' || userRole === 'admin') {
    // Staff/Admin: Can see batches
    const response = await fetch('/api/branches/1/inventory/5', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log(data.batches); // ✅ Full batch info
} else {
    // Public/Customer: Only see in_stock status
    const response = await fetch('/api/branches/1/inventory/5');
    const data = await response.json();
    console.log(data.in_stock); // ✅ Boolean: true/false
    console.log(data.stock_status); // ✅ "available" | "low_stock" | "out_of_stock"
}
```

**For Backend Developers:**

```javascript
// ❌ OLD CODE (v3.x)
const canWrite = canWriteToBranch(req.user, branchId); // sync
if (!canWrite) { /* reject */ }

// ✅ NEW CODE (v4.0)
const canWrite = await canWriteToBranch(req.user, branchId); // async
if (!canWrite) { /* reject */ }
```

---

## 8. CRON JOBS & BACKGROUND TASKS

### 8.1 Flashsale Status Update Job

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

### 8.2 OTP Cleanup Job (Đã xóa)

Trước đây có job cleanup OTP expired mỗi 5 phút, nhưng đã xóa do không cần cache.

---

## 9. CONSTANTS & CONFIGURATIONS

### 9.1 Order Status Constants

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

### 9.2 Payment Methods

```javascript
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  E_WALLET: "e_wallet",
};
```

### 9.3 User Roles

```javascript
export const USER_ROLES = {
  ADMIN: "admin", // role_id = 1
  STAFF: "staff", // role_id = 2
  CUSTOMER: "customer", // role_id = 3
};
```

### 9.4 Rate Limiting Configuration

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

## 10. ERROR HANDLING

### 10.1 Global Error Handler

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

### 10.2 Error Response Format

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

## 11. DEPLOYMENT

### 11.1 Environment Setup

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

### 11.2 Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### 11.3 Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 11.4 Health Check

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

## 12. TESTING APIs

### 12.1 Postman Collection

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

## 13. TROUBLESHOOTING

### 13.1 Common Errors

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

### 13.2 Debug Tips

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

## 14. FUTURE IMPROVEMENTS

### 14.1 Features cần thêm

- [ ] Email notifications (Nodemailer)
- [ ] SMS OTP (Twilio/SMSAPI)
- [ ] Payment gateway integration (VNPay, Momo)
- [ ] Real-time notifications (Socket.io)
- [ ] File upload (Cloudinary/AWS S3)
- [ ] Advanced search (Elasticsearch)
- [ ] AI chatbot (OpenAI API)
- [ ] Analytics dashboard

### 14.2 Performance Optimization

- [ ] Redis caching
- [ ] Database indexing optimization
- [ ] Query optimization (N+1 problem)
- [ ] CDN for static assets
- [ ] Load balancing

### 14.3 Security Enhancements

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

**Last Updated:** November 24, 2025  
**Document Version:** 4.0.0
