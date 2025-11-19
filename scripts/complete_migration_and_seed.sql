-- =============================================================================
-- Complete Migration & Seed Script
-- This script will:
--   1. Rename rolepermissions -> roles
--   2. Create staff and admin tables
--   3. Insert default roles
--   4. Create sample users for testing (admin, staff, customers)
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: MIGRATION - Rename and Create Tables
-- =============================================================================

-- Step 1: Rename rolepermissions table to roles (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rolepermissions') THEN
        ALTER TABLE rolepermissions RENAME TO roles;
        RAISE NOTICE 'Table rolepermissions renamed to roles';
    ELSE
        RAISE NOTICE 'Table rolepermissions does not exist or already renamed';
    END IF;
END $$;

-- Step 2: Add description column if it doesn't exist
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 3: Create staff table if not exists
CREATE TABLE IF NOT EXISTS staff (
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

  CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id)
    REFERENCES branches(id) ON DELETE SET NULL
);

-- Step 4: Create admin table if not exists
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  admin_level INTEGER DEFAULT 1,
  permissions JSON,
  last_activity TIMESTAMP(6),
  is_super_admin BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_admin_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Step 5: Create indexes for staff
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);

-- Step 6: Create indexes for admin
CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_level ON admin(admin_level);

-- Step 7: Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Apply triggers
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 2: INSERT DEFAULT ROLES
-- =============================================================================

