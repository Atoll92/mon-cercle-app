-- Migration to add tracking for admin welcome emails
-- This allows us to track which network admins have received the welcome email

-- Add preferred_language to profiles (defaults to 'fr' for French)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'fr';

-- Add welcome_email_sent to networks to track if the admin welcome email was sent
ALTER TABLE networks
ADD COLUMN IF NOT EXISTS admin_welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add index for efficient querying of networks needing welcome emails
CREATE INDEX IF NOT EXISTS idx_networks_welcome_email_pending
ON networks(created_at, admin_welcome_email_sent)
WHERE admin_welcome_email_sent = FALSE;

-- Comment on the new columns
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language for emails (en, fr)';
COMMENT ON COLUMN networks.admin_welcome_email_sent IS 'Whether the admin welcome email has been sent for this network';
