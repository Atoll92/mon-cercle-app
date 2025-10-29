/**
 * Analytics API
 * Functions for tracking events and retrieving analytics metrics
 */

import { handleArrayError, handleObjectError } from '../utils/errorHandling';

/**
 * Track an analytics event
 * @param {Object} supabase - Supabase client
 * @param {string} eventType - Type of event (e.g., 'user_login', 'network_created')
 * @param {Object} options - Event options
 * @param {string} options.userId - User ID (optional, defaults to current user)
 * @param {string} options.networkId - Network ID (optional)
 * @param {string} options.profileId - Profile ID (optional)
 * @param {Object} options.metadata - Additional event metadata (optional)
 * @returns {Promise<Object>} Result object
 */
export const trackEvent = async (supabase, eventType, options = {}) => {
  try {
    const { userId, networkId, profileId, metadata = {} } = options;

    const eventData = {
      event_type: eventType,
      user_id: userId || (await supabase.auth.getUser()).data.user?.id,
      network_id: networkId || null,
      profile_id: profileId || null,
      metadata
    };

    const { data, error } = await supabase
      .from('analytics_events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error tracking event:', error);
    return { error: error.message };
  }
};

/**
 * Track error event
 * @param {Object} supabase - Supabase client
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @returns {Promise<Object>} Result object
 */
export const trackError = async (supabase, error, context = {}) => {
  try {
    const metadata = {
      error_message: error.message,
      error_stack: error.stack,
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      ...context
    };

    return await trackEvent(supabase, 'error_occurred', {
      networkId: context.networkId,
      profileId: context.profileId,
      metadata
    });
  } catch (err) {
    console.error('Error tracking error event:', err);
    return { error: err.message };
  }
};

/**
 * Get network health metrics
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Array of network health metrics
 */
export const getNetworkHealthMetrics = async (supabase) => {
  try {
    const { data, error } = await supabase
      .from('network_health_metrics')
      .select('*')
      .limit(50) // Limit for performance
      .order('network_created', { ascending: false });

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching network health metrics:', error);
    return { error: error.message };
  }
};

/**
 * Get onboarding funnel metrics
 * @param {Object} supabase - Supabase client
 * @param {Object} options - Filter options
 * @param {number} options.daysRange - Number of days to look back (default: 30)
 * @returns {Promise<Object>} Array of onboarding funnel metrics
 */
export const getOnboardingFunnelMetrics = async (supabase, options = {}) => {
  try {
    const { daysRange = 30 } = options;

    let query = supabase
      .from('onboarding_funnel_metrics')
      .select('*')
      .limit(100); // Limit for performance

    if (daysRange) {
      query = query.gte('days_since_signup', 0).lte('days_since_signup', daysRange);
    }

    const { data, error } = await query.order('signup_date', { ascending: false });

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching onboarding funnel metrics:', error);
    return { error: error.message };
  }
};

/**
 * Get recent errors
 * @param {Object} supabase - Supabase client
 * @param {number} limit - Number of errors to fetch (default: 50)
 * @returns {Promise<Object>} Array of recent errors
 */
export const getRecentErrors = async (supabase, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('recent_errors')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching recent errors:', error);
    return { error: error.message };
  }
};

/**
 * Get user engagement metrics
 * @param {Object} supabase - Supabase client
 * @param {Object} options - Filter options
 * @param {number} options.minLogins - Minimum login count filter
 * @returns {Promise<Object>} Array of user engagement metrics
 */
export const getUserEngagementMetrics = async (supabase, options = {}) => {
  try {
    let query = supabase
      .from('user_engagement_metrics')
      .select('*')
      .limit(100); // Limit for performance

    if (options.minLogins) {
      query = query.gte('total_logins', options.minLogins);
    }

    const { data, error} = await query.order('signup_date', { ascending: false });

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching user engagement metrics:', error);
    return { error: error.message };
  }
};

/**
 * Get analytics event counts by type
 * @param {Object} supabase - Supabase client
 * @param {Object} options - Filter options
 * @param {number} options.daysRange - Number of days to look back (default: 7)
 * @returns {Promise<Object>} Event counts by type
 */
export const getEventCounts = async (supabase, options = {}) => {
  try {
    const { daysRange = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysRange);

    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Count events by type
    const counts = {};
    data.forEach(event => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });

    return { data: counts };
  } catch (error) {
    console.error('Error fetching event counts:', error);
    return { error: error.message };
  }
};

/**
 * Get analytics summary for dashboard
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Analytics summary
 */
export const getAnalyticsSummary = async (supabase) => {
  try {
    // Fetch all metrics in parallel
    const [
      healthMetrics,
      funnelMetrics,
      recentErrors,
      engagementMetrics,
      eventCounts
    ] = await Promise.all([
      getNetworkHealthMetrics(supabase),
      getOnboardingFunnelMetrics(supabase, { daysRange: 30 }),
      getRecentErrors(supabase, 10),
      getUserEngagementMetrics(supabase),
      getEventCounts(supabase, { daysRange: 7 })
    ]);

    // Check for errors
    if (healthMetrics.error) throw new Error(`Health metrics error: ${healthMetrics.error}`);
    if (funnelMetrics.error) throw new Error(`Funnel metrics error: ${funnelMetrics.error}`);
    if (recentErrors.error) throw new Error(`Recent errors error: ${recentErrors.error}`);
    if (engagementMetrics.error) throw new Error(`Engagement metrics error: ${engagementMetrics.error}`);
    if (eventCounts.error) throw new Error(`Event counts error: ${eventCounts.error}`);

    // Calculate summary statistics
    const totalNetworks = healthMetrics.data?.length || 0;
    const totalUsers = engagementMetrics.data?.length || 0;
    const activeUsers7d = engagementMetrics.data?.filter(u => u.logins_7d > 0).length || 0;
    const totalMembers = healthMetrics.data?.reduce((sum, n) => sum + (n.total_members || 0), 0) || 0;

    // Onboarding completion rates
    const usersCompletedNetwork = funnelMetrics.data?.filter(u => u.completed_network_creation).length || 0;
    const usersCompletedInvite = funnelMetrics.data?.filter(u => u.completed_member_invitation).length || 0;
    const usersCompletedProfile = funnelMetrics.data?.filter(u => u.completed_profile).length || 0;
    const usersCompletedFirstPost = funnelMetrics.data?.filter(u => u.completed_first_post).length || 0;

    return {
      data: {
        summary: {
          totalNetworks,
          totalUsers,
          activeUsers7d,
          totalMembers,
          errorCount7d: recentErrors.data?.length || 0
        },
        onboardingFunnel: {
          signups: totalUsers,
          networkCreated: usersCompletedNetwork,
          membersInvited: usersCompletedInvite,
          profileCompleted: usersCompletedProfile,
          firstPostCreated: usersCompletedFirstPost
        },
        eventCounts: eventCounts.data || {},
        recentErrors: recentErrors.data || [],
        healthMetrics: healthMetrics.data || [],
        engagementMetrics: engagementMetrics.data || []
      }
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return { error: error.message };
  }
};
