# PAYPAL PAYMENT API TESTING

## 📋 BASE URL
```
http://localhost:3000
```

---

## 1️⃣ CREATE ORDER (Tạo đơn hàng)

```http
POST http://localhost:3000/api/orders
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "branch_id": 1,
  "delivery_address": "123 Nguyen Van Linh, Da Nang",
  "delivery_phone": "0901234567",
  "payment_method": "paypal",
  "notes": "Test PayPal payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 123,
      "final_amount": 500000,
      "status": "pending"
    },
    "payment": {
      "id": 456,
      "payment_method": "paypal",
      "status": "pending"
    }
  }
}
```

**Lưu lại:** `orderId = 123`

---

## 2️⃣ CREATE PAYPAL PAYMENT (Tạo link thanh toán PayPal)

```http
POST http://localhost:3000/api/payments/paypal/create
Authorization: Bearer YOUR_CUSTOMER_TOKEN
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
    "amountUSD": 20.00,
    "status": "CREATED"
  }
}
```

**Action:** 
- Copy `approvalUrl` và mở trong browser
- Đăng nhập bằng **PayPal Sandbox Personal Account**
- Click **Pay Now**

---

## 3️⃣ CALLBACK (Tự động sau khi thanh toán)

PayPal sẽ tự động redirect về:
```
http://localhost:3000/api/payments/paypal/callback?token=8XY12345ABC67890&PayerID=XXXXX
```

Backend sẽ:
1. Capture payment từ PayPal
2. Update payment status: `pending` → `completed`
3. Update order status: `pending` → `confirmed`
4. Redirect về: `http://localhost:5173/payment/success?orderId=123`

---

## 4️⃣ VERIFY PAYMENT (Kiểm tra trạng thái thanh toán)

```http
GET http://localhost:3000/api/payments/456
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "order_id": 123,
    "payment_method": "paypal",
    "status": "completed",
    "amount": 500000,
    "transaction_id": "PAYPAL_CAPTURE_ID",
    "payment_date": "2024-01-20T10:30:00.000Z"
  }
}
```

---

## 5️⃣ VERIFY ORDER (Kiểm tra trạng thái đơn hàng)

```http
GET http://localhost:3000/api/orders/123
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "confirmed",
    "total_amount": 500000,
    "final_amount": 500000,
    "payment_method": "paypal",
    "payments": [
      {
        "id": 456,
        "status": "completed",
        "transaction_id": "PAYPAL_CAPTURE_ID"
      }
    ]
  }
}
```

---

## 🧪 TEST SCENARIOS

### ✅ Scenario 1: Thanh toán thành công
1. Tạo order với `payment_method: "paypal"`
2. Tạo PayPal payment
3. Mở `approvalUrl`, đăng nhập và thanh toán
4. Verify payment status = `completed`
5. Verify order status = `confirmed`

### ❌ Scenario 2: Hủy thanh toán
1. Tạo order với `payment_method: "paypal"`
2. Tạo PayPal payment
3. Mở `approvalUrl`, click **"Cancel and return"**
4. Redirect về: `http://localhost:5173/payment/cancelled`
5. Verify payment status = `cancelled`

### 💰 Scenario 3: Số dư không đủ
1. Đăng nhập PayPal với account có balance = 0
2. Thử thanh toán → PayPal sẽ báo lỗi "Insufficient funds"

---

## 🔑 GET AUTHENTICATION TOKEN

Nếu chưa có token, đăng nhập trước:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "role_name": "customer"
    }
  }
}
```

Sử dụng `accessToken` cho các request khác.

---

## 📊 POSTMAN COLLECTION

Import collection này vào Postman:

```json
{
  "info": {
    "name": "PayPal Payment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"branch_id\": 1,\n  \"delivery_address\": \"123 Test Street\",\n  \"delivery_phone\": \"0901234567\",\n  \"payment_method\": \"paypal\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3000/api/orders",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "orders"]
        }
      }
    },
    {
      "name": "2. Create PayPal Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orderId\": 123\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3000/api/payments/paypal/create",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "payments", "paypal", "create"]
        }
      }
    },
    {
      "name": "3. Get Payment Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/payments/:paymentId",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "payments", ":paymentId"],
          "variable": [
            {
              "key": "paymentId",
              "value": "456"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 🐛 DEBUG TIPS

### Check server logs:
```bash
# Xem logs realtime
tail -f server.log

# Hoặc nếu dùng nodemon/pm2
npm run dev
```

Logs sẽ hiển thị:
```
🟡 PayPal Payment Request: { orderId: 123, amountVND: 500000, amountUSD: 20 }
🟡 PayPal Response: { id: '8XY...', status: 'CREATED', links: [...] }
🟡 Capturing PayPal order: 8XY12345ABC67890
🟡 PayPal Capture Response: { status: 'COMPLETED', ... }
```

### Check database:
```sql
-- Kiểm tra payment
SELECT * FROM payments WHERE order_id = 123;

-- Kiểm tra payment logs
SELECT * FROM payment_logs WHERE payment_id = 456 ORDER BY created_at DESC;

-- Kiểm tra order status
SELECT id, status, payment_method FROM orders WHERE id = 123;
```

---

## 📱 TESTING WITH FRONTEND

Nếu có frontend React/Vue:

```javascript
// Create order and payment
const createPayPalPayment = async (orderId) => {
  try {
    const response = await fetch('http://localhost:3000/api/payments/paypal/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();
    
    if (result.success) {
      // Redirect to PayPal
      window.location.href = result.data.approvalUrl;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## ✅ EXPECTED RESULTS

### Database Changes:

**Before Payment:**
```sql
orders:   status = 'pending'
payments: status = 'pending', transaction_id = NULL
```

**After Payment:**
```sql
orders:   status = 'confirmed'
payments: status = 'completed', transaction_id = 'PAYPAL_CAPTURE_ID'
payment_logs: action = 'paypal_capture_success'
```

---

🎉 **Ready to test!** Hãy theo các bước trên để test thanh toán PayPal.
