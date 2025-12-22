# Review Management API Documentation

## Overview
API để quản lý đánh giá sản phẩm của khách hàng. Hệ thống cho phép khách hàng đánh giá sản phẩm sau khi mua hàng thành công.

## Business Rules

### Quy tắc đánh giá:
1. ✅ Chỉ khách hàng đã mua sản phẩm (order status = 'completed') mới có thể đánh giá
2. ✅ Mỗi khách hàng chỉ được đánh giá 1 lần cho mỗi sản phẩm (unique constraint)
3. ✅ Rating phải từ 1-5 sao
4. ✅ Comment tối đa 1000 ký tự
5. ✅ Khách hàng có thể sửa/xóa đánh giá của mình
6. ✅ Admin có thể xóa bất kỳ đánh giá nào
7. ✅ Rate limit: 10 reviews per hour per user

---

## API Endpoints

### 1. Get All Reviews (Public)
**GET** `/api/reviews`

Lấy danh sách tất cả đánh giá với filtering và pagination.

**Query Parameters:**
```
page        : number (default: 1)
limit       : number (default: 10, max: 100)
productId   : number (optional) - Filter by product
customerId  : number (optional) - Filter by customer
rating      : number (optional) - Filter by rating (1-5)
sortBy      : string (default: 'created_at') - Sort field
sortOrder   : string (default: 'desc') - 'asc' | 'desc'
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "customer_id": 10,
        "product_id": 5,
        "rating": 5,
        "comment": "Sản phẩm rất tốt!",
        "created_at": "2025-12-21T10:00:00.000Z",
        "updated_at": "2025-12-21T10:00:00.000Z",
        "customers": {
          "id": 10,
          "users": {
            "full_name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com"
          }
        },
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "image_url": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalRecords": 50
    }
  }
}
```

---

### 2. Get Review By ID (Public)
**GET** `/api/reviews/:id`

Lấy thông tin chi tiết một đánh giá.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 10,
    "product_id": 5,
    "rating": 5,
    "comment": "Sản phẩm rất tốt!",
    "created_at": "2025-12-21T10:00:00.000Z",
    "updated_at": "2025-12-21T10:00:00.000Z",
    "customers": {
      "id": 10,
      "users": {
        "full_name": "Nguyễn Văn A"
      }
    },
    "products": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "image_url": "https://..."
    }
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Không tìm thấy đánh giá"
}
```

---

### 3. Get Product Reviews (Public)
**GET** `/api/products/:productId/reviews`

Lấy tất cả đánh giá của một sản phẩm.

**Query Parameters:**
```
page      : number (default: 1)
limit     : number (default: 10)
rating    : number (optional) - Filter by rating
sortBy    : string (default: 'created_at')
sortOrder : string (default: 'desc')
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "image_url": "https://..."
    },
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "totalRecords": 25
    }
  }
}
```

---

### 4. Get Product Rating Statistics (Public)
**GET** `/api/products/:productId/rating-stats`

Lấy thống kê rating của sản phẩm.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 5,
      "name": "Paracetamol 500mg",
      "image_url": "https://..."
    },
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 100,
      "ratingDistribution": {
        "1": 2,
        "2": 3,
        "3": 10,
        "4": 30,
        "5": 55
      }
    }
  }
}
```

---

### 5. Get Customer's Own Reviews (Protected - Customer)
**GET** `/api/customers/me/reviews`

Khách hàng xem danh sách đánh giá của mình.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
page      : number (default: 1)
limit     : number (default: 10)
rating    : number (optional) - Filter by rating
sortBy    : string (default: 'created_at')
sortOrder : string (default: 'desc')
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 10,
      "full_name": "Nguyễn Văn A",
      "email": "nguyenvana@example.com"
    },
    "reviews": [
      {
        "id": 1,
        "customer_id": 10,
        "product_id": 5,
        "rating": 5,
        "comment": "Sản phẩm rất tốt!",
        "created_at": "2025-12-21T10:00:00.000Z",
        "products": {
          "id": 5,
          "name": "Paracetamol 500mg",
          "image_url": "https://...",
          "price": "50000"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "totalRecords": 15
    }
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Chỉ khách hàng mới có thể xem đánh giá của mình"
}
```

---

### 6. Create Review (Protected - Customer)
**POST** `/api/reviews`

Tạo đánh giá mới cho sản phẩm đã mua.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "product_id": 5,
  "rating": 5,
  "comment": "Sản phẩm rất tốt, giao hàng nhanh!"
}
```

**Validation:**
- `product_id`: required, number, > 0
- `rating`: required, number, 1-5
- `comment`: optional, string, max 1000 characters

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 10,
    "product_id": 5,
    "rating": 5,
    "comment": "Sản phẩm rất tốt!",
    "created_at": "2025-12-21T10:00:00.000Z",
    "customers": {...},
    "products": {...}
  }
}
```

**Response 400 - Not Purchased:**
```json
{
  "success": false,
  "error": "Bạn cần mua sản phẩm trước khi đánh giá"
}
```

**Response 400 - Already Reviewed:**
```json
{
  "success": false,
  "error": "Bạn đã đánh giá sản phẩm này rồi"
}
```

**Response 400 - Invalid Rating:**
```json
{
  "success": false,
  "error": "Đánh giá phải từ 1 đến 5 sao"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Sản phẩm không tồn tại"
}
```

**Response 429 - Rate Limited:**
```json
{
  "success": false,
  "error": "Quá nhiều đánh giá, vui lòng thử lại sau 1 giờ"
}
```

---

### 7. Update Review (Protected - Customer/Admin)
**PUT** `/api/reviews/:id`

Cập nhật đánh giá của mình (customer) hoặc bất kỳ đánh giá nào (admin).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Sản phẩm tốt nhưng giao hơi chậm"
}
```

