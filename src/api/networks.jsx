import { supabase } from '../supabaseclient';
import { queueNewsNotifications, queueEventNotifications, queueMentionNotification } from '../services/emailNotificationService';

// Storage limits by subscription plan (in MB)
const STORAGE_LIMITS = {
  free: 2 * 1024,           // 2GB
  family: 2 * 1024,         // 2GB
  community: 10 * 1024,     // 10GB
  nonprofit: 50 * 1024,     // 50GB
  organization: 100 * 1024, // 100GB
  network: 1024 * 1024,     // 1TB
  business: 5 * 1024 * 1024, // 5TB
  enterprise: Infinity      // Unlimited
};

// Get storage limit for a plan
export const getStorageLimit = (plan) => {
  return STORAGE_LIMITS[plan?.toLowerCase()] || STORAGE_LIMITS.free;
};

// Calculate storage usage for a network
export const calculateNetworkStorage = async (networkId) => {
  try {
    let totalSize = 0;
    
    // 1. Get network_files table data (these have explicit file sizes)
    const { data: dbFiles, error: dbError } = await supabase
      .from('network_files')
      .select('file_size')
      .eq('network_id', networkId);
    
    if (!dbError && dbFiles) {
      const dbFileSize = dbFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
      totalSize += dbFileSize;
    }
    
    // 2. Get all network members
    const { data: networkMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('network_id', networkId);
    
    if (networkMembers && networkMembers.length > 0) {
      const memberIds = networkMembers.map(m => m.id);
      
      // 3. Count portfolio items with media from network members
      const { count: portfolioMediaCount } = await supabase
        .from('portfolio_items')
        .select('*', { count: 'exact', head: true })
        .in('profile_id', memberIds)
        .or('media_url.not.is.null,image_url.not.is.null');
      
      // 4. Count member profile pictures
      const { count: profilePicCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', memberIds)
        .not('profile_picture_url', 'is', null);
      
      // Add portfolio media (avg 2MB per item)
      totalSize += (portfolioMediaCount || 0) * 2 * 1024 * 1024;
      
      // Add profile pictures (avg 500KB per profile)
      totalSize += (profilePicCount || 0) * 500 * 1024;
    }
    
    // 5. Count network news media
    const { count: newsMediaCount } = await supabase
      .from('network_news')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId)
      .or('media_url.not.is.null,image_url.not.is.null');
    
    // 6. Count messages with media in network chat
    const { count: messageMediaCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId)
      .not('media_url', 'is', null);
    
    // 7. Count wiki pages with content (estimate 100KB per page for embedded images)
    const { count: wikiPageCount } = await supabase
      .from('wiki_pages')
      .select('*', { count: 'exact', head: true })
      .eq('network_id', networkId)
      .eq('is_published', true);
    
    // 8. Count moodboard items (images, etc)
    const { count: moodboardItemCount } = await supabase
      .from('moodboard_items')
      .select('moodboards!inner(network_id)', { count: 'exact', head: true })
      .eq('moodboards.network_id', networkId)
      .eq('type', 'image');
    
    // Add news media (avg 1.5MB per item - mix of images and videos)
    totalSize += (newsMediaCount || 0) * 1.5 * 1024 * 1024;
    
    // Add message media (avg 2MB per item - could be images, videos, audio)
    totalSize += (messageMediaCount || 0) * 2 * 1024 * 1024;
    
    // Add wiki content (avg 100KB per page for embedded content)
    totalSize += (wikiPageCount || 0) * 100 * 1024;
    
    // Add moodboard items (avg 1MB per image)
    totalSize += (moodboardItemCount || 0) * 1 * 1024 * 1024;
    
    // 9. Add estimate for network logo and background images (5MB total)
    totalSize += 5 * 1024 * 1024;
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating network storage:', error);
    return 0;
  }
};

// Get network storage info (usage and limit)
export const getNetworkStorageInfo = async (networkId) => {
  try {
    // Get network details to know the subscription plan
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('subscription_plan')
      .eq('id', networkId)
      .single();
    
    if (networkError) throw networkError;
    
    // Calculate storage usage
    const usageBytes = await calculateNetworkStorage(networkId);
    const usageMB = Math.round(usageBytes / (1024 * 1024));
    
    // Get storage limit based on plan
    const plan = network.subscription_plan || 'free';
    const limitMB = getStorageLimit(plan);
    
    // Calculate percentage used
    const percentageUsed = limitMB === Infinity ? 0 : Math.round((usageMB / limitMB) * 100);
    
    return {
      usageMB,
      limitMB,
      percentageUsed,
      plan,
      isUnlimited: limitMB === Infinity,
      isAtLimit: percentageUsed >= 100
    };
  } catch (error) {
    console.error('Error getting network storage info:', error);
    return {
      usageMB: 0,
      limitMB: getStorageLimit('free'),
      percentageUsed: 0,
      plan: 'free',
      isUnlimited: false,
      isAtLimit: false
    };
  }
};

const fetchNetworkMembers = async (networkId, options = {}) => {
    //the callers of this function never seem to pass options or check for paging. with enough members this might start to cause issues.
    try {
        if (!networkId) {
            console.error('fetchNetworkMembers: networkId is required');
            return {
                members: [],
                totalCount: 0,
                currentPage: 1,
                totalPages: 0,
                hasMore: false
            };
        }

        const { 
            page = 1, 
            limit = 5000,
            orderBy = 'full_name',
            ascending = true,
            search = null
        } = options;
        
        console.log('Fetching network members for network:', networkId, 'with options:', options);
        
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        // Build query with badge count
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('network_id', networkId)
            .order(orderBy, { ascending })
            .range(offset, offset + limit - 1);
            
        // Add search filter if provided
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
        }
        
        const { data, error, count } = await query;
    
        if (error) {
            console.error("Error fetching network members:", {
                error,
                networkId,
                options,
                errorCode: error.code,
                errorMessage: error.message
            });
            throw error;
        }
        
        // Process members and add badge count as 0 for now (can be fetched separately if needed)
        const processedMembers = (data || []).map(member => ({
            ...member,
            badge_count: 0 // TODO: Fetch badge count separately if needed
        }));
        
        console.log(`Found ${processedMembers.length} network members (total: ${count})`);

        return {
            members: processedMembers,
            totalCount: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit),
            hasMore: offset + limit < (count || 0)
        };
    } catch (error) {
        console.error("Error fetching network members:", error);
        return {
            members: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            hasMore: false
        };
    }
};

 const fetchNetworkDetails = async (networkId) => {
    try {
      // console.log('Fetching network details for network:', networkId);
      
      // Fetch network data
      const { data: networkData, error: networkError } = await supabase
        .from('networks')
        .select('*')
        .eq('id', networkId)
        .single();
        
      if (networkError) throw networkError;
      
      // Fetch member count
      const { count: memberCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('network_id', networkId);
      
      if (countError) {
        console.warn('Error fetching member count:', countError);
      }
      
      // Add member count to network data
      const dataWithCount = {
        ...networkData,
        member_count: memberCount || 0
      };
      
      // console.log('Network details with member count:', dataWithCount);
      return dataWithCount;
    } catch (error) {
      console.error("Error fetching network details:", error);
      return null;
    }
  };

export {
    fetchNetworkMembers ,
    fetchNetworkDetails
}


// New API functions for admin operations
// MULTIPLE PROFILES SUPPORT: Supports users having multiple profiles across networks
// 1. Check if user already has a profile in this specific network
// 2. If existing auth user, create a new profile for them in this network 
// 3. If new user, send invitation link for them to sign up and join
export const inviteUserToNetwork = async (email, networkId, inviterId, role = 'member') => {
  try {
    // Step 1: Check if user already has a profile in this specific network
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, network_id, contact_email, full_name')
      .eq('contact_email', email.toLowerCase())
      .eq('network_id', networkId)
      .maybeSingle();
        
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    if (existingProfile) {
      // User already has a profile in this network
      return { 
        success: false, 
        message: 'This user is already in your network.'
      };
    }
    
    // Step 2: Check if this email belongs to an existing auth user
    // Try new schema first (with user_id column), fallback to old schema
    let authUser = null;
    let useOldSchema = false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, contact_email, full_name')
        .eq('contact_email', email.toLowerCase())
        .limit(1)
        .maybeSingle();
        
      if (error && error.message?.includes('user_id') && error.message?.includes('does not exist')) {
        // user_id column doesn't exist - database migration not done yet
        useOldSchema = true;
      } else if (error && error.code !== 'PGRST116') {
        throw error;
      } else {
        authUser = data;
      }
    } catch (error) {
      if (error.message?.includes('user_id') && error.message?.includes('does not exist')) {
        useOldSchema = true;
      } else {
        throw error;
      }
    }
    
    if (useOldSchema) {
      // FALLBACK: Use old schema behavior (pre-migration)
      const { data: _anyExistingProfile } = await supabase
        .from('profiles')
        .select('id, network_id, contact_email, full_name')
        .eq('contact_email', email.toLowerCase())
        .maybeSingle();
        
      // Remove legacy code that updates network_id for profiles without networks
      // In the new system, profiles are always created with a network_id
    } else if (authUser?.user_id) {
      // NEW SCHEMA: Existing user - create a new profile for them in this network
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authUser.user_id,
          network_id: networkId,
          contact_email: email.toLowerCase(),
          full_name: authUser.full_name || '',
          role: role
        }])
        .select()
        .single();
          
      if (createError) throw createError;

      // Update any pending invitations for this user to 'accepted'
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('email', email.toLowerCase())
        .eq('network_id', networkId)
        .eq('status', 'pending');

      // Send notification to existing user about the new network
      try {
        await supabase.functions.invoke('network-invite', {
          body: {
            toEmail: email,
            networkName: (await fetchNetworkDetails(networkId)).name,
            inviterName: (await getUserProfile(inviterId)).full_name || 'Network Admin',
            type: 'existing_user_new_network'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't throw - profile was created successfully
      }
      
      return { 
        success: true, 
        message: `User ${email} added to your network! They've been notified about this new network.`
      };
    }
    
    // Step 3b: New user OR old schema fallback - create invitation link for signup
    {
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_invitation_code');
      
      if (codeError) throw codeError;
      
      // Create invitation link with email-specific metadata
      const { error: linkError } = await supabase
        .from('network_invitation_links')
        .insert([{
          network_id: networkId,
          created_by: inviterId,
          code: codeResult,
          name: `Email invitation for ${email}`,
          description: `Invitation sent via email to ${email}`,
          role: role,
          max_uses: 1, // Single use for specific email
          is_active: true
        }])
        .select()
        .single();
      
      if (linkError) throw linkError;
      
      // Store the email in invitations table for tracking
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{ 
          email: email.toLowerCase(), 
          network_id: networkId, 
          invited_by: inviterId,
          status: 'pending',
          role: role
        }]);
          
      if (inviteError) console.error('Error storing invitation record:', inviteError);
      
      const { getBaseUrl } = await import('../config/environment');
      const baseUrl = getBaseUrl();
      const inviteLink = `${baseUrl}/join/${codeResult}?email=${encodeURIComponent(email)}`;

      // Send invitation email to new user
      try {
        await supabase.functions.invoke('network-invite', {
          body: {
            toEmail: email,
            networkName: (await fetchNetworkDetails(networkId)).name,
            inviterName: (await getUserProfile(inviterId)).full_name || 'Network Admin',
            inviteLink: inviteLink,
            type: 'new_user'
          }
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        throw new Error('Failed to send invitation email. Please try again.');
      }
      
      return { 
        success: true, 
        message: `Invitation sent to ${email}!` 
      };
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send invitation. Please try again.'
    };
  }
};

