# 📋 DANH SÁCH API CẦN KIỂM TRA - PHÂN THEO ROLE VÀ KỊCH BẢN

## 📊 TỔNG QUAN

### Các Role trong hệ thống:
| Role | Mô tả |
|------|-------|
| **Public** | Không cần đăng nhập |
| **Customer** | Khách hàng đã đăng nhập |
| **Staff** | Nhân viên chi nhánh |
| **Admin** | Quản trị viên |

### Ký hiệu:
- ✅ Được phép truy cập
- ❌ Không được phép (403 Forbidden)
- 🔐 Cần xác thực (401 Unauthorized nếu không có token)
- 👤 Chỉ truy cập data của chính mình (ownership check)

---

## 1️⃣ MODULE: AUTHENTICATION (`/api/auth`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | POST | `/auth/register` | ✅ | ✅ | ✅ | ✅ | Đăng ký tài khoản mới |
| 2 | POST | `/auth/login` | ✅ | ✅ | ✅ | ✅ | Đăng nhập bằng email/password |
| 3 | POST | `/auth/refresh-token` | ✅ | ✅ | ✅ | ✅ | Làm mới access token |
| 4 | POST | `/auth/otp/request` | ✅ | ✅ | ✅ | ✅ | Yêu cầu gửi OTP |
| 5 | POST | `/auth/otp/verify` | ✅ | ✅ | ✅ | ✅ | Xác thực OTP |
| 6 | POST | `/auth/customer/login-otp` | ✅ | ✅ | ✅ | ✅ | Đăng nhập bằng OTP |
| 7 | GET | `/auth/me` | ❌🔐 | ✅ | ✅ | ✅ | Lấy thông tin user hiện tại |
| 8 | POST | `/auth/change-password` | ❌🔐 | ✅ | ✅ | ✅ | Đổi mật khẩu |
| 9 | POST | `/auth/logout` | ❌🔐 | ✅ | ✅ | ✅ | Đăng xuất |

### Kịch bản chi tiết:
```
📝 TC-AUTH-01: Đăng ký với email hợp lệ → Success
📝 TC-AUTH-02: Đăng ký với email đã tồn tại → 409 Conflict
📝 TC-AUTH-03: Đăng nhập sai password → 401 Unauthorized
📝 TC-AUTH-04: Đăng nhập đúng → Trả về token
📝 TC-AUTH-05: Refresh token hết hạn → 401 Unauthorized
📝 TC-AUTH-06: Truy cập /auth/me không có token → 401 Unauthorized
📝 TC-AUTH-07: Rate limiting - Gửi quá nhiều request → 429 Too Many Requests
```

---

## 2️⃣ MODULE: USER MANAGEMENT (`/api/users`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/users` | ❌🔐 | ❌ | ❌ | ✅ | Lấy danh sách tất cả users |
| 2 | POST | `/users` | ❌🔐 | ❌ | ❌ | ✅ | Tạo user mới |
| 3 | GET | `/users/:id` | ❌🔐 | 👤 | ❌ | ✅ | Lấy thông tin user theo ID |
| 4 | PUT | `/users/:id` | ❌🔐 | 👤 | ❌ | ✅ | Cập nhật thông tin user |
| 5 | DELETE | `/users/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa user |

### Kịch bản chi tiết:
```
📝 TC-USER-01: Customer xem thông tin của mình → Success
📝 TC-USER-02: Customer xem thông tin user khác → 403 Forbidden
📝 TC-USER-03: Customer cập nhật thông tin của mình → Success
📝 TC-USER-04: Customer cập nhật thông tin user khác → 403 Forbidden
📝 TC-USER-05: Admin xem tất cả users → Success
📝 TC-USER-06: Admin xóa user → Success
```

---

## 3️⃣ MODULE: CUSTOMER MANAGEMENT (`/api/customers`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/customers` | ❌🔐 | ❌ | ❌ | ✅ | Lấy danh sách customers |
| 2 | GET | `/customers/:id` | ❌🔐 | 👤 | ❌ | ✅ | Lấy thông tin customer |
| 3 | PUT | `/customers/:id` | ❌🔐 | 👤 | ❌ | ✅ | Cập nhật customer |
| 4 | POST | `/customers` | ❌🔐 | ❌ | ❌ | ✅ | Tạo customer (Admin only) |
| 5 | DELETE | `/customers/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa customer |
| 6 | GET | `/customers/:id/stats` | ❌🔐 | 👤 | ❌ | ✅ | Thống kê customer |
| 7 | GET | `/customers/:id/reviews` | ❌🔐 | 👤 | ❌ | ✅ | Đánh giá của customer |

### Kịch bản chi tiết:
```
📝 TC-CUST-01: Customer xem thông tin của mình → Success
📝 TC-CUST-02: Customer A xem thông tin Customer B → 403 Forbidden
📝 TC-CUST-03: Customer xem stats của mình → Success
📝 TC-CUST-04: Customer xem stats của người khác → 403 Forbidden
📝 TC-CUST-05: Admin xem tất cả customers → Success
```

---

## 4️⃣ MODULE: STAFF MANAGEMENT (`/api/staff`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/staff` | ❌🔐 | ❌ | ❌ | ✅ | Lấy danh sách nhân viên |
| 2 | GET | `/staff/:id` | ❌🔐 | ❌ | ❌ | ✅ | Lấy thông tin nhân viên |
| 3 | POST | `/staff` | ❌🔐 | ❌ | ❌ | ✅ | Tạo nhân viên mới |
| 4 | PUT | `/staff/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật nhân viên |
| 5 | DELETE | `/staff/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa nhân viên |
| 6 | GET | `/branches/:branchId/staff` | ❌🔐 | ❌ | ❌ | ✅ | Nhân viên theo chi nhánh |

