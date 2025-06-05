import { supabase } from '../supabaseclient';

/**
 * Get a wiki page by ID
 * @param {string} pageId - The wiki page ID
 * @returns {Promise<Object|null>} The wiki page or null
 */
export const getWikiPage = async (pageId) => {
  try {
    const { data, error } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('id', pageId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    return null;
  }
};

/**
 * Get wiki pages for a network
 * @param {string} networkId - The network ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of wiki pages
 */
export const getNetworkWikiPages = async (networkId, options = {}) => {
  try {
    const { 
      orderBy = 'title',
      ascending = true,
      includeUnpublished = false,
      categoryId = null,
      limit = null,
      offset = 0
    } = options;
    
    let query = supabase
      .from('wiki_pages')
      .select('*')
      .eq('network_id', networkId)
      .order(orderBy, { ascending });
    
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }
    
    if (categoryId) {
      // Need to join with wiki_page_categories
      const { data: pageIds, error: catError } = await supabase
        .from('wiki_page_categories')
        .select('page_id')
        .eq('category_id', categoryId);
        
      if (catError) throw catError;
      
      if (pageIds && pageIds.length > 0) {
        query = query.in('id', pageIds.map(p => p.page_id));
      } else {
        return []; // No pages in this category
      }
    }
    
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching network wiki pages:', error);
    return [];
  }
};

/**
 * Create a new wiki page
 * @param {Object} pageData - The wiki page data
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Promise<Object>} Result with success status and data
 */
export const createWikiPage = async (pageData, categoryIds = []) => {
  try {
    // Create the wiki page
    const { data: page, error } = await supabase
      .from('wiki_pages')
      .insert([pageData])
      .select()
      .single();
      
    if (error) throw error;
    
    // Add categories if provided
    if (categoryIds.length > 0) {
      const categoryLinks = categoryIds.map(catId => ({
        page_id: page.id,
        category_id: catId
      }));
      
      const { error: catError } = await supabase
        .from('wiki_page_categories')
        .insert(categoryLinks);
        
      if (catError) {
        console.error('Error adding categories:', catError);
        // Don't fail the whole operation if categories fail
      }
    }
    
    return {
      success: true,
      data: page,
      message: 'Wiki page created successfully'
    };
  } catch (error) {
    console.error('Error creating wiki page:', error);
    return {
      success: false,
      error: error.message || 'Failed to create wiki page'
    };
  }
};

/**
 * Update a wiki page
 * @param {string} pageId - The wiki page ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Result with success status
 */
export const updateWikiPage = async (pageId, updates) => {
  try {
    const { error } = await supabase
      .from('wiki_pages')
      .update(updates)
      .eq('id', pageId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Wiki page updated successfully'
    };
  } catch (error) {
    console.error('Error updating wiki page:', error);
    return {
      success: false,
      error: error.message || 'Failed to update wiki page'
    };
  }
};

/**
 * Delete a wiki page
 * @param {string} pageId - The wiki page ID
 * @returns {Promise<Object>} Result with success status
 */
export const deleteWikiPage = async (pageId) => {
  try {
    const { error } = await supabase
      .from('wiki_pages')
      .delete()
      .eq('id', pageId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Wiki page deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting wiki page:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete wiki page'
    };
  }
};

/**
 * Increment view count for a wiki page
 * @param {string} pageId - The wiki page ID
 * @returns {Promise<void>}
 */
export const incrementWikiPageViews = async (pageId) => {
  try {
    const { error } = await supabase.rpc('increment', {
      table_name: 'wiki_pages',
      row_id: pageId,
      column_name: 'view_count'
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw - view count is not critical
  }
};

/**
 * Get wiki categories for a network
 * @param {string} networkId - The network ID
 * @returns {Promise<Array>} Array of categories
 */
export const getWikiCategories = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('wiki_categories')
      .select('*')
      .eq('network_id', networkId)
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wiki categories:', error);
    return [];
  }
};

/**
 * Get categories for a wiki page
 * @param {string} pageId - The wiki page ID
 * @returns {Promise<Array>} Array of category IDs
 */
export const getWikiPageCategories = async (pageId) => {
  try {
    const { data, error } = await supabase
      .from('wiki_page_categories')
      .select('category_id')
      .eq('page_id', pageId);
      
    if (error) throw error;
    return data ? data.map(item => item.category_id) : [];
  } catch (error) {
    console.error('Error fetching page categories:', error);
    return [];
  }
};

