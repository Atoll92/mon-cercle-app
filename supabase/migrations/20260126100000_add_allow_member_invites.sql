-- ============================================================================
-- ADD ALLOW_MEMBER_INVITES COLUMN TO NETWORKS TABLE
-- ============================================================================
-- This migration adds a setting to control whether regular members can
-- share invitation links to invite new members to the network.
-- ============================================================================

BEGIN;

-- Add the new column with default value of false (disabled)
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS allow_member_invites boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.networks.allow_member_invites IS 'When true, regular members can see and share invitation links on the About tab to invite new members';

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
    'add_allow_member_invites',
    'completed',
    'Added allow_member_invites column to networks table - controls whether members can share invitation links'
) ON CONFLICT DO NOTHING;

COMMIT;
