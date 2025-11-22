# User Management System - Quick Reference Guide

## 🚀 Quick Start

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```
Authorization: Bearer {your_jwt_token}
```

---

## 📋 Common Use Cases

### 1. Register New Customer (Public - No Auth)
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyen Van A",
    "email": "customer@example.com",
    "phone": "0987654321",
    "password": "password123",
    "gender": "Nam",
    "city_id": 1
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer@example.com",
    "password": "password123"
  }'
```

### 3. Get Customer Profile
```bash
curl -X GET http://localhost:3000/api/customers/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update Customer Profile
```bash
curl -X PUT http://localhost:3000/api/customers/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "address": "New Address",
    "city_id": 2
  }'
```

### 5. Get Customer Orders
```bash
curl -X GET "http://localhost:3000/api/customers/1/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Customer Statistics
```bash
curl -X GET http://localhost:3000/api/customers/1/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👨‍💼 Admin Operations

### Create Admin
```bash
curl -X POST http://localhost:3000/api/admins \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin01",
    "email": "admin@example.com",
    "password": "admin12345",
    "full_name": "Admin Name",
    "phone": "0901234567",
    "admin_level": 2
  }'
```

### List All Admins
```bash
curl -X GET "http://localhost:3000/api/admins?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update Admin Permissions
```bash
curl -X PUT http://localhost:3000/api/admins/1/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": {
      "users": ["read", "write"],
      "products": ["read"]
    }
  }'
```

---

## 👥 Staff Operations

### Create Staff
```bash
curl -X POST http://localhost:3000/api/staff \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff01",
    "email": "staff@example.com",
    "password": "staff12345",
    "full_name": "Staff Name",
    "phone": "0902234567",
    "employee_id": "EMP001",
    "branch_id": 1,
    "position": "Nhân viên"
  }'
```

### Get Staff by Branch
```bash
curl -X GET http://localhost:3000/api/branches/1/staff \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update Staff
```bash
curl -X PUT http://localhost:3000/api/staff/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Manager",
    "salary": 15000000,
    "branch_id": 2
  }'
```

---

## 📊 API Endpoints Summary

### Admin Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admins` | Admin | List all admins |
| GET | `/api/admins/:id` | Admin | Get admin by ID |
| POST | `/api/admins` | Admin | Create admin |
| PUT | `/api/admins/:id` | Admin | Update admin |
| DELETE | `/api/admins/:id` | Admin | Delete admin |
| PUT | `/api/admins/:id/permissions` | Admin | Update permissions |

### Staff Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/staff` | Admin | List all staff |
| GET | `/api/staff/:id` | Admin | Get staff by ID |
| POST | `/api/staff` | Admin | Create staff |
| PUT | `/api/staff/:id` | Admin | Update staff |
| DELETE | `/api/staff/:id` | Admin | Delete staff |
| GET | `/api/branches/:id/staff` | Admin | Get staff by branch |

### Customer Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customers` | Admin | List all customers |
| GET | `/api/customers/:id` | Auth | Get customer by ID |
| POST | `/api/customers` | Public | Register customer |
| PUT | `/api/customers/:id` | Owner/Admin | Update customer |
| DELETE | `/api/customers/:id` | Admin | Delete customer |
| GET | `/api/customers/:id/orders` | Auth | Get customer orders |
| GET | `/api/customers/:id/reviews` | Auth | Get customer reviews |
| GET | `/api/customers/:id/stats` | Auth | Get customer stats |

### User Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Owner/Admin | Get user by ID |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Owner/Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## 🔑 Field Requirements

### Admin Creation
**Required:** username, email, password, full_name
**Optional:** phone, admin_level, permissions, is_super_admin, notes

### Staff Creation
**Required:** username, email, password, full_name
**Optional:** phone, employee_id, branch_id, position, department, hire_date, salary, etc.

### Customer Registration
**Required:** full_name, email, phone, password
**Optional:** username, gender, dob, address, city_id

### User Creation
**Required:** username, email, password, role_id
**Optional:** phone, full_name, avatar_url

---

## ✅ Validation Rules

### Email
- Format: `user@example.com`
- Must be unique
- Required for all user types

