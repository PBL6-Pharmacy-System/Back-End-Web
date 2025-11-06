# 🧪 HƯỚNG DẪN TEST API VỚI POSTMAN

## 📥 BƯỚC 1: IMPORT COLLECTION VÀO POSTMAN

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file: `postman/PBL6-Pharmacy-API.postman_collection.json`
4. Click **Import**

## 🔧 BƯỚC 2: TẠO ENVIRONMENT

1. Click biểu tượng **Environment** (góc phải)
2. Click **+** để tạo environment mới
3. Đặt tên: **PBL6 Local**
4. Thêm các variables:

| Variable         | Initial Value               | Current Value               |
| ---------------- | --------------------------- | --------------------------- |
| `base_url`       | `http://localhost:3000/api` | `http://localhost:3000/api` |
| `access_token`   | (để trống)                  | (để trống)                  |
| `refresh_token`  | (để trống)                  | (để trống)                  |
| `customer_token` | (để trống)                  | (để trống)                  |
| `user_id`        | (để trống)                  | (để trống)                  |

5. Click **Save**
6. Chọn environment **PBL6 Local** trong dropdown

## 🚀 BƯỚC 3: TEST AUTHENTICATION

### Test 1: Đăng ký Admin

```
Folder: 1. Authentication
Request: Register Admin
Method: POST
URL: {{base_url}}/auth/register

Body (JSON):
{
  "username": "admin",
  "email": "admin@pharmacy.com",
  "password": "Admin@123456",
  "full_name": "Administrator",
  "phone": "0123456789",
  "role_id": 1
}

✅ Expected: 201 Created
📝 Note: Token tự động được lưu vào environment variable
```

**Kiểm tra kết quả:**

- Status: 201 Created
- Response có `data.token`, `data.refreshToken`, `data.user`
- Trong Environment, `access_token` và `refresh_token` đã được set tự động

---

### Test 2: Đăng ký Customer

```
Folder: 1. Authentication
Request: Register Customer
Method: POST

Body (JSON):
{
  "username": "customer1",
  "email": "customer@example.com",
  "password": "Customer@123",
  "full_name": "John Doe",
  "phone": "0987654321",
  "role_id": 3
}

✅ Expected: 201 Created
📝 Note: customer_token được lưu vào environment
```

---

### Test 3: Login Admin

```
Folder: 1. Authentication
Request: Login Admin
Method: POST

Body (JSON):
{
  "username": "admin",
  "password": "Admin@123456"
}

✅ Expected: 200 OK
📝 Note: Token mới được cập nhật vào environment
```

**Check trong Console (View → Show Postman Console):**

```
Login successful
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Test 4: Get Current User (Với Token)

```
Folder: 1. Authentication
Request: Get Current User
Method: GET
Auth: Bearer Token (tự động từ {{access_token}})

✅ Expected: 200 OK
Response: Thông tin user đang login
```

**Kiểm tra:**

- Status: 200 OK
- Response có đầy đủ thông tin user (id, username, email, role)

---

### Test 5: Refresh Token

```
Folder: 1. Authentication
Request: Refresh Token
Method: POST

Body (JSON):
{
  "refreshToken": "{{refresh_token}}"
}

✅ Expected: 200 OK
📝 Note: access_token mới được cập nhật
```

---

## 🔒 BƯỚC 4: TEST AUTHORIZATION

### Test 6: Access Without Token (401)

```
Folder: 6. Test Authorization
Request: Test 401 - No Token
Method: GET
Auth: No Auth

❌ Expected: 401 Unauthorized
Response:
{
  "success": false,
  "message": "No token provided"
}
```

**Mục đích:** Kiểm tra route bảo vệ có từ chối request không có token

---

### Test 7: Customer Access Admin Route (403)

```
Folder: 6. Test Authorization
Request: Test 403 - Customer Access Admin Route

Bước 1: Login Customer để có token
Bước 2: Dùng customer_token để tạo product

Method: POST
Auth: Bearer Token = {{customer_token}}

Body:
{
  "name": "Test Product",
  "price": 1000
}

