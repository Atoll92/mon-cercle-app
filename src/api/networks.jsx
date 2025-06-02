import { supabase } from '../supabaseclient';
import { queueNewsNotifications } from '../services/emailNotificationService';

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
    try {
        const { 
            page = 1, 
            limit = 50,
            orderBy = 'full_name',
            ascending = true,
            search = null
        } = options;
        
        console.log('Fetching network members for network:', networkId, 'with options:', options);
        
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        // Build query
        let query = supabase
            .from('profiles')
            .select('id, full_name, contact_email, role, profile_picture_url', { count: 'exact' })
            .eq('network_id', networkId)
            .order(orderBy, { ascending })
            .range(offset, offset + limit - 1);
            
        // Add search filter if provided
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
        }
        
        const { data, error, count } = await query;
    
        if (error) throw error;
        console.log(`Found ${data?.length || 0} network members (total: ${count})`);

        return {
            members: data || [],
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
      console.log('Fetching network details for network:', networkId);
      const { data, error } = await supabase
        .from('networks')
        .select('*')
        .eq('id', networkId)
        .single();
        
      if (error) throw error;
      console.log('Network details:', data);
      return data;
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
export const inviteUserToNetwork = async (email, networkId, inviterId, role = 'member') => {
  try {
    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id, network_id, contact_email, full_name')
      .eq('contact_email', email)
      .maybeSingle();
        
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (existingUser) {
      if (existingUser.network_id === networkId) {
        return { 
          success: false, 
          message: 'This user is already in your network.'
        };
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ network_id: networkId, role: role })
        .eq('id', existingUser.id);
          
      if (updateError) throw updateError;

      try {
        await supabase.functions.invoke('network-invite', {
          body: {
            toEmail: existingUser.contact_email,
            networkName: (await fetchNetworkDetails(networkId)).name,
            inviterName: (await getUserProfile(inviterId)).full_name || 'Network Admin',
            type: 'existing_user'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
      
      return { 
        success: true, 
        message: `User ${email} added to your network! Email notification sent.`
      };
    } else {
      // For new users, create an invitation link with the email
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
          email, 
          network_id: networkId, 
          invited_by: inviterId,
          status: 'pending',
          role: role
        }]);
          
      if (inviteError) console.error('Error storing invitation record:', inviteError);
      
      const { getBaseUrl } = await import('../config/environment');
      const baseUrl = getBaseUrl();
      const inviteLink = `${baseUrl}/join/${codeResult}?email=${encodeURIComponent(email)}`;

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

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
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

export const fetchNetworkEvents = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('network_events')
      .select('*')
      .eq('network_id', networkId)
      .order('date', { ascending: true });
      
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
      includeHidden = false
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
    const { error } = await supabase
      .from('profiles')
      .update({ network_id: null })
      .eq('id', memberId);
      
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Member removed from network.'
    };
  } catch (error) {
    console.error('Error removing member:', error);
    return { 
      success: false, 
      message: 'Failed to remove member. Please try again.' 
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
export const createEvent = async (networkId, userId, eventData, imageFile) => {
  try {
    // Create event
    const { data, error } = await supabase
      .from('network_events')
      .insert([{
        ...eventData,
        network_id: networkId,
        created_by: userId
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
    
    return {
      success: true,
      event: data[0],
      message: 'Event created successfully!'
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
export const createNewsPost = async (networkId, userId, title, content, imageUrl = null, imageCaption = null, mediaUrl = null, mediaType = null, mediaMetadata = {}) => {
  try {
    // Create base post object
    const postData = {
      title,
      content,
      network_id: networkId,
      created_by: userId
    };
    
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
        userId,
        title,
        content
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

// Get pending invitations for a network
export const getNetworkPendingInvitations = async (networkId) => {
  try {
    // First get the invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .eq('network_id', networkId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (invitationsError) throw invitationsError;
    
    if (!invitations || invitations.length === 0) {
      return {
        success: true,
        invitations: []
      };
    }
    
    // Get unique inviter IDs
    const inviterIds = [...new Set(invitations.map(inv => inv.invited_by))];
    
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
    const invitationsWithProfiles = invitations.map(invitation => ({
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