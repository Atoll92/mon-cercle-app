import { supabase } from '../supabaseclient';

// ============================================
// Blog Network Functions
// ============================================

/**
 * Fetch blog details by subdomain (public access)
 * @param {string} subdomain - The blog subdomain
 * @returns {Promise<Object|null>} Blog data or null
 */
export const fetchBlogBySubdomain = async (subdomain) => {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_by_subdomain', { subdomain_param: subdomain });

    if (error) {
      console.error('Error fetching blog by subdomain:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in fetchBlogBySubdomain:', error);
    return null;
  }
};

/**
 * Fetch blog details by custom domain (public access)
 * @param {string} domain - The custom domain
 * @returns {Promise<Object|null>} Blog data or null
 */
export const fetchBlogByDomain = async (domain) => {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_by_domain', { domain_param: domain });

    if (error) {
      console.error('Error fetching blog by domain:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in fetchBlogByDomain:', error);
    return null;
  }
};

/**
 * Check if a subdomain is available
 * @param {string} subdomain - The subdomain to check
 * @returns {Promise<boolean>} True if available
 */
export const checkSubdomainAvailability = async (subdomain) => {
  try {
    const { data, error } = await supabase
      .from('networks')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking subdomain:', error);
      return false;
    }

    return !data; // Available if no data returned
  } catch (error) {
    console.error('Error in checkSubdomainAvailability:', error);
    return false;
  }
};

/**
 * Update blog settings
 * @param {string} networkId - The network/blog ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated network data
 */