// DEPRECATED: This function assumes profile ID matches user ID (single profile per user)
// For multiple profiles migration, use getProfileById(profileId) instead
export const getUserProfile = async (userIdOrProfileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userIdOrProfileId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getUserProfileByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    return null;
  }
};

// NEW: Profile-aware function for multiple profiles migration
export const getProfileById = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    return null;
  }
};

export const updateNetworkDetails = async (networkId, updates) => {
  try {
    const { error } = await supabase
      .from('networks')
      .update(updates)
      .eq('id', networkId);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating network:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update network. Please try again.' 
    };
  }
};

export const fetchNetworkEvents = async (networkId, options = {}) => {
  try {
    const { categoryId = null, includeNonApproved = false } = options;
    
    let query = supabase
      .from('network_events')
      .select(`
        *,
        category:network_categories(
          id,
          name,
          color
        )
      `)
      .eq('network_id', networkId)
      .order('date', { ascending: true });
    
    // Only show approved events unless explicitly requested otherwise (for admins)
    if (!includeNonApproved) {
      query = query.eq('status', 'approved');
    }
    
    // Apply category filter if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const fetchNetworkNews = async (networkId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      includeHidden = false,
      categoryId = null
    } = options;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('network_news')
      .select('*', { count: 'exact' })
      .eq('network_id', networkId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    // Exclude hidden posts unless specifically requested
    if (!includeHidden) {
      query = query.eq('is_hidden', false);
    }
    
    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
      
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      news: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      news: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      hasMore: false
    };
  }
};

