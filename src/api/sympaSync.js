// File: src/api/sympaSync.js
// API functions for Sympa mailing list synchronization

import { supabase } from '../supabaseclient';

/**
 * Fetch subscription status for a profile
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object|null>} Subscription data or null
 */
export const fetchSubscriptionStatus = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('sympa_subscription_queue')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      // Not found is not an error - user may not have subscribed yet
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
};

/**
 * Fetch all subscription requests for a network (admin only)
 * @param {string} networkId - Network ID
 * @param {string|null} statusFilter - Optional status filter
 * @returns {Promise<Array>} Array of subscription requests with profile data
 */
export const fetchSubscriptionRequests = async (networkId, statusFilter = null) => {
  try {
    let query = supabase
      .from('sympa_subscription_queue')
      .select(`
        *,
        profiles!sympa_subscription_queue_profile_id_fkey (
          id,
          full_name,
          contact_email,
          profile_picture_url,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by network through the profiles join
    // Note: This requires the profile to exist
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subscription requests:', error);
      throw error;
    }

    // Filter by network ID (client-side for now, could be optimized with a view)
    const filteredData = data?.filter(
      req => req.profiles?.network_id === networkId
    ) || [];

    return filteredData;
  } catch (error) {
    console.error('Error fetching subscription requests:', error);
    throw error;
  }
};

/**
 * Subscribe a user to the Sympa mailing list
 * @param {string} profileId - Profile ID
 * @param {string} email - User email
 * @param {Array<string>} categories - Array of category preferences
 * @param {string} motivation - User's motivation for joining (optional)
 * @returns {Promise<Object>} Result from Edge Function
 */
export const subscribeToSympa = async (profileId, email, categories, motivation = '') => {
  try {
    // Create subscription queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from('sympa_subscription_queue')
      .insert({
        profile_id: profileId,
        email: email,
        categories: categories,
        motivation: motivation,
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error creating subscription queue entry:', queueError);
      throw queueError;
    }

    return {
      success: true,
      message: 'Subscription request submitted. Waiting for admin approval.',
      data: queueEntry
    };
  } catch (error) {
    console.error('Error subscribing to Sympa:', error);
    throw error;
  }
};

/**
 * Approve a subscription request (admin only)
 * @param {string} subscriptionId - Subscription queue ID
 * @param {string} email - User email
 * @returns {Promise<Object>} Result from Edge Function
 */
export const approveSubscription = async (subscriptionId, email) => {
  try {
    // Invoke Edge Function to send Sympa command
    const { data, error } = await supabase.functions.invoke('sympa-manage-subscription', {
      body: {
        subscriptionId,
        email,
        action: 'approve'
      }
    });

    if (error) {
      console.error('Error invoking subscription management function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error approving subscription:', error);
    throw error;
  }
};

/**
 * Reject a subscription request (admin only)
 * @param {string} subscriptionId - Subscription queue ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Result
 */
export const rejectSubscription = async (subscriptionId, profileId) => {
  try {
    // Update subscription queue to rejected status
    const { data, error } = await supabase
      .from('sympa_subscription_queue')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting subscription:', error);
      throw error;
    }

    return {
      success: true,
      message: 'Subscription request rejected',
      data
    };
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    throw error;
  }
};

/**
 * Unsubscribe a user from the Sympa mailing list
 * @param {string} profileId - Profile ID
 * @param {string} email - User email
 * @returns {Promise<Object>} Result from Edge Function
 */
export const unsubscribeFromSympa = async (profileId, email) => {
  try {
    // Invoke Edge Function to send Sympa unsubscribe command
    const { data, error } = await supabase.functions.invoke('sympa-manage-subscription', {
      body: {
        profileId,
        email,
        action: 'unsubscribe'
      }
    });

    if (error) {
      console.error('Error invoking unsubscribe function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error unsubscribing from Sympa:', error);
    throw error;
  }
};

/**
 * Update user's annonces category preferences
 * @param {string} profileId - Profile ID
 * @param {Array<string>} categories - Array of category preferences
 * @returns {Promise<Object>} Updated profile
 */
export const updateSympaCategories = async (profileId, categories) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        annonces_categories: categories
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category preferences:', error);
      throw error;
    }

    // Also update the subscription queue if it exists
    await supabase
      .from('sympa_subscription_queue')
      .update({
        categories: categories,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', profileId);

    return data;
  } catch (error) {
    console.error('Error updating category preferences:', error);
    throw error;
  }
};

/**
 * Get user's annonces category preferences
 * @param {string} profileId - Profile ID
 * @returns {Promise<Array<string>>} Array of category preferences
 */
export const getCategoryPreferences = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('annonces_categories')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching category preferences:', error);
      throw error;
    }

    return data?.annonces_categories || [];
  } catch (error) {
    console.error('Error fetching category preferences:', error);
    throw error;
  }
};
