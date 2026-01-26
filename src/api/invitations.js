// src/api/invitations.js
import { supabase } from '../supabaseclient';

// Create a new invitation link
export const createInvitationLink = async (networkId, profileId, data = {}) => {
  try {
    // Generate a unique code
    const { data: codeResult, error: codeError } = await supabase
      .rpc('generate_invitation_code');
    
    if (codeError) throw codeError;
    
    // Verify the profile exists and belongs to the network
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, network_id, role')
      .eq('id', profileId)
      .eq('network_id', networkId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found or does not belong to this network');
    }
    
    const invitationData = {
      network_id: networkId,
      created_by: profileId,
      code: codeResult,
      name: data.name || 'General Invitation',
      description: data.description || null,
      role: data.role || 'member',
      max_uses: data.maxUses || null,
      expires_at: data.expiresAt || null,
      is_active: true
    };
    
    const { data: invitation, error } = await supabase
      .from('network_invitation_links')
      .insert([invitationData])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      invitation,
      message: 'Invitation link created successfully'
    };
  } catch (error) {
    console.error('Error creating invitation link:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invitation link'
    };
  }
};

// Get all invitation links for a network
export const getNetworkInvitationLinks = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('network_invitation_links')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      success: true,
      invitations: data || []
    };
  } catch (error) {
    console.error('Error fetching invitation links:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch invitation links',
      invitations: []
    };
  }
};

// Get only active invitation links for a network (public display)
export const getActiveInvitationLinks = async (networkId) => {
  try {
    const { data, error } = await supabase
      .from('network_invitation_links')
      .select('*')
      .eq('network_id', networkId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter out expired links
    const activeLinks = (data || []).filter(link => {
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return false;
      }
      if (link.max_uses && link.uses_count >= link.max_uses) {
        return false;
      }
      return true;
    });
    
    return activeLinks;
  } catch (error) {
    console.error('Error fetching active invitation links:', error);
    return [];
  }
};

// Update invitation link
export const updateInvitationLink = async (linkId, updates) => {
  try {
    const { data, error } = await supabase
      .from('network_invitation_links')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      invitation: data,
      message: 'Invitation link updated successfully'
    };
  } catch (error) {
    console.error('Error updating invitation link:', error);
    return {
      success: false,
      error: error.message || 'Failed to update invitation link'
    };
  }
};

// Delete invitation link
export const deleteInvitationLink = async (linkId) => {
  try {
    const { error } = await supabase
      .from('network_invitation_links')
      .delete()
      .eq('id', linkId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Invitation link deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting invitation link:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete invitation link'
    };
  }
};

