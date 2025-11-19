# User & Role System Documentation

## Overview
Hệ thống User & Role được thiết kế với kiến trúc phân tầng rõ ràng:
- **users** - Base table chứa thông tin authentication
- **roles** - Table định nghĩa các roles trong hệ thống
- **customers**, **staff**, **admin** - Tables chứa thông tin specific cho từng role

## Database Schema

### 1. Roles Table
Định nghĩa các roles trong hệ thống.

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
```

**Default Roles:**
- `role_id = 1`: **admin** - Quản trị viên hệ thống
- `role_id = 2`: **staff** - Nhân viên
- `role_id = 3`: **customer** - Khách hàng

---

### 2. Users Table (Base)
Table cơ sở chứa thông tin authentication cho tất cả users.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role_id INTEGER NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP(6),
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

**Fields:**
- `username`: Tên đăng nhập (unique)
- `password_hash`: Mật khẩu đã hash (bcrypt)
- `email`: Email (unique)
- `phone`: Số điện thoại (unique, optional)
- `role_id`: Foreign key đến roles table
- `is_active`: Tài khoản có active không
- `is_verified`: Email/Phone đã verify chưa

---

### 3. Customers Table
Lưu thông tin specific cho khách hàng.

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  dob DATE,
  gender VARCHAR(10),
  address TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `user_id`: Link đến users table
- `dob`: Ngày sinh
- `gender`: Giới tính (male/female/other)
- `address`: Địa chỉ

**Relations:**
- `orders`: Đơn hàng của customer
- `reviews`: Đánh giá sản phẩm
- `shippingaddresses`: Địa chỉ giao hàng
- `prescriptions`: Đơn thuốc

---

### 4. Staff Table
Lưu thông tin specific cho nhân viên.

```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  branch_id INTEGER,
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  hometown VARCHAR(255),
  id_number VARCHAR(50),
  emergency_contact VARCHAR(20),
  emergency_name VARCHAR(255),
  salary DECIMAL(12, 2),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
```

**Fields:**
- `user_id`: Link đến users table
- `employee_id`: Mã nhân viên (unique)
- `branch_id`: Chi nhánh làm việc
- `position`: Vị trí (Dược sĩ, Thu ngân, Kho, ...)
- `department`: Phòng ban
- `hire_date`: Ngày vào làm
- `hometown`: Quê quán
- `id_number`: Số CMND/CCCD
- `emergency_contact`: SĐT người thân
- `emergency_name`: Tên người thân
- `salary`: Lương
- `bank_account`: Số tài khoản
- `bank_name`: Ngân hàng

**Relations:**
- `branch`: Chi nhánh làm việc
- `user`: Thông tin user base

---

### 5. Admin Table
Lưu thông tin specific cho admin.

```sql
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  admin_level INTEGER DEFAULT 1,
  permissions JSON,
  last_activity TIMESTAMP(6),
  is_super_admin BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `user_id`: Link đến users table
- `admin_level`: Cấp độ admin (1=Super Admin, 2=Admin, 3=Moderator)
- `permissions`: Additional permissions (JSON)
- `last_activity`: Lần hoạt động gần nhất
- `is_super_admin`: Flag cho super admin

**Admin Levels:**
1. **Super Admin** - Full access, manage everything
2. **Admin** - Manage products, orders, users
3. **Moderator** - View only, limited edit

---

## Authentication Flow

### 1. Register User

```javascript
POST /api/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone": "+84901234567",
  "full_name": "John Doe",
  "role_id": 3  // 1=admin, 2=staff, 3=customer
}
```

**Process:**
1. Validate input (username, email, password)
2. Check if user exists
3. Hash password with bcrypt
4. **Create user** in `users` table
5. **Create role-specific record** based on `role_id`:
   - If `role_id = 3` → Create record in `customers`
   - If `role_id = 2` → Create record in `staff`
   - If `role_id = 1` → Create record in `admin`