/**
 * Update categories for a wiki page
 * @param {string} pageId - The wiki page ID
 * @param {Array} categoryIds - Array of category IDs
 * @returns {Promise<Object>} Result with success status
 */
export const updateWikiPageCategories = async (pageId, categoryIds) => {
  try {
    // First delete existing categories
    const { error: deleteError } = await supabase
      .from('wiki_page_categories')
      .delete()
      .eq('page_id', pageId);
      
    if (deleteError) throw deleteError;
    
    // Then add new categories
    if (categoryIds.length > 0) {
      const categoryLinks = categoryIds.map(catId => ({
        page_id: pageId,
        category_id: catId
      }));
      
      const { error: insertError } = await supabase
        .from('wiki_page_categories')
        .insert(categoryLinks);
        
      if (insertError) throw insertError;
    }
    
    return {
      success: true,
      message: 'Categories updated successfully'
    };
  } catch (error) {
    console.error('Error updating page categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to update categories'
    };
  }
};

/**
 * Get wiki revisions for a page
 * @param {string} pageId - The wiki page ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of revisions
 */
export const getWikiRevisions = async (pageId, options = {}) => {
  try {
    const { 
      limit = 10,
      offset = 0,
      status = null
    } = options;
    
    let query = supabase
      .from('wiki_revisions')
      .select('*, profiles:edited_by(full_name, profile_picture_url)')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wiki revisions:', error);
    return [];
  }
};

/**
 * Create a wiki revision
 * @param {Object} revisionData - The revision data
 * @returns {Promise<Object>} Result with success status
 */
export const createWikiRevision = async (revisionData) => {
  try {
    const { data, error } = await supabase
      .from('wiki_revisions')
      .insert([revisionData])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      data: data,
      message: 'Revision created successfully'
    };
  } catch (error) {
    console.error('Error creating wiki revision:', error);
    return {
      success: false,
      error: error.message || 'Failed to create revision'
    };
  }
};

/**
 * Update a wiki revision status
 * @param {string} revisionId - The revision ID
 * @param {string} status - The new status ('approved' or 'rejected')
 * @param {string} reviewedBy - The reviewer's user ID
 * @returns {Promise<Object>} Result with success status
 */
export const updateWikiRevisionStatus = async (revisionId, status, reviewedBy) => {
  try {
    const { error } = await supabase
      .from('wiki_revisions')
      .update({ 
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', revisionId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: `Revision ${status} successfully`
    };
  } catch (error) {
    console.error('Error updating revision status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update revision'
    };
  }
};

/**
 * Get wiki comments for a page
 * @param {string} pageId - The wiki page ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of comments
 */
export const getWikiComments = async (pageId, options = {}) => {
  try {
    const { 
      includeHidden = false,
      orderBy = 'created_at',
      ascending = false
    } = options;
    
    let query = supabase
      .from('wiki_comments')
      .select('*, profiles:created_by(full_name, profile_picture_url)')
      .eq('page_id', pageId)
      .order(orderBy, { ascending });
    
    if (!includeHidden) {
      query = query.eq('is_hidden', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wiki comments:', error);
    return [];
  }
};

/**
 * Add a comment to a wiki page
 * @param {Object} commentData - The comment data
 * @returns {Promise<Object>} Result with success status
 */
export const addWikiComment = async (commentData) => {
  try {
    const { data, error } = await supabase
      .from('wiki_comments')
      .insert([commentData])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      data: data,
      message: 'Comment added successfully'
    };
  } catch (error) {
    console.error('Error adding wiki comment:', error);
    return {
      success: false,
      error: error.message || 'Failed to add comment'
    };
  }
};

/**
 * Hide/unhide a wiki comment
 * @param {string} commentId - The comment ID
 * @param {boolean} isHidden - Whether to hide or unhide
 * @returns {Promise<Object>} Result with success status
 */
export const toggleWikiCommentVisibility = async (commentId, isHidden) => {
  try {
    const { error } = await supabase
      .from('wiki_comments')
      .update({ is_hidden: isHidden })
      .eq('id', commentId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: `Comment ${isHidden ? 'hidden' : 'unhidden'} successfully`
    };
  } catch (error) {
    console.error('Error toggling comment visibility:', error);
    return {
      success: false,
      error: error.message || 'Failed to update comment'
    };
  }
};

/**
 * Delete a wiki comment
 * @param {string} commentId - The comment ID
 * @returns {Promise<Object>} Result with success status
 */
export const deleteWikiComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('wiki_comments')
      .delete()
      .eq('id', commentId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting wiki comment:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete comment'
    };
  }
};