-- Add event moderation columns and member publishing setting
-- Migration: 20251103000000_add_event_moderation_and_member_publishing.sql

-- Add event moderation columns to network_events table
ALTER TABLE public.network_events
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.network_events
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.network_events
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

ALTER TABLE public.network_events
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_network_events_status ON public.network_events(status);
CREATE INDEX IF NOT EXISTS idx_network_events_network_status ON public.network_events(network_id, status);

-- Add comment for documentation
COMMENT ON COLUMN public.network_events.status IS 'Event moderation status: pending (awaiting approval), approved (published), rejected';
COMMENT ON COLUMN public.network_events.approved_by IS 'Profile ID of admin who approved/rejected the event';
COMMENT ON COLUMN public.network_events.approved_at IS 'Timestamp when event was approved/rejected';
COMMENT ON COLUMN public.network_events.rejection_reason IS 'Reason provided when event was rejected';

-- Update existing events to have approved status (backward compatibility)
UPDATE public.network_events
SET status = 'approved'
WHERE status IS NULL;

-- Update networks features_config to include allow_member_event_publishing
-- This adds the new setting to the features configuration with default false (moderation enabled)

-- First, ensure features_config is proper JSONB for all networks
UPDATE public.networks
SET features_config = '{}'::jsonb
WHERE features_config IS NULL;

-- Now add the setting to networks that don't have it yet
UPDATE public.networks
SET features_config = features_config || '{"allow_member_event_publishing": false}'::jsonb
WHERE NOT (features_config ? 'allow_member_event_publishing');

-- Add comment for documentation
COMMENT ON COLUMN public.networks.features_config IS 'JSON configuration for network features. Includes: events, news, files, chat, wiki, moodboards, location_sharing, notifications, allow_member_event_publishing (if true, members can publish events without admin approval)';
