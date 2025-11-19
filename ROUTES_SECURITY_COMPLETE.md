# 🔐 BẢO MẬT ROUTES - HOÀN THÀNH

## ✅ Tất cả routes đã được bảo vệ!

### 📋 BẢNG TỔNG KẾT BẢO MẬT

| Route                | Public             | Protected                 | Admin Only         | Staff            |
| -------------------- | ------------------ | ------------------------- | ------------------ | ---------------- |
| **Auth**             | ✅ Login/Register  | ✅ Me, Change Password    | -                  | -                |
| **Users**            | -                  | ✅ Get/Update Own Profile | ✅ All CRUD        | -                |
| **Products**         | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Categories**       | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Suppliers**        | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Vouchers**         | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Cart**             | -                  | ✅ All Operations         | -                  | -                |
| **Reviews**          | ✅ GET All/By ID   | ✅ POST/PUT               | ✅ DELETE          | -                |
| **Branches**         | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Branch Inventory** | -                  | ✅ GET All/By ID          | ✅ CRUD            | ✅ Import/Export |
| **Product Units**    | ✅ GET All/By ID   | -                         | ✅ POST/PUT/DELETE | -                |
| **Customers**        | ✅ POST (Register) | ✅ GET/PUT Own            | ✅ All CRUD        | -                |
| **Notifications**    | -                  | ✅ GET/PUT Own            | ✅ POST/DELETE     | -                |
| **Flashsales**       | ✅ GET Active      | -                         | ✅ POST/PUT/DELETE | -                |

---

## 🔑 QUYỀN TRUY CẬP

### 1. **Public Routes** (Không cần token)

```http
# Products
GET /api/products
GET /api/products/:id
GET /api/products/search
GET /api/products/category/:categoryName

# Categories
GET /api/categories
GET /api/categories/:id

# Suppliers
GET /api/suppliers
GET /api/suppliers/:id

# Vouchers
GET /api/vouchers
GET /api/vouchers/:id

# Reviews
GET /api/reviews
GET /api/reviews/:id
GET /api/products/:productId/reviews
GET /api/products/:productId/rating-stats

# Branches
GET /api/branches
GET /api/branches/:id

# Product Units
GET /api/productunits
GET /api/productunits/:id

# Flashsales
GET /api/flashsales
GET /api/flashsales/active

# Auth
POST /api/auth/register
POST /api/auth/login

# Customer
POST /api/customers (Register customer)
```

### 2. **Protected Routes** (Cần token - User đã đăng nhập)

```http
# Auth
GET /api/auth/me
POST /api/auth/change-password
POST /api/auth/logout

# Users
GET /api/users/:id (Own profile)
PUT /api/users/:id (Own profile)

# Cart (Tất cả cart operations)
GET /api/cart/:customerId
POST /api/cart/:customerId/add
DELETE /api/cart/:customerId/remove/:productId
POST /api/cart/:customerId/checkout

# Reviews
POST /api/reviews (Create review)
PUT /api/reviews/:id (Update own review)

# Customers
GET /api/customers/:id (Own profile)
PUT /api/customers/:id (Own profile)

# Notifications
GET /api/notifications (Own notifications)
GET /api/notifications/:id
PUT /api/notifications/:id (Mark as read)

# Branch Inventory (View only)
GET /api/branchinventory
GET /api/branchinventory/:id
```

### 3. **Admin Only Routes** (Cần token + role admin)

```http
# Users
GET /api/users (All users)
POST /api/users
DELETE /api/users/:id

# Products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

# Categories
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id

# Suppliers
POST /api/suppliers
PUT /api/suppliers/:id
DELETE /api/suppliers/:id

# Vouchers
POST /api/vouchers
PUT /api/vouchers/:id
DELETE /api/vouchers/:id

# Reviews
DELETE /api/reviews/:id

# Branches
POST /api/branches
PUT /api/branches/:id
DELETE /api/branches/:id

# Branch Inventory
POST /api/branchinventory
PUT /api/branchinventory/:id
DELETE /api/branchinventory/:id

# Product Units
POST /api/productunits
PUT /api/productunits/:id
DELETE /api/productunits/:id

# Customers
GET /api/customers (All customers)
DELETE /api/customers/:id

# Notifications
POST /api/notifications
DELETE /api/notifications/:id

# Flashsales
POST /api/flashsales
PUT /api/flashsales/:id
DELETE /api/flashsales/:id
```

