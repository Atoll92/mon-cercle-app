-- Migration: Add CRON job for batch moderation at 18h
-- Description: Sets up a cron job to process annonces batch moderation at 18:00 daily
-- Date: 2025-10-13

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add the batch moderation cron job
-- Runs daily at 18:00 (6 PM)
SELECT cron.schedule(
  'sympa-batch-moderate-18h', -- job name
  '0 18 * * *', -- daily at 18:00
  $$
  SELECT net.http_post(
    url := 'https://etoxvocwsktguoddmgcu.supabase.co/functions/v1/sympa-batch-moderate',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI4NDEsImV4cCI6MjA1OTk0ODg0MX0.v4n_fZE09kg1qOK8J3mqxB166M22YJu5dr7Kr9YqOVk',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron', 'scheduled_time', NOW())
  );
  $$
);

-- Add comment
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for batch processing annonces moderation at 18h';
