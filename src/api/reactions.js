/**
 * Reactions API
 * Handles emoji reactions to content (posts, news, comments, events, wiki)
 */

import { handleArrayError, handleObjectError } from '../utils/errorHandling';

/**
 * Get reactions for a specific content item
 * @param {Object} supabase - Supabase client
 * @param {string} contentType - Type of content ('post', 'news', 'comment', 'event', 'wiki')
 * @param {string} contentId - ID of the content
 * @returns {Promise<Object>} - { data: reactions array, error }
 */
export const fetchReactions = async (supabase, contentType, contentId) => {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select(`
        id,
        emoji,
        created_at,
        profile_id,
        profiles!inner(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return { error: error.message };
  }
};

/**
 * Get reaction summary (grouped by emoji) for content
 * @param {Object} supabase - Supabase client
 * @param {string} contentType - Type of content
 * @param {string} contentId - ID of the content
 * @returns {Promise<Object>} - { data: { emoji: count, profileIds: [] }, error }
 */
export const fetchReactionSummary = async (supabase, contentType, contentId) => {
  try {
    const { data, error } = await supabase
      .from('reaction_summaries')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;

    // Transform to easier format: { '👍': { count: 5, profileIds: [...] } }
    const summary = {};
    if (data) {
      data.forEach(item => {
        summary[item.emoji] = {
          count: item.count,
          profileIds: item.profile_ids || []
        };
      });
    }

    return { data: summary };
  } catch (error) {
    console.error('Error fetching reaction summary:', error);
    return { error: error.message };
  }
};

/**
 * Add or update a reaction
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID of the user reacting
 * @param {string} networkId - Network ID
 * @param {string} contentType - Type of content
 * @param {string} contentId - ID of the content
 * @param {string} emoji - Emoji to react with
 * @returns {Promise<Object>} - { data: reaction, error }
 */
export const addReaction = async (supabase, profileId, networkId, contentType, contentId, emoji) => {
  try {
    // Use upsert to handle adding or updating reaction
    const { data, error } = await supabase
      .from('reactions')
      .upsert({
        profile_id: profileId,
        network_id: networkId,
        content_type: contentType,
        content_id: contentId,
        emoji: emoji
      }, {
        onConflict: 'profile_id,content_type,content_id'
      })
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error adding reaction:', error);
    return { error: error.message };
  }
};

/**
 * Remove a reaction
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID of the user
 * @param {string} contentType - Type of content
 * @param {string} contentId - ID of the content
 * @returns {Promise<Object>} - { data: true, error }
 */
export const removeReaction = async (supabase, profileId, contentType, contentId) => {
  try {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('profile_id', profileId)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;
    return { data: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { error: error.message };
  }
};

/**
 * Get user's reaction to a specific content item
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID of the user
 * @param {string} contentType - Type of content
 * @param {string} contentId - ID of the content
 * @returns {Promise<Object>} - { data: reaction or null, error }
 */
export const fetchUserReaction = async (supabase, profileId, contentType, contentId) => {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    return { error: error.message };
  }
};

/**
 * Get all reactions by a profile in a network
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: reactions array, error }
 */
export const fetchProfileReactions = async (supabase, profileId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching profile reactions:', error);
    return { error: error.message };
  }
};

/**
 * Batch fetch reaction summaries for multiple content items
 * @param {Object} supabase - Supabase client
 * @param {string} contentType - Type of content
 * @param {string[]} contentIds - Array of content IDs
 * @returns {Promise<Object>} - { data: { contentId: { emoji: { count, profileIds } } }, error }
 */
export const fetchBatchReactionSummaries = async (supabase, contentType, contentIds) => {
  if (!contentIds || contentIds.length === 0) {
    return { data: {} };
  }

  try {
    const { data, error } = await supabase
      .from('reaction_summaries')
      .select('*')
      .eq('content_type', contentType)
      .in('content_id', contentIds);

    if (error) throw error;

    // Transform to nested format: { contentId: { emoji: { count, profileIds } } }
    const summaries = {};
    if (data) {
      data.forEach(item => {
        if (!summaries[item.content_id]) {
          summaries[item.content_id] = {};
        }
        summaries[item.content_id][item.emoji] = {
          count: item.count,
          profileIds: item.profile_ids || []
        };
      });
    }

    return { data: summaries };
  } catch (error) {
    console.error('Error fetching batch reaction summaries:', error);
    return { error: error.message };
  }
};

/**
 * Subscribe to reactions for content (real-time)
 * @param {Object} supabase - Supabase client
 * @param {string} contentType - Type of content
 * @param {string} contentId - ID of the content
 * @param {Function} callback - Callback function for updates
 * @returns {Object} - Subscription object
 */
export const subscribeToReactions = (supabase, contentType, contentId, callback) => {
  return supabase
    .channel(`reactions:${contentType}:${contentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `content_type=eq.${contentType},content_id=eq.${contentId}`
      },
      callback
    )
    .subscribe();
};
