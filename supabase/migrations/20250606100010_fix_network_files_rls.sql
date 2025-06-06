-- ============================================================================
-- FIX NETWORK_FILES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for network_files that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX NETWORK_FILES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Admins can manage all files in their network" ON network_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON network_files;
DROP POLICY IF EXISTS "Users can update their own files" ON network_files;
DROP POLICY IF EXISTS "Users can upload files to their network" ON network_files;
DROP POLICY IF EXISTS "Users can view files in their network" ON network_files;

-- Create new ALL policy for admins to manage files in their network
CREATE POLICY "Admins can manage all files in their network" ON network_files
    FOR ALL USING (
        network_id IN (
            SELECT profiles.network_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create new DELETE policy for users to delete their own files
CREATE POLICY "Users can delete their own files" ON network_files
    FOR DELETE USING (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new UPDATE policy for users to update their own files
CREATE POLICY "Users can update their own files" ON network_files
    FOR UPDATE USING (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new INSERT policy for users to upload files to their network
CREATE POLICY "Users can upload files to their network" ON network_files
    FOR INSERT WITH CHECK (
        network_id IN (
            SELECT profiles.network_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
        AND uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for users to view files in their network
CREATE POLICY "Users can view files in their network" ON network_files
    FOR SELECT USING (
        network_id IN (
            SELECT profiles.network_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_network_files_rls', 
    'completed', 
    'Fixed RLS policies for network_files to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- uploading, viewing, and managing files after the multi-profile migration.
-- 
-- The key changes are:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.role = 'admin'
-- - File ownership checks now use: uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - Network membership checks now use: profiles.user_id = auth.uid()
-- 
-- Instead of the old:
-- - profiles.id = auth.uid() (which compared profile IDs to auth user IDs)
-- - uploaded_by = auth.uid() (which compared profile IDs to auth user IDs)
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================