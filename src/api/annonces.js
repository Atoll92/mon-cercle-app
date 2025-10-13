// File: src/api/annonces.js
// API functions for annonces moderation

import { supabase } from '../supabaseclient';

/**
 * Fetch annonces for a network with optional status filter
 * @param {string} networkId - Network ID
 * @param {string|null} status - Status filter: 'pending', 'approved', 'rejected', or null for all
 * @returns {Promise<Array>} Array of annonces
 */
export const fetchAnnonces = async (networkId, status = null) => {
  try {
    let query = supabase
      .from('annonces_moderation')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching annonces:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching annonces:', error);
    throw error;
  }
};

/**
 * Moderate an annonce (approve, reject, or change category) WITHOUT Sympa sync
 * @param {string} annonceId - Annonce ID
 * @param {string|null} status - New status: 'approved', 'rejected', 'pending', or null to keep current
 * @param {string|null} category - New category or null to keep current
 * @returns {Promise<Object>} Updated annonce
 */
export const moderateAnnonce = async (annonceId, status = null, category = null) => {
  try {
    const updates = {
      updated_at: new Date().toISOString()
    };

    // Update status if provided
    if (status) {
      updates.status = status;
      updates.moderated_at = new Date().toISOString();
    }

    // Update category if provided
    if (category !== null) {
      updates.category = category;
    }

    const { data, error } = await supabase
      .from('annonces_moderation')
      .update(updates)
      .eq('id', annonceId)
      .select()
      .single();

    if (error) {
      console.error('Error moderating annonce:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error moderating annonce:', error);
    throw error;
  }
};

/**
 * Moderate an annonce with batched Sympa sync (approve/reject)
 * This schedules the moderation command to be sent at 18h daily
 * @param {string} annonceId - Annonce ID
 * @param {string} status - New status: 'approved' or 'rejected'
 * @param {string|null} category - Category to assign (optional)
 * @returns {Promise<Object>} Result with success status
 */
export const moderateAnnonceWithSympa = async (annonceId, status, category = null) => {
  try {
    // Calculate next 18h send time (today at 18:00 or tomorrow at 18:00)
    const now = new Date();
    const today18h = new Date(now);
    today18h.setHours(18, 0, 0, 0);

    // If it's already past 18h today, schedule for tomorrow at 18h
    const scheduledSendAt = now > today18h
      ? new Date(today18h.getTime() + 24 * 60 * 60 * 1000)
      : today18h;

    const updates = {
      updated_at: new Date().toISOString()
    };

    // Update status if provided
    if (status) {
      updates.status = status;
      updates.moderated_at = new Date().toISOString();
      updates.scheduled_send_at = scheduledSendAt.toISOString();
      updates.synced_to_sympa = false; // Reset sync flag
      updates.sent_at = null; // Clear previous sent_at if any
    }

    // Update category if provided
    if (category !== null) {
      updates.category = category;
    }

    const { data, error } = await supabase
      .from('annonces_moderation')
      .update(updates)
      .eq('id', annonceId)
      .select()
      .single();

    if (error) {
      console.error('Error moderating annonce:', error);
      throw error;
    }

    return {
      success: true,
      data,
      scheduledSendAt: scheduledSendAt.toISOString(),
      message: `Moderation scheduled for ${scheduledSendAt.toLocaleString()}`
    };
  } catch (error) {
    console.error('Error moderating annonce with Sympa:', error);
    throw error;
  }
};

/**
 * Create a new annonce (for testing or manual creation)
 * @param {Object} annonceData - Annonce data
 * @returns {Promise<Object>} Created annonce
 */
export const createAnnonce = async (annonceData) => {
  try {
    const { data, error } = await supabase
      .from('annonces_moderation')
      .insert(annonceData)
      .select()
      .single();

    if (error) {
      console.error('Error creating annonce:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating annonce:', error);
    throw error;
  }
};
