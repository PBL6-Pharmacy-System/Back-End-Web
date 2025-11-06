# 🏗️ DỰ ÁN REFACTORING - DOMAIN-DRIVEN DESIGN

## 🎯 MỤC TIÊU

Tổ chức lại code theo **Domain-Driven Design (DDD)** pattern:
- ✅ Nhóm các modules theo **business domains**
- ✅ Chuẩn bị sẵn cho **Microservices migration** sau này
- ✅ Cải thiện **maintainability** và **scalability**
- ✅ Giảm **coupling**, tăng **cohesion**
- ✅ Loại bỏ code **trùng lặp** và **không cần thiết**

---

## 📊 CẤU TRÚC MỚI

### HIỆN TẠI (Monolithic - Flat Structure)
```
src/
├── config/
├── controllers/       (15 files - lộn xộn)
├── services/          (15 files - lộn xộn)
├── routes/            (14 files - lộn xộn)
├── middlewares/
├── utils/
└── jobs/
```

### MỚI (Domain-Driven Design)
```
src/
├── domains/
│   ├── auth/                    # 1. AUTHENTICATION DOMAIN
│   │   ├── auth.service.js
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   └── auth.validators.js
│   │
│   ├── catalog/                 # 2. CATALOG DOMAIN
│   │   ├── products/
│   │   │   ├── product.service.js
│   │   │   ├── product.controller.js
│   │   │   ├── product.routes.js
│   │   │   └── product.validators.js
│   │   ├── categories/
│   │   │   ├── category.service.js
│   │   │   ├── category.controller.js
│   │   │   ├── category.routes.js
│   │   │   └── category.validators.js
│   │   ├── suppliers/
│   │   │   ├── supplier.service.js
│   │   │   ├── supplier.controller.js
│   │   │   ├── supplier.routes.js
│   │   │   └── supplier.validators.js
│   │   ├── product-units/
│   │   │   ├── product-unit.service.js
│   │   │   ├── product-unit.controller.js
│   │   │   ├── product-unit.routes.js
│   │   │   └── product-unit.validators.js
│   │   └── index.js            # Catalog domain aggregator
│   │
│   ├── inventory/               # 3. INVENTORY DOMAIN
│   │   ├── branches/
│   │   │   ├── branch.service.js
│   │   │   ├── branch.controller.js
│   │   │   ├── branch.routes.js
│   │   │   └── branch.validators.js
│   │   ├── stock/
│   │   │   ├── branch-inventory.service.js
│   │   │   ├── branch-inventory.controller.js
│   │   │   ├── branch-inventory.routes.js
│   │   │   └── branch-inventory.validators.js
│   │   └── index.js
│   │
│   ├── orders/                  # 4. ORDER DOMAIN
│   │   ├── cart/
│   │   │   ├── cart.service.js
│   │   │   ├── cart.controller.js
│   │   │   ├── cart.routes.js
│   │   │   └── cart.validators.js
│   │   ├── orders/
│   │   │   ├── order.service.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.routes.js
│   │   │   └── order.validators.js
│   │   └── index.js
│   │
│   ├── promotions/              # 5. PROMOTION DOMAIN
│   │   ├── vouchers/
│   │   │   ├── voucher.service.js
│   │   │   ├── voucher.controller.js
│   │   │   ├── voucher.routes.js
│   │   │   └── voucher.validators.js
│   │   ├── flashsales/
│   │   │   ├── flashsale.service.js
│   │   │   ├── flashsale.controller.js
│   │   │   ├── flashsale.routes.js
│   │   │   ├── flashsale.validators.js
│   │   │   └── flashsale.job.js
│   │   └── index.js
│   │
│   ├── notifications/           # 6. NOTIFICATION DOMAIN
│   │   ├── notification.service.js
│   │   ├── notification.controller.js
│   │   ├── notification.routes.js
│   │   ├── notification.validators.js
│   │   └── email/
│   │       └── email.service.js
│   │
│   ├── reviews/                 # 7. REVIEW DOMAIN
│   │   ├── review.service.js
│   │   ├── review.controller.js
│   │   ├── review.routes.js
│   │   └── review.validators.js
│   │
│   └── users/                   # 8. USER DOMAIN (Bonus)
│       ├── users/
│       │   ├── user.service.js
│       │   ├── user.controller.js
│       │   ├── user.routes.js
│       │   └── user.validators.js
│       ├── customers/
│       │   ├── customer.service.js
│       │   ├── customer.controller.js
│       │   ├── customer.routes.js
│       │   └── customer.validators.js
│       └── index.js
│
├── shared/                      # SHARED MODULES
│   ├── config/
│   │   └── db.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── validate.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validation.js
│   └── types/                   # TypeScript definitions (optional)
│
└── app.js                       # Main entry point
```