❌ Expected: 403 Forbidden
Response:
{
  "success": false,
  "message": "Access denied. Admin role required"
}
```

**Mục đích:** Kiểm tra customer KHÔNG thể truy cập route dành cho admin

---

## 📦 BƯỚC 5: TEST ADMIN OPERATIONS

### Test 8: Create Product (Admin Only)

```
Folder: 2. Products (Public & Admin)
Request: Create Product (Admin Only)
Method: POST
Auth: Bearer Token = {{access_token}} (Admin token)

Body:
{
  "name": "Paracetamol 500mg",
  "description": "Pain reliever and fever reducer",
  "price": 5000,
  "manufacturer": "ABC Pharma",
  "category_id": 1,
  "supplier_id": 1,
  "base_unit_id": 1
}

✅ Expected: 201 Created (nếu là admin)
❌ Expected: 403 Forbidden (nếu là customer)
```

---

### Test 9: Update Product (Admin Only)

```
Request: Update Product (Admin Only)
Method: PUT
URL: {{base_url}}/products/1
Auth: Admin token

Body:
{
  "name": "Paracetamol 500mg Updated",
  "price": 6000
}

✅ Expected: 200 OK (admin)
```

---

### Test 10: Delete Product (Admin Only)

```
Request: Delete Product (Admin Only)
Method: DELETE
URL: {{base_url}}/products/1
Auth: Admin token

✅ Expected: 200 OK (admin)
❌ Expected: 403 Forbidden (customer)
```

---

## 🌐 BƯỚC 6: TEST PUBLIC ENDPOINTS

### Test 11: Get All Products (No Auth)

```
Folder: 2. Products (Public & Admin)
Request: Get All Products (Public)
Method: GET
Auth: No Auth

✅ Expected: 200 OK
📝 Note: API public, không cần token
```

---

### Test 12: Get Product By ID (No Auth)

```
Request: Get Product By ID (Public)
Method: GET
URL: {{base_url}}/products/1
Auth: No Auth

✅ Expected: 200 OK
```

---

### Test 13: Search Products (No Auth)

```
Request: Search Products (Public)
Method: GET
URL: {{base_url}}/products/search?q=para
Auth: No Auth

✅ Expected: 200 OK
```

---

## 🛒 BƯỚC 7: TEST CART (AUTHENTICATED)

### Test 14: Get Cart

```
Folder: 5. Cart (Authenticated)
Request: Get Cart
Method: GET
URL: {{base_url}}/cart/1
Auth: Bearer Token

✅ Expected: 200 OK (authenticated user)
❌ Expected: 401 Unauthorized (no token)
```

---

### Test 15: Add to Cart

```
Request: Add to Cart
Method: POST
URL: {{base_url}}/cart/1/add
Auth: Bearer Token

Body:
{
  "productId": 1,
  "productUnitId": 1,
  "quantity": 2,
  "unitPrice": 5000
}

✅ Expected: 200 OK
```

---

## 👥 BƯỚC 8: TEST USER ENDPOINTS

### Test 16: Get All Users (Admin Only)

```
Folder: 4. Users (Admin Only)
Request: Get All Users (Admin Only)
Method: GET
Auth: Admin token

✅ Expected: 200 OK (admin)
❌ Expected: 403 Forbidden (customer)
```

---

### Test 17: Get User By ID (Owner/Admin)

```
Request: Get User By ID (Owner/Admin)
Method: GET
URL: {{base_url}}/users/{{user_id}}
Auth: Bearer Token

✅ Expected: 200 OK (user viewing own profile)
✅ Expected: 200 OK (admin viewing any user)
❌ Expected: 403 Forbidden (user A viewing user B)
```

---

## ⏱️ BƯỚC 9: TEST RATE LIMITING

### Test 18: Rate Limiting - Auth Endpoints

```
Test: Gọi Login 6 lần liên tiếp trong vòng 15 phút

1. Gọi request "Login Admin"
2. Click Send 6 lần nhanh

✅ Lần 1-5: 200 OK hoặc 400 Bad Request
❌ Lần 6+: 429 Too Many Requests

