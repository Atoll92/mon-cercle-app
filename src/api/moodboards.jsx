import { supabase } from '../supabaseclient';

/**
 * Fetch a moodboard by ID
 * @param {string} id - The moodboard ID
 * @returns {Promise<object>} The moodboard data
 */
export const fetchMoodboard = async (id) => {
  const { data, error } = await supabase
    .from('moodboards')
    .select(`
      *,
      profiles:created_by (full_name, profile_picture_url)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Get or create user's moodboard (micro conclav)
 * Each user can only have one moodboard
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The user's moodboard
 */
export const getUserMoodboard = async (userId) => {
  // First try to get existing moodboard
  const { data: existing, error: fetchError } = await supabase
    .from('moodboards')
    .select('*')
    .eq('created_by', userId)
    .single();
    
  if (existing) return existing;
  
  // If no moodboard exists, create one
  if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
    const { data, error } = await supabase
      .from('moodboards')
      .insert([{
        created_by: userId,
        title: 'My Micro Conclav',
        description: 'Welcome to my personal space',
        background_color: '#f5f5f5'
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  if (fetchError) throw fetchError;
};

/**
 * Update a moodboard
 * @param {string} id - The moodboard ID
 * @param {object} updates - The fields to update
 * @returns {Promise<object>} The updated moodboard
 */
export const updateMoodboard = async (id, updates) => {
  const { data, error } = await supabase
    .from('moodboards')
    .update({
      ...updates,
      updated_at: new Date()
    })
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Moodboard deletion is now disabled - users always have one moodboard

/**
 * Add an item to a moodboard
 * @param {object} item - The item data
 * @returns {Promise<object>} The created item
 */
export const addMoodboardItem = async (item) => {
  const { data, error } = await supabase
    .from('moodboard_items')
    .insert([item])
    .select();
    
  if (error) throw error;
  return data[0];
};

/**
 * Update a moodboard item
 * @param {string} id - The item ID
 * @param {object} updates - The fields to update
 * @returns {Promise<object>} The updated item
 */
export const updateMoodboardItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('moodboard_items')
    .update({
      ...updates,
      updated_at: new Date()
    })
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

/**
 * Delete a moodboard item
 * @param {string} id - The item ID
 * @returns {Promise<void>}
 */
export const deleteMoodboardItem = async (id) => {
  const { error } = await supabase
    .from('moodboard_items')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

/**
 * Upload an image to a moodboard
 * @param {File} file - The image file
 * @param {string} moodboardId - The moodboard ID
 * @returns {Promise<string>} The image URL
 */
export const uploadMoodboardImage = async (file, moodboardId) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `moodboards/${moodboardId}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('shared')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (uploadError) throw uploadError;
  
  const { data: { publicUrl } } = supabase.storage
    .from('shared')
    .getPublicUrl(filePath);
    
  return publicUrl;
};

/**
 * Fetch all personal moodboard items for a user
 * @param {string} profileId - The profile ID (not auth user ID)
 * @param {number} offset - Pagination offset
 * @param {number} limit - Number of items to fetch
 * @returns {Promise<Array>} Array of moodboard items
 */
export const getUserMoodboardItems = async (profileId, offset = 0, limit = 20) => {
  try {
    // Get the user's single moodboard (micro conclav)
    const { data: moodboard, error: moodboardError } = await supabase
      .from('moodboards')
      .select('id, background_color')
      .eq('created_by', profileId)
      .single();
    
    if (moodboardError) throw moodboardError;
    
    if (!moodboard) {
      return { items: [], backgroundColor: null };
    }
    
    // Get all items from user's moodboard
    const { data: items, error: itemsError } = await supabase
      .from('moodboard_items')
      .select('*')
      .eq('moodboard_id', moodboard.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (itemsError) throw itemsError;
    
    // Return items and the background color
    return {
      items: items || [],
      backgroundColor: moodboard.background_color || null
    };
  } catch (error) {
    console.error('Error fetching user moodboard items:', error);
    return { items: [], backgroundColor: null };
  }
};