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
 * Fetch all items for a moodboard
 * @param {string} moodboardId - The moodboard ID
 * @returns {Promise<Array>} Array of moodboard items
 */
export const fetchMoodboardItems = async (moodboardId) => {
  const { data, error } = await supabase
    .from('moodboard_items')
    .select('*')
    .eq('moodboard_id', moodboardId)
    .order('z_index', { ascending: true })
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

/**
 * Create a new moodboard
 * @param {object} moodboard - The moodboard data
 * @returns {Promise<object>} The created moodboard
 */
export const createMoodboard = async (moodboard) => {
  const { data, error } = await supabase
    .from('moodboards')
    .insert([moodboard])
    .select();
    
  if (error) throw error;
  return data[0];
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

/**
 * Delete a moodboard
 * @param {string} id - The moodboard ID
 * @returns {Promise<void>}
 */
export const deleteMoodboard = async (id) => {
  // First delete all items in the moodboard
  const { error: itemsError } = await supabase
    .from('moodboard_items')
    .delete()
    .eq('moodboard_id', id);
    
  if (itemsError) throw itemsError;
  
  // Then delete the moodboard itself
  const { error } = await supabase
    .from('moodboards')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

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
 * @param {string} userId - The user ID
 * @param {number} offset - Pagination offset
 * @param {number} limit - Number of items to fetch
 * @returns {Promise<Array>} Array of moodboard items
 */
export const getUserMoodboardItems = async (userId, offset = 0, limit = 20) => {
  try {
    // First get all moodboards created by the user
    const { data: moodboards, error: moodboardsError } = await supabase
      .from('moodboards')
      .select('id')
      .eq('created_by', userId)
      .eq('is_personal', true);
    
    if (moodboardsError) throw moodboardsError;
    
    if (!moodboards || moodboards.length === 0) {
      return [];
    }
    
    // Get all items from user's moodboards
    const moodboardIds = moodboards.map(mb => mb.id);
    const { data: items, error: itemsError } = await supabase
      .from('moodboard_items')
      .select('*')
      .in('moodboard_id', moodboardIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (itemsError) throw itemsError;
    
    return items || [];
  } catch (error) {
    console.error('Error fetching user moodboard items:', error);
    return [];
  }
};