---

## 🔄 DOMAIN MAPPING

### 1. AUTH DOMAIN
**Files cần di chuyển:**
```
src/services/authService.js      → src/domains/auth/auth.service.js
src/controllers/authController.js → src/domains/auth/auth.controller.js
src/routes/authRoutes.js         → src/domains/auth/auth.routes.js
```

**Responsibilities:**
- User authentication (register, login, logout)
- JWT token management (access + refresh)
- Password management
- Session management

---

### 2. CATALOG DOMAIN
**Files cần di chuyển:**
```
# Products
src/services/productService.js         → src/domains/catalog/products/product.service.js
src/controllers/productController.js   → src/domains/catalog/products/product.controller.js
src/routes/productRoutes.js            → src/domains/catalog/products/product.routes.js

# Categories
src/services/categoryService.js        → src/domains/catalog/categories/category.service.js
src/controllers/categoryController.js  → src/domains/catalog/categories/category.controller.js
src/routes/categoryRoutes.js           → src/domains/catalog/categories/category.routes.js

# Suppliers
src/services/supplierService.js        → src/domains/catalog/suppliers/supplier.service.js
src/controllers/supplierController.js  → src/domains/catalog/suppliers/supplier.controller.js
src/routes/supplierRoutes.js           → src/domains/catalog/suppliers/supplier.routes.js

# Product Units
src/services/productUnitService.js     → src/domains/catalog/product-units/product-unit.service.js
src/controllers/productUnitController.js → src/domains/catalog/product-units/product-unit.controller.js
src/routes/productUnitRoutes.js        → src/domains/catalog/product-units/product-unit.routes.js
```

**Responsibilities:**
- Product catalog management
- Category hierarchy
- Supplier management
- Product units/SKU

---

### 3. INVENTORY DOMAIN
**Files cần di chuyển:**
```
# Branches
src/services/branchService.js          → src/domains/inventory/branches/branch.service.js
src/controllers/branchController.js    → src/domains/inventory/branches/branch.controller.js
src/routes/branchRoutes.js             → src/domains/inventory/branches/branch.routes.js

# Stock Management
src/services/branchInventoryService.js → src/domains/inventory/stock/branch-inventory.service.js
src/controllers/branchInventoryController.js → src/domains/inventory/stock/branch-inventory.controller.js
src/routes/branchInventoryRoutes.js    → src/domains/inventory/stock/branch-inventory.routes.js
```

**Responsibilities:**
- Branch/warehouse management
- Stock tracking
- Import/Export operations
- Low stock alerts

---

### 4. ORDER DOMAIN
**Files cần di chuyển:**
```
# Cart
src/services/cartService.js       → src/domains/orders/cart/cart.service.js
src/controllers/cartController.js → src/domains/orders/cart/cart.controller.js
src/routes/cartRoutes.js          → src/domains/orders/cart/cart.routes.js

# Orders (NOTE: orderService.js có duplicate cart logic)
src/services/orderService.js      → src/domains/orders/orders/order.service.js
```

**⚠️ CLEANUP NEEDED:**
- `orderService.js` có duplicate cart logic với `cartService.js`
- Cần merge và loại bỏ redundancy

**Responsibilities:**
- Shopping cart
- Order processing
- Checkout flow
- Order history

---

### 5. PROMOTION DOMAIN
**Files cần di chuyển:**
```
# Vouchers
src/services/voucherService.js         → src/domains/promotions/vouchers/voucher.service.js
src/controllers/voucherController.js   → src/domains/promotions/vouchers/voucher.controller.js
src/routes/voucherRoutes.js            → src/domains/promotions/vouchers/voucher.routes.js

# Flashsales
src/services/flashsaleService.js       → src/domains/promotions/flashsales/flashsale.service.js
src/controllers/flashsaleController.js → src/domains/promotions/flashsales/flashsale.controller.js
src/routes/flashsaleRoutes.js          → src/domains/promotions/flashsales/flashsale.routes.js
src/jobs/flashsaleJob.js               → src/domains/promotions/flashsales/flashsale.job.js
```