export const toggleMemberAdmin = async (memberId, currentRole) => {
  try {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId);
      
    if (error) throw error;
    
    return { 
      success: true, 
      message: `User ${newRole === 'admin' ? 'promoted to admin' : 'changed to regular member'}.`,
      newRole
    };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { 
      success: false, 
      message: 'Failed to update member role. Please try again.' 
    };
  }
};

export const removeMemberFromNetwork = async (memberId) => {
  try {
    console.log('Starting member removal process for profile:', memberId);
    
    // Use the database cascade delete function to handle all foreign key constraints
    // This bypasses RLS policies and handles direct messages properly
    const { data: result, error: sqlError } = await supabase.rpc('delete_profile_cascade', {
      profile_id_param: memberId
    });
    
    if (sqlError) {
      console.error('SQL cascade delete failed:', sqlError);
      throw new Error(`Failed to remove member: ${sqlError.message}`);
    }
    
    if (result?.success) {
      console.log('Successfully deleted profile using cascade function:', result);
      return { 
        success: true, 
        message: result.message || 'Member removed from network.'
      };
    } else {
      console.error('Cascade delete function returned error:', result);
      throw new Error(result?.message || 'Failed to remove member');
    }
  } catch (error) {
    console.error('Error removing member:', error);
    return { 
      success: false, 
      message: error.details || error.message || 'Failed to remove member. Please try again.' 
    };
  }
};

