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
    console.log('Queueing news notifications for network:', networkId);

    // Get all network members who want news notifications (excluding the author)
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_news')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_news', true);

    if (recipientsError) {
      console.error('Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for news notifications');
      return { success: true, message: 'No recipients found' };
    }

    // Get network name for the notification
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      console.error('Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();

    if (authorError) {
      console.error('Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Create notification queue entries
    const notifications = recipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'news',
      subject_line: `New post in ${network.name}: ${newsTitle}`,
      content_preview: `${author.full_name || 'Someone'} shared: ${newsContent?.substring(0, 200) || newsTitle}${newsContent?.length > 200 ? '...' : ''}`,
      related_item_id: newsId
    }));

    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    if (insertError) {
      console.error('Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`Successfully queued ${notifications.length} news notifications`);
    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    console.error('Error in queueNewsNotifications:', error);
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
    console.log('Processing pending notifications...');

    // Get all unsent notifications
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

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('No pending notifications to process');
      return { success: true, message: 'No pending notifications' };
    }

    console.log(`Processing ${pendingNotifications.length} pending notifications`);

    // Send emails via the network-invite edge function (reusing existing email infrastructure)
    const results = await Promise.allSettled(
      pendingNotifications.map(async (notification) => {
        try {
          // Call the edge function to send the email
          const { data, error } = await supabase.functions.invoke('network-invite', {
            body: {
              toEmail: notification.profiles.contact_email,
              networkName: notification.networks.name,
              inviterName: 'Network Update', // Generic sender name for notifications
              type: 'news_notification',
              subject: notification.subject_line,
              content: notification.content_preview,
              relatedItemId: notification.related_item_id
            }
          });

          if (error) {
            throw new Error(error.message);
          }

          // Mark notification as sent
          await supabase
            .from('notification_queue')
            .update({ 
              is_sent: true, 
              sent_at: new Date().toISOString() 
            })
            .eq('id', notification.id);

          return { success: true, id: notification.id };

        } catch (error) {
          console.error(`Error sending notification ${notification.id}:`, error);
          
          // Mark notification with error
          await supabase
            .from('notification_queue')
            .update({ 
              error_message: error.message 
            })
            .eq('id', notification.id);

          return { success: false, id: notification.id, error: error.message };
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;

    console.log(`Notification processing complete: ${successful} sent, ${failed} failed`);

    return {
      success: true,
      message: `Processed ${results.length} notifications: ${successful} sent, ${failed} failed`,
      sent: successful,
      failed: failed
    };

  } catch (error) {
    console.error('Error in processPendingNotifications:', error);
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