### Kịch bản chi tiết:
```
📝 TC-STAFF-01: Customer truy cập /staff → 403 Forbidden
📝 TC-STAFF-02: Staff truy cập /staff → 403 Forbidden
📝 TC-STAFF-03: Admin xem danh sách staff → Success
📝 TC-STAFF-04: Admin tạo staff mới → Success
📝 TC-STAFF-05: Admin xóa staff → Success
```

---

## 5️⃣ MODULE: ADMIN MANAGEMENT (`/api/admins`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/admins` | ❌🔐 | ❌ | ❌ | ✅ | Lấy danh sách admins |
| 2 | GET | `/admins/:id` | ❌🔐 | ❌ | ❌ | ✅ | Lấy thông tin admin |
| 3 | POST | `/admins` | ❌🔐 | ❌ | ❌ | ✅ | Tạo admin mới |
| 4 | PUT | `/admins/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật admin |
| 5 | DELETE | `/admins/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa admin |
| 6 | PUT | `/admins/:id/permissions` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật quyền admin |

### Kịch bản chi tiết:
```
📝 TC-ADMIN-01: Staff truy cập /admins → 403 Forbidden
📝 TC-ADMIN-02: Admin tạo admin khác → Success
📝 TC-ADMIN-03: Admin cập nhật permissions → Success
```

---

## 6️⃣ MODULE: PRODUCT MANAGEMENT (`/api/products`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/products` | ✅ | ✅ | ✅ | ✅ | Lấy danh sách sản phẩm |
| 2 | GET | `/products/search` | ✅ | ✅ | ✅ | ✅ | Tìm kiếm sản phẩm |
| 3 | GET | `/products/best-sellers` | ✅ | ✅ | ✅ | ✅ | Sản phẩm bán chạy |
| 4 | GET | `/products/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết sản phẩm |
| 5 | GET | `/products/:id/stats` | ✅ | ✅ | ✅ | ✅ | Thống kê sản phẩm |
| 6 | POST | `/products` | ❌🔐 | ❌ | ❌ | ✅ | Tạo sản phẩm mới |
| 7 | PUT | `/products/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật sản phẩm |
| 8 | DELETE | `/products/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa sản phẩm |

### Kịch bản chi tiết:
```
📝 TC-PROD-01: Public xem danh sách sản phẩm → Success
📝 TC-PROD-02: Public tìm kiếm sản phẩm → Success
📝 TC-PROD-03: Customer tạo sản phẩm → 403 Forbidden
📝 TC-PROD-04: Staff tạo sản phẩm → 403 Forbidden
📝 TC-PROD-05: Admin tạo sản phẩm → Success
📝 TC-PROD-06: Admin xóa sản phẩm → Success
📝 TC-PROD-07: Rate limiting search → 429 sau nhiều requests
```

---

## 7️⃣ MODULE: CATEGORY MANAGEMENT (`/api/categories`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/categories` | ✅ | ✅ | ✅ | ✅ | Lấy danh sách danh mục |
| 2 | GET | `/categories/tree` | ✅ | ✅ | ✅ | ✅ | Cây danh mục |
| 3 | GET | `/categories/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết danh mục |
| 4 | GET | `/categories/:id/stats` | ✅ | ✅ | ✅ | ✅ | Thống kê danh mục |
| 5 | POST | `/categories` | ❌🔐 | ❌ | ❌ | ✅ | Tạo danh mục |
| 6 | PUT | `/categories/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật danh mục |
| 7 | DELETE | `/categories/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa danh mục |

### Kịch bản chi tiết:
```
📝 TC-CAT-01: Public xem categories → Success
📝 TC-CAT-02: Customer tạo category → 403 Forbidden
📝 TC-CAT-03: Admin tạo category → Success
📝 TC-CAT-04: Xóa category có sản phẩm → 400 Bad Request
```

---

## 8️⃣ MODULE: SUPPLIER MANAGEMENT (`/api/suppliers`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/suppliers` | ✅ | ✅ | ✅ | ✅ | Lấy danh sách NCC |
| 2 | GET | `/suppliers/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết NCC |
| 3 | POST | `/suppliers` | ❌🔐 | ❌ | ❌ | ✅ | Tạo NCC |
| 4 | PUT | `/suppliers/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật NCC |
| 5 | DELETE | `/suppliers/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa NCC |

---

## 9️⃣ MODULE: PRODUCT UNITS (`/api/productunits`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/productunits` | ✅ | ✅ | ✅ | ✅ | Lấy danh sách đơn vị |
| 2 | GET | `/productunits/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết đơn vị |
| 3 | GET | `/product-units/product/:productId` | ✅ | ✅ | ✅ | ✅ | Đơn vị theo sản phẩm |
| 4 | POST | `/productunits` | ❌🔐 | ❌ | ❌ | ✅ | Tạo đơn vị |
| 5 | PUT | `/productunits/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật đơn vị |
| 6 | DELETE | `/productunits/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa đơn vị |

---

## 🔟 MODULE: ORDER MANAGEMENT (`/api/orders`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/orders` | ❌🔐 | ❌ | ✅ | ✅ | Lấy tất cả đơn hàng |
| 2 | GET | `/orders/statistics` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê đơn hàng |
| 3 | GET | `/orders/:id` | ❌🔐 | 👤 | ✅ | ✅ | Chi tiết đơn hàng |
| 4 | GET | `/customers/:customerId/orders` | ❌🔐 | 👤 | ✅ | ✅ | Đơn hàng của customer |
| 5 | PUT | `/orders/:id/status` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật trạng thái |
| 6 | PUT | `/orders/:id/note` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật ghi chú |
| 7 | POST | `/orders/:id/cancel` | ❌🔐 | ❌ | ✅ | ✅ | Hủy đơn hàng |