// File upload helpers
export const uploadNetworkImage = async (networkId, file, type = 'logo') => {
  try {
    if (!file) return { success: false, message: 'No file provided' };
    
    // Sanitize filename
    const sanitizedFilename = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9.-]/g, "_"); // Replace special chars
    
    let filePath;
    if (type === 'logo') {
      filePath = `${networkId}/${Date.now()}-${sanitizedFilename}`;
    } else if (type === 'background') {
      filePath = `backgrounds/${networkId}/${Date.now()}-${sanitizedFilename}`;
    } else {
      return { success: false, message: 'Invalid image type' };
    }
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('networks')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
      
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('networks')
      .getPublicUrl(filePath);
    
    // Update network record
    const updates = type === 'logo' 
      ? { logo_url: publicUrl }
      : { background_image_url: publicUrl };
      
    const { error: updateError } = await supabase
      .from('networks')
      .update(updates)
      .eq('id', networkId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true,
      publicUrl,
      message: `Network ${type} updated successfully!`
    };
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    return { 
      success: false, 
      message: `Failed to upload ${type}: ${error.message}` 
    };
  }
};

export const removeNetworkImage = async (networkId, type = 'logo') => {
  try {
    // Get current network to extract image URL
    const network = await fetchNetworkDetails(networkId);
    const imageUrl = type === 'logo' ? network.logo_url : network.background_image_url;
    
    if (!imageUrl) return { success: true, message: `No ${type} to remove` };
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('networks') + 1).join('/');
    
    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('networks')
      .remove([filePath]);
    
    // Don't throw if file not found
    if (deleteError && deleteError.message !== 'The resource was not found') {
      console.warn(`Error deleting ${type} file:`, deleteError);
    }
    
    // Update network record
    const updates = type === 'logo' 
      ? { logo_url: null }
      : { background_image_url: null };
      
    const { error: updateError } = await supabase
      .from('networks')
      .update(updates)
      .eq('id', networkId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      message: `Network ${type} removed successfully!`
    };
  } catch (error) {
    console.error(`Error removing ${type}:`, error);
    return { 
      success: false, 
      message: `Failed to remove ${type}. Please try again.` 
    };
  }
};

