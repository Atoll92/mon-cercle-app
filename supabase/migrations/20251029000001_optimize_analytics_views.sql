-- Optimize Analytics Views - Fix Statement Timeout
-- Simplify queries and add better indexes for performance

-- Drop existing views
DROP VIEW IF EXISTS network_health_metrics;
DROP VIEW IF EXISTS onboarding_funnel_metrics;
DROP VIEW IF EXISTS user_engagement_metrics;
DROP VIEW IF EXISTS recent_errors;

-- Simplified network health metrics view (much faster)
CREATE OR REPLACE VIEW network_health_metrics AS
SELECT
  n.id as network_id,
  n.name as network_name,
  n.created_at as network_created,
  n.created_by,

  -- Simple counts - much faster
  (SELECT COUNT(*) FROM profiles WHERE network_id = n.id) as total_members,
  (SELECT COUNT(*) FROM profiles WHERE network_id = n.id AND created_at > now() - interval '7 days') as new_members_7d,
  (SELECT COUNT(*) FROM profiles WHERE network_id = n.id AND created_at > now() - interval '30 days') as new_members_30d,

  -- Profile completion (simplified)
  (SELECT ROUND(AVG(CASE WHEN bio IS NOT NULL AND bio != '' AND profile_picture_url IS NOT NULL THEN 100 ELSE 0 END), 2)
   FROM profiles WHERE network_id = n.id) as profile_completion_rate,

  -- Content counts (simplified)
  (SELECT COUNT(*) FROM portfolio_items pi JOIN profiles p ON pi.profile_id = p.id WHERE p.network_id = n.id) as total_posts,
  (SELECT COUNT(*) FROM network_events WHERE network_id = n.id) as total_events,
  (SELECT COUNT(*) FROM comments c JOIN profiles p ON c.profile_id = p.id WHERE p.network_id = n.id) as total_comments

FROM networks n
ORDER BY n.created_at DESC;

-- Grant access
GRANT SELECT ON network_health_metrics TO authenticated;

-- Simplified onboarding funnel (much faster - just counts)
CREATE OR REPLACE VIEW onboarding_funnel_metrics AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as signup_date,

  -- Simple boolean checks
  EXISTS(SELECT 1 FROM networks WHERE created_by = u.id::text) as completed_network_creation,
  EXISTS(SELECT 1 FROM invitations WHERE invited_by = u.id) as completed_member_invitation,
  EXISTS(SELECT 1 FROM profiles WHERE user_id = u.id AND bio IS NOT NULL AND bio != '' AND profile_picture_url IS NOT NULL) as completed_profile,
  EXISTS(SELECT 1 FROM profiles p JOIN portfolio_items pi ON p.id = pi.profile_id WHERE p.user_id = u.id) as completed_first_post,

  -- Simple counts
  (SELECT COUNT(*) FROM networks WHERE created_by = u.id::text) as networks_created,
  (SELECT COUNT(*) FROM invitations WHERE invited_by = u.id) as members_invited,
  (SELECT COUNT(*) FROM analytics_events WHERE user_id = u.id AND event_type = 'user_login') as login_count,

  -- Days since signup
  EXTRACT(epoch FROM (now() - u.created_at)) / 86400 as days_since_signup

FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 100; -- Limit results for performance

-- Grant access
GRANT SELECT ON onboarding_funnel_metrics TO authenticated;

-- Recent errors view (already simple, just recreate)
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  ae.id,
  ae.created_at,
  ae.user_id,
  ae.metadata->>'error_message' as error_message,
  ae.metadata->>'component' as component,
  ae.metadata->>'action' as action
FROM analytics_events ae
WHERE ae.event_type = 'error_occurred'
ORDER BY ae.created_at DESC
LIMIT 100;

-- Grant access
GRANT SELECT ON recent_errors TO authenticated;

-- Simplified user engagement metrics
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as signup_date,

  -- Login activity
  (SELECT COUNT(*) FROM analytics_events WHERE user_id = u.id AND event_type = 'user_login') as total_logins,
  (SELECT COUNT(*) FROM analytics_events WHERE user_id = u.id AND event_type = 'user_login' AND created_at > now() - interval '7 days') as logins_7d,
  (SELECT MAX(created_at) FROM analytics_events WHERE user_id = u.id AND event_type = 'user_login') as last_login,

  -- Simple counts
  (SELECT COUNT(*) FROM networks WHERE created_by = u.id::text) as networks_owned,
  (SELECT COUNT(DISTINCT network_id) FROM profiles WHERE user_id = u.id) as networks_joined

FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 100; -- Limit for performance

-- Grant access
GRANT SELECT ON user_engagement_metrics TO authenticated;

-- Add helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_network_created ON profiles(network_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile ON portfolio_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_comments_profile ON comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_network_events_network ON network_events(network_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- Comments
COMMENT ON VIEW network_health_metrics IS 'Simplified network health metrics for fast loading';
COMMENT ON VIEW onboarding_funnel_metrics IS 'Simplified onboarding funnel (limited to 100 recent users)';
COMMENT ON VIEW user_engagement_metrics IS 'Simplified user engagement (limited to 100 recent users)';
COMMENT ON VIEW recent_errors IS 'Recent error events (last 100)';
