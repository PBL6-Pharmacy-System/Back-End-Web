# 🚀 Migration Guide - User & Role System

## Quick Start

Để migrate database từ schema cũ sang schema mới với roles, staff, admin:

### Bước 1: Run Migration SQL

**Option A: Via Supabase Dashboard (Recommended)**
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `scripts/migrate_roles.sql`
5. Paste vào SQL Editor
6. Click **Run** hoặc nhấn `Ctrl+Enter`
7. Kiểm tra kết quả: "Migration completed successfully!"

**Option B: Via psql (Nếu có direct access)**
```bash
psql <your-database-connection-string> -f scripts/migrate_roles.sql
```

---

### Bước 2: Verify Migration

Kiểm tra các tables đã được tạo:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('roles', 'staff', 'admin');

-- Check roles data
SELECT * FROM roles;

-- Should return:
-- id | role_name | description | created_at | updated_at
-- 1  | admin     | ...         | ...        | ...
-- 2  | staff     | ...         | ...        | ...
-- 3  | customer  | ...         | ...        | ...
```

---

### Bước 3: Regenerate Prisma Client

```bash
cd /Users/ert_macbook_178/Back-End-Web

# Generate Prisma client from updated schema
npx prisma generate

# Output should show: ✔ Generated Prisma Client
```

---

### Bước 4: Restart Server

```bash
# Kill existing process
pkill -f "node app.js"

# Start server
npm run dev

# Or if using pm2:
pm2 restart all
```

---

### Bước 5: Test Authentication

**Test 1: Register Customer**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_customer",
    "email": "customer@test.com",
    "password": "password123",
    "full_name": "Test Customer",
    "role_id": 3
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": ...,
      "username": "test_customer",
      "role": {
        "role_name": "customer"
      },
      "customer": {
        "id": ...,
        "user_id": ...
      }
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

**Test 2: Login**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_customer",
    "password": "password123"
  }'
```

**Test 3: Get Current User**
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>"
```

---

## Migration Details

### Tables Created/Modified

✅ **roles** (renamed from rolepermissions)
- Preserves existing data
- Adds `description` column

✅ **staff** (new table)
- `employee_id`, `branch_id`, `position`, `department`
- `hometown`, `id_number`, `salary`, `bank_account`
- Foreign keys to `users` and `branches`

✅ **admin** (new table)
- `admin_level`, `permissions`, `is_super_admin`
- Foreign key to `users`

### Schema Changes

**Before:**
```
users (role_id) → rolepermissions
customers (user_id) → users
```

**After:**
```
users (role_id) → roles
├─ customers (user_id) → users  (if role_id = 3)
├─ staff (user_id) → users      (if role_id = 2)
└─ admin (user_id) → users      (if role_id = 1)
```

---

## Rollback (If Needed)

Nếu cần rollback migration:

```sql
BEGIN;

-- Rollback Step 1: Drop new tables
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Rollback Step 2: Rename roles back to rolepermissions
ALTER TABLE roles RENAME TO rolepermissions;

-- Rollback Step 3: Remove description column
ALTER TABLE rolepermissions DROP COLUMN IF EXISTS description;

COMMIT;
```

Sau đó:
```bash
# Revert schema changes
git checkout prisma/schema.prisma

# Regenerate client
npx prisma generate
```

---

## Troubleshooting

### Issue: "Table roles already exists"
**Solution:** Migration đã chạy rồi. Skip migration, chỉ cần regenerate Prisma client.

```bash
npx prisma generate
npm run dev
```

### Issue: "Cannot find module @prisma/client"
**Solution:**
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: "Error: P2002 Unique constraint failed"
**Solution:** Username/email đã tồn tại. Dùng username/email khác khi test.

### Issue: "Role không hợp lệ"
**Solution:** Roles chưa được insert. Run migration lại hoặc insert manually:

```sql
INSERT INTO roles (role_name, description) VALUES
  ('admin', 'Administrator'),
  ('staff', 'Staff member'),
  ('customer', 'Customer')
ON CONFLICT (role_name) DO NOTHING;
```

---

## Verification Checklist

- [ ] Migration SQL đã chạy thành công
- [ ] Table `roles` tồn tại và có 3 rows
- [ ] Table `staff` tồn tại (empty initially)
- [ ] Table `admin` tồn tại (empty initially)
- [ ] Prisma client đã được regenerate
- [ ] Server restart thành công
- [ ] Register customer thành công
- [ ] Login thành công
- [ ] Token chứa `customer_id`
- [ ] Get current user thành công

---

## Next Steps

Sau khi migration thành công:

1. **Create Admin Accounts**
   ```javascript
   POST /api/register
   {
     "username": "admin",
     "email": "admin@pharmacy.com",
     "password": "secure_password",
     "role_id": 1
   }
   ```

2. **Create Staff Accounts & Update Info**
   ```javascript
   // Register staff
   POST /api/register { role_id: 2 }

   // Update staff details
   PUT /api/staff/:id
   {
     "employee_id": "NV001",
     "branch_id": 1,
     "position": "Dược sĩ",
     "salary": 15000000
   }
   ```

3. **Test Authorization**
   - Admin có thể access admin routes
   - Staff có thể access staff routes
   - Customer chỉ access customer routes

4. **Update Frontend**
   - Token payload mới có `customer_id`, `staff_id`, `admin_id`
   - Update role checking logic
   - Update UI based on role

---

## Support

Nếu gặp vấn đề:
1. Check server logs: `pm2 logs` hoặc console output
2. Check database logs in Supabase Dashboard
3. Verify Prisma schema matches database: `npx prisma db pull`
4. Read full documentation: `USER_ROLE_SYSTEM_DOCUMENTATION.md`

---

✅ **Migration hoàn tất! Hệ thống User & Role đã sẵn sàng sử dụng.**
