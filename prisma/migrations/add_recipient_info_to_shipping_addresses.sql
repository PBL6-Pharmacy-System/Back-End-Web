-- Migration: Add recipient name and phone to shipping addresses
-- Created: 2025-11-27

-- Add recipient_name and recipient_phone columns to shippingaddresses table
ALTER TABLE shippingaddresses 
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);

-- Update existing records to use customer's name and phone if null
UPDATE shippingaddresses sa
SET 
  recipient_name = COALESCE(sa.recipient_name, u.full_name),
  recipient_phone = COALESCE(sa.recipient_phone, u.phone)
FROM customers c
JOIN users u ON c.user_id = u.id
WHERE sa.customer_id = c.id
  AND (sa.recipient_name IS NULL OR sa.recipient_phone IS NULL);

-- Add comments
COMMENT ON COLUMN shippingaddresses.recipient_name IS 'Tên người nhận hàng';
COMMENT ON COLUMN shippingaddresses.recipient_phone IS 'Số điện thoại người nhận';