**Validation:**
- `rating`: optional, number, 1-5
- `comment`: optional, string, max 1000 characters
- Ít nhất 1 field phải được cung cấp

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 10,
    "product_id": 5,
    "rating": 4,
    "comment": "Sản phẩm tốt nhưng giao hơi chậm",
    "updated_at": "2025-12-21T11:00:00.000Z"
  }
}
```

**Response 400 - No Data:**
```json
{
  "success": false,
  "error": "Không có dữ liệu để cập nhật"
}
```

**Response 403 - Not Owner:**
```json
{
  "success": false,
  "error": "Bạn chỉ có thể sửa đánh giá của chính mình"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Không tìm thấy đánh giá"
}
```

---

### 8. Delete Review (Protected - Customer/Admin)
**DELETE** `/api/reviews/:id`

Xóa đánh giá của mình (customer) hoặc bất kỳ đánh giá nào (admin).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Xóa đánh giá thành công",
  "data": {
    "id": 1,
    "customer_id": 10,
    "product_id": 5,
    "rating": 5,
    "comment": "..."
  }
}
```

**Response 403 - Not Owner:**
```json
{
  "success": false,
  "error": "Bạn chỉ có thể xóa đánh giá của chính mình"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Không tìm thấy đánh giá"
}
```

---

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Not enough permission |
| 404 | Not Found | Review/Product/Customer not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Database Schema

```sql
model reviews {
  id          Int       @id @default(autoincrement())
  customer_id Int
  product_id  Int
  rating      Int       -- 1-5 stars
  comment     String?   -- Max 1000 characters
  created_at  DateTime? @default(now())
  updated_at  DateTime? @default(now())
  
  customers   customers @relation(...)
  products    products  @relation(...)

  @@unique([customer_id, product_id], map: "unique_review")
  @@index([product_id])
}
```

---

## Security Considerations

### ✅ Implemented:
1. **Authentication**: JWT token required for create/update/delete
2. **Authorization**: Ownership validation (customer can only modify own reviews)
3. **Rate Limiting**: 10 reviews per hour per user
4. **Input Validation**: Rating range, comment length
5. **Input Sanitization**: XSS prevention in comments
6. **Purchase Verification**: Must buy product before reviewing
7. **Duplicate Prevention**: One review per customer per product

### ⚠️ Recommendations:
1. Add spam detection for comment content
2. Add image upload support for reviews
3. Add review helpful/not helpful voting system
4. Add admin moderation queue for flagged reviews
5. Add email notification to customer when review is deleted by admin

---

## Testing Checklist

### Public Endpoints:
- [ ] Get all reviews with pagination
- [ ] Get all reviews with filters (productId, customerId, rating)
- [ ] Get review by valid ID
- [ ] Get review by invalid ID (404)
- [ ] Get product reviews with pagination
- [ ] Get product reviews for non-existent product (404)
- [ ] Get product rating stats
- [ ] Get rating stats for product with no reviews

### Protected Endpoints (Customer):
- [ ] Create review for purchased product
- [ ] Create review for non-purchased product (400)
- [ ] Create duplicate review (400)
- [ ] Create review with invalid rating (400)
- [ ] Create review with comment > 1000 chars (400)
- [ ] Get own reviews
- [ ] Update own review
- [ ] Update other customer's review (403)
- [ ] Delete own review
- [ ] Delete other customer's review (403)

### Admin Endpoints:
- [ ] Delete any review
- [ ] Update any review

### Rate Limiting:
- [ ] Create 11 reviews in 1 hour (should fail on 11th)

---

## Example API Calls

### Create Review (cURL):
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 5,
    "rating": 5,
    "comment": "Sản phẩm rất tốt!"
  }'
```

### Get Product Reviews:
```bash
curl http://localhost:3000/api/products/5/reviews?page=1&limit=10&rating=5
```

### Get Own Reviews:
```bash
curl http://localhost:3000/api/customers/me/reviews \
  -H "Authorization: Bearer <jwt_token>"
```

### Update Review:
```bash
curl -X PUT http://localhost:3000/api/reviews/1 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Sản phẩm tốt"
  }'
```

### Delete Review:
```bash
curl -X DELETE http://localhost:3000/api/reviews/1 \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Change Log

### Version 1.0 (2025-12-21)
- ✅ Fixed update logic to properly handle undefined values
- ✅ Added input validation and sanitization
- ✅ Added customer ownership validation
- ✅ Added endpoint for customer's own reviews
- ✅ Improved error handling and messages
- ✅ Added rate limiting
- ✅ Consistent response format with proper includes
- ✅ Allow customers to delete own reviews