6. Generate JWT token with role info
7. Return user + token

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": 3,
      "role": {
        "id": 3,
        "role_name": "customer"
      },
      "customer": {
        "id": 45,
        "user_id": 123
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

---

### 2. Login

```javascript
POST /api/login
{
  "username": "john_doe",  // or email
  "password": "securepass123"
}
```

**Process:**
1. Find user by username OR email
2. Load all role relations (`role`, `customer`, `staff`, `admin`)
3. Verify password
4. Update `last_login`
5. Generate JWT with role-specific info
6. Return user + token

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "john_doe",
      "role": {
        "role_name": "customer"
      },
      "customer": {
        "id": 45,
        "dob": "1990-01-01",
        "gender": "male"
      }
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

### 3. JWT Token Payload

Token chứa thông tin role-specific để dễ dàng authorization.

**For Customer:**
```json
{
  "userId": 123,
  "username": "john_doe",
  "email": "john@example.com",
  "role_id": 3,
  "role_name": "customer",
  "customer_id": 45
}
```

**For Staff:**
```json
{
  "userId": 456,
  "username": "staff_user",
  "email": "staff@example.com",
  "role_id": 2,
  "role_name": "staff",
  "staff_id": 12,
  "branch_id": 5
}
```

**For Admin:**
```json
{
  "userId": 789,
  "username": "admin_user",
  "email": "admin@example.com",
  "role_id": 1,
  "role_name": "admin",
  "admin_id": 3,
  "is_super_admin": true
}
```

---

## Migration Guide

### Run Migration

Để update database từ schema cũ sang mới, chạy script SQL:

```bash
# Option 1: Via Supabase Dashboard
# - Vào SQL Editor
# - Copy nội dung file scripts/migrate_roles.sql
# - Execute

# Option 2: Via psql (if you have direct access)
psql <your-database-url> -f scripts/migrate_roles.sql
```

**Script sẽ:**
1. ✅ Rename `rolepermissions` → `roles` (preserve data)
2. ✅ Add `description` column to `roles`
3. ✅ Create `staff` table
4. ✅ Create `admin` table
5. ✅ Create indexes
6. ✅ Insert default roles if not exist
7. ✅ Add triggers for `updated_at`

**Sau khi migrate:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart server
npm run dev
```

---

## Usage Examples

### Example 1: Create Customer Account

```javascript
// Register new customer
const result = await register({
  username: "customer1",
  email: "customer1@example.com",
  password: "password123",
  phone: "+84901234567",
  full_name: "Nguyễn Văn A",
  role_id: 3  // Customer
});

// Automatically creates:
// - User record in users table
// - Customer record in customers table
```

---

### Example 2: Create Staff Account

```javascript
// Register new staff
const result = await register({
  username: "staff1",
  email: "staff1@pharmacy.com",
  password: "staffpass123",
  full_name: "Trần Thị B",
  role_id: 2  // Staff
});

// Then update staff details
await prisma.staff.update({
  where: { user_id: result.data.user.id },
  data: {
    employee_id: "NV001",
    branch_id: 1,
    position: "Dược sĩ",
    department: "Bán lẻ",
    hire_date: new Date("2024-01-01"),
    hometown: "Hà Nội",
    id_number: "001234567890",
    salary: 15000000
  }
});
```

---

### Example 3: Create Admin Account

```javascript
// Register new admin
const result = await register({
  username: "admin1",
  email: "admin@pharmacy.com",
  password: "adminpass123",
  full_name: "Admin User",
  role_id: 1  // Admin
});

// Update admin settings
await prisma.admin.update({
  where: { user_id: result.data.user.id },
  data: {
    admin_level: 1,
    is_super_admin: true,
    permissions: {
      manage_users: true,
      manage_products: true,
      manage_orders: true,
      view_reports: true
    }
  }
});
```

---

### Example 4: Get User with Role Info

```javascript
// Get current user
const user = await prisma.users.findUnique({
  where: { id: userId },
  include: {
    role: true,
    customer: true,
    staff: {
      include: {
        branch: true
      }
    },
    admin: true
  }
});

// Check role and access profile
if (user.role.role_name === 'customer') {
  console.log('Customer ID:', user.customer.id);
  console.log('DOB:', user.customer.dob);
}

if (user.role.role_name === 'staff') {
  console.log('Employee ID:', user.staff.employee_id);
  console.log('Branch:', user.staff.branch.name);
}

if (user.role.role_name === 'admin') {
  console.log('Admin Level:', user.admin.admin_level);
  console.log('Is Super Admin:', user.admin.is_super_admin);
}
```

---

## Authorization Middleware

### Check Role

```javascript
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role_name;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập'
      });
    }

    next();
  };
};

// Usage:
router.post('/admin/users',
  authenticateToken,
  requireRole(['admin']),
  createUser
);

router.get('/staff/orders',
  authenticateToken,
  requireRole(['admin', 'staff']),
  getOrders
);
```

---

## Best Practices

### 1. Always Use Transactions
Khi tạo user, luôn tạo role-specific record trong cùng transaction:

```javascript
const user = await prisma.$transaction(async (tx) => {
  const newUser = await tx.users.create({ ... });

  if (role_id === 3) {
    await tx.customers.create({ user_id: newUser.id });
  }

  return tx.users.findUnique({
    where: { id: newUser.id },
    include: { role: true, customer: true }
  });
});
```

### 2. Include Role Relations
Khi query user, luôn include role relations:

```javascript
include: {
  role: true,
  customer: true,
  staff: { include: { branch: true } },
  admin: true
}
```

### 3. Token Contains Role Info
JWT token nên chứa `role_id`, `role_name` và ID của role-specific record:
- `customer_id` for customers
- `staff_id` + `branch_id` for staff
- `admin_id` + `is_super_admin` for admins

### 4. Cascade Deletes
Khi xóa user, tự động xóa role-specific record (đã set ON DELETE CASCADE).

---

## Testing

### Test Create Customer

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_customer",
    "email": "customer@test.com",
    "password": "password123",
    "role_id": 3
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_customer",
    "password": "password123"
  }'
```

### Test Get Current User

```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Error: Role không hợp lệ
**Cause:** `role_id` không tồn tại trong roles table

**Fix:**
```sql
-- Check existing roles
SELECT * FROM roles;

-- Insert missing roles
INSERT INTO roles (role_name) VALUES ('admin'), ('staff'), ('customer');
```

### Error: User đã tồn tại
**Cause:** Username, email hoặc phone đã được sử dụng

**Fix:** Sử dụng username/email/phone khác

### Schema out of sync
**Cause:** Prisma schema không khớp với database

**Fix:**
```bash
npx prisma db pull  # Pull schema from DB
npx prisma generate # Regenerate client
```

---

## Summary

✅ **users** - Base table (username, email, password, role_id)
✅ **roles** - Role definitions (admin, staff, customer)
✅ **customers** - Customer-specific data
✅ **staff** - Staff-specific data (employee_id, branch, salary, ...)
✅ **admin** - Admin-specific data (level, permissions)

Hệ thống được thiết kế để:
- Dễ mở rộng (thêm role mới)
- Tách biệt concerns (authentication vs profile data)
- Maintain data integrity (transactions, foreign keys)
- Flexible authorization (JWT contains role info)
