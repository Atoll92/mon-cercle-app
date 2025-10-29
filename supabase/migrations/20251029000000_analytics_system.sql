-- Analytics System Migration
-- Track user experiences, onboarding, and engagement for soft launch monitoring

-- Analytics events table for tracking user actions
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  network_id uuid REFERENCES networks(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_network ON analytics_events(network_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_metadata ON analytics_events USING gin(metadata);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins can see all events
CREATE POLICY "Super admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Network health metrics view
CREATE OR REPLACE VIEW network_health_metrics AS
SELECT
  n.id as network_id,
  n.name as network_name,
  n.created_at as network_created,
  n.created_by,
  creator.email as creator_email,

  -- Member metrics
  COUNT(DISTINCT p.id) as total_members,
  COUNT(DISTINCT CASE WHEN p.created_at > now() - interval '7 days' THEN p.id END) as new_members_7d,
  COUNT(DISTINCT CASE WHEN p.created_at > now() - interval '30 days' THEN p.id END) as new_members_30d,

  -- Profile completion metrics
  ROUND(AVG(
    CASE
      WHEN p.bio IS NOT NULL AND p.bio != '' AND p.profile_picture_url IS NOT NULL
      THEN 1 ELSE 0
    END
  ) * 100, 2) as profile_completion_rate,

  -- Activity metrics (last 7 days)
  COUNT(DISTINCT CASE
    WHEN pi.created_at > now() - interval '7 days'
    THEN pi.profile_id
  END) as active_posters_7d,

  COUNT(DISTINCT CASE
    WHEN comments.created_at > now() - interval '7 days'
    THEN comments.profile_id
  END) as active_commenters_7d,

  -- Content metrics
  COUNT(DISTINCT pi.id) as total_posts,
  COUNT(DISTINCT ne.id) as total_events,
  COUNT(DISTINCT comments.id) as total_comments,

  -- Recent activity
  MAX(pi.created_at) as last_post_created,
  MAX(comments.created_at) as last_comment_created

FROM networks n
LEFT JOIN profiles p ON p.network_id = n.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN network_events ne ON ne.network_id = n.id
LEFT JOIN network_news nn ON nn.network_id = n.id
LEFT JOIN comments ON comments.profile_id = p.id
LEFT JOIN auth.users creator ON creator.id::text = n.created_by
GROUP BY n.id, n.name, n.created_at, n.created_by, creator.email;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON network_health_metrics TO authenticated;

-- Onboarding funnel metrics view
CREATE OR REPLACE VIEW onboarding_funnel_metrics AS
WITH user_journey AS (
  SELECT
    u.id as user_id,
    u.email,
    u.created_at as signup_date,

    -- Network creation
    MIN(n.created_at) as first_network_created,
    COUNT(DISTINCT n.id) as networks_created,

    -- Member invitations
    COUNT(DISTINCT inv.id) as members_invited,

    -- Profile completion
    MAX(CASE
      WHEN p.bio IS NOT NULL AND p.bio != '' AND p.profile_picture_url IS NOT NULL
      THEN 1 ELSE 0
    END) as has_complete_profile,

    -- Content creation
    MIN(pi.created_at) as first_post_created,
    COUNT(DISTINCT pi.id) as posts_created,

    -- Engagement
    MIN(comments.created_at) as first_comment_created,
    COUNT(DISTINCT comments.id) as comments_created,

    -- Login tracking (from analytics_events)
    COUNT(DISTINCT CASE
      WHEN ae.event_type = 'user_login'
      THEN ae.id
    END) as login_count

  FROM auth.users u
  LEFT JOIN networks n ON n.created_by = u.id::text
  LEFT JOIN invitations inv ON inv.invited_by = u.id
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
  LEFT JOIN comments ON comments.profile_id = p.id
  LEFT JOIN analytics_events ae ON ae.user_id = u.id
  GROUP BY u.id, u.email, u.created_at
)
SELECT
  user_id,
  email,
  signup_date,

  -- Funnel stages
  CASE WHEN first_network_created IS NOT NULL THEN true ELSE false END as completed_network_creation,
  CASE WHEN members_invited > 0 THEN true ELSE false END as completed_member_invitation,
  CASE WHEN has_complete_profile = 1 THEN true ELSE false END as completed_profile,
  CASE WHEN first_post_created IS NOT NULL THEN true ELSE false END as completed_first_post,

  -- Metrics
  networks_created,
  members_invited,
  posts_created,
  comments_created,
  login_count,

  -- Timing
  first_network_created,
  first_post_created,
  first_comment_created,

  -- Days since signup
  EXTRACT(epoch FROM (now() - signup_date)) / 86400 as days_since_signup

FROM user_journey
ORDER BY signup_date DESC;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON onboarding_funnel_metrics TO authenticated;

-- Recent errors view (from analytics_events)
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  ae.id,
  ae.created_at,
  ae.user_id,
  u.email,
  ae.network_id,
  n.name as network_name,
  ae.metadata->>'error_message' as error_message,
  ae.metadata->>'error_stack' as error_stack,
  ae.metadata->>'component' as component,
  ae.metadata->>'action' as action
FROM analytics_events ae
LEFT JOIN auth.users u ON u.id = ae.user_id
LEFT JOIN networks n ON n.id = ae.network_id
WHERE ae.event_type = 'error_occurred'
ORDER BY ae.created_at DESC
LIMIT 100;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON recent_errors TO authenticated;

-- User engagement metrics view
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as signup_date,

  -- Login activity
  COUNT(DISTINCT CASE
    WHEN ae.event_type = 'user_login'
    THEN ae.id
  END) as total_logins,

  COUNT(DISTINCT CASE
    WHEN ae.event_type = 'user_login' AND ae.created_at > now() - interval '7 days'
    THEN ae.id
  END) as logins_7d,

  MAX(CASE
    WHEN ae.event_type = 'user_login'
    THEN ae.created_at
  END) as last_login,

  -- Content creation
  COUNT(DISTINCT pi.id) as total_posts,
  COUNT(DISTINCT comments.id) as total_comments,
  COUNT(DISTINCT nn.id) as total_news,

  -- Networks
  COUNT(DISTINCT n.id) as networks_owned,
  COUNT(DISTINCT p.network_id) as networks_joined,

  -- Feature usage
  COUNT(DISTINCT CASE
    WHEN ae.event_type = 'feature_used' AND ae.metadata->>'feature' = 'messaging'
    THEN ae.id
  END) as messaging_usage_count,

  COUNT(DISTINCT CASE
    WHEN ae.event_type = 'feature_used' AND ae.metadata->>'feature' = 'wiki'
    THEN ae.id
  END) as wiki_usage_count,

  COUNT(DISTINCT CASE
    WHEN ae.event_type = 'feature_used' AND ae.metadata->>'feature' = 'files'
    THEN ae.id
  END) as files_usage_count

FROM auth.users u
LEFT JOIN analytics_events ae ON ae.user_id = u.id
LEFT JOIN networks n ON n.created_by = u.id::text
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN comments ON comments.profile_id = p.id
LEFT JOIN network_news nn ON nn.created_by = p.id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON user_engagement_metrics TO authenticated;

-- Function to refresh materialized views (for future optimization)
-- Note: We're using regular views for now, but this can be converted to materialized views
-- CREATE OR REPLACE FUNCTION refresh_analytics_views()
-- RETURNS void AS $$
-- BEGIN
--   REFRESH MATERIALIZED VIEW network_health_metrics;
--   REFRESH MATERIALIZED VIEW onboarding_funnel_metrics;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables and views
COMMENT ON TABLE analytics_events IS 'Track user actions and events for monitoring soft launch';
COMMENT ON VIEW network_health_metrics IS 'Network-level health and engagement metrics';
COMMENT ON VIEW onboarding_funnel_metrics IS 'User onboarding funnel progress tracking';
COMMENT ON VIEW recent_errors IS 'Recent error events for debugging';
COMMENT ON VIEW user_engagement_metrics IS 'User-level engagement and activity metrics';
