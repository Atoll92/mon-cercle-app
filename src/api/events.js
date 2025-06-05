import { supabase } from '../supabaseclient';

/**
 * Get event participations for a user
 * @param {string} profileId - The profile ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of participations with event details
 */
export const getUserEventParticipations = async (profileId, options = {}) => {
  try {
    const { 
      onlyUpcoming = false,
      onlyAttending = false,
      includeEventDetails = true
    } = options;
    
    let query = supabase
      .from('event_participations')
      .select(includeEventDetails ? `
        *,
        events:event_id (*)
      ` : '*')
      .eq('profile_id', profileId);
    
    if (onlyAttending) {
      query = query.eq('status', 'attending');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    let participations = data || [];
    
    // Filter for upcoming events if requested
    if (onlyUpcoming && includeEventDetails) {
      const now = new Date();
      participations = participations.filter(p => 
        p.events && new Date(p.events.date) > now
      );
    }
    
    return participations;
  } catch (error) {
    console.error('Error fetching user event participations:', error);
    return [];
  }
};

/**
 * Get event participation for a specific event and user
 * @param {string} eventId - The event ID
 * @param {string} profileId - The profile ID
 * @returns {Promise<Object|null>} The participation record or null
 */
export const getEventParticipation = async (eventId, profileId) => {
  try {
    const { data, error } = await supabase
      .from('event_participations')
      .select('*')
      .eq('event_id', eventId)
      .eq('profile_id', profileId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching event participation:', error);
    return null;
  }
};

/**
 * Get all participations for an event
 * @param {string} eventId - The event ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of participations
 */
export const getEventParticipations = async (eventId, options = {}) => {
  try {
    const { 
      status = null,
      includeProfiles = true
    } = options;
    
    let query = supabase
      .from('event_participations')
      .select(includeProfiles ? `
        *,
        profiles:profile_id (
          id,
          full_name,
          contact_email,
          profile_picture_url,
          role
        )
      ` : '*')
      .eq('event_id', eventId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event participations:', error);
    return [];
  }
};

/**
 * Create or update event participation
 * @param {string} eventId - The event ID
 * @param {string} profileId - The profile ID
 * @param {string} status - The participation status
 * @returns {Promise<Object>} Result with success status
 */
export const upsertEventParticipation = async (eventId, profileId, status) => {
  try {
    const { data, error } = await supabase
      .from('event_participations')
      .upsert([{
        event_id: eventId,
        profile_id: profileId,
        status: status
      }], {
        onConflict: 'event_id,profile_id'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      data: data,
      message: 'Participation updated successfully'
    };
  } catch (error) {
    console.error('Error updating event participation:', error);
    return {
      success: false,
      error: error.message || 'Failed to update participation'
    };
  }
};

/**
 * Remove event participation
 * @param {string} eventId - The event ID
 * @param {string} profileId - The profile ID
 * @returns {Promise<Object>} Result with success status
 */
export const removeEventParticipation = async (eventId, profileId) => {
  try {
    const { error } = await supabase
      .from('event_participations')
      .delete()
      .eq('event_id', eventId)
      .eq('profile_id', profileId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Participation removed successfully'
    };
  } catch (error) {
    console.error('Error removing event participation:', error);
    return {
      success: false,
      error: error.message || 'Failed to remove participation'
    };
  }
};

/**
 * Get event details with creator info
 * @param {string} eventId - The event ID
 * @returns {Promise<Object|null>} The event with creator details
 */
export const getEventWithCreator = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('network_events')
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          profile_picture_url
        ),
        networks:network_id (
          id,
          name
        )
      `)
      .eq('id', eventId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching event with creator:', error);
    return null;
  }
};

/**
 * Get participation statistics for an event
 * @param {string} eventId - The event ID
 * @returns {Promise<Object>} Statistics object
 */
export const getEventParticipationStats = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('event_participations')
      .select('status')
      .eq('event_id', eventId);
      
    if (error) throw error;
    
    const stats = {
      total: data.length,
      attending: data.filter(p => p.status === 'attending').length,
      maybe: data.filter(p => p.status === 'maybe').length,
      not_attending: data.filter(p => p.status === 'not_attending').length
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching participation stats:', error);
    return {
      total: 0,
      attending: 0,
      maybe: 0,
      not_attending: 0
    };
  }
};

/**
 * Get upcoming events for a network
 * @param {string} networkId - The network ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of upcoming events
 */
export const getUpcomingNetworkEvents = async (networkId, options = {}) => {
  try {
    const { 
      limit = 10,
      includeParticipationStats = false
    } = options;
    
    const now = new Date().toISOString();
    
    const { data: events, error } = await supabase
      .from('network_events')
      .select('*')
      .eq('network_id', networkId)
      .gte('date', now)
      .order('date', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    if (includeParticipationStats && events && events.length > 0) {
      // Fetch participation stats for each event
      const eventsWithStats = await Promise.all(
        events.map(async (event) => {
          const stats = await getEventParticipationStats(event.id);
          return { ...event, participationStats: stats };
        })
      );
      return eventsWithStats;
    }
    
    return events || [];
  } catch (error) {
    console.error('Error fetching upcoming network events:', error);
    return [];
  }
};

/**
 * Update event view count
 * @param {string} eventId - The event ID
 * @returns {Promise<void>}
 */
export const incrementEventViews = async (eventId) => {
  try {
    const { error } = await supabase.rpc('increment', {
      table_name: 'network_events',
      row_id: eventId,
      column_name: 'view_count'
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing event views:', error);
    // Don't throw - view count is not critical
  }
};

/**
 * Check if user can edit an event
 * @param {string} eventId - The event ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether user can edit
 */
export const canEditEvent = async (eventId, userId) => {
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('network_events')
      .select('created_by, network_id')
      .eq('id', eventId)
      .single();
      
    if (eventError) throw eventError;
    
    // Check if user is creator
    if (event.created_by === userId) return true;
    
    // Check if user is network admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .eq('network_id', event.network_id)
      .single();
      
    if (profileError) throw profileError;
    
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking event edit permission:', error);
    return false;
  }
};