### Kịch bản chi tiết:
```
📝 TC-ORDER-01: Customer xem đơn hàng của mình → Success
📝 TC-ORDER-02: Customer A xem đơn hàng Customer B → 403 Forbidden
📝 TC-ORDER-03: Customer cập nhật status → 403 Forbidden
📝 TC-ORDER-04: Staff xem tất cả orders → Success
📝 TC-ORDER-05: Staff cập nhật status → Success
📝 TC-ORDER-06: Staff hủy đơn → Success
📝 TC-ORDER-07: Admin xem statistics → Success
```

---

## 1️⃣1️⃣ MODULE: CART MANAGEMENT (`/api/cart`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/cart/:customerId` | ❌🔐 | 👤 | ✅ | ✅ | Lấy giỏ hàng |
| 2 | GET | `/cart/:customerId/summary` | ❌🔐 | 👤 | ✅ | ✅ | Tóm tắt giỏ hàng |
| 3 | POST | `/cart/:customerId/add` | ❌🔐 | 👤 | ✅ | ✅ | Thêm vào giỏ |
| 4 | PUT | `/cart/:customerId/items/:itemId` | ❌🔐 | 👤 | ✅ | ✅ | Cập nhật item |
| 5 | DELETE | `/cart/:customerId/items/:itemId` | ❌🔐 | 👤 | ✅ | ✅ | Xóa item |
| 6 | DELETE | `/cart/:customerId/clear` | ❌🔐 | 👤 | ✅ | ✅ | Xóa toàn bộ giỏ |
| 7 | POST | `/cart/:customerId/voucher/preview` | ❌🔐 | 👤 | ✅ | ✅ | Xem trước voucher |
| 8 | POST | `/cart/merge` | ❌🔐 | ✅ | ✅ | ✅ | Merge giỏ hàng |
| 9 | POST | `/cart/checkout` | ❌🔐 | ✅ | ✅ | ✅ | Thanh toán |

### Kịch bản chi tiết:
```
📝 TC-CART-01: Customer xem giỏ hàng của mình → Success
📝 TC-CART-02: Customer A xem giỏ hàng Customer B → 403 Forbidden
📝 TC-CART-03: Customer thêm sản phẩm vào giỏ → Success
📝 TC-CART-04: Customer checkout → Success (tạo order)
📝 TC-CART-05: Rate limiting cart operations → 429
```

---

## 1️⃣2️⃣ MODULE: PAYMENT MANAGEMENT (`/api/payments`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/payments/statistics` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê thanh toán |
| 2 | GET | `/payments/:id` | ❌🔐 | 👤 | ✅ | ✅ | Chi tiết thanh toán |
| 3 | PUT | `/payments/:id/status` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật trạng thái |
| 4 | POST | `/payments/:id/process-cod` | ❌🔐 | ❌ | ✅ | ✅ | Xử lý COD |

### Kịch bản chi tiết:
```
📝 TC-PAY-01: Customer xem payment của order mình → Success
📝 TC-PAY-02: Customer xem payment của order người khác → 403 Forbidden
📝 TC-PAY-03: Staff cập nhật payment status → Success
📝 TC-PAY-04: Admin xem statistics → Success
```

---

## 1️⃣3️⃣ MODULE: SHIPMENT MANAGEMENT (`/api/shipments`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/shipments/track/:trackingNumber` | ✅ | ✅ | ✅ | ✅ | Tra cứu vận đơn (Public) |
| 2 | GET | `/shipments` | ❌🔐 | ❌ | ✅ | ✅ | Tất cả shipments |
| 3 | GET | `/shipments/statistics` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê shipments |
| 4 | GET | `/shipments/:id` | ❌🔐 | 👤 | ✅ | ✅ | Chi tiết shipment |
| 5 | GET | `/orders/:orderId/shipments` | ❌🔐 | 👤 | ✅ | ✅ | Shipments theo order |
| 6 | POST | `/shipments` | ❌🔐 | ❌ | ✅ | ✅ | Tạo shipment |
| 7 | PUT | `/shipments/:id/status` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật trạng thái |

