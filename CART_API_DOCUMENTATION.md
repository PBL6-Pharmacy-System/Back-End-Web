# Cart API Documentation

## Overview
API endpoints cho quản lý giỏ hàng (shopping cart) trong hệ thống Pharmacy.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tất cả các endpoints đều yêu cầu authentication token trong header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Get Cart
Lấy thông tin giỏ hàng của khách hàng.

**Endpoint:** `GET /cart/:customerId`

**Parameters:**
- `customerId` (path) - ID của khách hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 123,
    "status": "cart",
    "total_amount": 150000,
    "final_amount": 150000,
    "orderitems": [
      {
        "id": 1,
        "product_id": 456,
        "unit_id": 789,
        "quantity": 2,
        "price": 75000,
        "subtotal": 150000,
        "products": { ... },
        "productunits": { ... }
      }
    ]
  }
}
```

---

### 2. Get Cart Summary
Lấy tóm tắt giỏ hàng với tổng tiền và số lượng items.

**Endpoint:** `GET /cart/:customerId/summary`

**Parameters:**
- `customerId` (path) - ID của khách hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "cartId": 1,
    "itemCount": 3,
    "subtotal": 150000,
    "discount": 0,
    "total": 150000,
    "items": [
      {
        "id": 1,
        "product": { ... },
        "productUnit": { ... },
        "quantity": 2,
        "unitPrice": 75000,
        "subtotal": 150000,
        "hasFlashsale": false,
        "flashPrice": null
      }
    ]
  }
}
```

---

### 3. Add to Cart
Thêm sản phẩm vào giỏ hàng.

**Endpoint:** `POST /cart/:customerId/add`

**Parameters:**
- `customerId` (path) - ID của khách hàng

**Request Body:**
```json
{
  "productId": 456,
  "productUnitId": 789,
  "quantity": 2,
  "unitPrice": 75000
}
```

**Validation:**
- Quantity: 1 - 999 (MAX_QUANTITY_PER_ITEM)
- Cart items limit: 100 items (MAX_ITEMS_PER_CART)
- Price verification: Giá phải khớp với giá hiện tại
- Stock availability: Kiểm tra tồn kho

**Response:**
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng",
  "data": {
    "id": 1,
    "order_id": 1,
    "product_id": 456,
    "unit_id": 789,
    "quantity": 2,
    "price": 75000,
    "subtotal": 150000,
    "products": { ... },
    "productunits": { ... }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Giá sản phẩm đã thay đổi. Giá hiện tại: 80000 VNĐ",
  "data": {
    "currentPrice": 80000,
    "providedPrice": 75000
  }
}
```

---

### 4. Update Cart Item
Cập nhật số lượng sản phẩm trong giỏ hàng.

**Endpoint:** `PUT /cart/:customerId/items/:itemId`

**Parameters:**
- `customerId` (path) - ID của khách hàng
- `itemId` (path) - ID của item trong giỏ

**Request Body:**
```json
{
  "quantity": 3
}
```

**Validation:**
- Quantity: 1 - 999
- Stock availability
- Price verification

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật số lượng sản phẩm",
  "data": {
    "id": 1,
    "quantity": 3,
    "subtotal": 225000,
    ...
  }
}
```

---

### 5. Remove from Cart
Xóa sản phẩm khỏi giỏ hàng.

**Endpoint:** `DELETE /cart/:customerId/items/:itemId`

**Parameters:**
- `customerId` (path) - ID của khách hàng
- `itemId` (path) - ID của item cần xóa

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa sản phẩm khỏi giỏ hàng"
}
```

---

### 6. Clear Cart
Xóa toàn bộ giỏ hàng.

**Endpoint:** `DELETE /cart/:customerId/clear`

**Parameters:**
- `customerId` (path) - ID của khách hàng

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa toàn bộ giỏ hàng"
}
```

---

### 7. Preview Voucher
Xem trước discount khi áp dụng voucher (không thực sự apply).

**Endpoint:** `POST /cart/:customerId/voucher/preview`

**Parameters:**
- `customerId` (path) - ID của khách hàng

**Request Body:**
```json
{
  "voucherCode": "SUMMER2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 150000,
    "discount": 15000,
    "total": 135000,
    "voucher": {
      "code": "SUMMER2024",
      "discount_type": "percentage",
      "discount_value": 10,
      "min_order_value": 100000
    }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Mã voucher đã hết hạn hoặc chưa có hiệu lực"
}
```

```json
{
  "success": false,
  "error": "Đơn hàng phải có giá trị tối thiểu 200000 VNĐ"
}
```

---

### 8. Merge Guest Cart
Hợp nhất giỏ hàng guest vào tài khoản sau khi đăng nhập.

**Endpoint:** `POST /cart/merge`

**Request Body:**
```json
{
  "guestCartId": 999
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã hợp nhất giỏ hàng thành công",
  "data": {
    "success": true,
    "data": { ... }
  }
}
```

---

### 9. Checkout
Chuyển giỏ hàng thành đơn hàng và tạo payment.

**Endpoint:** `POST /cart/checkout`

**Request Body:**
```json
{
  "customerId": 123,
  "voucherCode": "SUMMER2024",
  "shippingAddressId": 456,
  "paymentMethod": "cash"
}
```

