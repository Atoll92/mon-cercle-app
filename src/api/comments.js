import { supabase } from '../supabaseclient';

// Get comments for a social wall item
export const getItemComments = async (itemType, itemId) => {
  try {
    const { data, error } = await supabase
      .from('social_wall_comments')
      .select(`
        *,
        profile:profiles!social_wall_comments_profile_id_fkey(
          id,
          full_name,
          profile_picture_url
        ),
        replies:social_wall_comments!social_wall_comments_parent_comment_id_fkey(
          *,
          profile:profiles!social_wall_comments_profile_id_fkey(
            id,
            full_name,
            profile_picture_url
          )
        )
      `)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error: error.message };
  }
};

// Add a comment
export const addComment = async (itemType, itemId, profileId, content, parentCommentId = null) => {
  try {
    const { data, error } = await supabase
      .from('social_wall_comments')
      .insert([{
        item_type: itemType,
        item_id: itemId,
        profile_id: profileId,
        content,
        parent_comment_id: parentCommentId
      }])
      .select(`
        *,
        profile:profiles!social_wall_comments_profile_id_fkey(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { data: null, error: error.message };
  }
};

// Delete a comment
export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('social_wall_comments')
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
    const { error } = await supabase
      .from('social_wall_comments')
      .update({ is_hidden: isHidden })
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
    const { count, error } = await supabase
      .from('social_wall_comments')
      .select('*', { count: 'exact', head: true })
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('is_hidden', false);

    if (error) throw error;
    return { count, error: null };
  } catch (error) {
    console.error('Error getting comment count:', error);
    return { count: 0, error: error.message };
  }
};