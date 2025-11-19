-- Migration script to safely rename rolepermissions to roles and add new tables
-- This preserves existing data

BEGIN;

-- Step 1: Rename rolepermissions table to roles
ALTER TABLE IF EXISTS rolepermissions RENAME TO roles;

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

-- Step 7: Insert default roles if they don't exist
INSERT INTO roles (role_name, description, created_at, updated_at)
VALUES
  ('admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff', 'Staff member with limited access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customer', 'Customer with basic access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (role_name) DO NOTHING;

-- Step 8: Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Apply triggers
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

COMMIT;

-- Display results
SELECT 'Migration completed successfully!' as status;
SELECT * FROM roles;