**Payment Methods:**
- `cash` - Thanh toán khi nhận hàng
- `card` - Thẻ tín dụng/ghi nợ
- `bank_transfer` - Chuyển khoản ngân hàng
- `momo` - Ví MoMo
- `zalopay` - Ví ZaloPay

**Validation:**
- Cart không được rỗng
- Stock availability cho tất cả items
- Shipping address hợp lệ (nếu có)
- Voucher hợp lệ (nếu có)

**Response:**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "order": {
      "id": 123,
      "customer_id": 456,
      "status": "pending",
      "total_amount": 150000,
      "discount_amount": 15000,
      "final_amount": 135000,
      "payment_status": "unpaid",
      ...
    },
    "payment": {
      "id": 789,
      "order_id": 123,
      "payment_method": "cash",
      "amount": 135000,
      "status": "pending",
      "transaction_id": "TXN-1234567890-123"
    },
    "summary": {
      "subtotal": 150000,
      "discount": 15000,
      "total": 135000,
      "items_count": 3
    }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Sản phẩm \"Paracetamol 500mg\" không đủ số lượng trong kho"
}
```

**Transaction Rollback:**
Nếu bất kỳ bước nào trong checkout thất bại (update stock, create payment, apply voucher), toàn bộ transaction sẽ được rollback.

---

### 10. Confirm Payment
Xác nhận thanh toán cho đơn hàng (cho payment methods online).

**Endpoint:** `POST /orders/:id/confirm-payment`

**Parameters:**
- `id` (path) - ID của order

**Request Body:**
```json
{
  "orderId": 123,
  "transactionId": "TXN-1234567890-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán thành công"
}
```

**Side Effects:**
- Update payment status to "completed"
- Update order payment_status to "paid"
- Update order status to "confirmed"
- Increment sold_count for all products in order

---

### 11. Cancel Order
Hủy đơn hàng.

**Endpoint:** `POST /orders/:id/cancel`

**Parameters:**
- `id` (path) - ID của order

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy đơn hàng thành công"
}
```

**Side Effects:**
- Update order status to "cancelled"
- Restore product stock
- Update payment_status to "refunded"

**Restrictions:**
- Không thể hủy đơn hàng đã giao (delivered)
- Không thể hủy đơn hàng đã hủy (cancelled)
- Không thể hủy giỏ hàng (cart status)

---

## Security

### Ownership Validation
Tất cả cart endpoints đều có middleware `validateCartOwnership` để đảm bảo:
- User chỉ có thể access giỏ hàng của chính mình
- Admin và Staff có thể access tất cả giỏ hàng
- Customer phải có `customer_id` matching với `customerId` trong URL

### Rate Limiting
Các endpoints thay đổi data (POST, PUT, DELETE) có rate limiting:
- Add to cart: Limited
- Update cart item: Limited
- Remove from cart: Limited

---

## Constants

### Cart Limits
```javascript
CART_LIMITS = {
  MAX_ITEMS_PER_CART: 100,      // Tối đa 100 loại sản phẩm khác nhau
  MAX_QUANTITY_PER_ITEM: 999,   // Tối đa 999 của mỗi sản phẩm
  CART_EXPIRATION_DAYS: 30      // Giỏ hàng hết hạn sau 30 ngày
}
```

### Order Status
```javascript
ORDER_STATUS = {
  CART: 'cart',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
}
```

---

## Background Jobs

### Cart Expiration Job
- **Schedule:** Chạy hàng ngày lúc 2:00 AM
- **Function:** Xóa giỏ hàng không được cập nhật trong 30 ngày
- **Log:** `[Cart Expiration] Deleted X expired carts`

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created (Add to cart) |
| 400 | Bad Request (Validation error) |
| 401 | Unauthorized (Not logged in) |
| 403 | Forbidden (Access denied) |
| 404 | Not Found (Cart/Product not found) |
| 500 | Internal Server Error |

---

## Example Usage

### Complete Checkout Flow

```javascript
// 1. Get cart
GET /cart/123

// 2. Add products to cart
POST /cart/123/add
{
  "productId": 456,
  "productUnitId": 789,
  "quantity": 2,
  "unitPrice": 75000
}

// 3. Update quantity if needed
PUT /cart/123/items/1
{
  "quantity": 3
}

// 4. Preview voucher
POST /cart/123/voucher/preview
{
  "voucherCode": "SUMMER2024"
}

// 5. Get cart summary
GET /cart/123/summary

// 6. Checkout
POST /cart/checkout
{
  "customerId": 123,
  "voucherCode": "SUMMER2024",
  "shippingAddressId": 456,
  "paymentMethod": "momo"
}

// 7. Confirm payment (if online payment)
POST /orders/789/confirm-payment
{
  "orderId": 789,
  "transactionId": "TXN-1234567890-789"
}
```

---

## Notes

1. **Price Verification:** Khi add/update cart, giá sản phẩm phải khớp với giá hiện tại (±0.01 VNĐ tolerance)

2. **Stock Management:** Stock được decrement khi checkout, không phải khi add to cart

3. **Flashsale Support:** Cart summary sẽ hiển thị flashsale price nếu sản phẩm đang có flashsale

4. **Transaction Safety:** Checkout sử dụng Prisma transaction để đảm bảo atomicity

5. **Race Condition Protection:** Khi decrement stock, kiểm tra stock không âm để tránh overselling

6. **Cart Expiration:** Giỏ hàng cũ sẽ tự động bị xóa sau 30 ngày không hoạt động
