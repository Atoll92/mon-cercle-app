-- Migration: Add cron job for notification processing
-- Description: Sets up a cron job to process notification queue every minute
-- Date: 2025-07-31

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Note: Supabase handles cron jobs differently for edge functions
-- You need to set up the cron job in the Supabase Dashboard under "Edge Functions > Cron"
-- Schedule: */1 * * * * (every minute)
-- Function: process-notifications
-- This migration only sets up the database side requirements

-- Add index on notification_queue for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
ON notification_queue(is_sent, created_at) 
WHERE is_sent = false AND error_message IS NULL;

-- Add cleanup cron job for old notifications
-- This removes sent notifications older than 30 days
SELECT cron.schedule(
    'cleanup-old-notifications', -- job name
    '0 2 * * *', -- daily at 2 AM
    $$
    DELETE FROM notification_queue 
    WHERE is_sent = true 
    AND sent_at < NOW() - INTERVAL '30 days';
    $$
);

-- Create a table to track notification processing runs (for monitoring)
CREATE TABLE IF NOT EXISTS notification_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notifications_processed INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    notifications_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying recent logs
CREATE INDEX idx_notification_processing_log_created_at 
ON notification_processing_log(created_at DESC);

-- Clean up old processing logs (keep last 7 days)
SELECT cron.schedule(
    'cleanup-notification-processing-logs', -- job name
    '0 3 * * *', -- daily at 3 AM
    $$
    DELETE FROM notification_processing_log 
    WHERE created_at < NOW() - INTERVAL '7 days';
    $$
);

-- Add comment
COMMENT ON TABLE notification_processing_log IS 'Tracks notification processing runs for monitoring and debugging';