// API functions for sending custom emails
import { supabase } from '../supabaseclient';

/**
 * Queue a custom email notification to selected members
 * @param {string} networkId - The network ID
 * @param {string} subject - Email subject
 * @param {string} content - Email content
 * @param {Array<string>} recipientIds - Array of profile IDs to send to (empty = all members)
 * @param {string} senderId - ID of the admin sending the email
 * @returns {Promise<Object>} Result with success status and count
 */
export const queueCustomEmail = async (networkId, subject, content, recipientIds = [], senderId) => {
  try {
    console.log('📧 [CUSTOM EMAIL] Starting to queue custom email');
    console.log('📧 [CUSTOM EMAIL] Network ID:', networkId);
    console.log('📧 [CUSTOM EMAIL] Subject:', subject);
    console.log('📧 [CUSTOM EMAIL] Recipients:', recipientIds.length || 'All members');

    // Get recipients based on selection
    let recipients;
    
    if (recipientIds.length === 0) {
      // Send to all members with email notifications enabled
      console.log('📧 [CUSTOM EMAIL] Fetching all network members...');
      const { data: allMembers, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, contact_email, email_notifications_enabled')
        .eq('network_id', networkId)
        .eq('email_notifications_enabled', true);

      if (membersError) {
        console.error('📧 [CUSTOM EMAIL] Error fetching members:', membersError);
        throw membersError;
      }

      recipients = allMembers || [];
    } else {
      // Send to selected members only (who have notifications enabled)
      console.log('📧 [CUSTOM EMAIL] Fetching selected members...');
      const { data: selectedMembers, error: selectedError } = await supabase
        .from('profiles')
        .select('id, full_name, contact_email, email_notifications_enabled')
        .in('id', recipientIds)
        .eq('email_notifications_enabled', true);

      if (selectedError) {
        console.error('📧 [CUSTOM EMAIL] Error fetching selected members:', selectedError);
        throw selectedError;
      }

      recipients = selectedMembers || [];
    }

    // Filter out recipients without email addresses
    const validRecipients = recipients.filter(r => r.contact_email);
    
    if (validRecipients.length === 0) {
      return { 
        success: true, 
        message: 'No valid recipients found with email addresses and notifications enabled',
        count: 0
      };
    }

    console.log(`📧 [CUSTOM EMAIL] Found ${validRecipients.length} valid recipients`);

    // Get sender information
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();

    if (senderError) {
      console.error('📧 [CUSTOM EMAIL] Error fetching sender:', senderError);
      throw senderError;
    }

    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      console.error('📧 [CUSTOM EMAIL] Error fetching network:', networkError);
      throw networkError;
    }

    // Create notification entries
    const notifications = validRecipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'custom',
      subject_line: subject,
      content_preview: content,
      related_item_id: null,
      metadata: JSON.stringify({
        senderName: sender.full_name || 'Network Admin',
        networkName: network.name,
        isCustomEmail: true
      })
    }));

    console.log('📧 [CUSTOM EMAIL] Inserting notifications into queue...');

    // Insert notifications
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    if (insertError) {
      console.error('📧 [CUSTOM EMAIL] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`📧 [CUSTOM EMAIL] Successfully queued ${notifications.length} custom emails`);

    return {
      success: true,
      message: `Successfully queued ${notifications.length} emails`,
      count: notifications.length,
      invalidCount: recipients.length - validRecipients.length
    };

  } catch (error) {
    console.error('📧 [CUSTOM EMAIL] Error:', error);
    return {
      success: false,
      error: error.message,
      count: 0
    };
  }
};