import { supabase } from '../supabaseclient';
import { queueCommentNotification } from '../services/emailNotificationService';

// Recursive function to build comment tree with unlimited depth
const buildCommentTree = (comments, parentId = null) => {
  const children = comments.filter(comment => comment.parent_comment_id === parentId);
  
  return children.map(comment => ({
    ...comment,
    replies: buildCommentTree(comments, comment.id)
  }));
};

// Get comments for any item type with unlimited threading depth
export const getItemComments = async (itemType, itemId) => {
  try {
    // Map item type to the correct foreign key field
    const entityField = `${itemType}_id`;
    
    // Get ALL comments for this item in one query
    const { data: allComments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!comments_profile_id_fkey(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq(entityField, itemId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build the comment tree with unlimited depth
    const commentTree = buildCommentTree(allComments || []);
    
    // Sort top-level comments by creation date (newest first)
    commentTree.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { data: commentTree, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error: error.message };
  }
};

// Add a comment to any item type
export const addComment = async (itemType, itemId, profileId, content, parentCommentId = null) => {
  try {
    // Map the item type to the correct entity type and field
    const entityType = itemType;
    const entityField = `${itemType}_id`;
    
    // Build insert data
    const insertData = {
      profile_id: profileId,
      content,
      parent_comment_id: parentCommentId,
      entity_type: entityType,
      [entityField]: itemId
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([insertData])
      .select(`
        *,
        profile:profiles!comments_profile_id_fkey(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) throw error;
    
    // Queue notification for comment
    try {
      console.log('🔔 Queueing comment notification...');
      
      // Get the item details to determine who should be notified
      let originalPosterId = null;
      let postTitle = '';
      
      if (itemType === 'event') {
        // Get event creator
        const { data: event } = await supabase
          .from('network_events')
          .select('created_by, title')
          .eq('id', itemId)
          .single();
        
        if (event) {
          originalPosterId = event.created_by;
          postTitle = event.title;
        }
      } else if (itemType === 'news') {
        // Get news post creator
        const { data: news } = await supabase
          .from('network_news')
          .select('created_by, title')
          .eq('id', itemId)
          .single();
        
        if (news) {
          originalPosterId = news.created_by;
          postTitle = news.title;
        }
      } else if (itemType === 'post') {
        // Get portfolio post creator
        const { data: post } = await supabase
          .from('portfolio_items')
          .select('profile_id, title')
          .eq('id', itemId)
          .single();
        
        if (post) {
          originalPosterId = post.profile_id;
          postTitle = post.title;
        }
      } else if (itemType === 'wiki') {
        // Get wiki page creator
        const { data: page } = await supabase
          .from('wiki_pages')
          .select('created_by, title')
          .eq('id', itemId)
          .single();
        
        if (page) {
          originalPosterId = page.created_by;
          postTitle = page.title;
        }
      }
      
      // If this is a reply, also get the parent comment author
      let parentCommentAuthorId = null;
      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('profile_id')
          .eq('id', parentCommentId)
          .single();
        
        if (parentComment) {
          parentCommentAuthorId = parentComment.profile_id;
        }
      }
      
      // Queue notifications
      await queueCommentNotification({
        itemType,
        itemId,
        commentId: data.id,
        commenterId: profileId,
        commenterName: data.profile?.full_name || 'Someone',
        content,
        originalPosterId,
        parentCommentAuthorId,
        postTitle,
        isReply: !!parentCommentId
      });
      
    } catch (notificationError) {
      console.error('Failed to queue comment notification:', notificationError);
      // Don't throw - comment creation succeeded, notification failure shouldn't break the flow
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { data: null, error: error.message };
  }
};

// Update a comment
export const updateComment = async (commentId, content) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ 
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        profile:profiles!comments_profile_id_fkey(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { data: null, error: error.message };
  }
};

// Delete a comment
export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: error.message };
  }
};

// Hide/unhide a comment (admin only)
export const toggleCommentVisibility = async (commentId, isHidden) => {
  try {
    const updateData = { 
      is_hidden: isHidden,
      hidden_at: isHidden ? new Date().toISOString() : null
    };
    
    // If hiding, we should also set hidden_by (would need to pass profileId)
    const { error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', commentId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error toggling comment visibility:', error);
    return { error: error.message };
  }
};

// Get comment count for an item
export const getCommentCount = async (itemType, itemId) => {
  try {
    // Map item type to the correct foreign key field
    const entityField = `${itemType}_id`;
    
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq(entityField, itemId)
      .eq('is_hidden', false);

    if (error) throw error;
    return { count, error: null };
  } catch (error) {
    console.error('Error getting comment count:', error);
    return { count: 0, error: error.message };
  }
};