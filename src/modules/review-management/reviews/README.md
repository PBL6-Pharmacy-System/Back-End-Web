# Review Management Module

## Overview
Module quản lý đánh giá sản phẩm của khách hàng trong hệ thống Pharmacy.

## Files Structure
```
reviews/
├── reviewController.js      # Controller layer - handles HTTP requests
├── reviewService.js          # Service layer - business logic
├── reviewRoutes.js           # Routes definition
├── REVIEW_API_DOCUMENTATION.md  # Complete API documentation
└── README.md                # This file
```

## Key Features
- ✅ Customer can review purchased products
- ✅ One review per customer per product
- ✅ Rating 1-5 stars with optional comment
- ✅ Purchase verification before review
- ✅ Customer can edit/delete own reviews
- ✅ Admin can delete any review
- ✅ Rate limiting: 10 reviews/hour
- ✅ Input validation and sanitization
- ✅ Product rating statistics

## Quick Start

### Get all reviews
```bash
curl http://localhost:3000/api/reviews
```

### Get product reviews
```bash
curl http://localhost:3000/api/products/1/reviews
```

### Create review (requires auth)
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "rating": 5, "comment": "Great product!"}'
```

## Documentation
See [REVIEW_API_DOCUMENTATION.md](./REVIEW_API_DOCUMENTATION.md) for complete API documentation.

## Recent Fixes (2025-12-21)
- ✅ Fixed undefined value handling in update
- ✅ Added input validation and sanitization
- ✅ Added customer ownership validation
- ✅ Added endpoint for customer's own reviews
- ✅ Improved error handling
- ✅ Customers can now delete own reviews
- ✅ Consistent response format

## Security
- JWT authentication required for create/update/delete
- Ownership validation (customer can only modify own reviews)
- Rate limiting (10 reviews/hour)
- Input sanitization (XSS prevention)
- Purchase verification

## Database Schema
```prisma
model reviews {
  id          Int       @id @default(autoincrement())
  customer_id Int
  product_id  Int
  rating      Int       // 1-5
  comment     String?   // max 1000 chars
  created_at  DateTime? @default(now())
  updated_at  DateTime? @default(now())
  
  @@unique([customer_id, product_id])
  @@index([product_id])
}
```

## Business Rules
1. Must purchase product before reviewing (order status = 'completed')
2. One review per customer per product
3. Rating must be 1-5 stars
4. Comment max 1000 characters
5. Customer can edit/delete own reviews
6. Admin can delete any review

## Testing
Run the server and test endpoints:
```bash
npm start
curl http://localhost:3000/api/reviews
curl http://localhost:3000/api/products/1/rating-stats
```

## Future Enhancements
- [ ] Add review images
- [ ] Add helpful/not helpful voting
- [ ] Add review moderation system
- [ ] Add admin reply to reviews
- [ ] Add spam detection
