-- Rollback batch moderation changes
-- Run this in Supabase SQL Editor

-- Step 1: Remove the cron job
DO $$
BEGIN
  PERFORM cron.unschedule('sympa-batch-moderate-18h');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Job doesn't exist, that's fine
END $$;

-- Step 2: Remove the indexes
DROP INDEX IF EXISTS public.idx_annonces_scheduled_send;
DROP INDEX IF EXISTS public.idx_annonces_pending_batch;

-- Step 3: Remove the columns
ALTER TABLE public.annonces_moderation
DROP COLUMN IF EXISTS scheduled_send_at,
DROP COLUMN IF EXISTS sent_at;

-- Verify cleanup
SELECT jobid, jobname FROM cron.job WHERE jobname = 'sympa-batch-moderate-18h';
-- Should return 0 rows
