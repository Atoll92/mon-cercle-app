-- Migration: Add Batch Moderation Support for Annonces
-- Description: Adds fields to support batched sending of moderation commands at 18h daily
-- Date: 2025-10-13

-- Add new columns to annonces_moderation table
ALTER TABLE public.annonces_moderation
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Add indexes for batch processing queries
CREATE INDEX IF NOT EXISTS idx_annonces_scheduled_send
ON public.annonces_moderation(scheduled_send_at, status)
WHERE scheduled_send_at IS NOT NULL AND sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_annonces_pending_batch
ON public.annonces_moderation(status, moderated_at)
WHERE status IN ('approved', 'rejected') AND synced_to_sympa = false;

-- Add comments
COMMENT ON COLUMN public.annonces_moderation.scheduled_send_at IS 'When the moderation command is scheduled to be sent to Sympa (18h daily batch)';
COMMENT ON COLUMN public.annonces_moderation.sent_at IS 'When the moderation command was actually sent to Sympa';