### Kịch bản chi tiết:
```
📝 TC-SHIP-01: Public tra cứu tracking → Success
📝 TC-SHIP-02: Customer xem shipment của order mình → Success
📝 TC-SHIP-03: Customer xem shipment order người khác → 403 Forbidden
📝 TC-SHIP-04: Staff tạo shipment → Success
📝 TC-SHIP-05: Staff cập nhật status → Success
```

---

## 1️⃣4️⃣ MODULE: SHIPPING ADDRESS (`/api/shipping-addresses`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/customers/:customerId/shipping-addresses` | ❌🔐 | 👤 | ✅ | ✅ | Danh sách địa chỉ |
| 2 | GET | `/customers/:customerId/shipping-addresses/default` | ❌🔐 | 👤 | ✅ | ✅ | Địa chỉ mặc định |
| 3 | GET | `/shipping-addresses/:id` | ❌🔐 | 👤 | ✅ | ✅ | Chi tiết địa chỉ |
| 4 | POST | `/customers/:customerId/shipping-addresses` | ❌🔐 | 👤 | ✅ | ✅ | Tạo địa chỉ |
| 5 | PUT | `/shipping-addresses/:id` | ❌🔐 | 👤 | ✅ | ✅ | Cập nhật địa chỉ |
| 6 | DELETE | `/shipping-addresses/:id` | ❌🔐 | 👤 | ✅ | ✅ | Xóa địa chỉ |
| 7 | PUT | `/shipping-addresses/:id/set-default` | ❌🔐 | 👤 | ✅ | ✅ | Đặt làm mặc định |

### Kịch bản chi tiết:
```
📝 TC-ADDR-01: Customer xem địa chỉ của mình → Success
📝 TC-ADDR-02: Customer A xem địa chỉ Customer B → 403 Forbidden
📝 TC-ADDR-03: Customer tạo địa chỉ mới → Success
📝 TC-ADDR-04: Customer đặt địa chỉ mặc định → Success
```

---

## 1️⃣5️⃣ MODULE: SHIPPING FEES (`/api/shipping`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/shipping/zones` | ✅ | ✅ | ✅ | ✅ | Lấy danh sách vùng vận chuyển |
| 2 | GET | `/shipping/calculate` | ✅ | ✅ | ✅ | ✅ | Tính phí vận chuyển theo khoảng cách |
| 3 | POST | `/shipping/zones` | ❌🔐 | ❌ | ❌ | ✅ | Tạo vùng vận chuyển mới |
| 4 | PUT | `/shipping/zones/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật vùng vận chuyển |
| 5 | DELETE | `/shipping/zones/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa vùng vận chuyển |

### Kịch bản chi tiết:
```
📝 TC-SHIPFEE-01: Public xem zones → Success
📝 TC-SHIPFEE-02: Public tính phí với distance=10 → Success (trả về fee)
📝 TC-SHIPFEE-03: Customer tạo zone → 403 Forbidden
📝 TC-SHIPFEE-04: Admin tạo zone → Success
```

---

## 1️⃣6️⃣ MODULE: BRANCH MANAGEMENT (`/api/branches`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/branches` | ✅ | ✅ | ✅ | ✅ | Danh sách chi nhánh |
| 2 | GET | `/branches/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết chi nhánh |
| 3 | POST | `/branches` | ❌🔐 | ❌ | ❌ | ✅ | Tạo chi nhánh |
| 4 | PUT | `/branches/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật chi nhánh |
| 5 | DELETE | `/branches/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa chi nhánh |

---

## 1️⃣7️⃣ MODULE: BRANCH INVENTORY (`/api/branches/:branchId/inventory`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/branches/:branchId/inventory` | ✅* | ✅* | ✅ | ✅ | Tồn kho chi nhánh (*masked data) |
| 2 | GET | `/branches/:branchId/inventory/:productId` | ✅* | ✅* | ✅ | ✅ | Chi tiết tồn kho (*masked) |
| 3 | GET | `/branches/:branchId/inventory/alerts/expiring-soon` | ❌🔐 | ❌ | ✅ | ✅ | Cảnh báo hết hạn |
| 4 | GET | `/branches/:branchId/inventory/alerts/low-stock` | ❌🔐 | ❌ | ✅ | ✅ | Cảnh báo tồn kho thấp |
| 5 | PUT | `/branches/:branchId/inventory/:productId` | ❌🔐 | ❌ | ✅🏢 | ✅ | Cập nhật tồn kho (Staff own branch) |

### Kịch bản chi tiết:
```
📝 TC-BINV-01: Public xem inventory → Success (chỉ thấy in_stock: true/false)
📝 TC-BINV-02: Staff xem inventory → Success (thấy số lượng chính xác)
📝 TC-BINV-03: Staff branch A cập nhật inventory branch B → 403 Forbidden
📝 TC-BINV-04: Staff cập nhật inventory branch của mình → Success
📝 TC-BINV-05: Customer xem expiring-soon → 403 Forbidden
```

---