### Phone
- Format: 10 digits (e.g., `0987654321`)
- Must be unique
- Vietnamese format

### Password
- Minimum 8 characters
- Auto-hashed with bcrypt

### Gender
- Only "Nam" or "Nữ"
- Case-sensitive

### Date of Birth
- Not in the future
- Maximum 120 years old

### Admin Level
- Integer between 1-5

---

## 🚫 Common Errors

### 400 Bad Request
```json
{
  "success": false,
  "error": "Số điện thoại không hợp lệ"
}
```
**Cause:** Invalid input format

### 401 Unauthorized
```json
{
  "error": "Token không hợp lệ"
}
```
**Cause:** Missing or invalid token

### 403 Forbidden
```json
{
  "error": "Không có quyền truy cập"
}
```
**Cause:** Insufficient permissions

### 404 Not Found
```json
{
  "error": "Không tìm thấy người dùng"
}
```
**Cause:** Resource doesn't exist

### 409 Conflict
```json
{
  "success": false,
  "error": "Email đã tồn tại"
}
```
**Cause:** Duplicate unique field

---

## 💡 Tips & Best Practices

### 1. Token Management
- Store token securely (localStorage/sessionStorage)
- Token expires in 24 hours
- Refresh token before expiration

### 2. Pagination
- Default: page=1, limit=10
- Max limit: 100
- Always handle pagination metadata

### 3. Search & Filter
- Use query parameters
- Combine multiple filters
- Case-insensitive search

### 4. Error Handling
```javascript
try {
  const response = await fetch('/api/customers', {...});
  const data = await response.json();
  
  if (!response.ok) {
    console.error(data.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 5. City-Based Orders
- Always set city_id for customers
- System auto-selects nearest branch
- Check inventory before order

---

## 🔍 Query Parameters

### Pagination
```
?page=1&limit=10
```

### Search
```
?search=nguyen
```

### Filter by Status
```
?isActive=true
```

### Filter by Branch
```
?branchId=1
```

### Sort
```
?sortBy=created_at&sortOrder=desc
```

### Multiple Filters
```
?page=1&limit=10&search=nguyen&role=customer&sortBy=created_at&sortOrder=desc
```

---

## 📱 Example Responses

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 100,
    "users": {
      "id": 100,
      "username": "customer01",
      "email": "customer@example.com",
      "full_name": "Nguyen Van A"
    }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalRecords": 50
    }
  }
}
```

### Customer Stats Response
```json
{
  "success": true,
  "data": {
    "totalSpent": 5000000,
    "orderCount": 15,
    "reviewCount": 8,
    "averageOrderValue": 333333.33,
    "lastOrderDate": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🛠️ Testing Commands

### Test Server Status
```bash
curl http://localhost:3000/health
```

### Test Public Endpoint (No Auth)
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","phone":"0900000000","password":"test12345"}'
```

### Test Protected Endpoint (With Auth)
```bash
TOKEN="your_jwt_token"
curl -X GET http://localhost:3000/api/customers/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Test Admin Endpoint
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X GET http://localhost:3000/api/admins \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🎯 Role Permissions

| Action | Admin | Staff | Customer |
|--------|-------|-------|----------|
| View all users | ✅ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Delete user | ✅ | ❌ | ❌ |
| View all customers | ✅ | ❌ | ❌ |
| Register (public) | N/A | N/A | ✅ |
| View orders | ✅ | ✅ | Own only |
| Manage staff | ✅ | ❌ | ❌ |
| Manage admins | ✅ | ❌ | ❌ |

---

## 📚 Additional Resources

- **Full Documentation:** `USER_MANAGEMENT_COMPLETE.md`
- **Test Cases:** `USER_MANAGEMENT_API_TESTS.md`
- **Implementation Summary:** `USER_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`
- **System Docs:** `SYSTEM_DOCUMENTATION.md`

---

## 🆘 Support

For issues or questions:
1. Check validation rules
2. Verify authentication token
3. Review error messages
4. Check database connections
5. Consult full documentation

---

**Last Updated:** 2024-11-22
**Version:** 1.0.0
