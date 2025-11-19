# Cấu trúc dự án PBL6 Pharmacy API

## Tổng quan

Dự án được tổ chức theo kiến trúc **modular** với các module quản lý được nhóm theo chức năng nghiệp vụ (domain-driven design).

## Cấu trúc thư mục

```
Back-End-Web/
├── app.js                      # Entry point của ứng dụng
├── package.json
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/                # Configuration files
│   │   └── db.js             # Database connection
│   ├── utils/                 # Utility functions
│   │   ├── helpers.js        # Helper functions (hash, token, etc.)
│   │   ├── validation.js     # Validation utilities
│   │   └── constants.js      # App constants
│   ├── middlewares/           # Global middlewares
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validate.middleware.js
│   ├── jobs/                  # Background jobs
│   │   └── flashsaleJob.js   # Cron job cập nhật flashsale status
│   └── modules/               # Business modules
│       ├── auth/
│       ├── user-management/
│       ├── product-management/
│       ├── inventory-management/
│       ├── order-management/
│       ├── promotion-management/
│       ├── review-management/
│       └── notification-management/
```

## Chi tiết các Module

### 1. **auth/** - Xác thực & Phân quyền

```
auth/
├── authController.js          # Xử lý HTTP requests
├── authService.js             # Business logic
├── authRoutes.js              # Route definitions
└── auth.middleware.js         # Authentication & authorization middleware
```

**Chức năng:**

- Đăng ký, đăng nhập, đăng xuất
- Refresh access token
- Đổi password
- Xác thực JWT token
- Phân quyền theo role (admin, staff, customer)

### 2. **user-management/** - Quản lý người dùng

```
user-management/
├── users/                     # Quản lý user nội bộ
│   ├── userController.js
│   ├── userService.js
│   └── userRoutes.js
└── customers/                 # Quản lý khách hàng
    ├── customerController.js
    ├── customerService.js
    └── customerRoutes.js
```

**Chức năng:**

- CRUD users (admin, staff)
- CRUD customers
- Quản lý thông tin cá nhân
- Lịch sử đơn hàng của khách hàng

### 3. **product-management/** - Quản lý sản phẩm

```
product-management/
├── products/                  # Sản phẩm
│   ├── productController.js
│   ├── productService.js
│   └── productRoutes.js
├── categories/                # Danh mục phân cấp
│   ├── categoryController.js
│   ├── categoryService.js
│   └── categoryRoutes.js
├── product-units/             # Đơn vị tính
│   ├── productUnitController.js
│   ├── productUnitService.js
│   └── productUnitRoutes.js
└── suppliers/                 # Nhà cung cấp
    ├── supplierController.js
    ├── supplierService.js
    └── supplierRoutes.js
```

**Chức năng:**

- CRUD sản phẩm với tìm kiếm, lọc, phân trang
- Quản lý danh mục phân cấp (parent-child)
- Quản lý đơn vị tính của sản phẩm
- Quản lý nhà cung cấp

### 4. **inventory-management/** - Quản lý kho

```
inventory-management/
├── branches/                  # Chi nhánh
│   ├── branchController.js
│   ├── branchService.js
│   └── branchRoutes.js
└── branch-inventory/          # Kho chi nhánh
    ├── branchInventoryController.js
    ├── branchInventoryService.js
    └── branchInventoryRoutes.js
```

**Chức năng:**

- CRUD chi nhánh
- Quản lý tồn kho từng chi nhánh
- Nhập kho, xuất kho
- Cập nhật số lượng tồn kho

### 5. **order-management/** - Quản lý đơn hàng

```
order-management/
└── cart/
    ├── cartController.js      # Giỏ hàng
    ├── cartService.js
    ├── cartRoutes.js
    └── orderService.js        # Xử lý đơn hàng
```

**Chức năng:**

- Quản lý giỏ hàng
- Thêm/xóa/cập nhật sản phẩm trong giỏ
- Checkout và tạo đơn hàng
- Quản lý trạng thái đơn hàng

### 6. **promotion-management/** - Quản lý khuyến mãi

```
promotion-management/
├── vouchers/                  # Mã giảm giá
│   ├── voucherController.js
│   ├── voucherService.js
│   └── voucherRoutes.js
└── flashsales/                # Flash sale
    ├── flashsaleController.js
    ├── flashsaleService.js
    └── flashsaleRoutes.js
```

**Chức năng:**

- CRUD voucher với điều kiện áp dụng
- Validate và apply voucher
- CRUD flash sale với thời gian
- Tự động cập nhật trạng thái flash sale (cron job)

### 7. **review-management/** - Quản lý đánh giá

```
review-management/
└── reviews/
    ├── reviewController.js
    ├── reviewService.js
    └── reviewRoutes.js
```

