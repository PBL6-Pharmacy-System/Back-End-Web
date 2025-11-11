# Hướng dẫn API - Tính năng mới

## 📱 1. OTP Authentication cho Customer

### Flow đăng nhập của Customer (qua OTP)

#### Bước 1: Request OTP
```http
POST /api/auth/otp/request
Content-Type: application/json

{
  "phone": "0912345678"  // hoặc "+84912345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP đã được gửi đến số điện thoại của bạn",
  "data": {
    "phone": "+84912345678",
    "expiresIn": 300
  }
}
```

#### Bước 2: Verify OTP
```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác thực OTP thành công",
  "data": {
    "phone": "+84912345678"
  }
}
```

#### Bước 3: Login với OTP
```http
POST /api/auth/customer/login
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "username": "+84912345678",
      "phone": "+84912345678",
      "role_id": 3,
      "role_name": "customer",
      "customers": {
        "id": 1,
        "user_id": 1,
        "phone": "+84912345678"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Lưu ý OTP
- OTP có hiệu lực 5 phút
- Chỉ có thể request OTP mới sau 1 phút
- Tối đa 5 lần nhập sai OTP
- Tự động tạo tài khoản customer nếu chưa tồn tại
- Admin và Staff không thể đăng nhập bằng OTP (phải dùng username/password)

---

## 🛒 2. Cart tự động tạo

Cart sẽ được tự động tạo khi customer thêm sản phẩm đầu tiên.

### Add to Cart
```http
POST /api/cart/:customerId/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "productUnitId": 1,
  "quantity": 2
}
```

**Response (Cart mới):**
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng",
  "data": {
    "cart": {
      "id": 1,
      "customer_id": 1,
      "status": "cart",
      "total_amount": "150000",
      "final_amount": "150000",
      "orderitems": [
        {
          "id": 1,
          "product_id": 1,
          "quantity": 2,
          "price": "75000",
          "subtotal": "150000",
          "products": {
            "name": "Paracetamol 500mg"
          }
        }
      ]
    }
  }
}
```

---

## 💳 3. Checkout với Voucher

### Checkout
```http
POST /api/cart/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "voucherCode": "SUMMER2024",  // Optional
  "shippingAddressId": 1,        // Optional
  "paymentMethod": "bank_transfer"  // cash, card, bank_transfer, momo, zalopay
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "order": {
      "id": 10,
      "customer_id": 1,
      "voucher_id": 5,
      "total_amount": "500000",
      "discount_amount": "50000",
      "final_amount": "450000",
      "status": "pending",
      "payment_status": "pending",
      "orderitems": [...]
    },
    "payment": {
      "id": 1,
      "order_id": 10,
      "payment_method": "bank_transfer",
      "amount": "450000",
      "status": "pending",
      "transaction_id": "TXN-1699999999999-10"
    },
    "summary": {
      "subtotal": "500000",
      "discount": "50000",
      "total": "450000",
      "items_count": 3
    }
  }
}
```

### Confirm Payment (sau khi thanh toán online)
```http
POST /api/orders/:id/confirm-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 10,
  "transactionId": "TXN-1699999999999-10"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán thành công"
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy đơn hàng thành công"
}
```

---

## ⭐ 4. Best Sellers (Top 10 sản phẩm bán chạy)

### Get Best Sellers
```http
GET /api/products/best-sellers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "name": "Vitamin C 1000mg",
      "price": "120000",
      "sold_count": 1523,
      "rank": 1,
      "average_rating": 4.8,
      "image_url": "...",
      "categories": {...},
      "reviews": [...]
    },
    {
      "id": 8,
      "name": "Paracetamol 500mg",
      "price": "75000",
      "sold_count": 1401,
      "rank": 2,
      "average_rating": 4.5,
      ...
    },
    // ... 8 sản phẩm khác
  ],
  "cached": true,
  "lastUpdate": "2025-11-11T10:30:00.000Z"
}
```

### Get Product Stats
```http
GET /api/products/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": 15,
    "sold_count": 1523,
    "review_count": 342,
    "average_rating": 4.8,
    "rank": 1,
    "is_best_seller": true
  }
}
```

### Update Best Sellers Cache (Admin only)
```http
POST /api/products/best-sellers/update-cache
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật cache sản phẩm nổi bật",
  "data": {
    "success": true,
    "count": 10
  }
}
```

---

## 🔄 Auto Update Logic

### Best Sellers tự động cập nhật

1. **Khi nào cập nhật:**
   - Mỗi giờ (cron job)
   - Sau khi xác nhận thanh toán đơn hàng
   - Khi admin manually trigger

2. **Cách thức:**
   - Lấy top 10 sản phẩm có `sold_count` cao nhất
   - Lưu vào `best_sellers_cache` table
   - Cache có hiệu lực 1 giờ
   - Nếu cache còn hiệu lực, trả về data từ cache (nhanh hơn)