INSERT INTO roles (role_name, description, created_at, updated_at)
VALUES
  ('admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff', 'Staff member with limited access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customer', 'Customer with basic access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (role_name) DO UPDATE
  SET description = EXCLUDED.description;

-- =============================================================================
-- PART 3: CREATE SAMPLE DATA
-- =============================================================================

-- Note: Password hash for "password123" using bcrypt (rounds=10)
-- This is generated from: bcrypt.hash('password123', 10)
-- You may need to regenerate this hash using your actual bcrypt implementation

-- =============================================================================
-- 3.1: Create Admin Users
-- =============================================================================

-- Admin 1: Super Admin
INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
VALUES (
  'admin',
  'admin@pharmacy.com',
  '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
  '+84901111111',
  'Nguyễn Văn Admin',
  1,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING
RETURNING id;

-- Get the admin user_id for admin record
DO $$
DECLARE
  admin_user_id INTEGER;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE username = 'admin';

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin (user_id, admin_level, is_super_admin, permissions, notes, created_at, updated_at)
    VALUES (
      admin_user_id,
      1,
      true,
      '{"manage_users": true, "manage_products": true, "manage_orders": true, "manage_branches": true, "view_reports": true, "manage_promotions": true}'::json,
      'Super Admin - Full system access',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Admin 2: Moderator
INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
VALUES (
  'moderator',
  'moderator@pharmacy.com',
  '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
  '+84901111112',
  'Trần Thị Moderator',
  1,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

DO $$
DECLARE
  moderator_user_id INTEGER;
BEGIN
  SELECT id INTO moderator_user_id FROM users WHERE username = 'moderator';

  IF moderator_user_id IS NOT NULL THEN
    INSERT INTO admin (user_id, admin_level, is_super_admin, permissions, notes, created_at, updated_at)
    VALUES (
      moderator_user_id,
      3,
      false,
      '{"manage_products": true, "view_reports": true}'::json,
      'Moderator - Limited admin access',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- 3.2: Create Staff Users
-- =============================================================================

-- Get first branch_id (if exists)
DO $$
DECLARE
  first_branch_id INTEGER;
  staff1_user_id INTEGER;
  staff2_user_id INTEGER;
  staff3_user_id INTEGER;
BEGIN
  -- Get first branch
  SELECT id INTO first_branch_id FROM branches LIMIT 1;

  -- Staff 1: Pharmacist
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'pharmacist1',
    'pharmacist1@pharmacy.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84902222221',
    'Lê Văn Dược Sĩ',
    2,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO staff1_user_id;

  IF staff1_user_id IS NULL THEN
    SELECT id INTO staff1_user_id FROM users WHERE username = 'pharmacist1';
  END IF;

  IF staff1_user_id IS NOT NULL THEN
    INSERT INTO staff (user_id, employee_id, branch_id, position, department, hire_date, hometown, id_number, emergency_contact, emergency_name, salary, bank_account, bank_name, is_active, notes, created_at, updated_at)
    VALUES (
      staff1_user_id,
      'NV001',
      first_branch_id,
      'Dược sĩ',
      'Bán lẻ',
      '2023-01-15',
      'Hà Nội',
      '001234567890',
      '+84987654321',
      'Lê Thị Mẹ',
      15000000.00,
      '1234567890',
      'Vietcombank',
      true,
      'Dược sĩ chính - Chi nhánh Hà Nội',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Staff 2: Cashier
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'cashier1',
    'cashier1@pharmacy.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84902222222',
    'Phạm Thị Thu Ngân',
    2,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO staff2_user_id;

  IF staff2_user_id IS NULL THEN
    SELECT id INTO staff2_user_id FROM users WHERE username = 'cashier1';
  END IF;

  IF staff2_user_id IS NOT NULL THEN
    INSERT INTO staff (user_id, employee_id, branch_id, position, department, hire_date, hometown, id_number, emergency_contact, emergency_name, salary, bank_account, bank_name, is_active, notes, created_at, updated_at)
    VALUES (
      staff2_user_id,
      'NV002',
      first_branch_id,
      'Thu ngân',
      'Bán lẻ',
      '2023-03-20',
      'Hồ Chí Minh',
      '001234567891',
      '+84987654322',
      'Phạm Văn Cha',
      10000000.00,
      '9876543210',
      'Techcombank',
      true,
      'Thu ngân ca sáng',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Staff 3: Warehouse Manager
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'warehouse1',
    'warehouse1@pharmacy.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84902222223',
    'Hoàng Văn Kho',
    2,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO staff3_user_id;

  IF staff3_user_id IS NULL THEN
    SELECT id INTO staff3_user_id FROM users WHERE username = 'warehouse1';
  END IF;

  IF staff3_user_id IS NOT NULL THEN
    INSERT INTO staff (user_id, employee_id, branch_id, position, department, hire_date, hometown, id_number, emergency_contact, emergency_name, salary, bank_account, bank_name, is_active, notes, created_at, updated_at)
    VALUES (
      staff3_user_id,
      'NV003',
      first_branch_id,
      'Quản lý kho',
      'Kho',
      '2022-11-01',
      'Đà Nẵng',
      '001234567892',
      '+84987654323',
      'Hoàng Thị Vợ',
      12000000.00,
      '5555555555',
      'ACB',
      true,
      'Quản lý kho chính',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- 3.3: Create Customer Users
-- =============================================================================

DO $$
DECLARE
  customer1_user_id INTEGER;
  customer2_user_id INTEGER;
  customer3_user_id INTEGER;
  customer4_user_id INTEGER;
BEGIN
  -- Customer 1
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'customer1',
    'customer1@example.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84903333331',
    'Nguyễn Thị Khách Hàng',
    3,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO customer1_user_id;

  IF customer1_user_id IS NULL THEN
    SELECT id INTO customer1_user_id FROM users WHERE username = 'customer1';
  END IF;

  IF customer1_user_id IS NOT NULL THEN
    INSERT INTO customers (user_id, dob, gender, address, created_at, updated_at)
    VALUES (
      customer1_user_id,
      '1990-05-15',
      'female',
      '123 Đường Lê Lợi, Quận 1, TP.HCM',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Customer 2
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'customer2',
    'customer2@example.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84903333332',
    'Trần Văn Mua Hàng',
    3,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO customer2_user_id;

  IF customer2_user_id IS NULL THEN
    SELECT id INTO customer2_user_id FROM users WHERE username = 'customer2';
  END IF;

  IF customer2_user_id IS NOT NULL THEN
    INSERT INTO customers (user_id, dob, gender, address, created_at, updated_at)
    VALUES (
      customer2_user_id,
      '1985-12-20',
      'male',
      '456 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Customer 3
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'customer3',
    'customer3@example.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84903333333',
    'Lê Thị Thường Xuyên',
    3,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO customer3_user_id;

  IF customer3_user_id IS NULL THEN
    SELECT id INTO customer3_user_id FROM users WHERE username = 'customer3';
  END IF;

  IF customer3_user_id IS NOT NULL THEN
    INSERT INTO customers (user_id, dob, gender, address, created_at, updated_at)
    VALUES (
      customer3_user_id,
      '1995-08-10',
      'female',
      '789 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Customer 4: VIP
  INSERT INTO users (username, email, password_hash, phone, full_name, role_id, is_active, is_verified, created_at, updated_at)
  VALUES (
    'vip_customer',
    'vip@example.com',
    '$2b$10$rKjHVJZ7XZqY5LqJZ5YJ0OYKqQ5xZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Replace with actual bcrypt hash
    '+84903333334',
    'Phạm Văn VIP',
    3,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO customer4_user_id;

  IF customer4_user_id IS NULL THEN
    SELECT id INTO customer4_user_id FROM users WHERE username = 'vip_customer';
  END IF;

  IF customer4_user_id IS NOT NULL THEN
    INSERT INTO customers (user_id, dob, gender, address, created_at, updated_at)
    VALUES (
      customer4_user_id,
      '1980-03-25',
      'male',
      '321 Đường Pasteur, Quận 3, TP.HCM',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Display Results
-- =============================================================================

SELECT '✅ Migration completed successfully!' as status;

SELECT '📊 Roles created:' as info;
SELECT id, role_name, description FROM roles ORDER BY id;

SELECT '👑 Admin users created:' as info;
SELECT u.id, u.username, u.email, u.role_id, a.admin_level, a.is_super_admin
FROM users u
JOIN admin a ON u.id = a.user_id
ORDER BY u.id;

SELECT '👨‍💼 Staff users created:' as info;
SELECT u.id, u.username, u.email, u.role_id, s.employee_id, s.position
FROM users u
JOIN staff s ON u.id = s.user_id
ORDER BY u.id;

SELECT '👥 Customer users created:' as info;
SELECT u.id, u.username, u.email, u.role_id, c.gender
FROM users u
JOIN customers c ON u.id = c.user_id
WHERE u.username LIKE 'customer%' OR u.username LIKE 'vip%'
ORDER BY u.id;

-- =============================================================================
-- IMPORTANT NOTES
-- =============================================================================

/*

⚠️  PASSWORD HASH NOTICE:
The password hashes in this script are PLACEHOLDERS and will NOT work for login!

You MUST replace them with actual bcrypt hashes generated by your application.

To generate actual password hashes, run this Node.js script:

```javascript
import bcrypt from 'bcrypt';

const password = 'password123';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

Or use the seed.js script instead:
```bash
node scripts/seed.js
```

The seed.js script will properly hash passwords using your application's bcrypt implementation.

=============================================================================

📝 TEST CREDENTIALS (after running seed.js):
Username: admin, moderator, pharmacist1, cashier1, warehouse1, customer1, customer2, customer3, vip_customer
Password: password123

=============================================================================

*/