Response:
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## 🎯 CHECKLIST TESTING

### Authentication & Authorization

- [x] Register Admin → 201 Created
- [x] Register Customer → 201 Created
- [x] Login Admin → 200 OK, token được set
- [x] Login Customer → 200 OK
- [x] Get Current User → 200 OK (với token)
- [x] Get Current User → 401 Unauthorized (không token)
- [x] Refresh Token → 200 OK, token mới
- [x] Change Password → 200 OK

### Authorization Tests

- [x] Customer tạo product → 403 Forbidden ✅
- [x] Admin tạo product → 201 Created ✅
- [x] Customer xóa product → 403 Forbidden ✅
- [x] Admin xóa product → 200 OK ✅

### Public Endpoints

- [x] Get Products (no auth) → 200 OK ✅
- [x] Get Product by ID (no auth) → 200 OK ✅
- [x] Search Products (no auth) → 200 OK ✅

### Protected Endpoints

- [x] Get Cart (no auth) → 401 Unauthorized ✅
- [x] Get Cart (with auth) → 200 OK ✅
- [x] Add to Cart (with auth) → 200 OK ✅

### Rate Limiting

- [x] Login 6 lần → 429 Too Many Requests ✅
- [x] Register 6 lần → 429 Too Many Requests ✅

---

## 🔍 DEBUGGING TIPS

### Lỗi 401 Unauthorized

```
Nguyên nhân:
- Token không được gửi trong header
- Token hết hạn (15 phút)
- Token không hợp lệ

Giải pháp:
1. Kiểm tra environment variable {{access_token}}
2. Login lại để lấy token mới
3. Hoặc dùng refresh token
```

### Lỗi 403 Forbidden

```
Nguyên nhân:
- User không có quyền truy cập
- Role không đúng (customer truy cập admin route)

Giải pháp:
1. Kiểm tra role_id khi đăng ký (1=admin, 3=customer)
2. Login bằng account có quyền phù hợp
```

### Lỗi 429 Too Many Requests

```
Nguyên nhân:
- Vượt quá giới hạn rate limit

Giải pháp:
- Đợi 15 phút
- Hoặc restart server để reset rate limit counter
```

---

## 📊 KẾT QUẢ MONG ĐỢI

| Test Case        | Method | Auth Required | Expected Status | Role Required |
| ---------------- | ------ | ------------- | --------------- | ------------- |
| Register         | POST   | ❌            | 201             | -             |
| Login            | POST   | ❌            | 200             | -             |
| Get Current User | GET    | ✅            | 200             | Any           |
| Refresh Token    | POST   | ❌            | 200             | -             |
| Get Products     | GET    | ❌            | 200             | -             |
| Create Product   | POST   | ✅            | 201             | Admin         |
| Update Product   | PUT    | ✅            | 200             | Admin         |
| Delete Product   | DELETE | ✅            | 200             | Admin         |
| Get Cart         | GET    | ✅            | 200             | Any           |
| Get All Users    | GET    | ✅            | 200             | Admin         |

---

## 🎓 LƯU Ý QUAN TRỌNG

1. **Token Expiry:**

   - Access Token: Hết hạn sau 15 phút
   - Refresh Token: Hết hạn sau 7 ngày
   - Nếu access token hết hạn → Dùng refresh token để lấy token mới

2. **Role IDs:**

   - 1 = Admin (full access)
   - 2 = Employee (có thể custom sau)
   - 3 = Customer (read only + own resources)

3. **Environment Variables:**

   - Luôn chọn đúng environment trước khi test
   - Token được lưu tự động sau khi login/register

4. **Rate Limiting:**
   - Auth endpoints: 5 requests / 15 phút
   - API endpoints: 100 requests / 15 phút
   - Write operations: 30 requests / 15 phút

---

## 🚀 NEXT STEPS

Sau khi test xong, bạn có thể:

1. Test các flashsale endpoints
2. Test order endpoints
3. Test review endpoints
4. Tích hợp với frontend
5. Deploy lên production

---

**Happy Testing! 🎉**
