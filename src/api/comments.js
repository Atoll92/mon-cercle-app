import { supabase } from '../supabaseclient';
import { queueCommentNotification } from '../services/emailNotificationService';

// Get comments for a social wall item (supports 'news', 'post', 'event', 'wiki')
export const getItemComments = async (itemType, itemId) => {
  try {
    // Determine which table to use based on item type
    const isEventComment = itemType === 'event';
    const isWikiComment = itemType === 'wiki';
    const tableName = isEventComment ? 'event_comments' : 
                     isWikiComment ? 'wiki_comments' : 
                     'social_wall_comments';
    
    // Build base query
    let baseQuery = supabase
      .from(tableName)
      .select(`
        *,
        profile:profiles(
          id,
          full_name,
          profile_picture_url
        )
      `);
    
    // Add filters based on item type
    if (isEventComment) {
      baseQuery = baseQuery.eq('event_id', itemId);
    } else if (isWikiComment) {
      baseQuery = baseQuery.eq('page_id', itemId);
    } else {
      baseQuery = baseQuery
        .eq('item_type', itemType)
        .eq('item_id', itemId);
    }
    
    // First get top-level comments
    const { data: topLevelComments, error: topLevelError } = await baseQuery
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (topLevelError) throw topLevelError;

    // Then get replies for each comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from(tableName)
          .select(`
            *,
            profile:profiles(
              id,
              full_name,
              profile_picture_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
          return { ...comment, replies: [] };
        }

        return { ...comment, replies: replies || [] };
      })
    );

    return { data: commentsWithReplies, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error: error.message };
  }
};

// Add a comment (supports 'news', 'post', 'event', 'wiki')
export const addComment = async (itemType, itemId, profileId, content, parentCommentId = null) => {
  try {
    // Determine which table to use based on item type
    const isEventComment = itemType === 'event';
    const isWikiComment = itemType === 'wiki';
    const tableName = isEventComment ? 'event_comments' : 
                     isWikiComment ? 'wiki_comments' : 
                     'social_wall_comments';
    
    // Build insert data based on table structure
    const insertData = {
      profile_id: profileId,
      content,
      parent_comment_id: parentCommentId
    };
    
    if (isEventComment) {
      insertData.event_id = itemId;
    } else if (isWikiComment) {
      insertData.page_id = itemId;
    } else {
      insertData.item_type = itemType;
      insertData.item_id = itemId;
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select(`
        *,
        profile:profiles(
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
      
      if (isEventComment) {
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
          .from(tableName)
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

// Delete a comment
export const deleteComment = async (commentId, itemType = null) => {
  try {
    // If itemType is provided, use it to determine the table
    // Otherwise, try both tables (for backward compatibility)
    if (itemType === 'event') {
      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    } else if (itemType === 'wiki') {
      const { error } = await supabase
        .from('wiki_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    } else if (itemType && itemType !== 'event') {
      const { error } = await supabase
        .from('social_wall_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    } else {
      // Try event_comments first, then social_wall_comments (backward compatibility)
      const { error: eventError } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);
      
      if (eventError && eventError.code !== 'PGRST116') {
        // Try social_wall_comments if not found in event_comments
        const { error: socialError } = await supabase
          .from('social_wall_comments')
          .delete()
          .eq('id', commentId);
        
        if (socialError) throw socialError;
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: error.message };
  }
};

// Hide/unhide a comment (admin only)
export const toggleCommentVisibility = async (commentId, isHidden, itemType = null) => {
  try {
    // If itemType is provided, use it to determine the table
    // Otherwise, try both tables (for backward compatibility)
    if (itemType === 'event') {
      const { error } = await supabase
        .from('event_comments')
        .update({ is_hidden: isHidden })
        .eq('id', commentId);
      
      if (error) throw error;
    } else if (itemType === 'wiki') {
      const { error } = await supabase
        .from('wiki_comments')
        .update({ is_hidden: isHidden })
        .eq('id', commentId);
      
      if (error) throw error;
    } else if (itemType && itemType !== 'event') {
      const { error } = await supabase
        .from('social_wall_comments')
        .update({ is_hidden: isHidden })
        .eq('id', commentId);
      
      if (error) throw error;
    } else {
      // Try event_comments first, then social_wall_comments (backward compatibility)
      const { error: eventError } = await supabase
        .from('event_comments')
        .update({ is_hidden: isHidden })
        .eq('id', commentId);
      
      if (eventError && eventError.code !== 'PGRST116') {
        // Try social_wall_comments if not found in event_comments
        const { error: socialError } = await supabase
          .from('social_wall_comments')
          .update({ is_hidden: isHidden })
          .eq('id', commentId);
        
        if (socialError) throw socialError;
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error toggling comment visibility:', error);
    return { error: error.message };
  }
};

// Get comment count for an item
export const getCommentCount = async (itemType, itemId) => {
  try {
    // Determine which table to use based on item type
    const isEventComment = itemType === 'event';
    const isWikiComment = itemType === 'wiki';
    const tableName = isEventComment ? 'event_comments' : 
                     isWikiComment ? 'wiki_comments' : 
                     'social_wall_comments';
    
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false);
    
    // Add filters based on item type
    if (isEventComment) {
      query = query.eq('event_id', itemId);
    } else if (isWikiComment) {
      query = query.eq('page_id', itemId);
    } else {
      query = query
        .eq('item_type', itemType)
        .eq('item_id', itemId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return { count, error: null };
  } catch (error) {
    console.error('Error getting comment count:', error);
    return { count: 0, error: error.message };
  }
};