// Get invitation link by code (public)
export const getInvitationByCode = async (code) => {
  try {
    const { data, error } = await supabase
      .from('network_invitation_links')
      .select(`
        *,
        networks!inner(
          id,
          name,
          description,
          logo_url,
          privacy_level,
          created_at
        ),
        inviter:profiles!created_by(
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    
    // Check if link is valid
    if (!data) {
      return null;
    }
    
    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('This invitation link has expired');
    }
    
    // Check usage limit
    if (data.max_uses && data.uses_count >= data.max_uses) {
      throw new Error('This invitation link has reached its usage limit');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching invitation by code:', error);
    throw error;
  }
};

// MULTIPLE PROFILES SUPPORT: Creates a new profile for the user in the target network
// while preserving their existing profiles in other networks
export const joinNetworkViaInvitation = async (code, inviteeEmail = null) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to join a network'
      };
    }
    
    // Get invitation details
    const invitation = await getInvitationByCode(code);
    
    if (!invitation) {
      return {
        success: false,
        error: 'Invalid invitation code'
      };
    }
    
    console.log('Joining network via invitation:', invitation.network_id, 'Role:', invitation.role);
    
    // Check if user already has a profile in this specific network
    // Try new schema first (with user_id column), fallback to old schema
    let existingProfile = null;
    let useOldSchema = false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, network_id, role')
        .eq('user_id', user.id)
        .eq('network_id', invitation.network_id)
        .maybeSingle();
        
      if (error && error.message?.includes('user_id') && error.message?.includes('does not exist')) {
        // user_id column doesn't exist - database migration not done yet
        useOldSchema = true;
      } else if (error && error.code !== 'PGRST116') {
        throw error;
      } else {
        existingProfile = data;
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
      const { data: oldProfile, error: oldProfileError } = await supabase
        .from('profiles')
        .select('network_id, role')
        .eq('id', user.id)
        .single();
      
      if (oldProfileError && oldProfileError.code !== 'PGRST116') {
        throw oldProfileError;
      }
      
      if (oldProfile?.network_id === invitation.network_id) {
        return {
          success: false,
          error: 'You are already a member of this network'
        };
      }
      
      // Update user's profile to join the network with the specified role (old behavior)
      const roleToAssign = invitation.role || 'member';
      console.log('OLD SCHEMA: Assigning role:', roleToAssign, 'to user:', user.id);
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          network_id: invitation.network_id,
          role: roleToAssign,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
      
      console.log('Updated profile (old schema):', updatedProfile);
      
      // Increment usage count
      await supabase.rpc('increment_invitation_link_uses', { link_code: code });
      
      // If joining via email invitation, update the invitation status
      if (inviteeEmail) {
        await supabase
          .from('invitations')
          .update({ status: 'accepted' })
          .eq('email', inviteeEmail.toLowerCase())
          .eq('network_id', invitation.network_id)
          .eq('status', 'pending');
      }
      
      // Set flags to trigger welcome message
      if (typeof window !== 'undefined') {
        console.log('[JoinNetwork] Setting flags (old schema) for user:', user.id, 'network:', invitation.network_id, 'profile:', updatedProfile.id);
        // Set with both profile ID and user+network ID for more robust detection
        sessionStorage.setItem(`recent_join_${invitation.network_id}_${updatedProfile.id}`, 'true');
        sessionStorage.setItem(`recent_join_user_${user.id}_network_${invitation.network_id}`, 'true');
        localStorage.setItem(`profile_created_${invitation.network_id}_${updatedProfile.id}`, 'true');
        localStorage.setItem(`profile_created_user_${user.id}_network_${invitation.network_id}`, 'true');
      }
      
      return {
        success: true,
        message: 'Successfully joined the network!',
        networkId: invitation.network_id,
        networkName: invitation.networks?.name || 'Network',
        profileId: updatedProfile.id
      };
    }
    
    if (existingProfile) {
      return {
        success: false,
        error: 'You are already a member of this network'
      };
    }
    
    // NEW SCHEMA: Get user's existing profile to copy basic info
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, bio, profile_picture_url, linkedin_url, portfolio_url, skills')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    
    if (userProfileError && userProfileError.code !== 'PGRST116') {
      throw userProfileError;
    }
    
    // Create a new profile for the user in this network
    const roleToAssign = invitation.role || 'member';
    console.log('NEW SCHEMA: Creating new profile with role:', roleToAssign, 'for user:', user.id);
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        user_id: user.id,
        network_id: invitation.network_id,
        role: roleToAssign,
        full_name: userProfile?.full_name || '',
        contact_email: userProfile?.contact_email || user.email || '',
        bio: userProfile?.bio || '',
        profile_picture_url: userProfile?.profile_picture_url || null,
        linkedin_url: userProfile?.linkedin_url || null,
        portfolio_url: userProfile?.portfolio_url || null,
        skills: userProfile?.skills || []
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating new profile:', createError);
      throw createError;
    }
    
    console.log('Created new profile:', newProfile);
    
    // Increment usage count
    await supabase.rpc('increment_invitation_link_uses', { link_code: code });
    
    // If joining via email invitation, update the invitation status
    if (inviteeEmail) {
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('email', inviteeEmail.toLowerCase())
        .eq('network_id', invitation.network_id)
        .eq('status', 'pending');
    }
    
    // Set flags to trigger welcome message
    if (typeof window !== 'undefined') {
      console.log('[JoinNetwork] Setting flags for user:', user.id, 'network:', invitation.network_id, 'profile:', newProfile.id);
      // Set with both profile ID and user+network ID for more robust detection
      sessionStorage.setItem(`recent_join_${invitation.network_id}_${newProfile.id}`, 'true');
      sessionStorage.setItem(`recent_join_user_${user.id}_network_${invitation.network_id}`, 'true');
      localStorage.setItem(`profile_created_${invitation.network_id}_${newProfile.id}`, 'true');
      localStorage.setItem(`profile_created_user_${user.id}_network_${invitation.network_id}`, 'true');
    }
    
    return {
      success: true,
      message: 'Successfully joined the network!',
      networkId: invitation.network_id,
      networkName: invitation.networks?.name || 'Network',
      profileId: newProfile.id
    };
  } catch (error) {
    console.error('Error joining network:', error);
    return {
      success: false,
      error: error.message || 'Failed to join network'
    };
  }
};

// Get or create a public invitation link for member sharing
export const getOrCreatePublicInvitationLink = async (networkId, profileId) => {
  try {
    // First, try to find an existing public invitation link
    const { data: existingLinks, error: fetchError } = await supabase
      .from('network_invitation_links')
      .select('*')
      .eq('network_id', networkId)
      .eq('name', 'Public Invitation')
      .eq('is_active', true)
      .is('max_uses', null)
      .is('expires_at', null)
      .limit(1);

    if (fetchError) throw fetchError;

    // If a public link exists and is valid, return it
    if (existingLinks && existingLinks.length > 0) {
      return {
        success: true,
        invitation: existingLinks[0],
        isNew: false
      };
    }

    // No existing public link, create one
    const { data: codeResult, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError) throw codeError;

    const { data: newInvitation, error: createError } = await supabase
      .from('network_invitation_links')
      .insert([{
        network_id: networkId,
        created_by: profileId,
        code: codeResult,
        name: 'Public Invitation',
        description: 'Shared invitation link for all members',
        role: 'member',
        max_uses: null,
        expires_at: null,
        is_active: true
      }])
      .select()
      .single();

    if (createError) throw createError;

    return {
      success: true,
      invitation: newInvitation,
      isNew: true
    };
  } catch (error) {
    console.error('Error getting/creating public invitation link:', error);
    return {
      success: false,
      error: error.message || 'Failed to get invitation link'
    };
  }
};

// Toggle invitation link active status
export const toggleInvitationStatus = async (linkId) => {
  try {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('network_invitation_links')
      .select('is_active')
      .eq('id', linkId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update with opposite status
    const { data, error } = await supabase
      .from('network_invitation_links')
      .update({
        is_active: !current.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      invitation: data,
      message: `Invitation link ${data.is_active ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    console.error('Error toggling invitation status:', error);
    return {
      success: false,
      error: error.message || 'Failed to toggle invitation status'
    };
  }
};