### 4. **Staff Routes** (Cần token + role admin hoặc staff)

```http
# Branch Inventory
POST /api/branchinventory/import
POST /api/branchinventory/export
```

---

## 🧪 TESTING EXAMPLES

### 1. Test Register (Public)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phone": "0123456789",
    "full_name": "Test User"
  }'
```

### 2. Test Login (Public)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
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

### 3. Test Protected Route

```bash
# Lấy thông tin user hiện tại
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test Admin Route

```bash
# Tạo product mới (chỉ admin)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 100000,
    "base_unit_id": 1
  }'
```

### 5. Test Unauthorized Access

```bash
# Thử tạo product không có token
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 100000
  }'

# Expected Response:
{
  "success": false,
  "error": "Token không được cung cấp"
}
```

---

## 📝 MIDDLEWARE ĐANG SỬ DỤNG

### 1. `authenticateToken`

- Xác thực JWT token
- Gán thông tin user vào `req.user`
- Trả về 401 nếu không có token hoặc token không hợp lệ

### 2. `authorizeAdmin`

- Kiểm tra user có role 'admin' không
- Phải dùng sau `authenticateToken`
- Trả về 403 nếu không phải admin

### 3. `authorizeRoles(...roles)`

- Kiểm tra user có một trong các roles cho phép
- Ví dụ: `authorizeRoles('admin', 'staff')`
- Trả về 403 nếu không có quyền

### 4. `authorizeOwner(paramName)`

- Kiểm tra user có phải owner của resource
- Admin luôn được phép
- User thường chỉ truy cập được resource của mình

### 5. `validateId(paramName)`

- Validate parameter là số nguyên dương
- Mặc định validate parameter 'id'
- Trả về 400 nếu không hợp lệ

---

## 🔒 BẢO MẬT TỐT NHẤT

### ✅ Đã Implement:

1. JWT Authentication
2. Role-based Authorization (Admin, Staff, Customer)
3. Owner-based Authorization
4. Input Validation
5. Error Handling
6. CORS Configuration
7. ID Validation

### 🎯 Nên Thêm (Tùy Chọn):

1. **Rate Limiting** - Giới hạn số request
2. **Helmet.js** - Security headers
3. **Express Validator** - Advanced validation
4. **JWT Refresh Token** - Refresh token mechanism
5. **API Key** - Cho external services
6. **IP Whitelist** - Cho admin routes
7. **Audit Logs** - Log tất cả actions

---

## 🚨 LƯU Ý QUAN TRỌNG

### 1. Environment Variables

Đảm bảo file `.env` có:

```env
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
```

### 2. Role IDs trong Database

Kiểm tra `rolepermissions` table có các roles:

- `id: 1` → Admin
- `id: 2` → Staff
- `id: 3` → Customer

### 3. Token Format

Khi gọi API, token phải có format:

```
Authorization: Bearer <token>
```

### 4. Error Responses

Tất cả lỗi authentication/authorization trả về format:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📞 TROUBLESHOOTING

### Lỗi 401: "Token không được cung cấp"

→ Chưa gửi token trong header Authorization

### Lỗi 403: "Không có quyền truy cập"

→ User không có đủ quyền (không phải admin)

### Lỗi 403: "Token không hợp lệ"

→ Token sai hoặc đã hết hạn, login lại

### Lỗi 400: "id phải là số nguyên dương"

→ ID parameter không hợp lệ

---

## ✨ HOÀN THÀNH!

Tất cả 13 routes đã được bảo vệ đầy đủ với:

- ✅ Authentication middleware
- ✅ Authorization middleware
- ✅ Input validation
- ✅ Error handling
- ✅ Security best practices

**Server đang chạy tại:** http://localhost:3000
**API Documentation:** Xem file này để biết routes nào cần authentication
