-- ============================================================================
-- FIX SOCIAL_WALL_COMMENTS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for social_wall_comments that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX SOCIAL_WALL_COMMENTS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can create comments" ON social_wall_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON social_wall_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON social_wall_comments;
DROP POLICY IF EXISTS "Users can view non-hidden comments" ON social_wall_comments;
DROP POLICY IF EXISTS "Network admins can hide/unhide comments" ON social_wall_comments;

-- Create new INSERT policy that properly checks profile IDs
CREATE POLICY "Users can create comments" ON social_wall_comments
    FOR INSERT WITH CHECK (
        -- The profile_id must be one of the user's profile IDs
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) AND
        -- The user must be in the same network as the item being commented on
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id IN (
                SELECT
                    CASE
                        WHEN social_wall_comments.item_type = 'news' THEN (
                            SELECT network_news.network_id
                            FROM network_news
                            WHERE network_news.id = social_wall_comments.item_id
                        )
                        WHEN social_wall_comments.item_type = 'post' THEN (
                            SELECT profiles_1.network_id
                            FROM profiles profiles_1
                            WHERE profiles_1.id IN (
                                SELECT portfolio_items.profile_id
                                FROM portfolio_items
                                WHERE portfolio_items.id = social_wall_comments.item_id
                            )
                        )
                        ELSE NULL::uuid
                    END
            )
        )
    );

-- Create new DELETE policy for own comments
CREATE POLICY "Users can delete own comments" ON social_wall_comments
    FOR DELETE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new UPDATE policy for own comments
CREATE POLICY "Users can update own comments" ON social_wall_comments
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for viewing comments
CREATE POLICY "Users can view non-hidden comments" ON social_wall_comments
    FOR SELECT USING (
        NOT is_hidden OR
        -- Admins can see hidden comments
        auth.uid() IN (
            SELECT profiles.user_id
            FROM profiles
            WHERE profiles.role = 'admin'
            AND profiles.network_id IN (
                SELECT
                    CASE
                        WHEN social_wall_comments.item_type = 'news' THEN (
                            SELECT network_news.network_id
                            FROM network_news
                            WHERE network_news.id = social_wall_comments.item_id
                        )
                        WHEN social_wall_comments.item_type = 'post' THEN (
                            SELECT profiles_1.network_id
                            FROM profiles profiles_1
                            WHERE profiles_1.id IN (
                                SELECT portfolio_items.profile_id
                                FROM portfolio_items
                                WHERE portfolio_items.id = social_wall_comments.item_id
                            )
                        )
                        ELSE NULL::uuid
                    END
            )
        )
    );

-- Create new admin policy for hiding/unhiding comments
CREATE POLICY "Network admins can hide/unhide comments" ON social_wall_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.network_id IN (
                SELECT
                    CASE
                        WHEN social_wall_comments.item_type = 'news' THEN (
                            SELECT network_news.network_id
                            FROM network_news
                            WHERE network_news.id = social_wall_comments.item_id
                        )
                        WHEN social_wall_comments.item_type = 'post' THEN (
                            SELECT profiles_1.network_id
                            FROM profiles profiles_1
                            WHERE profiles_1.id IN (
                                SELECT portfolio_items.profile_id
                                FROM portfolio_items
                                WHERE portfolio_items.id = social_wall_comments.item_id
                            )
                        )
                        ELSE NULL::uuid
                    END
            )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.network_id IN (
                SELECT
                    CASE
                        WHEN social_wall_comments.item_type = 'news' THEN (
                            SELECT network_news.network_id
                            FROM network_news
                            WHERE network_news.id = social_wall_comments.item_id
                        )
                        WHEN social_wall_comments.item_type = 'post' THEN (
                            SELECT profiles_1.network_id
                            FROM profiles profiles_1
                            WHERE profiles_1.id IN (
                                SELECT portfolio_items.profile_id
                                FROM portfolio_items
                                WHERE portfolio_items.id = social_wall_comments.item_id
                            )
                        )
                        ELSE NULL::uuid
                    END
            )
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_social_wall_comments_rls', 
    'completed', 
    'Fixed RLS policies for social_wall_comments to use profile IDs instead of direct auth.uid() comparisons after multi-profile migration'
);

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- posting comments on the social wall after the multi-profile migration.
-- 
-- The key change is that all policies now check:
-- - profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- 
-- Instead of the old:
-- - auth.uid() = profile_id
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where profile_id contains profile IDs, not auth user IDs.
-- ============================================================================