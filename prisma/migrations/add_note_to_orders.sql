-- Migration: Add note field to orders table
-- Created: 2025-11-27

-- Add note column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add comment
COMMENT ON COLUMN orders.note IS 'Ghi chú của đơn hàng';
