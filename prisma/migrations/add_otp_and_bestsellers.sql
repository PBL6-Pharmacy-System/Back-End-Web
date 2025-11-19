-- Migration: Add OTP authentication and best sellers tracking

-- Table for OTP verification
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  attempts INT DEFAULT 0
);

CREATE INDEX idx_otp_phone ON otp_verifications(phone);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Add sold_count to products table for tracking best sellers
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_products_sold_count ON products(sold_count DESC);

-- Add payment_status to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

-- Create table for best sellers cache (optional, for performance)
CREATE TABLE IF NOT EXISTS best_sellers_cache (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  sold_count INT NOT NULL,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rank)
);

CREATE INDEX idx_bestsellers_rank ON best_sellers_cache(rank);

COMMENT ON TABLE otp_verifications IS 'Store OTP codes for customer phone verification';
COMMENT ON TABLE best_sellers_cache IS 'Cache top 10 best selling products for performance';
