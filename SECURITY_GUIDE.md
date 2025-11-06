# 🔐 HƯỚNG DẪN BẢO MẬT VÀ AUTHENTICATION

## Các thay đổi đã thực hiện:

### 1. ✅ Middleware Layer (HOÀN THÀNH)

- **auth.middleware.js**: Authentication & Authorization

  - `authenticateToken`: Xác thực JWT token
  - `authorizeAdmin`: Chỉ admin mới truy cập được
  - `authorizeRoles`: Kiểm tra theo nhiều roles
  - `authorizeOwner`: User chỉ truy cập tài nguyên của mình
  - `optionalAuth`: Authentication không bắt buộc

- **errorHandler.middleware.js**: Xử lý lỗi tập trung

  - `errorHandler`: Global error handler
  - `notFound`: 404 handler
  - `asyncHandler`: Wrapper cho async functions
  - Xử lý Prisma errors tự động

- **validate.middleware.js**: Validation
  - `validateBody`: Validate request body
  - `validateQuery`: Validate query parameters
  - `validateParams`: Validate route parameters
  - `validateId`: Validate ID parameter
  - `validatePagination`: Validate pagination
  - `sanitizeInput`: Sanitize input để tránh XSS

### 2. ✅ Constants (HOÀN THÀNH)

- **constants.js**: Tập trung tất cả constants
  - ORDER_STATUS, USER_ROLES, FLASHSALE_STATUS
  - PAYMENT_STATUS, PAYMENT_METHODS, SHIPMENT_STATUS
  - HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES

### 3. ✅ Helpers (HOÀN THÀNH)

- **helpers.js**: Utility functions
  - `generateToken`: Tạo JWT token
  - `verifyToken`: Verify JWT token
  - `hashPassword`: Hash password
  - `comparePassword`: So sánh password
  - `successResponse`, `errorResponse`: Format response
  - `getPaginationMeta`: Tính toán pagination

### 4. ✅ Authentication System (HOÀN THÀNH)

- **authService.js**: Business logic cho auth

  - `register`: Đăng ký user mới
  - `login`: Đăng nhập
  - `getCurrentUser`: Lấy thông tin user hiện tại
  - `changePassword`: Đổi password

- **authController.js**: Controller cho auth endpoints
- **authRoutes.js**: Routes cho authentication

### 5. ✅ Chuẩn hóa Prisma Client (HOÀN THÀNH)

- Tất cả services giờ import từ `config/db.js`
- Xóa các instance `new PrismaClient()` trùng lặp

### 6. ✅ Protected Routes (HOÀN THÀNH)

- User routes: Yêu cầu authentication
- Flashsale routes: Admin routes được bảo vệ
- Cart routes: User chỉ truy cập cart của mình

---

## 📋 CÀI ĐẶT

### 1. Copy .env.example thành .env

```bash
cp .env.example .env
```

### 2. Cập nhật biến môi trường trong .env

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_db"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
PORT=3000
NODE_ENV="development"
```

**⚠️ QUAN TRỌNG:**

- `JWT_SECRET` phải là chuỗi ngẫu nhiên dài ít nhất 32 ký tự
- Không bao giờ commit file `.env` lên git

### 3. Cài đặt dependencies

```bash
npm install
```

---

## 🚀 SỬ DỤNG

### 1. API Authentication

#### Đăng ký (Register)

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0123456789",
  "full_name": "John Doe",
  "role_id": 3
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": 3,
      "rolepermissions": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Đăng nhập (Login)

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Lấy thông tin user hiện tại

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Đổi password

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

### 2. Sử dụng Protected Routes

#### Gọi API với Authentication

```javascript
// Thêm token vào header
const response = await fetch("http://localhost:3000/api/users", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

#### Ví dụ với Axios

```javascript
import axios from "axios";

// Set default header
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// Hoặc cho từng request
const response = await axios.get("/api/users", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 🔒 BẢO MẬT ROUTES

### Public Routes (Không cần authentication)

- `GET /api/products` - Xem danh sách sản phẩm
- `GET /api/products/:id` - Xem chi tiết sản phẩm
- `GET /api/flashsales/active` - Xem flashsale đang diễn ra
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Protected Routes (Cần authentication)

- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `GET /api/users/:id` - User chỉ xem được thông tin của mình (admin xem tất cả)
- `PUT /api/users/:id` - User chỉ sửa được thông tin của mình

### Admin Only Routes

- `GET /api/users` - Danh sách tất cả users
- `POST /api/users` - Tạo user mới
- `DELETE /api/users/:id` - Xóa user
- `POST /api/flashsales` - Tạo flashsale
- `PUT /api/flashsales/:id` - Sửa flashsale
- `DELETE /api/flashsales/:id` - Xóa flashsale

---

## 🛠️ HƯỚNG DẪN BẢO VỆ ROUTES MỚI

### Ví dụ: Bảo vệ Product Routes

```javascript
// src/routes/productRoutes.js
import {
  authenticateToken,
  authorizeAdmin,
} from "../middlewares/auth.middleware.js";

// Public routes
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);

// Admin only routes
router.post(
  "/products",
  authenticateToken,
  authorizeAdmin,
  productController.createProduct
);
router.put(
  "/products/:id",
  authenticateToken,
  authorizeAdmin,
  productController.updateProduct
);
router.delete(
  "/products/:id",
  authenticateToken,
  authorizeAdmin,
  productController.deleteProduct
);
```

### Sử dụng nhiều middleware

```javascript
router.put(
  "/users/:id",
  authenticateToken, // Bước 1: Xác thực
  authorizeOwner("id"), // Bước 2: Kiểm tra ownership
  validateId(), // Bước 3: Validate ID
  userController.updateUser // Bước 4: Controller
);
```

---

## 📝 CẦN LÀM TIẾP

### 1. Áp dụng middleware cho các routes còn lại

- [ ] productRoutes.js
- [ ] categoryRoutes.js
- [ ] supplierRoutes.js
- [ ] voucherRoutes.js
- [ ] cartRoutes.js
- [ ] reviewRoutes.js
- [ ] branchRoutes.js

### 2. Fix schema inconsistencies

- [ ] Chạy `npx prisma db pull` để sync schema
- [ ] Hoặc fix code để match với schema hiện tại

### 3. Testing

- [ ] Test register/login endpoints
- [ ] Test protected routes
- [ ] Test authorization (admin vs user)

---

## 🐛 TROUBLESHOOTING

### Lỗi: "JWT_SECRET is not defined"

→ Kiểm tra file `.env` đã có `JWT_SECRET`

### Lỗi: "Token không hợp lệ"

→ Token đã hết hạn hoặc sai. Login lại để lấy token mới

### Lỗi: "Không có quyền truy cập"

→ User không phải admin hoặc không phải owner của resource

### Lỗi: "Prisma table not found"

→ Chạy migrations: `npx prisma migrate dev`

---

## 📞 SUPPORT

Nếu có vấn đề, kiểm tra:

1. File `.env` đã được cấu hình chưa
2. Database đã chạy chưa
3. Migrations đã chạy chưa (`npx prisma migrate dev`)
4. Token có đúng format `Bearer <token>` không
