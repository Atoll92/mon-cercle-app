/**
 * Leaderboard API
 * Handles fetching engagement statistics and leaderboards
 */

import { handleArrayError, handleObjectError } from '../utils/errorHandling';

/**
 * Fetch top contributors by posts
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of top users to fetch (default: 10)
 * @returns {Promise<Object>} - { data: leaderboard array, error }
 */
export const fetchTopContributors = async (supabase, networkId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select(`
        user_id,
        posts_count,
        events_attended,
        messages_sent,
        wiki_contributions,
        polls_participated,
        files_shared,
        last_active,
        profiles!inner(
          id,
          full_name,
          profile_picture_url,
          badge_count
        )
      `)
      .eq('network_id', networkId)
      .order('posts_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    return { error: error.message };
  }
};

/**
 * Fetch most active members (by messages sent)
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of top users to fetch (default: 10)
 * @returns {Promise<Object>} - { data: leaderboard array, error }
 */
export const fetchMostActiveMembers = async (supabase, networkId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select(`
        user_id,
        posts_count,
        events_attended,
        messages_sent,
        wiki_contributions,
        polls_participated,
        files_shared,
        last_active,
        profiles!inner(
          id,
          full_name,
          profile_picture_url,
          badge_count
        )
      `)
      .eq('network_id', networkId)
      .order('messages_sent', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching most active members:', error);
    return { error: error.message };
  }
};

/**
 * Fetch top event attendees
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of top users to fetch (default: 10)
 * @returns {Promise<Object>} - { data: leaderboard array, error }
 */
export const fetchTopEventAttendees = async (supabase, networkId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select(`
        user_id,
        posts_count,
        events_attended,
        messages_sent,
        wiki_contributions,
        polls_participated,
        files_shared,
        last_active,
        profiles!inner(
          id,
          full_name,
          profile_picture_url,
          badge_count
        )
      `)
      .eq('network_id', networkId)
      .order('events_attended', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return handleArrayError(data);
  } catch (error) {
    console.error('Error fetching top event attendees:', error);
    return { error: error.message };
  }
};

/**
 * Fetch overall leaderboard (combined score)
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of top users to fetch (default: 10)
 * @returns {Promise<Object>} - { data: leaderboard array, error }
 */
export const fetchOverallLeaderboard = async (supabase, networkId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select(`
        user_id,
        posts_count,
        events_attended,
        messages_sent,
        wiki_contributions,
        polls_participated,
        files_shared,
        last_active,
        profiles!inner(
          id,
          full_name,
          profile_picture_url,
          badge_count
        )
      `)
      .eq('network_id', networkId);

    if (error) throw error;

    // Calculate overall score (weighted)
    const scored = data.map(item => ({
      ...item,
      total_score:
        (item.posts_count * 5) +
        (item.events_attended * 3) +
        (item.messages_sent * 1) +
        (item.wiki_contributions * 4) +
        (item.polls_participated * 2) +
        (item.files_shared * 2)
    }));

    // Sort by score and limit
    scored.sort((a, b) => b.total_score - a.total_score);

    return { data: scored.slice(0, limit) };
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    return { error: error.message };
  }
};

/**
 * Fetch user's engagement stats and rank
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User/Profile ID
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: { stats, rank }, error }
 */
export const fetchUserEngagementStats = async (supabase, userId, networkId) => {
  try {
    // Get user stats
    const { data: userStats, error: statsError } = await supabase
      .from('engagement_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('network_id', networkId)
      .single();

    if (statsError) throw statsError;

    // Get user rank (based on total score)
    const { data: allStats, error: allError } = await supabase
      .from('engagement_stats')
      .select('user_id, posts_count, events_attended, messages_sent, wiki_contributions, polls_participated, files_shared')
      .eq('network_id', networkId);

    if (allError) throw allError;

    // Calculate scores and find rank
    const scored = allStats.map(item => ({
      user_id: item.user_id,
      total_score:
        (item.posts_count * 5) +
        (item.events_attended * 3) +
        (item.messages_sent * 1) +
        (item.wiki_contributions * 4) +
        (item.polls_participated * 2) +
        (item.files_shared * 2)
    }));

    scored.sort((a, b) => b.total_score - a.total_score);
    const userRank = scored.findIndex(item => item.user_id === userId) + 1;

    return {
      data: {
        stats: userStats,
        rank: userRank,
        totalMembers: scored.length,
        totalScore: scored.find(item => item.user_id === userId)?.total_score || 0
      }
    };
  } catch (error) {
    console.error('Error fetching user engagement stats:', error);
    return { error: error.message };
  }
};

/**
 * Fetch network engagement summary
 * @param {Object} supabase - Supabase client
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: summary, error }
 */
export const fetchNetworkEngagementSummary = async (supabase, networkId) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select('*')
      .eq('network_id', networkId);

    if (error) throw error;

    // Calculate totals
    const summary = {
      totalMembers: data.length,
      totalPosts: data.reduce((sum, item) => sum + (item.posts_count || 0), 0),
      totalEvents: data.reduce((sum, item) => sum + (item.events_attended || 0), 0),
      totalMessages: data.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
      totalWikiContributions: data.reduce((sum, item) => sum + (item.wiki_contributions || 0), 0),
      totalPolls: data.reduce((sum, item) => sum + (item.polls_participated || 0), 0),
      totalFiles: data.reduce((sum, item) => sum + (item.files_shared || 0), 0),
      averagePosts: data.length > 0 ? (data.reduce((sum, item) => sum + (item.posts_count || 0), 0) / data.length).toFixed(1) : 0,
      averageEvents: data.length > 0 ? (data.reduce((sum, item) => sum + (item.events_attended || 0), 0) / data.length).toFixed(1) : 0,
      averageMessages: data.length > 0 ? (data.reduce((sum, item) => sum + (item.messages_sent || 0), 0) / data.length).toFixed(1) : 0
    };

    return { data: summary };
  } catch (error) {
    console.error('Error fetching network engagement summary:', error);
    return { error: error.message };
  }
};