// Event management functions
export const createEvent = async (networkId, profileId, eventData, imageFile, isAdmin = false) => {
  try {
    // Create event with status based on user role
    const { data, error } = await supabase
      .from('network_events')
      .insert([{
        ...eventData,
        network_id: networkId,
        created_by: profileId,
        status: isAdmin ? 'approved' : 'pending'
      }])
      .select();
      
    if (error) throw error;
    
    const eventId = data[0].id;
    
    // If we have an image, upload it
    if (imageFile) {
      const imageUrl = await uploadEventImage(eventId, imageFile);
      
      // Update the event with the image URL
      const { error: updateError } = await supabase
        .from('network_events')
        .update({ cover_image_url: imageUrl })
        .eq('id', eventId);
        
      if (updateError) throw updateError;
      
      // Update the data object
      data[0].cover_image_url = imageUrl;
    }
    
    // Queue email notifications for network members only if event is approved (admin created)
    if (isAdmin) {
      try {
        console.log('📅 [EVENT DEBUG] Starting to queue email notifications for event...');
        console.log('📅 [EVENT DEBUG] Event created:', data[0]);
        
        const notificationResult = await queueEventNotifications(
          networkId,
          data[0].id,
          profileId,
          eventData.title,
          eventData.description,
          eventData.date,
          eventData.location,
          data[0].cover_image_url
        );
        
        console.log('📅 [EVENT DEBUG] Notification queueing result:', notificationResult);
        
        if (notificationResult.success) {
          console.log(`📅 [EVENT DEBUG] Email notifications queued successfully: ${notificationResult.message}`);
        } else {
          console.error('📅 [EVENT DEBUG] Failed to queue email notifications:', notificationResult.error);
          // Don't fail the event creation if notification queueing fails
        }
      } catch (notificationError) {
        console.error('📅 [EVENT DEBUG] Error queueing email notifications:', notificationError);
        // Don't fail the event creation if notification queueing fails
      }
    }
    
    return {
      success: true,
      event: data[0],
      message: isAdmin ? 'Event created successfully!' : 'Event proposal submitted successfully! It will be reviewed by an admin.'
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      message: 'Failed to create event. Please try again.'
    };
  }
};

export const updateEvent = async (eventId, eventData, imageFile) => {
  try {
    // If we have a new image, upload it
    if (imageFile) {
      const imageUrl = await uploadEventImage(eventId, imageFile);
      eventData.cover_image_url = imageUrl;
    }
    
    // Update the event
    const { data, error } = await supabase
      .from('network_events')
      .update(eventData)
      .eq('id', eventId)
      .select();
      
    if (error) throw error;
    
    return {
      success: true,
      event: data[0],
      message: 'Event updated successfully!'
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false,
      message: 'Failed to update event. Please try again.'
    };
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const { error } = await supabase
      .from('network_events')
      .delete()
      .eq('id', eventId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Event deleted successfully'
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      message: 'Failed to delete event'
    };
  }
};

