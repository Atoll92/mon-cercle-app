import { supabase } from '../supabaseclient';

const fetchNetworkMembers = async (networkId) => {
    try {
        console.log('Fetching network members for network:', networkId);
        const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, contact_email, role, profile_picture_url')
        .eq('network_id', networkId);
    
        if (error) throw error;
        console.log(`Found ${data?.length || 0} network members`);

        return data || [];
    } catch (error) {
        console.error("Error fetching network members:", error);
        setError("Failed to load network members. Please try again later.");
        return [];
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
export const inviteUserToNetwork = async (email, networkId, inviterId) => {
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
        .update({ network_id: networkId })
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
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert([{ 
          email, 
          network_id: networkId, 
          invited_by: inviterId,
          status: 'pending',
          role: 'member'
        }])
        .select()
        .single();
          
      if (inviteError) throw inviteError;
      
      const inviteToken = btoa(`invite:${invitation.id}:${networkId}`);
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mon-cercle-app.vercel.app' 
        : window.location.origin;
      const inviteLink = `${baseUrl}/signup?invite=${inviteToken}`;

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

export const fetchNetworkNews = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('network_news')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
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
    
    // Create a unique file path in the events bucket
    const filePath = `${eventId}/${Date.now()}-${imageFile.name}`;
    
    // Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
};

// News post functions
export const createNewsPost = async (networkId, userId, title, content, imageUrl = null, imageCaption = null) => {
  try {
    // Create base post object
    const postData = {
      title,
      content,
      network_id: networkId,
      created_by: userId
    };
    
    // Add image fields if provided
    if (imageUrl) {
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