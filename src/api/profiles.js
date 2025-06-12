import { supabase } from '../supabaseclient';


/**
 * Get a user profile by ID with specific fields (backward compatibility)
 * @param {string} userId - The user ID
 * @param {string} fields - Fields to select (defaults to '*')
 * @returns {Promise<Object>} The user profile
 */
export const getUserProfileFields = async (userId, fields = '*') => {
  try {
    // First try the old single-profile database structure (current system)
    const { data, error } = await supabase
      .from('profiles')
      .select(fields)
      .eq('id', userId)
      .single();
      
    if (error) {
      // If error is "row not found", check for multiple profiles (post-migration)
      if (error.code === 'PGRST116') {
        // Try to get the active profile first
        const { data: activeProfile } = await getActiveProfile(userId);
        
        if (activeProfile) {
          return activeProfile;
        }
        
        // Fallback to getting the first profile
        const { data: profiles } = await getUserProfiles(userId);
        
        if (profiles && profiles.length > 0) {
          return profiles[0];
        }
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile fields:', error);
    return null;
  }
};

/**
 * Get all profiles for a single user (multiple profile support)
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with data and error
 */
export const getUserProfiles = async (userId) => {
  try {
    // Try the new multiple profile structure first (post-migration)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If user_id column doesn't exist yet (pre-migration), try old structure
      if (error.code === '42703') { // Column doesn't exist
        const { data: oldData, error: oldError } = await supabase
          .from('profiles')
          .select(`
            *,
            network:networks(
              id,
              name,
              description,
              theme_color,
              logo_url
            )
          `)
          .eq('id', userId);

        if (oldError) {
          if (oldError.code === 'PGRST116') { // No rows returned
            return { data: [], error: null };
          }
          throw oldError;
        }

        // Return as array for consistency
        return { data: oldData || [], error: null };
      }
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get multiple user profiles by IDs (legacy support)
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} fields - Fields to select (defaults to '*')
 * @returns {Promise<Array>} Array of user profiles
 */
export const getUserProfilesByIds = async (userIds, fields = '*') => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(fields)
      .in('id', userIds);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
};

/**
 * Check if a user profile exists
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the profile exists
 */
export const checkProfileExists = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking profile existence:', error);
    return false;
  }
};

/**
 * Create a new user profile
 * @param {Object} profileData - The profile data
 * @returns {Promise<Object>} Result with success status and data/error
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      data: data,
      message: 'Profile created successfully'
    };
  } catch (error) {
    console.error('Error creating profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to create profile'
    };
  }
};

/**
 * Update a user profile
 * @param {string} userId - The user ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Result with success status and data/error
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      data: data,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile'
    };
  }
};

/**
 * Get user's subscription information
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Subscription info
 */
export const getUserSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_plan, trial_ends_at, storage_quota_mb')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return null;
  }
};

/**
 * Get user's notification preferences
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Notification preferences
 */
export const getUserNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email_notifications_enabled, email_frequency, email_types')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
};

/**
 * Update user's notification preferences
 * @param {string} userId - The user ID
 * @param {Object} preferences - The notification preferences
 * @returns {Promise<Object>} Result with success status
 */
export const updateUserNotificationPreferences = async (userId, preferences) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', userId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Notification preferences updated successfully'
    };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to update preferences'
    };
  }
};

/**
 * Join a user to a network
 * @param {string} userId - The user ID
 * @param {string} networkId - The network ID
 * @param {string} role - The user role (defaults to 'member')
 * @returns {Promise<Object>} Result with success status
 */
export const joinNetwork = async (userId, networkId, role = 'member') => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        network_id: networkId,
        role: role
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Successfully joined network'
    };
  } catch (error) {
    console.error('Error joining network:', error);
    return {
      success: false,
      error: error.message || 'Failed to join network'
    };
  }
};

/**
 * Leave a network
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with success status
 */
export const leaveNetwork = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        network_id: null,
        role: null
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Successfully left network'
    };
  } catch (error) {
    console.error('Error leaving network:', error);
    return {
      success: false,
      error: error.message || 'Failed to leave network'
    };
  }
};

/**
 * Get profiles by email
 * @param {string} email - The email address
 * @returns {Promise<Object>} The user profile or null
 */
export const getProfileByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('contact_email', email)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return null;
  }
};

/**
 * Search users by name or email within a network
 * @param {string} networkId - The network ID
 * @param {string} searchTerm - The search term
 * @param {number} limit - Maximum results (defaults to 10)
 * @returns {Promise<Array>} Array of matching profiles
 */
