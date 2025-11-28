# 💳 PAYPAL PAYMENT GATEWAY - TỔNG QUAN

## ✅ ĐÃ HOÀN THÀNH

Tích hợp PayPal Payment Gateway đã được thêm vào hệ thống payments với đầy đủ chức năng:

### 📁 Cấu trúc Files đã tạo:

```
src/modules/order-management/payments/gateways/paypal/
├── paypalConfig.js         # Cấu hình PayPal (credentials, URLs, tỷ giá)
├── paypalUtils.js          # Utility functions (getToken, convert currency)
├── paypalService.js        # Business logic (create, capture, webhook)
├── paypalController.js     # HTTP request handlers
└── paypalRoutes.js         # API endpoints

Tài liệu:
├── PAYPAL_INTEGRATION_GUIDE.md  # Hướng dẫn chi tiết setup PayPal
└── PAYPAL_API_TESTING.md        # Hướng dẫn test API
```

---

## 🔧 TÍNH NĂNG

### 1. Create Payment
- Chuyển đổi VND → USD (tỷ giá có thể điều chỉnh)
- Tạo PayPal Order qua API v2
- Trả về approval URL để khách hàng thanh toán

### 2. Payment Flow
```
Customer → Create Order (paypal) 
  → Create PayPal Payment 
  → Redirect to PayPal 
  → Customer Login & Pay 
  → Callback to Backend 
  → Capture Payment 
  → Update DB (order: confirmed, payment: completed)
  → Redirect to Frontend Success
```

### 3. Cancel Payment
- Customer có thể hủy trên PayPal
- System update payment status = `cancelled`

### 4. Webhook Support
- Nhận event từ PayPal (capture completed, refunded, etc.)
- Update payment status real-time

---

## 🚀 CÁCH SỬ DỤNG NHANH

### Bước 1: Lấy PayPal Credentials

1. Đăng ký tại: https://developer.paypal.com/
2. Tạo App trong **Sandbox**
3. Copy **Client ID** và **Secret**

### Bước 2: Cập nhật `.env`

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_SECRET_HERE
PAYPAL_RETURN_URL=http://localhost:3000/api/payments/paypal/callback
PAYPAL_CANCEL_URL=http://localhost:3000/api/payments/paypal/cancel
PAYPAL_WEBHOOK_URL=http://localhost:3000/api/payments/paypal/webhook
```

### Bước 3: Khởi động server

```bash
npm start
```

### Bước 4: Test thanh toán

```bash
# 1. Tạo order
POST http://localhost:3000/api/orders
{
  "payment_method": "paypal",
  "delivery_address": "123 Test St",
  ...
}

# 2. Tạo PayPal payment
POST http://localhost:3000/api/payments/paypal/create
{
  "orderId": 123
}

# 3. Mở approvalUrl → Thanh toán → Done!
```

---

## 📚 TÀI LIỆU CHI TIẾT

### 📖 Setup & Configuration
👉 **[PAYPAL_INTEGRATION_GUIDE.md](./PAYPAL_INTEGRATION_GUIDE.md)**
- Hướng dẫn tạo tài khoản PayPal Developer
- Cách lấy Client ID và Secret
- Setup tài khoản test
- Chuyển sang LIVE mode

### 🧪 Testing APIs
👉 **[PAYPAL_API_TESTING.md](./PAYPAL_API_TESTING.md)**
- Các API endpoints
- Request/Response examples
- Test scenarios
- Debug tips
- Postman collection

---

## 🔗 API ENDPOINTS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/paypal/create` | Tạo PayPal payment | ✅ Customer |
| GET | `/api/payments/paypal/callback` | Handle return callback | ❌ Public |
| GET | `/api/payments/paypal/cancel` | Handle cancel | ❌ Public |
| POST | `/api/payments/paypal/webhook` | Handle webhook events | ❌ Public |

---

## 💰 TỶ GIÁ VND → USD

Mặc định: **1 USD = 25,000 VND**

Có thể thay đổi trong `paypalConfig.js`:
```javascript
exchangeRate: 25000 // Điều chỉnh theo tỷ giá thực tế
```

**Lưu ý:** PayPal chỉ chấp nhận USD, EUR, GBP... (không hỗ trợ VND)

---

## 🔐 BẢO MẬT

### ✅ Đã implement:
- Client credentials được encrypt (Base64)
- Webhook signature verification (optional)
- Idempotency để tránh duplicate payment
- Transaction logging đầy đủ

### ⚠️ Lưu ý:
- **KHÔNG** commit `.env` lên Git
- **KHÔNG** để lộ `PAYPAL_CLIENT_SECRET`
- Chỉ dùng Sandbox credentials cho development
- Dùng HTTPS cho production

