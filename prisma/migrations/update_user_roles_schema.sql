-- Migration: Update User Roles Schema
-- Rename rolepermissions -> roles
-- Add staff and admin tables

-- ========================================
-- STEP 1: Rename rolepermissions to roles
-- ========================================

ALTER TABLE rolepermissions RENAME TO roles;

-- Update comments
COMMENT ON TABLE roles IS 'Roles table - stores role definitions (admin, staff, customer)';

-- ========================================
-- STEP 2: Create staff table
-- ========================================

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

  -- Foreign keys
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id)
    REFERENCES branches(id) ON DELETE SET NULL
);

-- Indexes for staff
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_branch_id ON staff(branch_id);
CREATE INDEX idx_staff_employee_id ON staff(employee_id);

COMMENT ON TABLE staff IS 'Staff information table - stores employee-specific data';
COMMENT ON COLUMN staff.employee_id IS 'Employee ID - unique identifier for staff';
COMMENT ON COLUMN staff.branch_id IS 'Branch where staff works';
COMMENT ON COLUMN staff.hometown IS 'Hometown/Place of origin';
COMMENT ON COLUMN staff.id_number IS 'National ID number or passport';

-- ========================================
-- STEP 3: Create admin table
-- ========================================

CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  admin_level INTEGER DEFAULT 1, -- 1: Super Admin, 2: Admin, 3: Moderator
  permissions JSON, -- Additional permissions if needed
  last_activity TIMESTAMP(6),
  is_super_admin BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for admin
CREATE INDEX idx_admin_user_id ON admin(user_id);
CREATE INDEX idx_admin_level ON admin(admin_level);

COMMENT ON TABLE admin IS 'Admin information table - stores admin-specific data and permissions';
COMMENT ON COLUMN admin.admin_level IS '1: Super Admin, 2: Admin, 3: Moderator';
COMMENT ON COLUMN admin.is_super_admin IS 'Flag for super admin with full access';

-- ========================================
-- STEP 4: Insert default roles if not exist
-- ========================================

INSERT INTO roles (role_name, created_at, updated_at)
VALUES
  ('admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (role_name) DO NOTHING;

-- ========================================
-- STEP 5: Add triggers for updated_at
-- ========================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to staff table
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to admin table
DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 6: Update existing data (if needed)
-- ========================================

-- Note: You may need to manually migrate existing data
-- based on role_id in users table

COMMENT ON SCHEMA public IS 'Updated schema with roles, staff, and admin tables';
