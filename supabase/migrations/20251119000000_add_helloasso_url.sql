-- Migration: Add HelloAsso URL field to networks table
-- Description: Adds a column to store HelloAsso donation widget URL for French associations
-- Date: 2025-11-19

-- Add helloasso_url column to networks table
ALTER TABLE networks
ADD COLUMN IF NOT EXISTS helloasso_url TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN networks.helloasso_url IS 'HelloAsso widget URL for embedding donation forms. Used by French associations to collect donations through HelloAsso platform.';

-- Create index for networks that have HelloAsso configured (for faster filtering)
CREATE INDEX IF NOT EXISTS idx_networks_helloasso_url
ON networks (id)
WHERE helloasso_url IS NOT NULL;

-- Note: No RLS policy changes needed as helloasso_url follows same access patterns as other network fields
-- Admins can edit via network settings, all members can view when enabled as a tab