## 1️⃣8️⃣ MODULE: GLOBAL BRANCH INVENTORY (`/api/branch-inventory`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/branch-inventory` | ❌🔐 | ❌ | ✅ | ✅ | Tất cả tồn kho |
| 2 | GET | `/branch-inventory/alerts/low-stock` | ❌🔐 | ❌ | ✅ | ✅ | Cảnh báo tồn kho thấp |
| 3 | GET | `/branch-inventory/:id` | ❌🔐 | ❌ | ✅ | ✅ | Chi tiết inventory record |
| 4 | POST | `/branch-inventory` | ❌🔐 | ❌ | ❌ | ✅ | Tạo inventory record |
| 5 | DELETE | `/branch-inventory/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa inventory record |

---

## 1️⃣9️⃣ MODULE: INVENTORY TRANSFER (`/api/inventory-transfers`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/inventory-transfers` | ❌🔐 | ❌ | ✅ | ✅ | Danh sách phiếu chuyển |
| 2 | GET | `/inventory-transfers/:id` | ❌🔐 | ❌ | ✅ | ✅ | Chi tiết phiếu |
| 3 | POST | `/inventory-transfers` | ❌🔐 | ❌ | ✅🏢 | ✅ | Tạo phiếu chuyển |
| 4 | POST | `/inventory-transfers/:id/approve` | ❌🔐 | ❌ | ❌ | ✅ | Duyệt phiếu |
| 5 | POST | `/inventory-transfers/:id/ship` | ❌🔐 | ❌ | ✅🏢 | ✅ | Xuất kho |
| 6 | POST | `/inventory-transfers/:id/receive` | ❌🔐 | ❌ | ✅🏢 | ✅ | Nhận kho |
| 7 | POST | `/inventory-transfers/:id/cancel` | ❌🔐 | ❌ | ✅ | ✅ | Hủy phiếu |

### Kịch bản chi tiết:
```
📝 TC-TRANS-01: Staff tạo phiếu chuyển từ branch mình → Success
📝 TC-TRANS-02: Staff tạo phiếu từ branch khác → 403 Forbidden
📝 TC-TRANS-03: Staff duyệt phiếu → 403 Forbidden (Admin only)
📝 TC-TRANS-04: Admin duyệt phiếu → Success
📝 TC-TRANS-05: Staff xuất kho từ branch mình → Success
📝 TC-TRANS-06: Staff nhận kho vào branch mình → Success
```

---

## 2️⃣0️⃣ MODULE: PRODUCT BATCH (`/api/product-batches`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/product-batches` | ❌🔐 | ❌ | ✅ | ✅ | Danh sách lô hàng |
| 2 | GET | `/product-batches/:id` | ❌🔐 | ❌ | ✅ | ✅ | Chi tiết lô hàng |
| 3 | GET | `/product-batches/expiring-soon` | ❌🔐 | ❌ | ✅ | ✅ | Lô sắp hết hạn |
| 4 | POST | `/product-batches` | ❌🔐 | ❌ | ✅🏢 | ✅ | Tạo lô hàng (nhập kho) |
| 5 | PUT | `/product-batches/:id` | ❌🔐 | ❌ | ✅🏢 | ✅ | Cập nhật lô |
| 6 | DELETE | `/product-batches/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa lô (Admin only) |
| 7 | POST | `/product-batches/:id/expire` | ❌🔐 | ❌ | ✅🏢 | ✅ | Đánh dấu hết hạn |
| 8 | POST | `/product-batches/:id/dispose` | ❌🔐 | ❌ | ✅🏢 | ✅ | Tiêu hủy lô |
| 9 | GET | `/product-batches/fefo/:branchId/:productId` | ❌🔐 | ❌ | ✅ | ✅ | Lấy batches theo FEFO |
| 10 | POST | `/product-batches/fefo/allocate` | ❌🔐 | ❌ | ✅ | ✅ | Phân bổ theo FEFO |
| 11 | POST | `/product-batches/fefo/export` | ❌🔐 | ❌ | ✅🏢 | ✅ | Xuất kho theo FEFO |
| 12 | POST | `/product-batches/import` | ❌🔐 | ❌ | ✅🏢 | ✅ | Nhập kho |
| 13 | POST | `/product-batches/:id/add-stock` | ❌🔐 | ❌ | ✅🏢 | ✅ | Thêm số lượng vào lô |
| 14 | GET | `/product-batches/summary/:branchId/:productId` | ❌🔐 | ❌ | ✅ | ✅ | Tóm tắt batch |
| 15 | GET | `/product-batches/validate/:branchId/:productId` | ❌🔐 | ❌ | ✅ | ✅ | Validate consistency |
| 16 | POST | `/product-batches/reconcile/:branchId/:productId` | ❌🔐 | ❌ | ❌ | ✅ | Reconcile (Admin only) |
| 17 | POST | `/product-batches/auto-expire` | ❌🔐 | ❌ | ❌ | ✅ | Auto expire (Admin only) |

---

## 2️⃣1️⃣ MODULE: STOCK TAKE (`/api/stock-takes`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/stock-takes` | ❌🔐 | ❌ | ✅ | ✅ | Danh sách phiếu kiểm kê |
| 2 | GET | `/stock-takes/:id` | ❌🔐 | ❌ | ✅ | ✅ | Chi tiết phiếu |
| 3 | GET | `/stock-takes/:id/items` | ❌🔐 | ❌ | ✅ | ✅ | Items trong phiếu |
| 4 | POST | `/stock-takes` | ❌🔐 | ❌ | ✅🏢 | ✅ | Tạo phiếu kiểm kê |
| 5 | PUT | `/stock-takes/:id/items/:itemId` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật số lượng thực tế |
| 6 | POST | `/stock-takes/:id/complete` | ❌🔐 | ❌ | ✅ | ✅ | Hoàn thành kiểm kê |
| 7 | POST | `/stock-takes/:id/cancel` | ❌🔐 | ❌ | ✅ | ✅ | Hủy phiếu |
| 8 | DELETE | `/stock-takes/:id` | ❌🔐 | ❌ | ✅ | ✅ | Xóa phiếu |