**Responsibilities:**
- Voucher/coupon management
- Flash sales
- Discount calculations
- Promotion scheduling

---

### 6. NOTIFICATION DOMAIN
**Files cần di chuyển:**
```
src/services/notificationService.js      → src/domains/notifications/notification.service.js
src/controllers/notificationController.js → src/domains/notifications/notification.controller.js
src/routes/notificationRoutes.js         → src/domains/notifications/notification.routes.js
```

**Future enhancements:**
```
src/domains/notifications/
├── email/
│   └── email.service.js      # Email sending logic
├── sms/
│   └── sms.service.js        # SMS sending logic
└── push/
    └── push.service.js       # Push notifications
```

**Responsibilities:**
- Email notifications
- SMS notifications (future)
- Push notifications (future)
- Notification templates

---

### 7. REVIEW DOMAIN
**Files cần di chuyển:**
```
src/services/reviewService.js      → src/domains/reviews/review.service.js
src/controllers/reviewController.js → src/domains/reviews/review.controller.js
src/routes/reviewRoutes.js         → src/domains/reviews/review.routes.js
```

**Responsibilities:**
- Product reviews
- Rating system
- Review moderation

---

### 8. USER DOMAIN (Bonus)
**Files cần di chuyển:**
```
# Users (Admin/Staff)
src/services/userService.js        → src/domains/users/users/user.service.js
src/controllers/userController.js  → src/domains/users/users/user.controller.js
src/routes/userRoutes.js           → src/domains/users/users/user.routes.js

# Customers
src/services/customerService.js     → src/domains/users/customers/customer.service.js
src/controllers/customerController.js → src/domains/users/customers/customer.controller.js
src/routes/customerRoutes.js        → src/domains/users/customers/customer.routes.js
```

**Responsibilities:**
- User management (admin, staff)
- Customer management
- User profiles
- Access control

---

## ⚠️ CODE CLEANUP NEEDED

### 1. **Duplicate Cart Logic**
**Problem:** `orderService.js` và `cartService.js` có logic trùng lặp

**Files:**
```javascript
// orderService.js (Lines 169-545)
export const getCart = async (customerId) => {...}
export const addToCart = async (customerId, orderData) => {...}
export const updateCartItem = async (itemId, quantity) => {...}
export const removeCartItem = async (itemId) => {...}
export const checkout = async (orderId) => {...}

// cartService.js (SAME LOGIC!)
export const getOrCreateCart = async (customerId) => {...}
export const addToCart = async (orderId, productId, productUnitId, quantity, unitPrice) => {...}
export const removeCartItem = async (itemId) => {...}
export const checkout = async (orderId) => {...}
```

**✅ Solution:**
- **Keep:** `cartService.js` (more focused, cleaner)
- **Remove:** Cart logic from `orderService.js`
- **Update:** `orderService.js` should **import and use** `cartService`

---

### 2. **Inconsistent Prisma Import**
**Problem:** `branchService.js` import Prisma directly

**Current:**
```javascript
// branchService.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**✅ Solution:**
```javascript
// Use shared config
import prisma from '../../shared/config/db.js';
```

---

### 3. **Validation Logic Spread Across Files**
**Problem:** Validation logic scattered everywhere

**✅ Solution:** Extract to `*.validators.js` files
```javascript
// Example: product.validators.js
export const validateCreateProduct = (data) => {
  // Validation logic
};

export const validateUpdateProduct = (data) => {
  // Validation logic
};
```

---

## 📋 MIGRATION STEPS

### PHASE 1: Chuẩn bị (30 phút)
```bash
# 1. Tạo cấu trúc folders
mkdir -p src/domains/{auth,catalog,inventory,orders,promotions,notifications,reviews,users}
mkdir -p src/domains/catalog/{products,categories,suppliers,product-units}
mkdir -p src/domains/inventory/{branches,stock}
mkdir -p src/domains/orders/{cart,orders}
mkdir -p src/domains/promotions/{vouchers,flashsales}
mkdir -p src/domains/users/{users,customers}
mkdir -p src/shared/{config,middlewares,utils}

