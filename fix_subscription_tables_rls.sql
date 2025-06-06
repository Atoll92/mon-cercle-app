-- ============================================================================
-- FIX SUBSCRIPTION TABLES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for membership_plans and member_subscriptions 
-- that were still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX MEMBERSHIP_PLANS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can manage membership plans" ON membership_plans;

-- Create new ALL policy for network admins
CREATE POLICY "Network admins can manage membership plans" ON membership_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = membership_plans.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- FIX MEMBER_SUBSCRIPTIONS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON member_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON member_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON member_subscriptions;
DROP POLICY IF EXISTS "Network admins can view all subscriptions" ON member_subscriptions;

-- Create new SELECT policy for users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON member_subscriptions
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new INSERT policy for users to create their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" ON member_subscriptions
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new UPDATE policy for users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON member_subscriptions
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for network admins to view all subscriptions
CREATE POLICY "Network admins can view all subscriptions" ON member_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p1.network_id = p2.network_id
            WHERE p1.user_id = auth.uid()
            AND p1.role = 'admin'
            AND p2.id = member_subscriptions.profile_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_subscription_tables_rls', 
    'completed', 
    'Fixed RLS policies for membership_plans and member_subscriptions to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for subscription tables after the multi-profile migration.
-- 
-- Key changes:
-- - membership_plans: Admin checks now use profiles.user_id = auth.uid() AND profiles.network_id = membership_plans.network_id
-- - member_subscriptions: User checks now use profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - member_subscriptions: Admin checks now use network relationships through profiles
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where users can have multiple subscriptions across different networks.
-- ============================================================================