---

## 2️⃣2️⃣ MODULE: VOUCHER MANAGEMENT (`/api/vouchers`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/vouchers/available` | ❌🔐 | ✅ | ✅ | ✅ | Vouchers đang active |
| 2 | GET | `/vouchers/check/:code` | ❌🔐 | ✅ | ✅ | ✅ | Validate voucher code |
| 3 | GET | `/vouchers/:id` | ❌🔐 | ✅ | ✅ | ✅ | Chi tiết voucher |
| 4 | GET | `/vouchers` | ❌🔐 | ❌ | ❌ | ✅ | Tất cả vouchers |
| 5 | POST | `/vouchers` | ❌🔐 | ❌ | ❌ | ✅ | Tạo voucher |
| 6 | PUT | `/vouchers/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật voucher |
| 7 | DELETE | `/vouchers/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa voucher |

### Kịch bản chi tiết:
```
📝 TC-VOUCH-01: Customer xem vouchers available → Success
📝 TC-VOUCH-02: Customer validate voucher code → Success
📝 TC-VOUCH-03: Customer xem tất cả vouchers → 403 Forbidden
📝 TC-VOUCH-04: Admin tạo voucher → Success
```

---

## 2️⃣3️⃣ MODULE: FLASHSALE MANAGEMENT (`/api/flashsales`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/flashsales/active` | ✅ | ✅ | ✅ | ✅ | Flashsale đang diễn ra |
| 2 | GET | `/flashsales` | ❌🔐 | ❌ | ❌ | ✅ | Tất cả flashsales |
| 3 | POST | `/flashsales` | ❌🔐 | ❌ | ❌ | ✅ | Tạo flashsale |
| 4 | PUT | `/flashsales/:id` | ❌🔐 | ❌ | ❌ | ✅ | Cập nhật flashsale |
| 5 | DELETE | `/flashsales/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa flashsale |

---

## 2️⃣4️⃣ MODULE: REVIEW MANAGEMENT (`/api/reviews`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/reviews` | ✅ | ✅ | ✅ | ✅ | Tất cả reviews |
| 2 | GET | `/reviews/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết review |
| 3 | GET | `/products/:productId/reviews` | ✅ | ✅ | ✅ | ✅ | Reviews của sản phẩm |
| 4 | GET | `/products/:productId/rating-stats` | ✅ | ✅ | ✅ | ✅ | Thống kê rating |
| 5 | POST | `/reviews` | ❌🔐 | ✅ | ✅ | ✅ | Tạo review (cần mua SP) |
| 6 | PUT | `/reviews/:id` | ❌🔐 | 👤 | ❌ | ✅ | Cập nhật review |
| 7 | DELETE | `/reviews/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa review (Admin only) |

### Kịch bản chi tiết:
```
📝 TC-REV-01: Public xem reviews → Success
📝 TC-REV-02: Customer chưa mua tạo review → 403 Forbidden
📝 TC-REV-03: Customer đã mua tạo review → Success
📝 TC-REV-04: Customer sửa review của mình → Success
📝 TC-REV-05: Customer sửa review người khác → 403 Forbidden
📝 TC-REV-06: Admin xóa review → Success
📝 TC-REV-07: Rate limiting create review → 429
```

---

