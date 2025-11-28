-- Migration: Add cron job to call send-admin-welcome-email edge function
-- Description: Schedules daily call to send welcome emails to new network admins
-- Date: 2025-11-28

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the welcome email job to run daily at 9:00 AM UTC
-- Uses pg_net to make HTTP request to the edge function
SELECT cron.schedule(
  'send-admin-welcome-emails',
  '0 9 * * *', -- Daily at 9:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/send-admin-welcome-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI4NDEsImV4cCI6MjA1OTk0ODg0MX0.v4n_fZE09kg1qOK8J3mqxB166M22YJu5dr7Kr9YqOVk',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Verify the cron job was created
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'send-admin-welcome-emails';