export const searchNetworkUsers = async (networkId, searchTerm, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, profile_picture_url, role')
      .eq('network_id', networkId)
      .or(`full_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
      .limit(limit);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching network users:', error);
    return [];
  }
};

/**
 * Get user's storage quota information
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Storage quota info
 */
export const getUserStorageQuota = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('storage_quota_mb, storage_used_mb')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return {
      quota: data.storage_quota_mb || 0,
      used: data.storage_used_mb || 0,
      remaining: (data.storage_quota_mb || 0) - (data.storage_used_mb || 0)
    };
  } catch (error) {
    console.error('Error fetching storage quota:', error);
    return {
      quota: 0,
      used: 0,
      remaining: 0
    };
  }
};

/**
 * Check if user is network admin
 * @param {string} userId - The user ID
 * @param {string} networkId - The network ID
 * @returns {Promise<boolean>} Whether user is admin
 */
export const isNetworkAdmin = async (userId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .eq('network_id', networkId)
      .single();
      
    if (error) throw error;
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Update user's theme preference
 * @param {string} userId - The user ID
 * @param {string} theme - The theme ('light' or 'dark')
 * @returns {Promise<Object>} Result with success status
 */
export const updateUserTheme = async (userId, theme) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ theme_preference: theme })
      .eq('id', userId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Theme preference updated'
    };
  } catch (error) {
    console.error('Error updating theme:', error);
    return {
      success: false,
      error: error.message || 'Failed to update theme'
    };
  }
};

// ===== NEW MULTIPLE PROFILE FUNCTIONS =====

/**
 * Create profile for specific network
 * @param {string} userId - The user ID
 * @param {string} networkId - The network ID
 * @param {Object} profileData - The profile data
 * @returns {Promise<Object>} Result with data and error
 */
export const createProfileForNetwork = async (userId, networkId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        network_id: networkId,
        full_name: profileData.full_name,
        contact_email: profileData.contact_email,
        bio: profileData.bio || '',
        profile_picture_url: profileData.profile_picture_url,
        skills: profileData.skills || [],
        role: 'member' // New profiles start as members
      })
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get profile by user and network
 * @param {string} userId - The user ID
 * @param {string} networkId - The network ID
 * @returns {Promise<Object>} Result with data and error
 */
export const getProfileByUserAndNetwork = async (userId, networkId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .eq('network_id', networkId)
      .maybeSingle();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile by user and network:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get profile by ID
 * @param {string} profileId - The profile ID
 * @returns {Promise<Object>} Result with data and error
 */
export const getProfileById = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .eq('id', profileId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    return { data: null, error: error.message };
  }
};

// Cookie management for active profile
const ACTIVE_PROFILE_COOKIE = 'activeProfileId';

/**
 * Set active profile (save to cookie)
 * @param {string} profileId - The profile ID to set as active
 * @returns {Promise<Object>} Result with data and error
 */
export const setActiveProfile = async (profileId) => {
  try {
    // Save to localStorage for now (we can switch to secure cookies later)
    localStorage.setItem(ACTIVE_PROFILE_COOKIE, profileId);
    
    // Fetch the profile data to return
    const { data: profile, error } = await getProfileById(profileId);
    
    if (error) throw new Error(error);

    return { data: profile, error: null };
  } catch (error) {
    console.error('Error setting active profile:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get active profile from cookie
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with data and error
 */
export const getActiveProfile = async (userId) => {
  try {
    const activeProfileId = localStorage.getItem(ACTIVE_PROFILE_COOKIE);
    
    if (!activeProfileId) {
      return { data: null, error: null };
    }
    
    // Verify the profile belongs to the user and fetch full data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .eq('id', activeProfileId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // If user_id column doesn't exist yet (pre-migration), just clear the cookie
      if (error.code === '42703') {
        localStorage.removeItem(ACTIVE_PROFILE_COOKIE);
        return { data: null, error: null };
      }
      
      // Profile not found or doesn't belong to user, clear the cookie
      localStorage.removeItem(ACTIVE_PROFILE_COOKIE);
      return { data: null, error: null };
    }

    return { data: profile, error: null };
  } catch (error) {
    console.error('Error getting active profile:', error);
    localStorage.removeItem(ACTIVE_PROFILE_COOKIE);
    return { data: null, error: error.message };
  }
};

/**
 * Clear active profile
 * @returns {Promise<Object>} Result with data and error
 */
export const clearActiveProfile = async () => {
  try {
    localStorage.removeItem(ACTIVE_PROFILE_COOKIE);
    return { data: null, error: null };
  } catch (error) {
    console.error('Error clearing active profile:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update profile
 * @param {string} profileId - The profile ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Result with data and error
 */
export const updateProfile = async (profileId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select(`
        *,
        network:networks(
          id,
          name,
          description,
          theme_color,
          logo_url
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete profile
 * @param {string} profileId - The profile ID
 * @param {string} userId - The user ID (for ownership verification)
 * @returns {Promise<Object>} Result with success and error
 */
export const deleteProfile = async (profileId, userId) => {
  try {
    // Verify ownership before deletion - with fallback for old schema
    let profile = null;
    let useOldSchema = false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();
        
      if (error && error.message?.includes('user_id') && error.message?.includes('does not exist')) {
        useOldSchema = true;
      } else if (error) {
        throw error;
      } else {
        profile = data;
      }
    } catch (error) {
      if (error.message?.includes('user_id') && error.message?.includes('does not exist')) {
        useOldSchema = true;
      } else {
        throw error;
      }
    }
    
    if (useOldSchema) {
      // OLD SCHEMA: In old schema, profile.id = user.id, so just verify the profileId matches userId
      if (profileId !== userId) {
        throw new Error('Unauthorized: Cannot delete profile that does not belong to you');
      }
    } else {
      // NEW SCHEMA: Check user_id field
      if (profile.user_id !== userId) {
        throw new Error('Unauthorized: Cannot delete profile that does not belong to you');
      }
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;

    // Clear active profile if it was the deleted one
    const activeProfileId = localStorage.getItem(ACTIVE_PROFILE_COOKIE);
    if (activeProfileId === profileId) {
      localStorage.removeItem(ACTIVE_PROFILE_COOKIE);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile:', error);
    return { success: false, error: error.message };
  }
};