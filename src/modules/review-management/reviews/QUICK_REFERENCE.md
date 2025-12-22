# Review Management - Quick Reference Card

## 🎯 Endpoints Quick Reference

### Public APIs (No Auth)
```bash
# Get all reviews
GET /api/reviews?page=1&limit=10&rating=5

# Get single review
GET /api/reviews/:id

# Get product reviews
GET /api/products/:productId/reviews?page=1&limit=10

# Get product rating stats
GET /api/products/:productId/rating-stats
```

### Customer APIs (Auth Required)
```bash
# Get my reviews
GET /api/customers/me/reviews
Headers: Authorization: Bearer <token>

# Create review
POST /api/reviews
Headers: Authorization: Bearer <token>
Body: { "product_id": 1, "rating": 5, "comment": "Great!" }

# Update my review
PUT /api/reviews/:id
Headers: Authorization: Bearer <token>
Body: { "rating": 4, "comment": "Good" }

# Delete my review
DELETE /api/reviews/:id
Headers: Authorization: Bearer <token>
```

### Admin APIs (Auth Required)
```bash
# Update any review
PUT /api/reviews/:id
Headers: Authorization: Bearer <admin_token>

# Delete any review
DELETE /api/reviews/:id
Headers: Authorization: Bearer <admin_token>
```

---

## 📋 Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| product_id | number | Yes | Must exist, must be purchased |
| rating | number | Yes | 1-5 only |
| comment | string | No | Max 1000 chars |

---

## 🔒 Business Rules

✅ Must purchase product (order status = 'completed')  
✅ One review per customer per product  
✅ Customer can edit/delete own reviews  
✅ Admin can edit/delete any reviews  
✅ Rate limit: 10 reviews/hour  

---

## 📊 Response Format

### Success (200/201)
```json
{
  "success": true,
  "data": { ... },
  "message": "..." // optional
}
```

### Error (400/403/404)
```json
{
  "success": false,
  "error": "Error message in Vietnamese"
}
```

---

## 🚨 Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Thiếu thông tin product_id | Include product_id in body |
| 400 | Đánh giá phải từ 1 đến 5 sao | Use rating 1-5 |
| 400 | Bạn cần mua sản phẩm trước | Purchase product first |
| 400 | Bạn đã đánh giá sản phẩm này rồi | Can only review once |
| 401 | Token không được cung cấp | Add Authorization header |
| 403 | Bạn chỉ có thể sửa đánh giá của chính mình | Can only edit own reviews |
| 404 | Không tìm thấy đánh giá | Review doesn't exist |
| 429 | Quá nhiều đánh giá | Wait 1 hour (rate limit) |

---

## 🧪 Testing Commands

```bash
# Start server
npm start

# Test public endpoints
curl http://localhost:3000/api/reviews
curl http://localhost:3000/api/products/1/reviews
curl http://localhost:3000/api/products/1/rating-stats

# Test with auth (replace <TOKEN>)
curl http://localhost:3000/api/customers/me/reviews \
  -H "Authorization: Bearer <TOKEN>"

curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "rating": 5, "comment": "Great!"}'
```

---

## 📁 File Locations

```
src/modules/review-management/reviews/
├── reviewController.js              # HTTP handlers
├── reviewService.js                 # Business logic
├── reviewRoutes.js                  # Route definitions
├── REVIEW_API_DOCUMENTATION.md      # Full docs
├── README.md                        # Overview
└── QUICK_REFERENCE.md              # This file
```

---

## 🔧 Key Functions

### Service Layer
```javascript
getAllReviews(filters)        // Get all with pagination
getReviewById(id)             // Get single review
getProductReviews(productId)  // Get product's reviews
getProductRatingStats(id)     // Get rating statistics
getCustomerReviews(customerId) // Get customer's reviews
createReview(data)            // Create new review
updateReview(id, data)        // Update review
deleteReview(id)              // Delete review
```

### Controller Layer
```javascript
getAllReviews(req, res)       // GET /api/reviews
getReviewById(req, res)       // GET /api/reviews/:id
getProductReviews(req, res)   // GET /api/products/:id/reviews
getProductRatingStats(req, res) // GET /api/products/:id/rating-stats
getCustomerOwnReviews(req, res) // GET /api/customers/me/reviews
createReview(req, res)        // POST /api/reviews
updateReview(req, res)        // PUT /api/reviews/:id
deleteReview(req, res)        // DELETE /api/reviews/:id
```

---

## 🎨 Example Responses

### Get Product Reviews
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Paracetamol 500mg",
      "image_url": "https://..."
    },
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Sản phẩm tốt!",
        "created_at": "2025-12-21T10:00:00.000Z",
        "customers": {
          "users": {
            "full_name": "Nguyễn Văn A"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalRecords": 5
    }
  }
}
```

### Get Rating Stats
```json
{
  "success": true,
  "data": {
    "product": { "id": 1, "name": "..." },
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 100,
      "ratingDistribution": {
        "1": 2, "2": 3, "3": 10, "4": 30, "5": 55
      }
    }
  }
}
```

---

## ⚡ Performance Tips

1. Use pagination (default: page=1, limit=10)
2. Filter by rating to reduce data
3. Sort by created_at for chronological view
4. Cache rating stats for popular products

---

## 🔐 Security Checklist

✅ JWT token validated  
✅ Ownership checked  
✅ Input sanitized  
✅ Rate limited  
✅ Purchase verified  
✅ XSS prevented  

---

**Last Updated:** 2025-12-21  
**Module Version:** 1.0  
**Status:** Production Ready ✅
