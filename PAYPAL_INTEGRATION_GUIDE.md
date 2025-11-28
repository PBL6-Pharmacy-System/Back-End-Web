# 🔥 HƯỚNG DẪN TÍCH HỢP PAYPAL THANH TOÁN THẬT

## 📋 MỤC LỤC
1. [Tạo tài khoản PayPal Developer](#1-tạo-tài-khoản-paypal-developer)
2. [Tạo App và lấy credentials](#2-tạo-app-và-lấy-credentials)
3. [Cấu hình môi trường](#3-cấu-hình-môi-trường)
4. [Tạo tài khoản test](#4-tạo-tài-khoản-test)
5. [Cài đặt dependencies](#5-cài-đặt-dependencies)
6. [Testing thanh toán](#6-testing-thanh-toán)
7. [Chuyển sang môi trường LIVE](#7-chuyển-sang-môi-trường-live)

---

## 1. TẠO TÀI KHOẢN PAYPAL DEVELOPER

### Bước 1: Đăng ký tài khoản
1. Truy cập: https://developer.paypal.com/
2. Click **"Log in to Dashboard"** ở góc trên phải
3. Nếu chưa có tài khoản:
   - Click **"Sign Up"**
   - Điền email, mật khẩu
   - Xác thực email

### Bước 2: Truy cập Dashboard
- Sau khi đăng nhập, bạn sẽ vào PayPal Developer Dashboard
- URL: https://developer.paypal.com/dashboard/

---

## 2. TẠO APP VÀ LẤY CREDENTIALS

### Bước 1: Tạo App mới
1. Vào **"My Apps & Credentials"** trong menu bên trái
2. Chọn tab **"Sandbox"** (để test)
3. Click nút **"Create App"**
4. Nhập thông tin:
   - **App Name**: `PBL6-Pharmacy-Payment` (hoặc tên bạn thích)
   - **App Type**: Chọn **"Merchant"**
5. Click **"Create App"**

### Bước 2: Lấy Credentials
Sau khi tạo app, bạn sẽ thấy:

```
Sandbox account: sb-xxxxx-facilitator@business.example.com

Client ID (Sandbox):
AXfDG0i4pA7Q3TC8Gb5HJW7_JSuG9EdNalPViWZvGj4AUDj6scb460n4zjHCFC2_qoDVTg0faQBCL6UG

Secret (click Show):
********************************
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- **Client ID**: Hiển thị công khai
- **Secret**: Click nút **"Show"** để xem, SAO CHÉP và LƯU LẠI NGAY
- KHÔNG BAO GIỜ chia sẻ Secret key lên Git, forum, hay bất kỳ đâu!

---

## 3. CẤU HÌNH MÔI TRƯỜNG

### Bước 1: Cập nhật file `.env`
Mở file `.env` trong project và thêm/cập nhật:

```env
# PayPal Payment Gateway
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_SECRET_HERE

# PayPal URLs (cho sandbox)
PAYPAL_RETURN_URL=http://localhost:3000/api/payments/paypal/callback
PAYPAL_CANCEL_URL=http://localhost:3000/api/payments/paypal/cancel
PAYPAL_WEBHOOK_URL=http://localhost:3000/api/payments/paypal/webhook

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Bước 2: Thay thế credentials
Copy **Client ID** và **Secret** từ PayPal Dashboard vào file `.env`:

```env
PAYPAL_CLIENT_ID=AXfDG0i4pA7Q3TC8Gb5HJW7_JSuG9EdNalPViWZvGj4AUDj6scb460n4zjHCFC2_qoDVTg0faQBCL6UG
PAYPAL_CLIENT_SECRET=EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM
```

### Bước 3: Điều chỉnh tỷ giá (nếu cần)
Trong `paypalConfig.js`, có thể điều chỉnh tỷ giá VND -> USD:

```javascript
exchangeRate: 25000 // 1 USD = 25,000 VND
```

**Lưu ý:** Tỷ giá thực tế thay đổi hàng ngày. Có thể tích hợp API tỷ giá như:
- https://exchangerate-api.com/
- https://openexchangerates.org/

---

## 4. TẠO TÀI KHOẢN TEST

PayPal tự động tạo 2 tài khoản test:
- **Business Account** (Merchant): Nhận tiền
- **Personal Account** (Buyer): Trả tiền

### Xem tài khoản test:
1. Vào **"Sandbox"** > **"Accounts"** trong menu
2. Bạn sẽ thấy danh sách:

```
Type        Email                                       Password
Business    sb-xxxxx-facilitator@business.example.com   ********
Personal    sb-yyyyy@personal.example.com               ********
```

### Lấy thông tin đăng nhập:
1. Click vào dấu **3 chấm** (...) bên phải mỗi account
2. Click **"View/Edit Account"**
3. Tab **"Account Details"** sẽ hiển thị:
   - Email
   - Password (click Show để xem)
   - Balance (số dư)

### Tạo thêm tài khoản test (nếu cần):
1. Click nút **"Create Account"**
2. Chọn **"Personal"** (để test thanh toán)
3. Điền thông tin:
   - Country: **Vietnam**
   - Balance: **5000 USD** (hoặc số tiền bạn muốn)
4. Click **"Create"**

---

## 5. CÀI ĐẶT DEPENDENCIES

PayPal đã được tích hợp sẵn, chỉ cần đảm bảo có `axios`:

```bash
npm install axios
```

Hoặc nếu chưa có các package cần thiết:

```bash
npm install express cors dotenv prisma axios crypto
```

---

## 6. TESTING THANH TOÁN

### A. Khởi động server:
```bash
npm start
# hoặc
npm run dev
```

### B. Test flow thanh toán:

#### 1️⃣ **Tạo đơn hàng** (từ Frontend hoặc API client):
```bash
POST http://localhost:3000/api/orders
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "delivery_address": "123 Test Street",
  "delivery_phone": "0901234567",
  "payment_method": "paypal",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

**Response sẽ chứa:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 123,
      "final_amount": 500000
    },
    "payment": {
      "id": 456,
      "payment_method": "paypal",
      "status": "pending"
    }
  }
}
```

#### 2️⃣ **Tạo PayPal payment**:
```bash
POST http://localhost:3000/api/payments/paypal/create
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paypalOrderId": "8XY12345ABC67890",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=8XY12345ABC67890",
    "orderId": 123,
    "amountVND": 500000,
    "amountUSD": 20.00
  }
}
```

#### 3️⃣ **Thanh toán trên PayPal**:
1. Mở `approvalUrl` trong trình duyệt
2. Đăng nhập bằng **Personal Account** (tài khoản test):
   ```
   Email: sb-yyyyy@personal.example.com
   Password: (xem trong Sandbox > Accounts)
   ```
3. Review và click **"Pay Now"**

#### 4️⃣ **Callback xử lý**:
- PayPal sẽ redirect về: `http://localhost:3000/api/payments/paypal/callback?token=xxx`
- Backend tự động capture payment
- Update order status: `pending` → `confirmed`
- Redirect về Frontend: `http://localhost:5173/payment/success?orderId=123`

### C. Test case cần thử:

✅ **Test thành công:**
- Thanh toán đủ số tiền
- Kiểm tra DB: payment status = `completed`
- Kiểm tra DB: order status = `confirmed`

✅ **Test hủy thanh toán:**
- Trên PayPal checkout, click **"Cancel and return"**
- Redirect về: `http://localhost:5173/payment/cancelled`
- Kiểm tra DB: payment status = `cancelled`

✅ **Test số dư không đủ:**
- Tạo Personal Account mới với balance = 0
- Thử thanh toán → PayPal sẽ báo lỗi

---

## 7. CHUYỂN SANG MÔI TRƯỜNG LIVE

Khi đã test xong và sẵn sàng nhận thanh toán thật:

### Bước 1: Verify tài khoản PayPal Business
1. Cần có **tài khoản PayPal Business thật** (không phải Sandbox)
2. Đăng ký tại: https://www.paypal.com/vn/business
3. Xác thực:
   - Email
   - Số điện thoại
   - Thông tin doanh nghiệp (nếu có)
   - Liên kết ngân hàng/thẻ

### Bước 2: Tạo Live App
1. Vào PayPal Developer Dashboard
2. **"My Apps & Credentials"** > Tab **"Live"**
3. Click **"Create App"**
4. Lấy **Live Client ID** và **Live Secret**

### Bước 3: Cập nhật `.env` cho production:
```env
# LIVE MODE
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_LIVE_SECRET

# Production URLs (domain thật)
PAYPAL_RETURN_URL=https://yourdomain.com/api/payments/paypal/callback
PAYPAL_CANCEL_URL=https://yourdomain.com/api/payments/paypal/cancel
PAYPAL_WEBHOOK_URL=https://yourdomain.com/api/payments/paypal/webhook
FRONTEND_URL=https://yourdomain.com
```

### Bước 4: Cấu hình Webhook (Optional nhưng recommended)
1. Vào **"My Apps & Credentials"** > Chọn app
2. Scroll xuống **"Webhooks"**
3. Click **"Add Webhook"**
4. Nhập URL: `https://yourdomain.com/api/payments/paypal/webhook`
5. Chọn events:
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
   - ✅ `PAYMENT.CAPTURE.REFUNDED`
6. Click **"Save"**

### Bước 5: Test trên production
- Dùng tài khoản PayPal thật
- Thanh toán với số tiền nhỏ để test (vd: $0.5)
- Kiểm tra tiền có vào tài khoản Business không

---

## 🚨 TROUBLESHOOTING

### Lỗi: "Invalid client credentials"
➡️ Kiểm tra lại `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET` trong `.env`

### Lỗi: "INTERNAL_SERVER_ERROR"
➡️ Check logs server, có thể do:
- Database connection failed
- Missing environment variables
- Order không tồn tại

### Payment status không update
➡️ Check:
- Callback URL có đúng không
- Port 3000 có đang chạy không
- Firewall có block không (với LIVE mode cần domain public)

### Không nhận được webhook
➡️ Check:
- Webhook URL phải là HTTPS (production)
- URL phải public, PayPal phải reach được
- Dùng ngrok cho local testing:
  ```bash
  ngrok http 3000
  # Lấy URL: https://xxxx.ngrok.io
  # Set webhook: https://xxxx.ngrok.io/api/payments/paypal/webhook
  ```

---

## 📚 TÀI LIỆU THAM KHẢO

- **PayPal Developer Docs:** https://developer.paypal.com/docs/
- **REST API Reference:** https://developer.paypal.com/api/rest/
- **Sandbox Testing Guide:** https://developer.paypal.com/api/rest/sandbox/
- **Webhooks Guide:** https://developer.paypal.com/api/rest/webhooks/

---

## 💡 TIPS & BEST PRACTICES

1. **Luôn log request/response** để debug dễ dàng
2. **Dùng idempotency** để tránh duplicate payment
3. **Xử lý timeout**: PayPal API có thể chậm lúc peak hours
4. **Monitor webhook**: Đảm bảo webhook luôn hoạt động
5. **Backup credentials**: Lưu Client ID/Secret ở nơi an toàn
6. **Test kỹ trước khi lên production**

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] Tạo tài khoản PayPal Developer
- [ ] Tạo Sandbox App và lấy credentials
- [ ] Cập nhật `.env` với credentials
- [ ] Tạo tài khoản test (Business & Personal)
- [ ] Test thanh toán thành công
- [ ] Test hủy thanh toán
- [ ] Test webhook (nếu dùng)
- [ ] Verify tài khoản PayPal Business (cho LIVE)
- [ ] Tạo Live App và lấy credentials
- [ ] Deploy lên production
- [ ] Test với tiền thật (số tiền nhỏ)
- [ ] Setup webhook cho production
- [ ] Monitor logs và transactions

---

🎉 **HOÀN THÀNH!** Bây giờ bạn đã có hệ thống thanh toán PayPal hoạt động!

Nếu gặp vấn đề, hãy check logs server và PayPal Dashboard > Activity.
