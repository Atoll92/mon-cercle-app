-- Migration: Add tracking for admin welcome emails CRON job
-- Description: Sets up database requirements for the admin welcome email system
-- Date: 2025-11-28
--
-- IMPORTANT: The cron job for calling the edge function must be set up manually
-- in the Supabase Dashboard under "Edge Functions > Cron"
--
-- Cron Configuration:
--   Schedule: 0 9 * * * (daily at 9:00 AM UTC)
--   Function: send-admin-welcome-email
--   HTTP Method: POST
--   Body: {}

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a table to track welcome email sends (for monitoring and debugging)
CREATE TABLE IF NOT EXISTS admin_welcome_email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
    network_name TEXT,
    admin_email TEXT,
    language VARCHAR(5),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_admin_welcome_email_log_created_at
ON admin_welcome_email_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_welcome_email_log_network_id
ON admin_welcome_email_log(network_id);

-- Clean up old welcome email logs (keep last 90 days)
SELECT cron.schedule(
    'cleanup-admin-welcome-email-logs', -- job name
    '0 4 * * *', -- daily at 4 AM UTC
    $$
    DELETE FROM admin_welcome_email_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    $$
);

-- Add RLS policies for admin_welcome_email_log
ALTER TABLE admin_welcome_email_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the logs
CREATE POLICY "Super admins can view welcome email logs"
ON admin_welcome_email_log
FOR SELECT
USING (
    auth.jwt() ->> 'email' IN (
        'music.music@mac.com',
        'music.music+cc@mac.com',
        'music.music+test@mac.com'
    )
);

-- Service role can insert logs
CREATE POLICY "Service role can insert welcome email logs"
ON admin_welcome_email_log
FOR INSERT
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE admin_welcome_email_log IS 'Tracks admin welcome email sends for monitoring. Set up cron job in Supabase Dashboard: Edge Functions > Cron, schedule send-admin-welcome-email at 0 9 * * *';
