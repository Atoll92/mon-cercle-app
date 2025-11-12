/**
 * Activity Feed API
 * Handles fetching network activity for engagement
 */

import { handleArrayError, handleArraySuccess } from '../utils/errorHandling';

/**
 * Fetch recent activity for a network
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of activities to fetch (default: 50)
 * @returns {Promise<Object>} - { data: activities array, error }
 */
export const fetchNetworkActivity = async (supabase, networkId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        activity_type,
        activity_text,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profile_id,
        profiles!inner(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('network_id', networkId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArraySuccess(data);
  } catch (error) {
    console.error('Error fetching network activity:', error);
    return handleArrayError(error, 'fetching network activity');
  }
};

/**
 * Fetch activity for a specific profile
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {number} limit - Number of activities to fetch (default: 20)
 * @returns {Promise<Object>} - { data: activities array, error }
 */
export const fetchProfileActivity = async (supabase, profileId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        activity_type,
        activity_text,
        entity_type,
        entity_id,
        metadata,
        created_at,
        network_id
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArraySuccess(data);
  } catch (error) {
    console.error('Error fetching profile activity:', error);
    return handleArrayError(error, 'fetching profile activity');
  }
};

/**
 * Fetch activity by type
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {string} activityType - Activity type to filter
 * @param {number} limit - Number of activities to fetch (default: 20)
 * @returns {Promise<Object>} - { data: activities array, error }
 */
export const fetchActivityByType = async (supabase, networkId, activityType, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        activity_type,
        activity_text,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profile_id,
        profiles!inner(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('network_id', networkId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArraySuccess(data);
  } catch (error) {
    console.error('Error fetching activity by type:', error);
    return handleArrayError(error, 'fetching activity by type');
  }
};

/**
 * Subscribe to real-time activity updates
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {Function} callback - Callback function for updates
 * @returns {Object} - Subscription object
 */
export const subscribeToActivity = (supabase, networkId, callback) => {
  return supabase
    .channel(`activity:${networkId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
        filter: `network_id=eq.${networkId}`
      },
      callback
    )
    .subscribe();
};

/**
 * Get activity statistics for a network
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} - { data: stats object, error }
 */
export const fetchActivityStats = async (supabase, networkId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('activity_feed')
      .select('activity_type')
      .eq('network_id', networkId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Count activities by type
    const stats = {};
    data.forEach(activity => {
      stats[activity.activity_type] = (stats[activity.activity_type] || 0) + 1;
    });

    return {
      data: {
        total: data.length,
        byType: stats,
        period: days
      }
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return { error: error.message };
  }
};

/**
 * Manually create an activity (for client-side actions not covered by triggers)
 * @param {Object} supabase - Supabase client
 * @param {Object} activityData - Activity data
 * @returns {Promise<Object>} - { data: activity, error }
 */
export const createActivity = async (supabase, activityData) => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .insert(activityData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { error: error.message };
  }
};
