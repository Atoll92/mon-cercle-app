/**
 * Onboarding API
 * Handles onboarding checklist progress
 */

import { handleObjectError } from '../utils/errorHandling';

/**
 * Get onboarding progress for a profile
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: progress, error }
 */
export const fetchOnboardingProgress = async (supabase, profileId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('network_id', networkId)
      .single();

    if (error) {
      // If no progress exists, create it
      if (error.code === 'PGRST116') {
        const { data: newData, error: createError } = await supabase
          .from('onboarding_progress')
          .insert({ profile_id: profileId, network_id: networkId })
          .select()
          .single();

        if (createError) throw createError;
        return handleObjectError(newData);
      }
      throw error;
    }

    return handleObjectError(data);
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return { error: error.message };
  }
};

/**
 * Mark a checklist item as complete
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} networkId - Network ID
 * @param {string} itemName - Item field name
 * @returns {Promise<Object>} - { data: progress, error }
 */
export const markChecklistItemComplete = async (supabase, profileId, networkId, itemName) => {
  try {
    const timestampField = `${itemName}_at`;
    const updateData = {
      [itemName]: true,
      [timestampField]: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('onboarding_progress')
      .update(updateData)
      .eq('profile_id', profileId)
      .eq('network_id', networkId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error marking item complete:', error);
    return { error: error.message };
  }
};

/**
 * Dismiss the onboarding checklist
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: progress, error }
 */
export const dismissOnboarding = async (supabase, profileId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString()
      })
      .eq('profile_id', profileId)
      .eq('network_id', networkId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error dismissing onboarding:', error);
    return { error: error.message };
  }
};

/**
 * Reset onboarding progress (re-show checklist)
 * @param {Object} supabase - Supabase client
 * @param {string} profileId - Profile ID
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - { data: progress, error }
 */
export const resetOnboarding = async (supabase, profileId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .update({
        is_dismissed: false,
        dismissed_at: null
      })
      .eq('profile_id', profileId)
      .eq('network_id', networkId)
      .select()
      .single();

    if (error) throw error;
    return handleObjectError(data);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return { error: error.message };
  }
};

/**
 * Get checklist items with completion status
 * @param {Object} progress - Onboarding progress object
 * @returns {Array} - Array of checklist items with status
 */
export const getChecklistItems = (progress) => {
  if (!progress) return [];

  return [
    {
      id: 'completed_profile',
      label: 'Complete your profile',
      description: 'Add your bio and tagline',
      completed: progress.completed_profile || false,
      completedAt: progress.completed_profile_at,
      action: 'Edit Profile',
      route: '/profile'
    },
    {
      id: 'uploaded_profile_picture',
      label: 'Upload a profile picture',
      description: 'Help others recognize you',
      completed: progress.uploaded_profile_picture || false,
      completedAt: progress.uploaded_profile_picture_at,
      action: 'Upload Picture',
      route: '/profile'
    },
    {
      id: 'made_first_post',
      label: 'Create your first post',
      description: 'Share something with the network',
      completed: progress.made_first_post || false,
      completedAt: progress.made_first_post_at,
      action: 'Create Post',
      route: '/network'
    },
    {
      id: 'rsvp_first_event',
      label: 'RSVP to an event',
      description: 'Join an upcoming network event',
      completed: progress.rsvp_first_event || false,
      completedAt: progress.rsvp_first_event_at,
      action: 'View Events',
      route: '/network/events'
    },
    {
      id: 'sent_first_message',
      label: 'Send your first message',
      description: 'Start a conversation in chat',
      completed: progress.sent_first_message || false,
      completedAt: progress.sent_first_message_at,
      action: 'Open Chat',
      route: '/network/chat'
    },
    {
      id: 'explored_wiki',
      label: 'Explore the wiki',
      description: 'Learn about the network',
      completed: progress.explored_wiki || false,
      completedAt: progress.explored_wiki_at,
      action: 'Browse Wiki',
      route: '/network/wiki'
    },
    {
      id: 'joined_first_chat',
      label: 'Join a conversation',
      description: 'Participate in network discussions',
      completed: progress.joined_first_chat || false,
      completedAt: progress.joined_first_chat_at,
      action: 'Join Chat',
      route: '/network/chat'
    }
  ];
};
