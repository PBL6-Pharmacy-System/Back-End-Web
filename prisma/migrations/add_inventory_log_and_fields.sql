-- Migration: Add inventory_log table and update branchinventory
-- Date: 2025-01-20
-- Description: Adds inventory logging functionality and min/max stock fields

-- 1. Add min_stock and max_stock columns to branchinventory
ALTER TABLE branchinventory
ADD COLUMN IF NOT EXISTS min_stock INT,
ADD COLUMN IF NOT EXISTS max_stock INT;

-- 2. Create inventory_log table
CREATE TABLE IF NOT EXISTS "inventoryLog" (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  unit_id INT,
  quantity INT NOT NULL,
  type VARCHAR(20) NOT NULL,
  note TEXT,
  created_by INT,
  date TIMESTAMP(6) DEFAULT NOW(),
  created_at TIMESTAMP(6) DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_inventory_log_branch
    FOREIGN KEY (branch_id)
    REFERENCES branches(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_inventory_log_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_inventory_log_unit
    FOREIGN KEY (unit_id)
    REFERENCES productunits(id)
    ON DELETE NO ACTION,

  CONSTRAINT fk_inventory_log_user
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE NO ACTION,

  -- Composite foreign key to branchinventory
  CONSTRAINT fk_inventory_log_branchinventory
    FOREIGN KEY (branch_id, product_id)
    REFERENCES branchinventory(branch_id, product_id)
    ON DELETE CASCADE
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_log_branch ON "inventoryLog"(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_product ON "inventoryLog"(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_date ON "inventoryLog"(date);
CREATE INDEX IF NOT EXISTS idx_inventory_log_type ON "inventoryLog"(type);

-- 4. Add comments for documentation
COMMENT ON TABLE "inventoryLog" IS 'Logs all inventory movements (imports, exports, adjustments) for auditing and reporting';
COMMENT ON COLUMN "inventoryLog".type IS 'Type of inventory movement: IMPORT, EXPORT, or ADJUSTMENT';
COMMENT ON COLUMN "inventoryLog".quantity IS 'Quantity moved (positive for imports, negative for exports)';
COMMENT ON COLUMN branchinventory.min_stock IS 'Minimum stock threshold for low stock alerts';
COMMENT ON COLUMN branchinventory.max_stock IS 'Maximum stock threshold for overstock alerts';

-- 5. Enable Row Level Security (if using Supabase)
ALTER TABLE "inventoryLog" ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (adjust based on your security needs)
-- Allow authenticated users to read inventory logs
CREATE POLICY "Allow authenticated users to read inventory logs"
ON "inventoryLog"
FOR SELECT
TO authenticated
USING (true);

-- Allow admin and staff to create inventory logs
CREATE POLICY "Allow admin/staff to create inventory logs"
ON "inventoryLog"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid()
    AND roles.role_name IN ('admin', 'staff')
  )
);

-- 7. Add check constraints
ALTER TABLE "inventoryLog"
ADD CONSTRAINT check_inventory_log_type
CHECK (type IN ('IMPORT', 'EXPORT', 'ADJUSTMENT'));

ALTER TABLE branchinventory
ADD CONSTRAINT check_min_max_stock
CHECK (min_stock IS NULL OR max_stock IS NULL OR min_stock < max_stock);