**Chức năng:**

- Đánh giá sản phẩm (rating, comment)
- Xem reviews theo sản phẩm
- Thống kê rating trung bình

### 8. **notification-management/** - Quản lý thông báo

```
notification-management/
└── notifications/
    ├── notificationController.js
    ├── notificationService.js
    └── notificationRoutes.js
```

**Chức năng:**

- CRUD thông báo
- Đánh dấu đã đọc/chưa đọc
- Xem thông báo theo user

## Quy ước đặt tên

### File naming

- **Controller**: `[resource]Controller.js` (VD: `productController.js`)
- **Service**: `[resource]Service.js` (VD: `productService.js`)
- **Routes**: `[resource]Routes.js` (VD: `productRoutes.js`)
- **Middleware**: `[name].middleware.js` (VD: `auth.middleware.js`)

### Import paths

```javascript
// Controller imports Service (cùng thư mục)
import * as productService from "./productService.js";

// Service imports utils/config
import prisma from "../../../config/db.js";
import { validateEmail } from "../../../utils/validation.js";

// Routes imports Controller (cùng thư mục) và middlewares
import * as productController from "./productController.js";
import { authenticateToken } from "../../auth/auth.middleware.js";
import { validateId } from "../../../middlewares/validate.middleware.js";
```

## API Routes Pattern

Tất cả routes đều có prefix `/api`:

```
/api/auth/*                    # Authentication endpoints
/api/users/*                   # User management
/api/customers/*               # Customer management
/api/products/*                # Product management
/api/categories/*              # Category management
/api/product-units/*           # Product unit management
/api/suppliers/*               # Supplier management
/api/branches/*                # Branch management
/api/branch-inventory/*        # Inventory management
/api/cart/*                    # Cart management
/api/vouchers/*                # Voucher management
/api/flashsales/*              # Flash sale management
/api/reviews/*                 # Review management
/api/notifications/*           # Notification management
```

## Authentication Flow

1. User gửi request đến `/api/auth/login` hoặc `/api/auth/register`
2. Server trả về `accessToken` (15m) và `refreshToken` (7d)
3. Client lưu tokens và gửi accessToken trong header: `Authorization: Bearer {token}`
4. Middleware `authenticateToken` verify token và gán `req.user`
5. Middleware phân quyền (`authorizeAdmin`, `authorizeRoles`, etc.) check permissions
6. Khi accessToken hết hạn, client gọi `/api/auth/refresh-token` với refreshToken

## Error Handling

Tất cả errors được xử lý tập trung bởi `errorHandler.middleware.js`:

- Validation errors: 400
- Authentication errors: 401
- Authorization errors: 403
- Not found errors: 404
- Server errors: 500

Response format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

- Global API rate limit: 100 requests/15 phút
- Auth endpoints: 5 requests/15 phút
- Password change: 3 requests/15 phút

## Database

Sử dụng **Prisma ORM** với PostgreSQL:

- Schema: `prisma/schema.prisma`
- Migrations: `npx prisma migrate dev`
- Prisma Studio: `npx prisma studio`

## Scripts

```bash
# Development
npm run dev              # Start với nodemon

# Production
npm start               # Start server

# Database
npx prisma migrate dev  # Run migrations
npx prisma studio       # Open Prisma Studio
npx prisma generate     # Generate Prisma Client

# Import paths fixing (sau khi restructure)
.\update-imports.ps1         # Cập nhật imports
.\fix-all-imports.ps1        # Sửa route imports
.\fix-service-imports.ps1    # Sửa service imports
```

## Environment Variables

```env
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="*"
NODE_ENV="development"
```

## Best Practices

1. **Separation of Concerns**: Controller chỉ xử lý HTTP, logic nằm ở Service
2. **Consistent Response**: Luôn trả về `{ success, data/error }`
3. **Error Handling**: Sử dụng try-catch và errorHandler middleware
4. **Validation**: Validate input ở Service layer
5. **Security**: Luôn hash password, verify JWT, check permissions
6. **Code Reusability**: Tái sử dụng utils, helpers, middlewares
7. **Documentation**: Comment rõ ràng cho các function quan trọng

## Team Collaboration

- Mỗi module có thể được phát triển độc lập
- Conflicts ít hơn khi nhiều người làm việc cùng lúc
- Dễ review code theo từng module
- Dễ viết tests cho từng module

## Future Improvements

- [ ] Thêm module `analytics/` cho báo cáo thống kê
- [ ] Tách `orders/` ra khỏi `cart/` thành module riêng
- [ ] Thêm `payment/` module cho thanh toán online
- [ ] Implement caching với Redis
- [ ] Add logging với Winston
- [ ] Write unit tests với Jest
- [ ] Add API documentation với Swagger