export const updateBlogSettings = async (networkId, settings) => {
  try {
    const updateData = {};

    // Handle blog_settings
    if (settings.blog_settings !== undefined) {
      updateData.blog_settings = settings.blog_settings;
    }

    // Handle seo_settings
    if (settings.seo_settings !== undefined) {
      updateData.seo_settings = settings.seo_settings;
    }

    // Handle other network fields
    if (settings.name !== undefined) updateData.name = settings.name;
    if (settings.description !== undefined) updateData.description = settings.description;
    if (settings.logo_url !== undefined) updateData.logo_url = settings.logo_url;
    if (settings.background_image_url !== undefined) updateData.background_image_url = settings.background_image_url;
    if (settings.theme_color !== undefined) updateData.theme_color = settings.theme_color;
    if (settings.theme_bg_color !== undefined) updateData.theme_bg_color = settings.theme_bg_color;
    if (settings.subdomain !== undefined) updateData.subdomain = settings.subdomain?.toLowerCase();
    if (settings.custom_domain !== undefined) updateData.custom_domain = settings.custom_domain;

    const { data, error } = await supabase
      .from('networks')
      .update(updateData)
      .eq('id', networkId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBlogSettings:', error);
    throw error;
  }
};

/**
 * Convert a blog to a full network
 * @param {string} networkId - The blog network ID
 * @returns {Promise<boolean>} Success status
 */
export const convertBlogToNetwork = async (networkId) => {
  try {
    const { data, error } = await supabase
      .rpc('convert_blog_to_network', { network_uuid: networkId });

    if (error) {
      console.error('Error converting blog to network:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in convertBlogToNetwork:', error);
    throw error;
  }
};

// ============================================
// Blog Posts Functions
// ============================================

/**
 * Fetch blog posts (public access for published posts)
 * @param {string} networkId - The blog network ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of posts to fetch
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.includeUnpublished - Include unpublished (admin only)
 * @returns {Promise<Array>} Array of blog posts
 */
export const fetchBlogPosts = async (networkId, options = {}) => {
  const { limit = 20, offset = 0, includeUnpublished = false } = options;

  try {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        created_by_profile:profiles!blog_posts_created_by_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('network_id', networkId)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBlogPosts:', error);
    return [];
  }
};

/**
 * Fetch a single blog post by ID (public access for published)
 * @param {string} postId - The blog post ID
 * @returns {Promise<Object|null>} Blog post data or null
 */
export const fetchBlogPost = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        created_by_profile:profiles!blog_posts_created_by_fkey (
          id,
          full_name,
          profile_picture_url,
          bio
        ),
        network:networks!blog_posts_network_id_fkey (
          id,
          name,
          subdomain,
          custom_domain,
          blog_settings,
          seo_settings,
          logo_url,
          theme_color
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchBlogPost:', error);
    return null;
  }
};

/**
 * Create a new blog post
 * @param {Object} postData - The post data
 * @returns {Promise<Object>} Created post data
 */
export const createBlogPost = async (postData) => {
  const {
    network_id,
    title,
    content,
    media_url,
    media_type,
    media_metadata,
    media_items,
    is_featured,
    is_published,
    created_by
  } = postData;

  if (!network_id || !created_by) {
    throw new Error('Network ID and author profile ID are required');
  }

  try {
    const newPost = {
      network_id,
      title: title?.trim() || null,
      content: content || null,
      is_featured: is_featured || false,
      is_published: is_published !== false, // Default to published
      published_at: is_published !== false ? new Date().toISOString() : null,
      created_by
    };

    // Handle media - prioritize media_items array
    if (media_items && Array.isArray(media_items) && media_items.length > 0) {
      const firstMedia = media_items[0];
      newPost.media_url = firstMedia.url;
      newPost.media_type = firstMedia.type;
      newPost.media_metadata = {
        ...(firstMedia.metadata || {}),
        media_items: media_items
      };
    } else if (media_url) {
      newPost.media_url = media_url;
      newPost.media_type = media_type;
      newPost.media_metadata = media_metadata || {};
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(newPost)
      .select(`
        *,
        created_by_profile:profiles!blog_posts_created_by_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBlogPost:', error);
    throw error;
  }
};

/**
 * Update a blog post
 * @param {string} postId - The post ID
 * @param {Object} postData - The post data to update
 * @returns {Promise<Object>} Updated post data
 */
export const updateBlogPost = async (postId, postData) => {
  const {
    title,
    content,
    media_url,
    media_type,
    media_metadata,
    media_items,
    is_featured,
    is_published
  } = postData;

  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    const updateData = {
      title: title?.trim() || null,
      content: content || null
    };

    // Handle featured flag
    if (is_featured !== undefined) {
      updateData.is_featured = is_featured;
    }

    // Handle publish status
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      // Set published_at when first published
      if (is_published) {
        const { data: currentPost } = await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', postId)
          .single();

        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }

    // Handle media - prioritize media_items array
    if (media_items && Array.isArray(media_items) && media_items.length > 0) {
      const firstMedia = media_items[0];
      updateData.media_url = firstMedia.url;
      updateData.media_type = firstMedia.type;
      updateData.media_metadata = {
        ...(firstMedia.metadata || {}),
        media_items: media_items
      };
    } else if (media_url) {
      updateData.media_url = media_url;
      updateData.media_type = media_type;
      updateData.media_metadata = media_metadata || {};
    } else {
      // Clear media if none provided
      updateData.media_url = null;
      updateData.media_type = null;
      updateData.media_metadata = {};
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        *,
        created_by_profile:profiles!blog_posts_created_by_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBlogPost:', error);
    throw error;
  }
};

/**
 * Delete a blog post
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export const deleteBlogPost = async (postId) => {
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBlogPost:', error);
    throw error;
  }
};

/**
 * Toggle featured status of a blog post
 * @param {string} postId - The post ID
 * @param {boolean} isFeatured - Featured status
 * @returns {Promise<Object>} Updated post data
 */
export const toggleFeaturedPost = async (postId, isFeatured) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ is_featured: isFeatured })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling featured post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in toggleFeaturedPost:', error);
    throw error;
  }
};

/**
 * Increment view count for a blog post (public access)
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export const incrementPostViews = async (postId) => {
  try {
    const { error } = await supabase
      .rpc('increment_blog_post_views', { post_uuid: postId });

    if (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw - this is a non-critical operation
    }
  } catch (error) {
    console.error('Error in incrementPostViews:', error);
  }
};

// ============================================
// Blog Comments Functions
// ============================================

/**
 * Fetch comments for a blog post (public - approved only, admin - all)
 * @param {string} postId - The blog post ID
 * @param {boolean} includeUnapproved - Include unapproved comments (admin)
 * @returns {Promise<Array>} Array of comments in tree structure
 */
export const fetchBlogComments = async (postId, includeUnapproved = false) => {
  try {
    let query = supabase
      .from('blog_comments')
      .select(`
        *,
        profile:profiles!blog_comments_profile_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!includeUnapproved) {
      query = query.eq('is_approved', true).eq('is_hidden', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog comments:', error);
      throw error;
    }

    // Build tree structure for threaded comments
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create map of all comments
    (data || []).forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    commentMap.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        } else {
          // Parent was deleted/hidden, show as root
          rootComments.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Error in fetchBlogComments:', error);
    return [];
  }
};

/**
 * Fetch pending comments for moderation (admin only)
 * @param {string} networkId - The blog network ID
 * @returns {Promise<Array>} Array of pending comments
 */
export const fetchPendingComments = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        profile:profiles!blog_comments_profile_id_fkey (
          id,
          full_name,
          profile_picture_url
        ),
        post:blog_posts!blog_comments_post_id_fkey (
          id,
          title,
          network_id
        )
      `)
      .eq('post.network_id', networkId)
      .eq('is_approved', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending comments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPendingComments:', error);
    return [];
  }
};

/**
 * Add a comment to a blog post (supports anonymous)
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 */
export const addBlogComment = async (commentData) => {
  const {
    post_id,
    profile_id,
    author_name,
    author_email,
    content,
    parent_comment_id
  } = commentData;

  if (!post_id || !content?.trim()) {
    throw new Error('Post ID and content are required');
  }

  // For anonymous comments, require author_name
  if (!profile_id && !author_name?.trim()) {
    throw new Error('Name is required for anonymous comments');
  }

  try {
    const newComment = {
      post_id,
      profile_id: profile_id || null,
      author_name: profile_id ? null : author_name?.trim(),
      author_email: profile_id ? null : author_email?.trim() || null,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      is_approved: false, // Requires moderation by default
      is_hidden: false
    };

    const { data, error } = await supabase
      .from('blog_comments')
      .insert(newComment)
      .select(`
        *,
        profile:profiles!blog_comments_profile_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single();

    if (error) {
      console.error('Error adding blog comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addBlogComment:', error);
    throw error;
  }
};

/**
 * Approve a blog comment
 * @param {string} commentId - Comment ID
 * @param {string} approvedBy - Profile ID of approver
 * @returns {Promise<Object>} Updated comment
 */
export const approveBlogComment = async (commentId, approvedBy) => {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: approvedBy
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error approving comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in approveBlogComment:', error);
    throw error;
  }
};

/**
 * Reject/hide a blog comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Updated comment
 */
export const rejectBlogComment = async (commentId) => {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .update({ is_hidden: true })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in rejectBlogComment:', error);
    throw error;
  }
};

