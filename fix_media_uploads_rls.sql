-- ============================================================================
-- FIX MEDIA_UPLOADS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for media_uploads that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX MEDIA_UPLOADS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "media_uploads_deletable_by_owner" ON media_uploads;
DROP POLICY IF EXISTS "media_uploads_insertable_by_network_members" ON media_uploads;
DROP POLICY IF EXISTS "media_uploads_viewable_by_network_members" ON media_uploads;

-- Create new DELETE policy for file owners
CREATE POLICY "media_uploads_deletable_by_owner" ON media_uploads
    FOR DELETE USING (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new INSERT policy for network members
CREATE POLICY "media_uploads_insertable_by_network_members" ON media_uploads
    FOR INSERT WITH CHECK (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = media_uploads.network_id
        )
    );

-- Create new SELECT policy for network members
CREATE POLICY "media_uploads_viewable_by_network_members" ON media_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = media_uploads.network_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_media_uploads_rls', 
    'completed', 
    'Fixed RLS policies for media_uploads to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for media uploads after the multi-profile migration.
-- 
-- Key changes:
-- - Owner checks now use: uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - Network member checks now use: profiles.user_id = auth.uid() AND profiles.network_id = media_uploads.network_id
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================