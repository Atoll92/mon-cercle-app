// Email notification service for sending notifications to network members
import { supabase } from '../supabaseclient';

/**
 * Queue a news notification for all network members who want to receive them
 * @param {string} networkId - The network ID where news was posted
 * @param {string} newsId - The ID of the news post
 * @param {string} authorId - The ID of the user who posted the news
 * @param {string} newsTitle - Title of the news post
 * @param {string} newsContent - Content preview of the news post
 */
export const queueNewsNotifications = async (networkId, newsId, authorId, newsTitle, newsContent) => {
  try {
    console.log('🔔 [EMAIL DEBUG] Starting to queue news notifications');
    console.log('🔔 [EMAIL DEBUG] Network ID:', networkId);
    console.log('🔔 [EMAIL DEBUG] News ID:', newsId);
    console.log('🔔 [EMAIL DEBUG] Author ID:', authorId);
    console.log('🔔 [EMAIL DEBUG] News Title:', newsTitle);

    // Get all network members who want news notifications (excluding the author)
    console.log('🔔 [EMAIL DEBUG] Fetching potential recipients...');
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_news')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_news', true);

    console.log('🔔 [EMAIL DEBUG] Recipients query result:', { recipients, recipientsError });

    if (recipientsError) {
      console.error('🔔 [EMAIL DEBUG] Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      console.log('🔔 [EMAIL DEBUG] No recipients found for news notifications');
      console.log('🔔 [EMAIL DEBUG] This could mean:');
      console.log('  - No other members in the network');
      console.log('  - All members have email notifications disabled');
      console.log('  - All members have news notifications disabled');
      return { success: true, message: 'No recipients found' };
    }

    console.log(`🔔 [EMAIL DEBUG] Found ${recipients.length} potential recipients:`, recipients);

    // Get network name for the notification
    console.log('🔔 [EMAIL DEBUG] Fetching network details...');
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    console.log('🔔 [EMAIL DEBUG] Network query result:', { network, networkError });

    if (networkError) {
      console.error('🔔 [EMAIL DEBUG] Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    console.log('🔔 [EMAIL DEBUG] Fetching author details...');
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();

    console.log('🔔 [EMAIL DEBUG] Author query result:', { author, authorError });

    if (authorError) {
      console.error('🔔 [EMAIL DEBUG] Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Create notification queue entries
    console.log('🔔 [EMAIL DEBUG] Creating notification queue entries...');
    const notifications = recipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'news',
      subject_line: `New post in ${network.name}: ${newsTitle}`,
      content_preview: `${author.full_name || 'Someone'} shared: ${newsContent?.substring(0, 200) || newsTitle}${newsContent?.length > 200 ? '...' : ''}`,
      related_item_id: newsId
    }));

    console.log('🔔 [EMAIL DEBUG] Notification entries to insert:', notifications);

    // Insert all notifications at once
    console.log('🔔 [EMAIL DEBUG] Inserting notifications into queue...');
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    console.log('🔔 [EMAIL DEBUG] Insert result:', { insertError });

    if (insertError) {
      console.error('🔔 [EMAIL DEBUG] Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`🔔 [EMAIL DEBUG] Successfully queued ${notifications.length} news notifications`);
    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    console.error('🔔 [EMAIL DEBUG] Error in queueNewsNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process pending notifications and send emails
 * This function should be called periodically (e.g., every few minutes)
 * In a production app, this would typically be triggered by a cron job or scheduled function
 */
export const processPendingNotifications = async () => {
  try {
    console.log('📨 [EMAIL PROCESS DEBUG] Starting to process pending notifications...');

    // Get all unsent notifications
    console.log('📨 [EMAIL PROCESS DEBUG] Fetching unsent notifications...');
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select(`
        id,
        recipient_id,
        network_id,
        notification_type,
        subject_line,
        content_preview,
        related_item_id,
        profiles!notification_queue_recipient_id_fkey (
          contact_email,
          full_name
        ),
        networks!notification_queue_network_id_fkey (
          name
        )
      `)
      .eq('is_sent', false)
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    console.log('📨 [EMAIL PROCESS DEBUG] Fetch result:', { 
      count: pendingNotifications?.length || 0, 
      fetchError,
      notifications: pendingNotifications 
    });

    if (fetchError) {
      console.error('📨 [EMAIL PROCESS DEBUG] Error fetching pending notifications:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('📨 [EMAIL PROCESS DEBUG] No pending notifications to process');
      return { success: true, message: 'No pending notifications' };
    }

    console.log(`📨 [EMAIL PROCESS DEBUG] Processing ${pendingNotifications.length} pending notifications`);

    // Send emails via the network-invite edge function with rate limiting
    console.log('📨 [EMAIL PROCESS DEBUG] Starting to send emails with rate limiting...');
    console.log('📨 [EMAIL PROCESS DEBUG] Processing with 500ms delay between requests to avoid rate limits');
    
    const results = [];
    
    // Process notifications sequentially with delay to respect rate limits
    for (let index = 0; index < pendingNotifications.length; index++) {
      const notification = pendingNotifications[index];
      
      try {
        console.log(`📨 [EMAIL PROCESS DEBUG] Processing notification ${index + 1}/${pendingNotifications.length}:`, {
          id: notification.id,
          recipient: notification.profiles?.contact_email,
          subject: notification.subject_line
        });

        // Add delay between requests (except for the first one)
        if (index > 0) {
          console.log('📨 [EMAIL PROCESS DEBUG] Waiting 600ms to respect rate limits...');
          await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay = ~1.7 requests per second
        }

        // Retry logic for rate limit errors
        let retryCount = 0;
        const maxRetries = 3;
        // emailResult will be set if successful

        while (retryCount < maxRetries) {
          try {
            console.log(`📨 [EMAIL PROCESS DEBUG] Attempt ${retryCount + 1}/${maxRetries} for notification ${notification.id}`);

            // Prepare additional context based on notification type
            let additionalData = {};
            
            // For event notifications, get event details
            if (notification.notification_type === 'event' && notification.related_item_id) {
              try {
                const { data: eventData } = await supabase
                  .from('network_events')
                  .select('event_date, location')
                  .eq('id', notification.related_item_id)
                  .single();
                
                if (eventData) {
                  additionalData.eventDate = eventData.event_date;
                  additionalData.eventLocation = eventData.location;
                }
              } catch (eventError) {
                console.warn('📨 [EMAIL PROCESS DEBUG] Failed to fetch event details:', eventError);
              }
            }
            
            // For mention notifications, add context about chat location
            if (notification.notification_type === 'mention') {
              additionalData.messageContext = `Network Chat in ${notification.networks.name}`;
            }

            // Call the edge function to send the email
            const { data, error } = await supabase.functions.invoke('network-invite', {
              body: {
                toEmail: notification.profiles.contact_email,
                networkName: notification.networks.name,
                inviterName: 'Network Update',
                type: notification.notification_type, // Use the actual notification type from database
                subject: notification.subject_line,
                content: notification.content_preview,
                relatedItemId: notification.related_item_id,
                ...additionalData
              }
            });

            console.log(`📨 [EMAIL PROCESS DEBUG] Edge function result for notification ${notification.id}:`, { data, error });

            if (error) {
              // Check if it's a rate limit error
              if (error.message && error.message.includes('rate_limit_exceeded')) {
                console.log(`📨 [EMAIL PROCESS DEBUG] Rate limit hit, waiting before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                retryCount++;
                continue;
              } else {
                throw new Error(error.message);
              }
            }

            // Email sent successfully
            break; // Success, exit retry loop

          } catch (retryError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw retryError;
            }
            console.log(`📨 [EMAIL PROCESS DEBUG] Retry ${retryCount} failed, trying again...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }

        // Mark notification as sent
        console.log(`📨 [EMAIL PROCESS DEBUG] Marking notification ${notification.id} as sent...`);
        const { error: updateError } = await supabase
          .from('notification_queue')
          .update({ 
            is_sent: true, 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`📨 [EMAIL PROCESS DEBUG] Error updating notification ${notification.id}:`, updateError);
        } else {
          console.log(`📨 [EMAIL PROCESS DEBUG] Successfully marked notification ${notification.id} as sent`);
        }

        results.push({ status: 'fulfilled', value: { success: true, id: notification.id } });

      } catch (error) {
        console.error(`📨 [EMAIL PROCESS DEBUG] Error sending notification ${notification.id}:`, error);
        
        // Mark notification with error
        console.log(`📨 [EMAIL PROCESS DEBUG] Marking notification ${notification.id} with error...`);
        const { error: errorUpdateError } = await supabase
          .from('notification_queue')
          .update({ 
            error_message: error.message 
          })
          .eq('id', notification.id);

        if (errorUpdateError) {
          console.error(`📨 [EMAIL PROCESS DEBUG] Error updating notification ${notification.id} with error:`, errorUpdateError);
        }

        results.push({ status: 'fulfilled', value: { success: false, id: notification.id, error: error.message } });
      }
    }

    // Count successes and failures
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;

    console.log(`📨 [EMAIL PROCESS DEBUG] Notification processing complete: ${successful} sent, ${failed} failed`);
    console.log('📨 [EMAIL PROCESS DEBUG] Detailed results:', results);

    return {
      success: true,
      message: `Processed ${results.length} notifications: ${successful} sent, ${failed} failed`,
      sent: successful,
      failed: failed
    };

  } catch (error) {
    console.error('📨 [EMAIL PROCESS DEBUG] Error in processPendingNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification statistics for a user
 * @param {string} profileId - The profile ID
 */
export const getNotificationStats = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('is_sent, created_at, error_message')
      .eq('recipient_id', profileId);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return { success: false, error: error.message };
    }

    const total = data.length;
    const sent = data.filter(n => n.is_sent).length;
    const pending = data.filter(n => !n.is_sent && !n.error_message).length;
    const failed = data.filter(n => n.error_message).length;

    return {
      success: true,
      stats: {
        total,
        sent,
        pending,
        failed
      }
    };

  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue a mention notification for a specific user
 * @param {string} mentionedUserId - The ID of the user who was mentioned
 * @param {string} networkId - The network ID where the mention occurred
 * @param {string} mentionerName - Name of the user who mentioned them
 * @param {string} messageContent - The message content containing the mention
 * @param {string} messageId - The ID of the message
 */
export const queueMentionNotification = async (mentionedUserId, networkId, mentionerName, messageContent, messageId) => {
  try {
    console.log('🔔 [MENTION DEBUG] Queueing mention notification');
    console.log('🔔 [MENTION DEBUG] Mentioned user ID:', mentionedUserId);
    console.log('🔔 [MENTION DEBUG] Network ID:', networkId);
    console.log('🔔 [MENTION DEBUG] Mentioner:', mentionerName);
    
    // Check if the user wants mention notifications
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled, notify_on_mentions')
      .eq('id', mentionedUserId)
      .single();
      
    if (profileError) {
      console.error('🔔 [MENTION DEBUG] Error fetching user profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!userProfile.email_notifications_enabled || !userProfile.notify_on_mentions) {
      console.log('🔔 [MENTION DEBUG] User has mention notifications disabled');
      return { success: true, message: 'User has mention notifications disabled' };
    }
    
    // Check if user has email configured
    if (!userProfile.contact_email) {
      console.error('🔔 [MENTION DEBUG] No contact_email found for mentioned user');
      return { success: false, error: 'Mentioned user has no email address configured' };
    }
    
    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();
      
    if (networkError) {
      console.error('🔔 [MENTION DEBUG] Error fetching network:', networkError);
      return { success: false, error: networkError.message };
    }
    
    // Create notification
    const notification = {
      recipient_id: mentionedUserId,
      network_id: networkId,
      notification_type: 'mention',
      subject_line: `${mentionerName} mentioned you in ${network.name}`,
      content_preview: messageContent.substring(0, 200) + (messageContent.length > 200 ? '...' : ''),
      related_item_id: messageId
    };
    
    console.log('🔔 [MENTION DEBUG] Creating notification:', notification);
    
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);
      
    if (insertError) {
      console.error('🔔 [MENTION DEBUG] Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }
    
    console.log('🔔 [MENTION DEBUG] Successfully queued mention notification');
    return { success: true, message: 'Mention notification queued' };
    
  } catch (error) {
    console.error('🔔 [MENTION DEBUG] Error in queueMentionNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue an event notification for all network members who want to receive them
 * @param {string} networkId - The network ID where event was created
 * @param {string} eventId - The ID of the event
 * @param {string} authorId - The ID of the user who created the event
 * @param {string} eventTitle - Title of the event
 * @param {string} eventDescription - Description of the event
 * @param {string} eventDate - Date of the event
 */
export const queueEventNotifications = async (networkId, eventId, authorId, eventTitle, eventDescription, eventDate, eventLocation = null) => {
  try {
    console.log('📅 [EVENT DEBUG] Starting to queue event notifications');
    console.log('📅 [EVENT DEBUG] Network ID:', networkId);
    console.log('📅 [EVENT DEBUG] Event ID:', eventId);
    console.log('📅 [EVENT DEBUG] Author ID:', authorId);
    console.log('📅 [EVENT DEBUG] Event Title:', eventTitle);

    // Get all network members who want event notifications (excluding the author)
    console.log('📅 [EVENT DEBUG] Fetching potential recipients...');
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_events')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_events', true);

    console.log('📅 [EVENT DEBUG] Recipients query result:', { recipients, recipientsError });

    if (recipientsError) {
      console.error('📅 [EVENT DEBUG] Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      console.log('📅 [EVENT DEBUG] No recipients found for event notifications');
      console.log('📅 [EVENT DEBUG] This could mean:');
      console.log('  - No other members in the network');
      console.log('  - All members have email notifications disabled');
      console.log('  - All members have event notifications disabled');
      return { success: true, message: 'No recipients found' };
    }

    console.log(`📅 [EVENT DEBUG] Found ${recipients.length} potential recipients:`, recipients);

    // Get network name for the notification
    console.log('📅 [EVENT DEBUG] Fetching network details...');
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    console.log('📅 [EVENT DEBUG] Network query result:', { network, networkError });

    if (networkError) {
      console.error('📅 [EVENT DEBUG] Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    console.log('📅 [EVENT DEBUG] Fetching author details...');
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();

    console.log('📅 [EVENT DEBUG] Author query result:', { author, authorError });

    if (authorError) {
      console.error('📅 [EVENT DEBUG] Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Format event date for display
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create notification queue entries
    console.log('📅 [EVENT DEBUG] Creating notification queue entries...');
    const notifications = recipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'event',
      subject_line: `New event in ${network.name}: ${eventTitle}`,
      content_preview: `${author.full_name || 'Someone'} created an event: ${eventTitle} on ${formattedDate}. ${eventDescription?.substring(0, 150) || ''}${eventDescription?.length > 150 ? '...' : ''}`,
      related_item_id: eventId
    }));

    console.log('📅 [EVENT DEBUG] Notification entries to insert:', notifications);

    // Insert all notifications at once
    console.log('📅 [EVENT DEBUG] Inserting notifications into queue...');
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    console.log('📅 [EVENT DEBUG] Insert result:', { insertError });

    if (insertError) {
      console.error('📅 [EVENT DEBUG] Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`📅 [EVENT DEBUG] Successfully queued ${notifications.length} event notifications`);
    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    console.error('📅 [EVENT DEBUG] Error in queueEventNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old notifications (older than 30 days)
 * This helps keep the notification queue table manageable
 */
export const cleanupOldNotifications = async () => {
  try {
    console.log('🧹 [CLEANUP DEBUG] Starting notification cleanup...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error } = await supabase
      .from('notification_queue')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('is_sent', true);
      
    if (error) {
      console.error('🧹 [CLEANUP DEBUG] Error cleaning up notifications:', error);
      return { success: false, error: error.message };
    }
    
    console.log('🧹 [CLEANUP DEBUG] Successfully cleaned up old notifications');
    return { success: true, message: 'Old notifications cleaned up' };
    
  } catch (error) {
    console.error('🧹 [CLEANUP DEBUG] Error in cleanupOldNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue a direct message notification for a recipient
 * @param {string} recipientId - The ID of the user receiving the message
 * @param {string} senderId - The ID of the user sending the message
 * @param {string} messageContent - The message content
 * @param {string} messageId - The ID of the message
 */
export const queueDirectMessageNotification = async (recipientId, senderId, messageContent, messageId) => {
  try {
    console.log('💬 [DM DEBUG] Queueing direct message notification');
    console.log('💬 [DM DEBUG] Recipient ID:', recipientId);
    console.log('💬 [DM DEBUG] Sender ID:', senderId);
    
    // Don't send notification to self
    if (recipientId === senderId) {
      console.log('💬 [DM DEBUG] Skipping notification - same user');
      return { success: true, message: 'No notification needed for self-messaging' };
    }
    
    // Check if the recipient wants direct message notifications
    const { data: recipientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled, notify_on_direct_messages, network_id')
      .eq('id', recipientId)
      .single();
      
    if (profileError) {
      console.error('💬 [DM DEBUG] Error fetching recipient profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!recipientProfile.email_notifications_enabled || !recipientProfile.notify_on_direct_messages) {
      console.log('💬 [DM DEBUG] Recipient has direct message notifications disabled');
      return { success: true, message: 'Recipient has direct message notifications disabled' };
    }
    
    // Use contact_email as the notification email (should be populated during profile creation)
    const recipientEmail = recipientProfile.contact_email;
    if (!recipientEmail) {
      console.error('💬 [DM DEBUG] No contact_email found for recipient');
      return { success: false, error: 'Recipient has no email address configured' };
    }
    
    // Get sender name
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();
      
    if (senderError) {
      console.error('💬 [DM DEBUG] Error fetching sender profile:', senderError);
      return { success: false, error: senderError.message };
    }
    
    // Create notification
    const notification = {
      recipient_id: recipientId,
      network_id: recipientProfile.network_id, // Use recipient's network for organization
      notification_type: 'direct_message',
      subject_line: `New message from ${senderProfile.full_name || 'Someone'}`,
      content_preview: messageContent.substring(0, 200) + (messageContent.length > 200 ? '...' : ''),
      related_item_id: messageId
    };
    
    console.log('💬 [DM DEBUG] Creating notification:', notification);
    
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);
      
    if (insertError) {
      console.error('💬 [DM DEBUG] Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }
    
    console.log('💬 [DM DEBUG] Successfully queued direct message notification');
    return { success: true, message: 'Direct message notification queued' };
    
  } catch (error) {
    console.error('💬 [DM DEBUG] Error in queueDirectMessageNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all notifications for a user (sent and pending)
 * @param {string} profileId - The profile ID
 */
export const clearNotificationQueue = async (profileId) => {
  try {
    console.log('🧹 [CLEAR DEBUG] Clearing notification queue for profile:', profileId);
    
    const { error } = await supabase
      .from('notification_queue')
      .delete()
      .eq('recipient_id', profileId);
      
    if (error) {
      console.error('🧹 [CLEAR DEBUG] Error clearing notification queue:', error);
      return { success: false, error: error.message };
    }
    
    console.log('🧹 [CLEAR DEBUG] Successfully cleared notification queue');
    return { success: true, message: 'Notification queue cleared successfully' };
    
  } catch (error) {
    console.error('🧹 [CLEAR DEBUG] Error in clearNotificationQueue:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's notification preferences
 * @param {string} profileId - The profile ID
 */
export const getUserNotificationPreferences = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email_notifications_enabled, notify_on_news, notify_on_events, notify_on_mentions, notify_on_direct_messages')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      preferences: data
    };

  } catch (error) {
    console.error('Error in getUserNotificationPreferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Automatic notification processor - runs continuously in the background
 * Processes queued notifications every 1 minute and clears successful sends
 */
class NotificationProcessor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.processingInterval = 1 * 60 * 1000; // 1 minute
  }

  /**
   * Start automatic notification processing
   */
  start() {
    if (this.isRunning) {
      console.log('🤖 [AUTO PROCESSOR] Already running');
      return;
    }

    console.log('🤖 [AUTO PROCESSOR] Starting automatic notification processing...');
    console.log(`🤖 [AUTO PROCESSOR] Will process notifications every ${this.processingInterval / 1000} seconds`);
    
    this.isRunning = true;
    
    // Process immediately on start
    this.processNotifications();
    
    // Set up interval for continuous processing
    this.intervalId = setInterval(() => {
      this.processNotifications();
    }, this.processingInterval);
  }

  /**
   * Stop automatic notification processing
   */
  stop() {
    if (!this.isRunning) {
      console.log('🤖 [AUTO PROCESSOR] Not running');
      return;
    }

    console.log('🤖 [AUTO PROCESSOR] Stopping automatic notification processing...');
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process notifications and clear successful sends automatically
   */
  async processNotifications() {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🤖 [AUTO PROCESSOR] Starting notification processing cycle...');
      
      // Get pending count before processing
      const { data: beforeCount } = await supabase
        .from('notification_queue')
        .select('id', { count: 'exact' })
        .eq('is_sent', false);

      const pendingBefore = beforeCount || 0;
      
      if (pendingBefore === 0) {
        console.log('🤖 [AUTO PROCESSOR] No pending notifications to process');
        return;
      }

      console.log(`🤖 [AUTO PROCESSOR] Found ${pendingBefore} pending notifications`);

      // Process pending notifications
      const result = await processPendingNotifications();
      
      if (result.success) {
        console.log(`🤖 [AUTO PROCESSOR] Processing completed: ${result.sent} sent, ${result.failed} failed`);
        
        // Auto-cleanup: Remove old sent notifications (older than 7 days) to prevent database bloat
        await this.cleanupSentNotifications();
      } else {
        console.error('🤖 [AUTO PROCESSOR] Processing failed:', result.error);
      }

    } catch (error) {
      console.error('🤖 [AUTO PROCESSOR] Error in automatic processing:', error);
    }
  }

  /**
   * Clean up sent notifications older than 7 days to prevent database bloat
   */
  async cleanupSentNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .lt('sent_at', sevenDaysAgo.toISOString())
        .eq('is_sent', true);

      if (error) {
        console.error('🤖 [AUTO PROCESSOR] Error cleaning up sent notifications:', error);
      } else {
        console.log('🤖 [AUTO PROCESSOR] Cleaned up old sent notifications');
      }
    } catch (error) {
      console.error('🤖 [AUTO PROCESSOR] Error in cleanup:', error);
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingInterval: `${this.processingInterval / 1000} seconds`,
      nextProcessing: this.isRunning ? new Date(Date.now() + this.processingInterval).toISOString() : null
    };
  }
}

// Create singleton instance
const notificationProcessor = new NotificationProcessor();

/**
 * Start automatic notification processing
 * Call this when the application starts up
 */
export const startAutomaticNotificationProcessing = () => {
  notificationProcessor.start();
  return notificationProcessor.getStatus();
};

/**
 * Stop automatic notification processing
 */
export const stopAutomaticNotificationProcessing = () => {
  notificationProcessor.stop();
  return notificationProcessor.getStatus();
};

/**
 * Get automatic processor status
 */
export const getAutomaticProcessorStatus = () => {
  return notificationProcessor.getStatus();
};

/**
 * Force immediate notification processing (manual trigger)
 */
export const forceNotificationProcessing = async () => {
  console.log('🔄 [FORCE PROCESSOR] Manual notification processing triggered');
  await notificationProcessor.processNotifications();
  return { success: true, message: 'Forced processing completed' };
};