## 2️⃣5️⃣ MODULE: NOTIFICATION MANAGEMENT (`/api/notifications`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/notifications` | ❌🔐 | 👤 | 👤 | ✅ | Notifications của user |
| 2 | GET | `/notifications/:id` | ❌🔐 | 👤 | 👤 | ✅ | Chi tiết notification |
| 3 | PUT | `/notifications/:id` | ❌🔐 | 👤 | 👤 | ✅ | Đánh dấu đã đọc |
| 4 | POST | `/notifications` | ❌🔐 | ❌ | ❌ | ✅ | Tạo notification |
| 5 | DELETE | `/notifications/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa notification |

### Kịch bản chi tiết:
```
📝 TC-NOTIF-01: User xem notifications của mình → Success
📝 TC-NOTIF-02: User xem notification người khác → 403 Forbidden
📝 TC-NOTIF-03: User đánh dấu đã đọc → Success
📝 TC-NOTIF-04: Admin tạo notification → Success
```

---

## 2️⃣6️⃣ MODULE: PRESCRIPTION MANAGEMENT (`/api/prescriptions`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/prescriptions` | ❌🔐 | ❌ | ✅ | ✅ | Lấy tất cả đơn thuốc |
| 2 | GET | `/prescriptions/statistics` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê đơn thuốc |
| 3 | GET | `/prescriptions/:id` | ❌🔐 | 👤 | ✅ | ✅ | Chi tiết đơn thuốc |
| 4 | GET | `/customers/:customerId/prescriptions` | ❌🔐 | 👤 | ✅ | ✅ | Đơn thuốc của customer |
| 5 | POST | `/prescriptions` | ❌🔐 | ✅ | ✅ | ✅ | Tạo đơn thuốc mới |
| 6 | PUT | `/prescriptions/:id` | ❌🔐 | 👤 | ✅ | ✅ | Cập nhật đơn thuốc |
| 7 | DELETE | `/prescriptions/:id` | ❌🔐 | ❌ | ❌ | ✅ | Xóa đơn thuốc |
| 8 | PUT | `/prescriptions/:id/status` | ❌🔐 | ❌ | ✅ | ✅ | Cập nhật trạng thái |
| 9 | PUT | `/prescriptions/:id/verify` | ❌🔐 | ❌ | ✅ | ✅ | Xác minh đơn thuốc |

### Kịch bản chi tiết:
```
📝 TC-PRESC-01: Customer xem đơn thuốc của mình → Success
📝 TC-PRESC-02: Customer A xem đơn thuốc Customer B → 403 Forbidden
📝 TC-PRESC-03: Customer tạo đơn thuốc → Success
📝 TC-PRESC-04: Staff verify đơn thuốc → Success
📝 TC-PRESC-05: Admin xem statistics → Success
```

---

## 2️⃣7️⃣ MODULE: LOCATION - CITIES (`/api/cities`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/cities` | ✅ | ✅ | ✅ | ✅ | Danh sách thành phố |
| 2 | GET | `/cities/search` | ✅ | ✅ | ✅ | ✅ | Tìm kiếm thành phố |
| 3 | GET | `/cities/:id` | ✅ | ✅ | ✅ | ✅ | Chi tiết thành phố |
| 4 | POST | `/cities` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Tạo thành phố (cần thêm auth) |
| 5 | PUT | `/cities/:id` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Cập nhật (cần thêm auth) |
| 6 | DELETE | `/cities/:id` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Xóa (cần thêm auth) |

> ⚠️ **LƯU Ý**: Module cities chưa có middleware auth, cần bổ sung!

---

## 2️⃣8️⃣ MODULE: BUSINESS STATISTICS (`/api/statistics/business`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/statistics/business/dashboard` | ❌🔐 | ❌ | ❌ | ✅ | Dashboard overview |
| 2 | GET | `/statistics/business/revenue` | ❌🔐 | ❌ | ❌ | ✅ | Doanh thu |
| 3 | GET | `/statistics/business/orders-by-status` | ❌🔐 | ❌ | ❌ | ✅ | Orders theo status |
| 4 | GET | `/statistics/business/best-selling` | ❌🔐 | ❌ | ❌ | ✅ | Sản phẩm bán chạy |
| 5 | GET | `/statistics/business/top-customers` | ❌🔐 | ❌ | ❌ | ✅ | Top customers |
| 6 | GET | `/statistics/business/voucher-performance` | ❌🔐 | ❌ | ❌ | ✅ | Hiệu quả voucher |
| 7 | GET | `/statistics/business/flashsale-performance` | ❌🔐 | ❌ | ❌ | ✅ | Hiệu quả flashsale |
| 8 | GET | `/statistics/business/conversion-rate` | ❌🔐 | ❌ | ❌ | ✅ | Tỷ lệ chuyển đổi |
| 9 | GET | `/statistics/business/average-order-value` | ❌🔐 | ❌ | ❌ | ✅ | Giá trị đơn TB |
| 10 | GET | `/statistics/business/payment-methods` | ❌🔐 | ❌ | ❌ | ✅ | Theo phương thức TT |

---

## 2️⃣9️⃣ MODULE: INVENTORY STATISTICS (`/api/statistics/inventory`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/statistics/inventory/overview` | ❌🔐 | ❌ | ✅ | ✅ | Tổng quan tồn kho |
| 2 | GET | `/statistics/inventory/branch/:branchId` | ❌🔐 | ❌ | ✅ | ✅ | Tồn kho theo chi nhánh |
| 3 | GET | `/statistics/inventory/low-stock` | ❌🔐 | ❌ | ✅ | ✅ | Sản phẩm tồn thấp |
| 4 | GET | `/statistics/inventory/overstock` | ❌🔐 | ❌ | ✅ | ✅ | Sản phẩm tồn cao |
| 5 | GET | `/statistics/inventory/movements` | ❌🔐 | ❌ | ✅ | ✅ | Báo cáo xuất nhập |
| 6 | GET | `/statistics/inventory/top-imported` | ❌🔐 | ❌ | ✅ | ✅ | Top nhập nhiều |
| 7 | GET | `/statistics/inventory/top-exported` | ❌🔐 | ❌ | ✅ | ✅ | Top xuất nhiều |
| 8 | GET | `/statistics/inventory/by-category` | ❌🔐 | ❌ | ✅ | ✅ | Theo danh mục |

