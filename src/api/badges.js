import { supabase } from '../supabaseclient';

// Fetch all badges for a network
export const fetchNetworkBadges = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
};

// Create a new badge
export const createBadge = async (badge) => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .insert([badge])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      badge: data,
      message: 'Badge created successfully!'
    };
  } catch (error) {
    console.error('Error creating badge:', error);
    return {
      success: false,
      message: error.message || 'Failed to create badge'
    };
  }
};

// Update a badge
export const updateBadge = async (badgeId, updates) => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .update(updates)
      .eq('id', badgeId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      badge: data,
      message: 'Badge updated successfully!'
    };
  } catch (error) {
    console.error('Error updating badge:', error);
    return {
      success: false,
      message: error.message || 'Failed to update badge'
    };
  }
};

// Delete a badge
export const deleteBadge = async (badgeId) => {
  try {
    const { error } = await supabase
      .from('badges')
      .delete()
      .eq('id', badgeId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Badge deleted successfully!'
    };
  } catch (error) {
    console.error('Error deleting badge:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete badge'
    };
  }
};

// Fetch user badges
export const fetchUserBadges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

// Award a badge to a user
export const awardBadge = async (userId, badgeId, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .insert([{
        user_id: userId,
        badge_id: badgeId,
        awarded_by: (await supabase.auth.getUser()).data.user.id,
        reason
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      userBadge: data,
      message: 'Badge awarded successfully!'
    };
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return {
        success: false,
        message: 'User already has this badge'
      };
    }
    console.error('Error awarding badge:', error);
    return {
      success: false,
      message: error.message || 'Failed to award badge'
    };
  }
};

// Revoke a badge from a user
export const revokeBadge = async (userId, badgeId) => {
  try {
    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('user_id', userId)
      .eq('badge_id', badgeId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Badge revoked successfully!'
    };
  } catch (error) {
    console.error('Error revoking badge:', error);
    return {
      success: false,
      message: error.message || 'Failed to revoke badge'
    };
  }
};

// Fetch engagement stats for a user
export const fetchUserEngagementStats = async (userId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('network_id', networkId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    
    return data || {
      posts_count: 0,
      events_attended: 0,
      messages_sent: 0,
      wiki_contributions: 0,
      polls_participated: 0,
      files_shared: 0
    };
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    return {
      posts_count: 0,
      events_attended: 0,
      messages_sent: 0,
      wiki_contributions: 0,
      polls_participated: 0,
      files_shared: 0
    };
  }
};

// Fetch top engaged users in a network
export const fetchTopEngagedUsers = async (networkId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('engagement_stats')
      .select(`
        *,
        user:profiles!user_id(
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
    return data || [];
  } catch (error) {
    console.error('Error fetching top engaged users:', error);
    return [];
  }
};

// Check and award automatic badges for a user
export const checkAndAwardAutomaticBadges = async (userId, networkId) => {
  try {
    const { error } = await supabase
      .rpc('check_and_award_badges', {
        p_user_id: userId,
        p_network_id: networkId
      });
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Badges checked and awarded'
    };
  } catch (error) {
    console.error('Error checking automatic badges:', error);
    return {
      success: false,
      message: error.message || 'Failed to check badges'
    };
  }
};

// Award badge to multiple users
export const awardBadgeToMultipleUsers = async (userIds, badgeId, reason = null) => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    const userBadges = userIds.map(userId => ({
      user_id: userId,
      badge_id: badgeId,
      awarded_by: currentUser.id,
      reason
    }));
    
    const { data, error } = await supabase
      .from('user_badges')
      .insert(userBadges)
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      awarded: data.length,
      message: `Badge awarded to ${data.length} users!`
    };
  } catch (error) {
    console.error('Error awarding badge to multiple users:', error);
    return {
      success: false,
      message: error.message || 'Failed to award badges'
    };
  }
};