---

## 🧪 TEST ACCOUNTS

PayPal tự động tạo 2 tài khoản test:

1. **Business Account** (Nhận tiền)
   - Được link với App của bạn
   - Xem trong Dashboard > Sandbox > Accounts

2. **Personal Account** (Trả tiền)
   - Dùng để test thanh toán
   - Balance mặc định: $1000
   - Có thể tạo thêm accounts

### Lấy thông tin đăng nhập:
- Vào **Sandbox > Accounts**
- Click 3 chấm (...) > **View/Edit Account**
- Copy Email & Password

---

## 🐛 TROUBLESHOOTING

### Lỗi thường gặp:

#### 1. "Invalid client credentials"
```bash
# Kiểm tra .env
echo $PAYPAL_CLIENT_ID
echo $PAYPAL_CLIENT_SECRET

# Restart server
npm restart
```

#### 2. Payment không update
```bash
# Check logs
tail -f server.log

# Check database
SELECT * FROM payments WHERE order_id = 123;
```

#### 3. Callback không hoạt động
- Kiểm tra `PAYPAL_RETURN_URL` trong `.env`
- Đảm bảo server đang chạy port 3000
- Check firewall

---

## 📊 DATABASE SCHEMA

### `payments` table:
```sql
- payment_method: 'paypal'
- status: 'pending' | 'completed' | 'cancelled' | 'failed'
- transaction_id: PayPal Capture ID
- amount: Số tiền VND
- payment_date: Thời gian thanh toán thành công
```

### `payment_logs` table:
```sql
- action: 'paypal_capture_success' | 'paypal_cancelled' | 'paypal_webhook_*'
- old_status: Trạng thái cũ
- new_status: Trạng thái mới
- metadata: JSON chứa paypalOrderId, captureId, etc.
```

---

## 🌍 CHUYỂN SANG PRODUCTION

### Checklist:

- [ ] Verify PayPal Business Account (tài khoản thật)
- [ ] Tạo Live App trên PayPal Developer
- [ ] Cập nhật `.env`:
  ```env
  PAYPAL_MODE=live
  PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
  PAYPAL_CLIENT_SECRET=YOUR_LIVE_SECRET
  ```
- [ ] Deploy lên server với domain public
- [ ] Update URLs:
  ```env
  PAYPAL_RETURN_URL=https://yourdomain.com/api/payments/paypal/callback
  PAYPAL_CANCEL_URL=https://yourdomain.com/api/payments/paypal/cancel
  PAYPAL_WEBHOOK_URL=https://yourdomain.com/api/payments/paypal/webhook
  ```
- [ ] Setup webhook trên PayPal Dashboard
- [ ] Test với số tiền nhỏ ($0.5 - $1)
- [ ] Monitor logs & transactions

---

## 📞 SUPPORT

### Tài liệu PayPal:
- Developer Docs: https://developer.paypal.com/docs/
- REST API: https://developer.paypal.com/api/rest/
- Sandbox Guide: https://developer.paypal.com/api/rest/sandbox/

### Community:
- Stack Overflow: [paypal] tag
- PayPal Community: https://www.paypal-community.com/

---

## ✅ TESTING CHECKLIST

Trước khi deploy production:

- [ ] Tạo order với payment_method = "paypal"
- [ ] Tạo PayPal payment thành công
- [ ] Thanh toán với Sandbox account
- [ ] Callback update payment status = "completed"
- [ ] Order status chuyển "confirmed"
- [ ] Test hủy thanh toán
- [ ] Check payment_logs có log đầy đủ
- [ ] Test với items nhiều sản phẩm
- [ ] Test với số tiền khác nhau
- [ ] Verify transaction trên PayPal Dashboard

---

## 🎉 KẾT LUẬN

PayPal Payment Gateway đã được tích hợp hoàn chỉnh và sẵn sàng sử dụng!

### Features hoàn thiện:
✅ Tạo payment link  
✅ Xử lý callback tự động  
✅ Update order & payment status  
✅ Hỗ trợ webhook  
✅ Cancel payment  
✅ Chuyển đổi VND → USD  
✅ Transaction logging  
✅ Error handling  
✅ Documentation đầy đủ  

### Next steps:
1. Đọc [PAYPAL_INTEGRATION_GUIDE.md](./PAYPAL_INTEGRATION_GUIDE.md)
2. Setup credentials theo hướng dẫn
3. Test API theo [PAYPAL_API_TESTING.md](./PAYPAL_API_TESTING.md)
4. Verify business account cho production

**Happy Coding! 🚀**
