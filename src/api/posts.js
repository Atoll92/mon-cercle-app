import { supabase } from '../supabaseclient';
import { queuePortfolioNotifications } from '../services/emailNotificationService';

/**
 * Create a new post
 * @param {Object} postData - The post data
 * @param {string} postData.title - Post title (required)
 * @param {string} postData.description - Post description/content
 * @param {string} postData.url - Optional URL link
 * @param {string} postData.profile_id - Profile ID (required)
 * @param {string} postData.category_id - Category ID (optional)
 * @param {string} postData.mediaUrl - Media URL (optional)
 * @param {string} postData.mediaType - Media type (optional)
 * @param {Object} postData.mediaMetadata - Media metadata (optional)
 * @returns {Promise<Object>} The created post data
 */
export const createPost = async (postData) => {
  const {
    title,
    description,
    url,
    profile_id,
    category_id,
    mediaUrl,
    mediaType,
    mediaMetadata
  } = postData;

  // Validate required fields
  if (!title?.trim()) {
    throw new Error('Post title is required');
  }
  
  if (!profile_id) {
    throw new Error('Profile ID is required');
  }

  try {
    // Build the post object
    const newPost = {
      profile_id,
      title: title.trim(),
      description: description || '',
      url: url || null,
      category_id: category_id || null
    };

    // Add media fields if media was uploaded
    if (mediaUrl) {
      newPost.media_url = mediaUrl;
      newPost.media_type = mediaType;
      newPost.media_metadata = mediaMetadata;
      
      // For backward compatibility, also set image_url if it's an image
      if (mediaType === 'image') {
        newPost.image_url = mediaUrl;
      }
    }
    
    console.log('Creating post:', newPost);
    
    // Insert the post
    const { error, data } = await supabase
      .from('portfolio_items')
      .insert(newPost)
      .select()
      .single();
        
    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }
    
    console.log('Post created successfully:', data);
    console.log('Created post media fields:', {
      media_url: data.media_url,
      media_type: data.media_type,
      media_metadata: data.media_metadata,
      image_url: data.image_url
    });

    // Queue email notifications to network members
    try {
      await queuePortfolioNotifications(
        data.id, 
        profile_id, 
        title, 
        description, 
        data.media_url || data.image_url
      );
    } catch (notificationError) {
      console.error('Failed to queue post notifications:', notificationError);
      // Don't throw - post creation succeeded, notification failure shouldn't break the flow
    }

    return data;
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
};

/**
 * Update an existing post
 * @param {string} postId - The post ID to update
 * @param {Object} postData - The post data to update
 * @param {string} postData.title - Post title (required)
 * @param {string} postData.description - Post description/content
 * @param {string} postData.url - Optional URL link
 * @param {string} postData.category_id - Category ID (optional)
 * @param {string} postData.mediaUrl - Media URL (optional)
 * @param {string} postData.mediaType - Media type (optional)
 * @param {Object} postData.mediaMetadata - Media metadata (optional)
 * @returns {Promise<Object>} The updated post data
 */
export const updatePost = async (postId, postData) => {
  const {
    title,
    description,
    url,
    category_id,
    mediaUrl,
    mediaType,
    mediaMetadata
  } = postData;

  // Validate required fields
  if (!title?.trim()) {
    throw new Error('Post title is required');
  }
  
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    // Build the update object
    const updateData = {
      title: title.trim(),
      description: description || '',
      url: url || null,
      category_id: category_id || null
    };

    // Add media fields if media was uploaded
    if (mediaUrl) {
      updateData.media_url = mediaUrl;
      updateData.media_type = mediaType;
      updateData.media_metadata = mediaMetadata;
      
      // For backward compatibility, also set image_url if it's an image
      if (mediaType === 'image') {
        updateData.image_url = mediaUrl;
      }
    } else {
      // If no media, clear media fields
      updateData.media_url = null;
      updateData.media_type = null;
      updateData.media_metadata = null;
      updateData.image_url = null;
    }
    
    console.log('Updating post:', postId, updateData);
    
    // Update the post
    const { error, data } = await supabase
      .from('portfolio_items')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();
        
    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }
    
    console.log('Post updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updatePost:', error);
    throw error;
  }
};

/**
 * Delete a post
 * @param {string} postId - The post ID to delete
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    console.log('Deleting post:', postId);
    
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', postId);
        
    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
    
    console.log('Post deleted successfully:', postId);
  } catch (error) {
    console.error('Error in deletePost:', error);
    throw error;
  }
};