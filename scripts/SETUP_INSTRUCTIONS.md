# 🚀 Setup Instructions - User & Role System

## Prerequisites

✅ Database already exists with existing data
✅ `rolepermissions` table exists with data
✅ Prisma schema has been updated

## Step-by-Step Migration & Seeding

### Step 1: Run Migration SQL (⚠️ IMPORTANT - Run this first!)

The migration script will safely rename `rolepermissions` → `roles` and create new tables.

**Option A: Via Supabase Dashboard (Recommended)**

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the ENTIRE content from `scripts/migrate_roles.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)
8. Wait for "Migration completed successfully!" message

**Option B: Via psql (If you have direct database access)**

```bash
# Get your database connection string from Supabase
# Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

psql "YOUR_CONNECTION_STRING" -f scripts/migrate_roles.sql
```

**Expected Output:**
```
BEGIN
ALTER TABLE
ALTER TABLE
CREATE TABLE
CREATE TABLE
...
COMMIT
           status
-----------------------------
 Migration completed successfully!

 id | role_name | description
----+----------+-------------------------------------
  1 | admin    | Administrator with full system access
  2 | staff    | Staff member with limited access
  3 | customer | Customer with basic access
```

---

### Step 2: Verify Migration Success

Run this SQL query to check if tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('roles', 'staff', 'admin');
```

**Expected Output:**
```
 table_name
------------
 roles
 staff
 admin
```

Also check roles data:

```sql
SELECT * FROM roles;
```

**Expected Output:**
```
 id | role_name | description
----+----------+-------------------------------------
  1 | admin    | Administrator with full system access
  2 | staff    | Staff member with limited access
  3 | customer | Customer with basic access
```

---

### Step 3: Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

### Step 4: Run Seed Script

Now create sample users for testing:

```bash
node scripts/seed.js
```

**Expected Output:**
```
🌱 Starting database seeding...

✅ Found 3 roles in database

🔐 Test account credentials:
   Username: [see below]
   Password: password123

👑 Creating Admin users...
   ✅ Created: admin (Super Admin)
   ✅ Created: moderator (Moderator)

👨‍💼 Creating Staff users...
   ✅ Created: pharmacist1 (Dược sĩ - NV001)
   ✅ Created: cashier1 (Thu ngân - NV002)
   ✅ Created: warehouse1 (Quản lý kho - NV003)

👥 Creating Customer users...
   ✅ Created: customer1 (female)
   ✅ Created: customer2 (male)
   ✅ Created: customer3 (female)
   ✅ Created: vip_customer (VIP customer)

📊 Seeding Summary:
   ✅ 2 Admin users created
   ✅ 3 Staff users created
   ✅ 4 Customer users created
   ✅ Total: 9 users

🔑 Login Credentials:
┌─────────────────┬──────────────────────────────┬──────────────┐
│ Username        │ Email                        │ Role         │
├─────────────────┼──────────────────────────────┼──────────────┤
│ admin           │ admin@pharmacy.com           │ Super Admin  │
│ moderator       │ moderator@pharmacy.com       │ Moderator    │
│ pharmacist1     │ pharmacist1@pharmacy.com     │ Dược sĩ      │
│ cashier1        │ cashier1@pharmacy.com        │ Thu ngân     │
│ warehouse1      │ warehouse1@pharmacy.com      │ Quản lý kho  │
│ customer1       │ customer1@example.com        │ Customer     │
│ customer2       │ customer2@example.com        │ Customer     │
│ customer3       │ customer3@example.com        │ Customer     │
│ vip_customer    │ vip@example.com              │ VIP Customer │
└─────────────────┴──────────────────────────────┴──────────────┘

🔐 Password for all accounts: password123

✅ Database seeding completed successfully!
```

---

### Step 5: Restart Server

```bash
# Kill existing server
pkill -f "node app.js"

# Or if using npm run dev
# Ctrl+C to stop, then restart:

npm run dev
```

---

### Step 6: Test Authentication

**Test 1: Login as Admin**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@pharmacy.com",
      "role": {
        "role_name": "admin"
      },
      "admin": {
        "id": 1,
        "admin_level": 1,
        "is_super_admin": true,
        "permissions": {
          "manage_users": true,
          "manage_products": true,
          ...
        }
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Test 2: Login as Staff**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "pharmacist1",
    "password": "password123"
  }'
```

**Expected Token Payload:**
```json
{
  "userId": 3,
  "username": "pharmacist1",
  "email": "pharmacist1@pharmacy.com",
  "role_id": 2,
  "role_name": "staff",
  "staff_id": 1,
  "branch_id": 1
}
```

**Test 3: Login as Customer**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "customer1",
    "password": "password123"
  }'
```

**Expected Token Payload:**
```json
{
  "userId": 6,
  "username": "customer1",
  "email": "customer1@example.com",
  "role_id": 3,
  "role_name": "customer",
  "customer_id": 1
}
```

**Test 4: Get Current User (with Token)**

