# API Test Results
Generated: Sat Nov 22 13:17:11 +07 2025

# Auth Module
## Test 1: User Registration
- **Endpoint**: `POST /auth/register`
- **Request Body**: `{
  "username": "testuser",
  "password": "Test@123456",
  "email": "testuser@example.com",
  "phone": "0901234567",
  "full_name": "Test User",
  "role_name": "customer"
}`
- **Status**: ❌ FAILED
- **Response**: ```json
```

## Test 2: Get Current User Profile
- **Endpoint**: `GET /auth/me`
- **Status**: ❌ FAILED
- **Response**: ```json
```

# Product Module
## Test 3: Get All Products
- **Endpoint**: `GET /products?page=1&limit=10`
- **Status**: ❌ FAILED
- **Response**: ```json
```

## Test 4: Get Product By ID
- **Endpoint**: `GET /products/1`
- **Status**: ❌ FAILED
- **Response**: ```json
```

## Test 5: Search Products by Keyword
- **Endpoint**: `GET /products/search?keyword=thuốc`
- **Status**: ❌ FAILED
- **Response**: ```json
```

# Category Module
## Test 6: Get All Categories
- **Endpoint**: `GET /categories`
- **Status**: ✅ PASSED
- **Response**: ```json
```

## Test 7: Get Category By ID
- **Endpoint**: `GET /categories/1`
- **Status**: ✅ PASSED
- **Response**: ```json
```

# Review Module
## Test 8: Get Product Reviews
- **Endpoint**: `GET /reviews/product/1`
- **Status**: ❌ FAILED
- **Response**: ```json
```

# Branch Module
## Test 9: Get All Branches
- **Endpoint**: `GET /branches`
- **Status**: ✅ PASSED
- **Response**: ```json
```

## Test 10: Get Branch By ID
- **Endpoint**: `GET /branches/1`
- **Status**: ✅ PASSED
- **Response**: ```json
```

# Cities Module
## Test 11: Get All Cities
- **Endpoint**: `GET /cities`
- **Status**: ❌ FAILED
- **Response**: ```json
```

---
## Summary
- **Total Tests**: 11
- **Passed**: ✅ 4
- **Failed**: ❌ 7
- **Success Rate**: 36.36%
