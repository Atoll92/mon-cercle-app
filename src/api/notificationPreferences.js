/**
 * Notification Preferences API
 * Handles user notification and digest preferences
 */

import { handleObjectError } from '../utils/errorHandling';

/**
 * Update notification digest frequency
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} frequency - 'instant', 'hourly', 'daily', 'weekly'
 * @returns {Promise<Object>} - { data: profile, error }
 */
export const updateDigestFrequency = async (supabase, profileId, frequency) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ notification_digest_frequency: frequency })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating digest frequency:', error);
    return { error: error.message };
  }
};

/**
 * Update preferred digest time
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} time - Time in HH:MM:SS format
 * @returns {Promise<Object>} - { data: profile, error }
 */
export const updateDigestPreferredTime = async (supabase, profileId, time) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ digest_preferred_time: time })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating digest time:', error);
    return { error: error.message };
  }
};

/**
 * Get notification preferences for a profile
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} - { data: preferences, error }
 */
export const getNotificationPreferences = async (supabase, profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        email_notifications_enabled,
        notify_on_news,
        notify_on_events,
        notify_on_mentions,
        notify_on_direct_messages,
        notification_digest_frequency,
        digest_preferred_time,
        digest_last_sent_at
      `)
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return { error: error.message };
  }
};

/**
 * Update multiple notification preferences at once
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {Object} preferences - Preferences object
 * @returns {Promise<Object>} - { data: profile, error }
 */
export const updateNotificationPreferences = async (supabase, profileId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { error: error.message };
  }
};

/**
 * Get digest history for a profile
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {number} limit - Number of digests to fetch
 * @returns {Promise<Object>} - { data: digests array, error }
 */
export const getDigestHistory = async (supabase, profileId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('notification_digests')
      .select('*')
      .eq('profile_id', profileId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error fetching digest history:', error);
    return { error: error.message };
  }
};
