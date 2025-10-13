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
 * Moderate an annonce with Sympa sync (approve/reject)
 * This triggers the Edge Function to send the command to Sympa
 * @param {string} annonceId - Annonce ID
 * @param {string} status - New status: 'approved' or 'rejected'
 * @param {string|null} category - Category to assign (optional)
 * @returns {Promise<Object>} Result with success status and sync info
 */
export const moderateAnnonceWithSympa = async (annonceId, status, category = null) => {
  try {
    // First, update the annonce in the database
    await moderateAnnonce(annonceId, status, category);

    // Only sync with Sympa if there's a status change (not just category update)
    if (status) {
      // Then, invoke the Sympa moderation Edge Function
      const { data, error } = await supabase.functions.invoke('sympa-moderate-message', {
        body: {
          annonceId,
          action: status
        }
      });

      if (error) {
        console.error('Error invoking Sympa moderation function:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Extract error message from the response
        let errorMessage = 'Failed to sync with Sympa';
        if (error.context?.body) {
          try {
            const errorBody = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body;
            errorMessage = errorBody.error || errorMessage;
          } catch (e) {
            console.error('Could not parse error body:', e);
          }
        }

        throw new Error(errorMessage);
      }

      return data;
    }

    // If no status change, just return success
    return { success: true };
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