// Event approval/rejection functions
export const approveEvent = async (eventId, approverId, networkId) => {
  try {
    // First get the event details
    const { data: event, error: fetchError } = await supabase
      .from('network_events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Update event status to approved
    const { error: updateError } = await supabase
      .from('network_events')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', eventId);
      
    if (updateError) throw updateError;
    
    // Queue email notifications for the approved event
    try {
      console.log('📅 [EVENT APPROVAL] Queueing notifications for approved event');
      const notificationResult = await queueEventNotifications(
        networkId,
        eventId,
        event.created_by,
        event.title,
        event.description,
        event.date,
        event.location,
        event.cover_image_url
      );
      
      if (notificationResult.success) {
        console.log('📅 [EVENT APPROVAL] Notifications queued successfully');
      }
    } catch (notificationError) {
      console.error('📅 [EVENT APPROVAL] Error queueing notifications:', notificationError);
    }
    
    return {
      success: true,
      message: 'Event approved successfully and notifications sent!'
    };
  } catch (error) {
    console.error('Error approving event:', error);
    return {
      success: false,
      message: 'Failed to approve event'
    };
  }
};

export const rejectEvent = async (eventId, approverId, rejectionReason = '') => {
  try {
    const { error } = await supabase
      .from('network_events')
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      })
      .eq('id', eventId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'Event rejected'
    };
  } catch (error) {
    console.error('Error rejecting event:', error);
    return {
      success: false,
      message: 'Failed to reject event'
    };
  }
};

