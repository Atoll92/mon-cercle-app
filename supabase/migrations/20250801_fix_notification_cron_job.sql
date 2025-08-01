-- Migration: Fix notification processing cron job
-- Description: Create a working cron job to process notifications every minute
-- Date: 2025-08-01

-- First, unschedule any existing cron job
SELECT cron.unschedule('process-notifications-cron');

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job with proper authentication
-- Note: For Supabase edge functions, you can use the anon key for public functions
-- or configure the service_role_key as a secret
SELECT cron.schedule(
  'process-notifications-cron',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI4NDEsImV4cCI6MjA1OTk0ODg0MX0.v4n_fZE09kg1qOK8J3mqxB166M22YJu5dr7Kr9YqOVk',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Verify the cron job was created
SELECT cron.job.* FROM cron.job WHERE jobname = 'process-notifications-cron';

-- Add comment
COMMENT ON EXTENSION pg_cron IS 'Cron job scheduler for PostgreSQL - used for notification processing';