```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_LOGIN"
```

---

## Troubleshooting

### ❌ Error: "Table roles already exists"

**Cause:** Migration already ran successfully.

**Fix:** Skip migration, just run seeding:
```bash
node scripts/seed.js
```

---

### ❌ Error: "Some users already exist"

**Cause:** Seed script already ran before.

**Fix:** Delete test users first:

```sql
-- Delete all test users
DELETE FROM users WHERE username IN (
  'admin', 'moderator',
  'pharmacist1', 'cashier1', 'warehouse1',
  'customer1', 'customer2', 'customer3', 'vip_customer'
);
```

Then run seed again:
```bash
node scripts/seed.js
```

---

### ❌ Error: "Cannot find module @prisma/client"

**Fix:**
```bash
npm install @prisma/client
npx prisma generate
```

---

### ❌ Error: "Role không hợp lệ" when calling register endpoint

**Cause:** Roles table is empty.

**Fix:** Run migration script again to insert default roles, or manually:

```sql
INSERT INTO roles (role_name, description) VALUES
  ('admin', 'Administrator with full system access'),
  ('staff', 'Staff member with limited access'),
  ('customer', 'Customer with basic access')
ON CONFLICT (role_name) DO NOTHING;
```

---

### ⚠️ Warning: "No branches found" during seeding

**Cause:** Branches table is empty.

**Impact:** Staff users will be created without branch assignment (`branch_id = null`).

**Fix (Optional):** Create sample branches first:

```sql
INSERT INTO branches (name, address, phone, is_active)
VALUES
  ('Chi nhánh Hà Nội', '123 Đường Láng, Đống Đa, Hà Nội', '+84243111111', true),
  ('Chi nhánh TP.HCM', '456 Đường Lê Lợi, Quận 1, TP.HCM', '+84283111111', true);
```

Then run seed script again.

---

## Verification Checklist

- [ ] Migration SQL ran successfully
- [ ] Table `roles` exists with 3 rows (admin, staff, customer)
- [ ] Table `staff` exists (may be empty before seeding)
- [ ] Table `admin` exists (may be empty before seeding)
- [ ] Prisma client regenerated successfully
- [ ] Seed script ran successfully
- [ ] 9 test users created (2 admin, 3 staff, 4 customers)
- [ ] Server restarted successfully
- [ ] Admin login works
- [ ] Staff login works
- [ ] Customer login works
- [ ] JWT token contains role-specific IDs (`customer_id`, `staff_id`, `admin_id`)
- [ ] Get current user endpoint works

---

## Sample Data Created

### Admin Users (2)
| Username  | Email                  | Role       | Admin Level | Super Admin |
|-----------|------------------------|------------|-------------|-------------|
| admin     | admin@pharmacy.com     | admin      | 1           | ✅ Yes       |
| moderator | moderator@pharmacy.com | admin      | 3           | ❌ No        |

### Staff Users (3)
| Username    | Email                    | Role  | Employee ID | Position      | Salary       |
|-------------|--------------------------|-------|-------------|---------------|--------------|
| pharmacist1 | pharmacist1@pharmacy.com | staff | NV001       | Dược sĩ       | 15,000,000   |
| cashier1    | cashier1@pharmacy.com    | staff | NV002       | Thu ngân      | 10,000,000   |
| warehouse1  | warehouse1@pharmacy.com  | staff | NV003       | Quản lý kho   | 12,000,000   |

### Customer Users (4)
| Username     | Email                 | Role     | Gender | DOB        |
|--------------|-----------------------|----------|--------|------------|
| customer1    | customer1@example.com | customer | female | 1990-05-15 |
| customer2    | customer2@example.com | customer | male   | 1985-12-20 |
| customer3    | customer3@example.com | customer | female | 1995-08-10 |
| vip_customer | vip@example.com       | customer | male   | 1980-03-25 |

**All accounts use password:** `password123`

---

## Next Steps After Setup

1. **Update existing users** (if any) to have proper role-specific records:
   ```sql
   -- Find users without customer/staff/admin records
   SELECT u.id, u.username, u.role_id
   FROM users u
   LEFT JOIN customers c ON u.id = c.user_id
   LEFT JOIN staff s ON u.id = s.user_id
   LEFT JOIN admin a ON u.id = a.user_id
   WHERE c.id IS NULL AND s.id IS NULL AND a.id IS NULL;
   ```

2. **Test authorization middleware** with different role endpoints

3. **Update frontend** to handle new token payload structure

4. **Create staff management endpoints** (update staff info, salary, etc.)

5. **Create admin management endpoints** (manage permissions, admin levels)

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Rename roles back to rolepermissions
ALTER TABLE roles RENAME TO rolepermissions;

-- Remove description column
ALTER TABLE rolepermissions DROP COLUMN IF EXISTS description;

COMMIT;
```

Then:
```bash
git checkout prisma/schema.prisma
npx prisma generate
```

---

✅ **Setup complete! Your User & Role system is ready to use.**
