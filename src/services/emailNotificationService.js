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
        let emailResult = null;

        while (retryCount < maxRetries) {
          try {
            console.log(`📨 [EMAIL PROCESS DEBUG] Attempt ${retryCount + 1}/${maxRetries} for notification ${notification.id}`);

            // Call the edge function to send the email
            const { data, error } = await supabase.functions.invoke('network-invite', {
              body: {
                toEmail: notification.profiles.contact_email,
                networkName: notification.networks.name,
                inviterName: 'Network Update',
                type: 'news_notification',
                subject: notification.subject_line,
                content: notification.content_preview,
                relatedItemId: notification.related_item_id
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

            emailResult = { data, error: null };
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
 * @param {string} userId - The user ID
 */
export const getNotificationStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('is_sent, created_at')
      .eq('recipient_id', userId);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return { success: false, error: error.message };
    }

    const total = data.length;
    const sent = data.filter(n => n.is_sent).length;
    const pending = total - sent;

    return {
      success: true,
      stats: {
        total,
        sent,
        pending
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