export const uploadEventImage = async (eventId, imageFile) => {
  try {
    if (!imageFile) return null;
    
    // Sanitize filename to remove special characters and accents
    const fileExtension = imageFile.name.split('.').pop();
    const sanitizedFilename = `${Date.now()}-event-image.${fileExtension}`;
    
    // Create a unique file path in the events bucket
    const filePath = `${eventId}/${sanitizedFilename}`;
    
    console.log('Uploading event image to path:', filePath);
    
    // Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: imageFile.type
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);
    
    console.log('Image uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
};

// News post functions
export const createNewsPost = async (networkId, profileId, title, content, imageUrl = null, imageCaption = null, mediaUrl = null, mediaType = null, mediaMetadata = {}, categoryId = null) => {
  try {
    // Create base post object
    const postData = {
      title,
      content,
      network_id: networkId,
      created_by: profileId
    };
    
    // Add category if provided
    if (categoryId) {
      postData.category_id = categoryId;
    }
    
    // Add media fields if provided
    if (mediaUrl) {
      postData.media_url = mediaUrl;
      postData.media_type = mediaType;
      postData.media_metadata = mediaMetadata;
      
      // For backward compatibility, also set image fields if it's an image
      if (mediaType === 'image') {
        postData.image_url = mediaUrl;
        postData.image_caption = imageCaption;
      }
    } else if (imageUrl) {
      // Legacy image upload support
      postData.image_url = imageUrl;
      if (imageCaption) {
        postData.image_caption = imageCaption;
      }
    }
    
    const { data, error } = await supabase
      .from('network_news')
      .insert([postData])
      .select();
      
    if (error) throw error;
    
    // Queue email notifications for network members
    try {
      console.log('📰 [NEWS DEBUG] Starting to queue email notifications for news post...');
      console.log('📰 [NEWS DEBUG] News post created:', data[0]);
      
      const notificationResult = await queueNewsNotifications(
        networkId,
        data[0].id,
        profileId,
        title,
        content,
        mediaUrl || imageUrl,
        mediaType || (imageUrl ? 'image' : null)
      );
      
      console.log('📰 [NEWS DEBUG] Notification queueing result:', notificationResult);
      
      if (notificationResult.success) {
        console.log(`📰 [NEWS DEBUG] Email notifications queued successfully: ${notificationResult.message}`);
      } else {
        console.error('📰 [NEWS DEBUG] Failed to queue email notifications:', notificationResult.error);
        // Don't fail the news post creation if notification queueing fails
      }
    } catch (notificationError) {
      console.error('📰 [NEWS DEBUG] Error queueing email notifications:', notificationError);
      // Don't fail the news post creation if notification queueing fails
    }
    
    return {
      success: true,
      post: data[0],
      message: 'News post published successfully!'
    };
  } catch (error) {
    console.error('News error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to publish news post'
    };
  }
};

export const deleteNewsPost = async (postId) => {
  try {
    const { error } = await supabase
      .from('network_news')
      .delete()
      .eq('id', postId);
      
    if (error) throw error;
    
    return {
      success: true,
      message: 'News post deleted successfully'
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      message: 'Failed to delete news post'
    };
  }
};

// Participants management
export const exportEventParticipantsList = async (eventId) => {
  try {
    // Fetch event details
    const { data: eventData, error: eventError } = await supabase
      .from('network_events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (eventError) throw eventError;
    
    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from('event_participations')
      .select(`
        status,
        profiles:profile_id (
          id,
          full_name,
          contact_email,
          role
        )
      `)
      .eq('event_id', eventId);
      
    if (participantsError) throw participantsError;
    
    // Convert to CSV format
    let csvContent = "Name,Email,Status,Role\n";
    
    participants.forEach(participant => {
      const profile = participant.profiles;
      csvContent += `"${profile.full_name || 'Unnamed User'}","${profile.contact_email}","${participant.status}","${profile.role || 'member'}"\n`;
    });
    
    return {
      success: true,
      eventTitle: eventData.title,
      csvContent
    };
  } catch (error) {
    console.error('Error exporting participants:', error);
    return {
      success: false,
      message: 'Failed to export participants list'
    };
  }
};

// Get pending and recently accepted invitations for a network
export const getNetworkPendingInvitations = async (networkId) => {
  try {
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Get both pending and recently accepted invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .eq('network_id', networkId)
      .or(`status.eq.pending,and(status.eq.accepted,updated_at.gte.${threeDaysAgo.toISOString()})`)
      .order('created_at', { ascending: false });
    
    if (invitationsError) throw invitationsError;
    
    if (!invitations || invitations.length === 0) {
      return {
        success: true,
        invitations: []
      };
    }
    
    // Get all network members to cross-reference emails
    const { data: networkMembers, error: membersError } = await supabase
      .from('profiles')
      .select('contact_email')
      .eq('network_id', networkId);
    
    if (membersError) throw membersError;
    
    // Create a set of member emails for quick lookup
    const memberEmails = new Set((networkMembers || []).map(m => m.contact_email?.toLowerCase()));
    
    // Filter pending invitations where the invitee hasn't joined yet
    // Keep accepted invitations as they are
    const filteredInvitations = invitations.filter(inv => {
      if (inv.status === 'accepted') {
        return true; // Always show accepted invitations (within the 3-day window)
      }
      // For pending invitations, only show if the user hasn't joined yet
      return !memberEmails.has(inv.email?.toLowerCase());
    });
    
    if (filteredInvitations.length === 0) {
      return {
        success: true,
        invitations: []
      };
    }
    
    // Get unique inviter IDs
    const inviterIds = [...new Set(filteredInvitations.map(inv => inv.invited_by))];
    
    // Fetch profile information for all inviters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email')
      .in('id', inviterIds);
    
    if (profilesError) throw profilesError;
    
    // Create a map of profiles by ID
    const profileMap = (profiles || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
    
    // Map profile data to invitations
    const invitationsWithProfiles = filteredInvitations.map(invitation => ({
      ...invitation,
      inviter: profileMap[invitation.invited_by] || { 
        id: invitation.invited_by, 
        full_name: 'Unknown User',
        contact_email: null
      }
    }));
    
    return {
      success: true,
      invitations: invitationsWithProfiles
    };
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return {
      success: false,
      invitations: [],
      error: error.message || 'Failed to fetch pending invitations'
    };
  }
};

/**
 * Send a chat message to a network with automatic mention notification handling
 * @param {string} networkId - Network ID
 * @param {string} userId - Sender's profile ID
 * @param {string} content - Message content
 * @param {Object} mediaData - Optional media data
 * @param {Object} replyData - Optional reply data
 * @param {Array} networkMembers - Array of network members for mention detection
 * @returns {Object} Object containing success status and message data
 */
export const sendChatMessage = async (networkId, userId, content, mediaData = null, replyData = null, networkMembers = []) => {
  try {
    // Build message data
    const messageData = {
      network_id: networkId,
      user_id: userId,
      content
    };
    
    // Add reply data if present
    if (replyData) {
      messageData.parent_message_id = replyData.id;
      messageData.reply_to_user_id = replyData.user_id;
      messageData.reply_to_content = replyData.content?.substring(0, 100);
    }
    
    // Add media data if present
    if (mediaData) {
      messageData.media_url = mediaData.url;
      messageData.media_type = mediaData.type || mediaData.mediaType?.toLowerCase();
      messageData.media_metadata = mediaData.metadata || {
        fileName: mediaData.fileName,
        fileSize: mediaData.fileSize,
        mimeType: mediaData.mimeType
      };
    }
    
    // Insert the message
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select('id')
      .single();

    if (error) throw error;
    
    console.log('💬 [CHAT API DEBUG] Message sent successfully with ID:', data.id);
    
    // Handle mentions - extract and queue notifications (similar to news notifications)
    if (content && networkMembers.length > 0) {
      try {
        const mentions = extractMentions(content, networkMembers);
        console.log('💬 [CHAT API DEBUG] Found mentions:', mentions.length);
        
        if (mentions.length > 0) {
          // Get sender profile info for notifications
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
            
          const senderName = senderProfile?.full_name || 'Someone';
          
          for (const mentionedUser of mentions) {
            if (mentionedUser.id !== userId) { // Don't notify self
              try {
                console.log(`💬 [CHAT API DEBUG] Queueing mention notification for ${mentionedUser.full_name}`);
                const notificationResult = await queueMentionNotification(
                  mentionedUser.id,
                  networkId,
                  senderName,
                  content,
                  data.id
                );
                
                if (notificationResult.success) {
                  console.log(`💬 [CHAT API DEBUG] Notification queued successfully for ${mentionedUser.full_name}`);
                } else {
                  console.warn(`💬 [CHAT API DEBUG] Failed to queue notification for ${mentionedUser.full_name}:`, notificationResult.error);
                }
              } catch (notifError) {
                console.error(`💬 [CHAT API DEBUG] Error queueing mention notification for ${mentionedUser.full_name}:`, notifError);
              }
            }
          }
        }
      } catch (mentionError) {
        console.error('💬 [CHAT API DEBUG] Error processing mentions:', mentionError);
        // Don't fail the message sending if mention processing fails
      }
    }
    
    return {
      success: true,
      message: data,
      messageId: data.id
    };
  } catch (error) {
    console.error('💬 [CHAT API DEBUG] Error sending chat message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message'
    };
  }
};

/**
 * Extract mentions from message content
 * @param {string} content - Message content
 * @param {Array} networkMembers - Array of network members
 * @returns {Array} Array of mentioned users
 */
const extractMentions = (content, networkMembers) => {
  if (!content || !networkMembers || networkMembers.length === 0) return [];
  
  const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionedName = match[1].trim();
    const mentionedUser = networkMembers.find(member => 
      member.full_name?.toLowerCase() === mentionedName.toLowerCase()
    );
    if (mentionedUser) {
      mentions.push(mentionedUser);
    }
  }
  
  return mentions;
};