# 2. Backup
git checkout -b refactor/domain-driven-design
git add .
git commit -m "Before DDD refactoring"
```

### PHASE 2: Di chuyển Shared Modules (15 phút)
```bash
# Move shared resources
mv src/config src/shared/
mv src/middlewares src/shared/
mv src/utils src/shared/
```

### PHASE 3: Di chuyển Domains (1-2 giờ)
**Thứ tự:**
1. ✅ Auth Domain (đơn giản nhất)
2. ✅ Notification Domain
3. ✅ Review Domain
4. ✅ Catalog Domain (nhiều files)
5. ✅ Inventory Domain
6. ✅ Promotion Domain
7. ✅ Order Domain (có cleanup)
8. ✅ User Domain

### PHASE 4: Update Imports (30 phút)
- Update all import paths
- Update app.js
- Test from browser/Postman

### PHASE 5: Cleanup (30 phút)
- Remove duplicate cart logic
- Fix Prisma imports
- Extract validators
- Remove old folders

### PHASE 6: Testing (1 giờ)
- Test all endpoints
- Verify authentication
- Check database operations
- Run Postman collection

---

## 🎯 BENEFITS

### ✅ Sau khi refactor:

**1. Better Organization:**
```
✅ Mỗi domain là một "mini-app" độc lập
✅ Dễ tìm file (domain/feature/file.js)
✅ Dễ onboard developers mới
```

**2. Easy to Scale:**
```
✅ Muốn scale Catalog? → Optimize catalog domain
✅ Muốn migrate sang Microservices? → Extract domain thành service
✅ Muốn thêm feature? → Thêm vào domain tương ứng
```

**3. Better Testing:**
```
✅ Test từng domain độc lập
✅ Mock dependencies dễ dàng
✅ Integration testing rõ ràng
```

**4. Team Collaboration:**
```
✅ Team 1: Catalog + Inventory
✅ Team 2: Orders + Promotions
✅ Team 3: Auth + Users
✅ Ít conflict khi merge code
```

**5. Future Microservices:**
```
✅ Mỗi domain → 1 microservice
✅ Đã có boundaries rõ ràng
✅ Refactor nhỏ thay vì rewrite toàn bộ
```

---

## 🚀 MIGRATION TO MICROSERVICES (FUTURE)

Sau khi refactor theo DDD, migrate sang Microservices dễ dàng:

```
# BEFORE DDD
Monolith (khó tách)

# AFTER DDD
Monolith with Domains (sẵn sàng tách)

# FUTURE - Microservices
domains/auth       → auth-service (Port 3001)
domains/catalog    → catalog-service (Port 3002)
domains/inventory  → inventory-service (Port 3003)
domains/orders     → order-service (Port 3004)
domains/promotions → promotion-service (Port 3005)
domains/notifications → notification-service (Port 3006)
domains/reviews    → review-service (Port 3007)
```

---

## 📊 ESTIMATED TIME

| Phase | Time | Difficulty |
|-------|------|------------|
| Setup folders | 10 min | Easy |
| Move shared | 15 min | Easy |
| Move Auth domain | 15 min | Easy |
| Move Notification domain | 15 min | Easy |
| Move Review domain | 15 min | Easy |
| Move Catalog domain | 30 min | Medium |
| Move Inventory domain | 20 min | Medium |
| Move Promotion domain | 20 min | Medium |
| Move Order domain + Cleanup | 45 min | Hard |
| Move User domain | 20 min | Medium |
| Update imports | 30 min | Medium |
| Testing | 60 min | Medium |
| **TOTAL** | **~4-5 hours** | **Medium** |

---

## ✅ CHECKLIST

### Pre-Refactoring
- [ ] Backup code (Git commit)
- [ ] Run tests (ensure everything works)
- [ ] Document current API endpoints

### During Refactoring
- [ ] Create domain folders
- [ ] Move shared modules
- [ ] Move domain by domain
- [ ] Update import paths
- [ ] Remove duplicates

### Post-Refactoring
- [ ] All endpoints working
- [ ] Authentication working
- [ ] Database operations working
- [ ] Run Postman collection
- [ ] Update documentation
- [ ] Git commit

---

**Ready to start? Chúng ta bắt đầu từ domain nào? 🚀**