/**
 * Delete a blog comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
export const deleteBlogComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBlogComment:', error);
    throw error;
  }
};

/**
 * Get comment count for a blog post
 * @param {string} postId - Post ID
 * @returns {Promise<number>} Comment count
 */
export const getBlogCommentCount = async (postId) => {
  try {
    const { count, error } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_approved', true)
      .eq('is_hidden', false);

    if (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getBlogCommentCount:', error);
    return 0;
  }
};

// ============================================
// Blog Subscribers Functions
// ============================================

/**
 * Fetch subscribers for a blog (admin only)
 * @param {string} networkId - The blog network ID
 * @returns {Promise<Array>} Array of subscribers
 */
export const fetchBlogSubscribers = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('blog_subscribers')
      .select('*')
      .eq('network_id', networkId)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog subscribers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBlogSubscribers:', error);
    return [];
  }
};

/**
 * Subscribe to a blog (public access)
 * @param {string} networkId - The blog network ID
 * @param {string} email - Subscriber email
 * @returns {Promise<Object>} Subscription data
 */
export const subscribeToBlog = async (networkId, email) => {
  if (!networkId || !email?.trim()) {
    throw new Error('Network ID and email are required');
  }

  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('blog_subscribers')
      .select('id, unsubscribed_at')
      .eq('network_id', networkId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (existing.unsubscribed_at) {
        // Resubscribe
        const { data, error } = await supabase
          .from('blog_subscribers')
          .update({
            unsubscribed_at: null,
            is_verified: false,
            verification_token: crypto.randomUUID()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
      // Already subscribed
      return existing;
    }

    // New subscription
    const { data, error } = await supabase
      .from('blog_subscribers')
      .insert({
        network_id: networkId,
        email: email.toLowerCase().trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to blog:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in subscribeToBlog:', error);
    throw error;
  }
};

/**
 * Unsubscribe from a blog using token
 * @param {string} token - Unsubscribe token
 * @returns {Promise<boolean>} Success status
 */
export const unsubscribeFromBlog = async (token) => {
  try {
    const { data, error } = await supabase
      .from('blog_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in unsubscribeFromBlog:', error);
    return false;
  }
};

/**
 * Delete a subscriber (admin only)
 * @param {string} subscriberId - Subscriber ID
 * @returns {Promise<void>}
 */
export const deleteBlogSubscriber = async (subscriberId) => {
  try {
    const { error } = await supabase
      .from('blog_subscribers')
      .delete()
      .eq('id', subscriberId);

    if (error) {
      console.error('Error deleting subscriber:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBlogSubscriber:', error);
    throw error;
  }
};

// ============================================
// Blog Analytics Functions
// ============================================

/**
 * Get blog analytics summary
 * @param {string} networkId - The blog network ID
 * @returns {Promise<Object>} Analytics data
 */
export const getBlogAnalytics = async (networkId) => {
  try {
    // Get total posts and views
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, view_count, is_published, is_featured, published_at, created_at')
      .eq('network_id', networkId)
      .order('view_count', { ascending: false });

    if (postsError) throw postsError;

    // Get total subscribers
    const { count: subscriberCount, error: subError } = await supabase
      .from('blog_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId)
      .is('unsubscribed_at', null);

    if (subError) throw subError;

    // Get total approved comments
    const postIds = posts?.map(p => p.id) || [];

    let commentCount = 0;
    let pendingCommentCount = 0;

    if (postIds.length > 0) {
      const { count: approved } = await supabase
        .from('blog_comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)
        .eq('is_approved', true)
        .eq('is_hidden', false);

      const { count: pending } = await supabase
        .from('blog_comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)
        .eq('is_approved', false)
        .eq('is_hidden', false);

      commentCount = approved || 0;
      pendingCommentCount = pending || 0;
    }

    // Get comment counts per post for top posts
    const topPosts = await Promise.all(
      (posts || []).slice(0, 10).map(async (post) => {
        const count = await getBlogCommentCount(post.id);
        return { ...post, comment_count: count };
      })
    );

    const totalPosts = posts?.length || 0;
    const publishedPosts = posts?.filter(p => p.is_published).length || 0;
    const totalViews = posts?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

    return {
      totalPosts,
      publishedPosts,
      draftPosts: totalPosts - publishedPosts,
      totalViews,
      totalSubscribers: subscriberCount || 0,
      totalComments: commentCount,
      pendingComments: pendingCommentCount,
      topPosts
    };
  } catch (error) {
    console.error('Error in getBlogAnalytics:', error);
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      totalViews: 0,
      totalSubscribers: 0,
      totalComments: 0,
      pendingComments: 0,
      topPosts: []
    };
  }
};

/**
 * Get posts with view counts for analytics
 * @param {string} networkId - The blog network ID
 * @returns {Promise<Array>} Posts with analytics
 */
export const getBlogPostAnalytics = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, view_count, is_published, is_featured, published_at, created_at')
      .eq('network_id', networkId)
      .order('view_count', { ascending: false });

    if (error) throw error;

    // Get comment counts for each post
    const postsWithComments = await Promise.all(
      (data || []).map(async (post) => {
        const commentCount = await getBlogCommentCount(post.id);
        return { ...post, comment_count: commentCount };
      })
    );

    return postsWithComments;
  } catch (error) {
    console.error('Error in getBlogPostAnalytics:', error);
    return [];
  }
};
