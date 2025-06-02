// src/api/invitations.js
import { supabase } from '../supabaseclient';

// Create a new invitation link
export const createInvitationLink = async (networkId, data = {}) => {
  try {
    // Generate a unique code
    const { data: codeResult, error: codeError } = await supabase
      .rpc('generate_invitation_code');
    
    if (codeError) throw codeError;
    
    const invitationData = {
      network_id: networkId,
      created_by: (await supabase.auth.getUser()).data.user.id,
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

// Join network via invitation link
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
    
    // Debug: Log the invitation data to see if role is included
    console.log('Invitation data:', invitation);
    console.log('Invitation role:', invitation.role);
    
    // Check if user is already in the network
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('network_id')
      .eq('id', user.id)
      .single();
    
    if (existingProfile?.network_id === invitation.network_id) {
      return {
        success: false,
        error: 'You are already a member of this network'
      };
    }
    
    // Update user's profile to join the network with the specified role
    const roleToAssign = invitation.role || 'member';
    console.log('Assigning role:', roleToAssign, 'to user:', user.id);
    
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
    
    console.log('Updated profile:', updatedProfile);
    console.log('Profile role after update:', updatedProfile?.role);
    
    // Increment usage count
    await supabase.rpc('increment_invitation_link_uses', { link_code: code });
    
    // If joining via email invitation, update the invitation status
    if (inviteeEmail) {
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('email', inviteeEmail)
        .eq('network_id', invitation.network_id)
        .eq('status', 'pending');
    }
    
    return {
      success: true,
      message: 'Successfully joined the network!',
      networkId: invitation.network_id,
      networkName: invitation.networks.name
    };
  } catch (error) {
    console.error('Error joining network:', error);
    return {
      success: false,
      error: error.message || 'Failed to join network'
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