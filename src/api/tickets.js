import { supabase } from '../supabaseclient';

// Get tickets for a network (admin view)
export const getNetworkTickets = async (networkId) => {
  try {
    // First get the tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;

    // Then get the profile information for submitters and assignees
    const userIds = [...new Set([
      ...tickets.map(t => t.submitted_by).filter(Boolean),
      ...tickets.map(t => t.assigned_to).filter(Boolean)
    ])];

    let profiles = {};
    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .in('id', userIds);
      
      if (!profileError && profileData) {
        profiles = profileData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Combine the data
    const ticketsWithProfiles = tickets.map(ticket => ({
      ...ticket,
      submitted_by_profile: profiles[ticket.submitted_by] || null,
      assigned_to_profile: profiles[ticket.assigned_to] || null
    }));

    return { data: ticketsWithProfiles, error: null };
  } catch (error) {
    console.error('Error fetching network tickets:', error);
    return { data: null, error: error.message };
  }
};

// Get all tickets (super admin view)
export const getAllTickets = async (filters = {}) => {
  try {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        network:networks(
          id,
          name,
          logo_url
        )
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data: tickets, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get profile information separately
    const userIds = [...new Set([
      ...tickets.map(t => t.submitted_by).filter(Boolean),
      ...tickets.map(t => t.assigned_to).filter(Boolean)
    ])];

    let profiles = {};
    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, contact_email')
        .in('id', userIds);
      
      if (!profileError && profileData) {
        profiles = profileData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Combine the data
    const ticketsWithProfiles = tickets.map(ticket => ({
      ...ticket,
      submitted_by_profile: profiles[ticket.submitted_by] || null,
      assigned_to_profile: profiles[ticket.assigned_to] || null
    }));

    return { data: ticketsWithProfiles, error: null };
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    return { data: null, error: error.message };
  }
};

// Get single ticket with messages
export const getTicketDetails = async (ticketId) => {
  try {
    // Get ticket details first
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        network:networks(
          id,
          name,
          logo_url
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;

    // Get profile information for submitted_by and assigned_to
    const userIds = [ticket.submitted_by, ticket.assigned_to].filter(Boolean);
    let profiles = {};
    
    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, contact_email')
        .in('id', userIds);
      
      if (!profileError && profileData) {
        profiles = profileData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Add profile information to ticket
    ticket.submitted_by_profile = profiles[ticket.submitted_by] || null;
    ticket.assigned_to_profile = profiles[ticket.assigned_to] || null;

    // Get messages with sender profiles
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Get sender profiles for messages
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map(m => m.sender_id).filter(Boolean))];
      
      if (senderIds.length > 0) {
        const { data: senderProfiles, error: senderError } = await supabase
          .from('profiles')
          .select('id, full_name, profile_picture_url')
          .in('id', senderIds);
        
        if (!senderError && senderProfiles) {
          const senderMap = senderProfiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
          
          // Add sender profile to each message
          messages.forEach(message => {
            message.sender = senderMap[message.sender_id] || null;
          });
        }
      }
    }

    return { 
      data: { 
        ...ticket, 
        messages: messages || [] 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return { data: null, error: error.message };
  }
};

// Create a new ticket
export const createTicket = async (ticketData) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { data: null, error: error.message };
  }
};

// Update ticket (super admin)
export const updateTicket = async (ticketId, updates) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return { data: null, error: error.message };
  }
};

// Send a message to a ticket
export const sendTicketMessage = async (ticketId, message, isInternal = false) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert the message
    // NOTE: sender_id uses user.id (auth user) intentionally for support system
    const { data: messageData, error } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        is_internal: isInternal
      }])
      .select()
      .single();

    if (error) throw error;

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url')
      .eq('id', user.id)
      .single();

    // Add sender profile to message
    messageData.sender = senderProfile || null;

    return { data: messageData, error: null };
  } catch (error) {
    console.error('Error sending ticket message:', error);
    return { data: null, error: error.message };
  }
};

// Get ticket statistics (super admin)
export const getTicketStatistics = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_ticket_statistics');

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    return { data: null, error: error.message };
  }
};

// Close a ticket (network admin)
export const closeTicket = async (ticketId) => {
  try {
    // Network admins can only update status to 'closed' and set resolved_at
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ 
        status: 'closed',
        resolved_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error closing ticket:', error);
    return { data: null, error: error.message };
  }
};

// Check if a similar error ticket already exists
export const checkForDuplicateErrorTicket = async () => {
  try {
    // Skip duplicate checking for now since RLS policies prevent reading system tickets
    // This is a temporary solution - ideally we'd update the view policies to allow
    // reading system tickets for duplicate detection, or use a different approach
    console.log('Skipping duplicate check due to RLS restrictions on system tickets');
    return { isDuplicate: false, existingTicketId: null, error: null };
  } catch (error) {
    console.error('Error checking for duplicate tickets:', error);
    return { isDuplicate: false, existingTicketId: null, error: error.message };
  }
};

// Create a system-generated error ticket
export const createSystemErrorTicket = async (errorData) => {
  try {

    //if we're in dev mode, skip ticket creation
    if (import.meta.env.MODE === 'development') {
      console.warn('Skipping system error ticket creation in development mode');
      return { data: null, error: null };
    }

    const { error, errorInfo, userAgent, url, timestamp } = errorData;
    
    // Check for duplicates first (using authenticated client is fine for reading)
    const duplicateCheck = await checkForDuplicateErrorTicket();
    if (duplicateCheck.isDuplicate) {
      console.log('Duplicate error ticket found, skipping creation:', duplicateCheck.existingTicketId);
      return { data: { isDuplicate: true, existingTicketId: duplicateCheck.existingTicketId }, error: null };
    }

    const ticketData = {
      network_id: null, // System tickets don't belong to a specific network
      submitted_by: null, // System-generated tickets have no user submitter
      title: `[SYSTEM] Application Error: ${error.message.substring(0, 100)}`,
      description: `Automatic error report from ErrorBoundary

**Error Details:**
Message: ${error.message}
Name: ${error.name}

**Stack Trace:**
${error.stack}

**Component Stack:**
${errorInfo?.componentStack || 'Not available'}

**Environment:**
- URL: ${url}
- User Agent: ${userAgent}
- Timestamp: ${timestamp}
- Environment: ${import.meta.env.MODE || 'unknown'}

This ticket was automatically created by the application's error handling system.`,
      category: 'bug',
      priority: 'medium',
      status: 'open'
    };

    // Use regular authenticated client - policy should now allow system tickets
    // Don't use .select() to avoid RLS violations when reading back the created ticket
    const { error: insertError } = await supabase
      .from('support_tickets')
      .insert([ticketData]);

    if (insertError) {
      console.warn('Could not create system error ticket:', insertError);
      return { data: null, error: insertError.message };
    }

    console.log('System error ticket created successfully');
    return { data: { isDuplicate: false }, error: null };
  } catch (error) {
    console.error('Error creating system error ticket:', error);
    return { data: null, error: error.message };
  }
};