# PayPal Payment Security Update

## Tổng quan
Đã thêm validation kiểm tra order ownership cho PayPal payment để đảm bảo chỉ chủ đơn hàng mới có thể thanh toán.

## Thay đổi

### File: `paypalController.js`

#### 1. Thêm kiểm tra ownership
```javascript
// Get user ID from authenticated token
const userId = req.user.id;

// Get order with customer info
const order = await prisma.orders.findUnique({
  where: { id: Number(orderId) },
  include: {
    customers: {
      include: {
        users: {
          select: { id: true }
        }
      }
    },
    payments: {
      select: {
        payment_method: true,
        status: true
      },
      take: 1
    }
  }
});

// Check if order belongs to the customer
if (order.customers?.users?.id !== userId) {
  return res.status(403).json({
    success: false,
    error: 'Bạn không có quyền thanh toán đơn hàng này'
  });
}
```

#### 2. Cập nhật comment
```javascript
// Before
@access  Private (Customer)

// After  
@access  Private (Customer only - verified by order ownership)
```

## Lý do thay đổi

### Vấn đề trước đây:
- ❌ Bất kỳ user nào đã login đều có thể thanh toán order của người khác
- ❌ Không có validation kiểm tra order có thuộc về user hay không
- ❌ Có thể bị abuse để thanh toán sai order

### Sau khi cập nhật:
- ✅ Chỉ chủ đơn hàng mới thanh toán được
- ✅ Kiểm tra `order.customers.users.id === userId`
- ✅ Trả về lỗi 403 Forbidden nếu không phải chủ order
- ✅ Bảo mật tốt hơn, tránh abuse

## Flow bảo mật

```
User Request → authenticateToken Middleware → Controller
                     ↓                              ↓
                Extract userId                Check order ownership
                from JWT token                     ↓
                                            Compare userId with
                                            order.customers.users.id
                                                   ↓
                                            ✅ Match: Process payment
                                            ❌ Not match: 403 Forbidden
```

## Response Codes

| Code | Scenario | Message |
|------|----------|---------|
| 200  | Success | Payment created successfully |
| 400  | Missing orderId | "Thiếu thông tin đơn hàng" |
| 403  | Not order owner | "Bạn không có quyền thanh toán đơn hàng này" |
| 404  | Order not found | "Không tìm thấy đơn hàng" |
| 400  | Already paid | "Đơn hàng đã được thanh toán" |
| 400  | Wrong payment method | "Đơn hàng này sử dụng phương thức thanh toán X" |

## Testing

### Test Case 1: Chủ đơn hàng thanh toán (Success)
```bash
# Login as customer with ID = 5
curl -X POST http://localhost:3000/api/payments/paypal/create \
  -H "Authorization: Bearer CUSTOMER_5_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123}'

# Expected: 200 OK, payment created
```

### Test Case 2: User khác cố thanh toán (Forbidden)
```bash
# Login as customer with ID = 10
curl -X POST http://localhost:3000/api/payments/paypal/create \
  -H "Authorization: Bearer CUSTOMER_10_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123}'  # Order của customer 5

# Expected: 403 Forbidden
# Response: {"success": false, "error": "Bạn không có quyền thanh toán đơn hàng này"}
```

### Test Case 3: Không đăng nhập (Unauthorized)
```bash
curl -X POST http://localhost:3000/api/payments/paypal/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123}'

# Expected: 401 Unauthorized
```

## So sánh với các phương thức khác

| Payment Method | Ownership Check | Location |
|---------------|----------------|----------|
| **PayPal** | ✅ Yes | paypalController.js |
| MoMo | ✅ Yes | momoController.js (đã có sẵn) |
| VNPay | ❌ No | - |

## Notes

### Tại sao không dùng `authorizeRoles('customer')`?
- ❌ Hard-code role check - không linh hoạt
- ✅ Order ownership check an toàn hơn
- ✅ Admin/Staff vẫn có thể test payment nếu cần (bằng cách tạo order với account của họ)

### Tại sao không thay đổi MoMo và VNPay?
- MoMo đã có logic tương tự (lines 58-62 trong momoController.js)
- VNPay chưa có nhưng không được yêu cầu thay đổi trong task này
- Chỉ focus vào PayPal theo yêu cầu

## Database Schema

Order ownership được xác định qua relationship:
```
orders → customer_id → customers → user_id → users.id
```

Query để lấy owner:
```javascript
order.customers?.users?.id
```

## Security Best Practices

✅ **Implemented:**
- Authentication via JWT token
- Order ownership verification
- Payment method validation
- Duplicate payment prevention

✅ **Recommendations for future:**
- Add rate limiting for payment creation
- Log all payment attempts for audit
- Add IP validation for suspicious activities
- Implement 2FA for large transactions