---

## 3️⃣0️⃣ MODULE: ADMIN DASHBOARD (`/api/statistics/dashboard`)

| # | Method | Endpoint | Public | Customer | Staff | Admin | Kịch bản kiểm tra |
|---|--------|----------|--------|----------|-------|-------|-------------------|
| 1 | GET | `/statistics/dashboard/overview` | ❌🔐 | ❌ | ❌ | ✅ | Tổng quan |
| 2 | GET | `/statistics/dashboard/revenue` | ❌🔐 | ❌ | ❌ | ✅ | Phân tích doanh thu |
| 3 | GET | `/statistics/dashboard/top-products` | ❌🔐 | ❌ | ❌ | ✅ | Top sản phẩm |
| 4 | GET | `/statistics/dashboard/orders-stats` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê orders |
| 5 | GET | `/statistics/dashboard/customers-stats` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê customers |
| 6 | GET | `/statistics/dashboard/inventory-stats` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê tồn kho |
| 7 | GET | `/statistics/dashboard/branches-performance` | ❌🔐 | ❌ | ❌ | ✅ | Hiệu suất chi nhánh |
| 8 | GET | `/statistics/dashboard/promotions-stats` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê khuyến mãi |
| 9 | GET | `/statistics/dashboard/reviews-stats` | ❌🔐 | ❌ | ❌ | ✅ | Thống kê đánh giá |
| 10 | GET | `/statistics/dashboard/recent-activities` | ❌🔐 | ❌ | ❌ | ✅ | Hoạt động gần đây |

---

## 📊 TỔNG KẾT

### Tổng số API Endpoints: **~122 endpoints**

| Module | Số lượng |
|--------|----------|
| Authentication | 9 |
| User Management | 5 |
| Customer Management | 7 |
| Staff Management | 6 |
| Admin Management | 6 |
| Product Management | 8 |
| Category Management | 7 |
| Supplier Management | 5 |
| Product Units | 6 |
| Order Management | 7 |
| Cart Management | 9 |
| Payment Management | 4 |
| Shipment Management | 7 |
| Shipping Address | 7 |
| Shipping Fees | 5 |
| Branch Management | 5 |
| Branch Inventory | 5 |
| Global Inventory | 5 |
| Inventory Transfer | 7 |
| Product Batch | 17 |
| Stock Take | 8 |
| Voucher Management | 7 |
| Flashsale Management | 5 |
| Review Management | 7 |
| Notification Management | 5 |
| Prescription Management | 9 |
| Location (Cities) | 6 |
| Business Statistics | 10 |
| Inventory Statistics | 8 |
| Admin Dashboard | 10 |

### Phân loại theo quyền truy cập:

| Quyền | Số lượng ước tính |
|-------|------------------|
| Public (không cần auth) | ~25 endpoints |
| Customer + Staff + Admin | ~15 endpoints |
| Staff + Admin only | ~35 endpoints |
| Admin only | ~45 endpoints |
| Ownership check (👤) | ~30 endpoints |

---

## 🧪 CHECKLIST KIỂM TRA BẢO MẬT

### 1. Authentication Tests
- [ ] Không có token → 401 Unauthorized
- [ ] Token hết hạn → 401 Unauthorized  
- [ ] Token không hợp lệ → 401 Unauthorized
- [ ] Refresh token hoạt động đúng

### 2. Authorization Tests
- [ ] Customer truy cập Admin API → 403 Forbidden
- [ ] Staff truy cập Admin API → 403 Forbidden
- [ ] Customer truy cập Staff API → 403 Forbidden

### 3. Ownership Tests
- [ ] User A truy cập data User B → 403 Forbidden
- [ ] Staff branch A thay đổi data branch B → 403 Forbidden

### 4. Rate Limiting Tests
- [ ] Quá nhiều login attempts → 429 Too Many Requests
- [ ] Quá nhiều search requests → 429 Too Many Requests
- [ ] Quá nhiều cart operations → 429 Too Many Requests

### 5. Input Validation Tests
- [ ] ID không hợp lệ → 400 Bad Request
- [ ] Data thiếu required fields → 400 Bad Request
- [ ] SQL Injection attempts → Blocked
- [ ] XSS attempts → Sanitized

### 6. Data Masking Tests
- [ ] Public/Customer xem inventory → Chỉ thấy in_stock boolean
- [ ] Staff xem inventory → Thấy số lượng chính xác
- [ ] Sensitive data (cost_price, supplier) → Chỉ Staff/Admin xem được

---

## 📝 GHI CHÚ

### Ký hiệu đặc biệt:
- 🏢 = Staff chỉ thao tác được với branch của mình
- 👤 = Ownership check - chỉ truy cập data của chính mình
- ⚠️ = Cần review/bổ sung middleware

### Các API cần lưu ý đặc biệt:
1. **Cities module** - Thiếu auth middleware cho POST/PUT/DELETE
2. **Inventory operations** - Staff branch authorization check trong controller
3. **Review creation** - Cần check customer đã mua sản phẩm chưa
4. **Cart ownership** - Middleware validateCartOwnership

---

*Tài liệu được tạo tự động từ source code - Cập nhật: November 2025*