3. **Real-time update:**
   - Khi đơn hàng được thanh toán, `sold_count` của sản phẩm tăng
   - Nếu sản phẩm có `sold_count` > sản phẩm thứ 10, cache được cập nhật ngay

---

## 📊 Voucher System

### Voucher Types
- **percentage**: Giảm theo phần trăm (VD: 10%)
- **fixed**: Giảm số tiền cố định (VD: 50,000 VNĐ)

### Voucher Validation
- Kiểm tra thời gian hiệu lực (start_date, end_date)
- Kiểm tra usage_limit (số lần sử dụng tối đa)
- Kiểm tra min_order_value (giá trị đơn hàng tối thiểu)
- Kiểm tra customer đã dùng voucher này chưa (mỗi customer chỉ dùng 1 lần)

### Example Vouchers
```sql
-- Giảm 10% cho đơn từ 200k
INSERT INTO vouchers (code, discount_type, discount_value, min_order_value, start_date, end_date, usage_limit)
VALUES ('SUMMER10', 'percentage', 10, 200000, '2025-11-01', '2025-12-31', 1000);

-- Giảm 50k cho đơn từ 300k
INSERT INTO vouchers (code, discount_type, discount_value, min_order_value, start_date, end_date, usage_limit)
VALUES ('SAVE50K', 'fixed', 50000, 300000, '2025-11-01', '2025-11-30', 500);
```

---

## 🔐 Role-based Access

### Admin & Staff (username/password login)
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

### Customer (OTP login)
```http
POST /api/auth/customer/login
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456"
}
```

### Permission Check
- **Admin**: Full access
- **Staff**: Limited access (defined in rolepermissions table)
- **Customer**: Can only access their own cart, orders, reviews

---

## 🎯 Complete Customer Journey

1. **Customer mở app lần đầu** → Chưa có account

2. **Request OTP** → Nhập số điện thoại → Nhận OTP

3. **Login với OTP** → Tự động tạo account + customer record

4. **Browse sản phẩm** → Xem best sellers, categories, search

5. **Add to cart** → Tự động tạo cart (nếu chưa có) → Thêm sản phẩm

6. **Checkout** → 
   - Chọn địa chỉ giao hàng
   - Nhập voucher code (nếu có)
   - Chọn phương thức thanh toán
   
7. **Payment**:
   - **Cash on delivery**: payment_status = "unpaid"
   - **Online payment**: payment_status = "pending" → Confirm payment → "paid"

8. **After payment confirmed**:
   - Order status: pending → confirmed
   - Product stock giảm
   - Product sold_count tăng
   - Best sellers tự động update (nếu cần)

9. **Tracking**: Customer xem order history, status updates

---

## 🔧 Cron Jobs

### Best Sellers Update
```javascript
// Chạy mỗi giờ
cron.schedule('0 * * * *', updateBestSellersCache);
```

### OTP Cleanup
```javascript
// Chạy mỗi 5 phút - xóa OTP hết hạn
cron.schedule('*/5 * * * *', cleanupExpiredOTPs);
```

### Flashsale Status Update
```javascript
// Chạy mỗi phút - cập nhật trạng thái flashsale
cron.schedule('* * * * *', updateFlashsaleStatuses);
```

---

## 📝 Database Changes

### New Tables
1. `otp_verifications` - Lưu OTP codes
2. `best_sellers_cache` - Cache top 10 sản phẩm bán chạy

### Modified Tables
1. `products` - Thêm `sold_count` column
2. `orders` - Thêm `payment_status` column

### Run Migration
```bash
# Apply migration
psql -U username -d database_name -f prisma/migrations/add_otp_and_bestsellers.sql

# Generate Prisma Client
npx prisma generate
```

---

## 🚀 Testing Guide

### 1. Test OTP Login
```bash
# Request OTP
curl -X POST http://localhost:3000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678"}'

# Check console log for OTP code

# Verify OTP
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678","otp":"123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678","otp":"123456"}'
```

### 2. Test Cart & Checkout
```bash
# Add to cart
curl -X POST http://localhost:3000/api/cart/1/add \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"productUnitId":1,"quantity":2}'

# Checkout with voucher
curl -X POST http://localhost:3000/api/cart/checkout \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"voucherCode":"SUMMER10","paymentMethod":"bank_transfer"}'
```

### 3. Test Best Sellers
```bash
# Get best sellers
curl http://localhost:3000/api/products/best-sellers

# Get product stats
curl http://localhost:3000/api/products/1/stats
```

---

## ⚠️ Important Notes

1. **OTP in Production**: Cần tích hợp SMS service (Twilio, AWS SNS, etc.)
2. **Payment Gateway**: Cần tích hợp payment gateway thực (MoMo, ZaloPay, VNPay)
3. **Security**: Luôn validate customer_id từ token, không trust từ request body
4. **Performance**: Best sellers cache giúp giảm query database
5. **Stock Management**: Cần thêm transaction để đảm bảo consistency khi nhiều người mua cùng lúc

