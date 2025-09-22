// Email notification service for sending notifications to network members
import { supabase } from '../supabaseclient';
import { createICSAttachment } from '../utils/icsGenerator';

/**
 * Queue a news notification for all network members who want to receive them
 * @param {string} networkId - The network ID where news was posted
 * @param {string} newsId - The ID of the news post
 * @param {string} authorId - The ID of the user who posted the news
 * @param {string} newsTitle - Title of the news post
 * @param {string} newsContent - Content preview of the news post
 */
export const queueNewsNotifications = async (networkId, newsId, authorId, newsTitle, newsContent, mediaUrl = null, mediaType = null) => {
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
      content_preview: `${author.full_name || 'Someone'} shared: ${newsContent?.substring(0, 200) || newsTitle}${newsContent?.length > 200 ? '...' : ''}${mediaUrl ? ` [${mediaType || 'Media'}:${mediaUrl}]` : ''}`,
      related_item_id: newsId,
      metadata: JSON.stringify({
        authorName: author.full_name || 'Someone'
      })
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

// Note: Client-side notification processing has been deprecated and replaced by server-side processing
// Notification processing is now handled by the process-notifications edge function
// See /supabase/functions/process-notifications for the server-side implementation

/**
 * Get notification statistics for a user
 * @param {string} profileId - The profile ID
 */
export const getNotificationStats = async (profileId) => {
  try {
    // For now, keeping direct access to notification_queue
    // This can be restricted later with proper RLS policies
    const { data, error } = await supabase
      .from('notification_queue')
      .select('is_sent, created_at, error_message')
      .eq('recipient_id', profileId);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return { success: false, error: error.message };
    }

    const total = data?.length || 0;
    const sent = data?.filter(n => n.is_sent).length || 0;
    const pending = data?.filter(n => !n.is_sent && !n.error_message).length || 0;
    const failed = data?.filter(n => n.error_message).length || 0;

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
      related_item_id: messageId,
      metadata: JSON.stringify({
        mentionerName: mentionerName
      })
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
export const queueEventNotifications = async (networkId, eventId, authorId, eventTitle, eventDescription, eventDate, eventLocation = null, coverImageUrl = null) => {
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

    // Generate ICS attachment data for the event
    console.log('📅 [EVENT DEBUG] Generating ICS attachment data...');
    let icsAttachmentData = null;
    try {
      // Create event data for ICS generation
      const eventForICS = {
        id: eventId,
        title: eventTitle,
        description: eventDescription || '',
        startDate: eventDate,
        location: eventLocation || '',
        organizer: author.full_name || 'Event Organizer',
        organizerEmail: '', // We'll set this in the edge function if needed
        url: `${import.meta.env.VITE_APP_URL || 'https://your-app-url.com'}/network/${networkId}/event/${eventId}`
      };
      
      const icsAttachment = createICSAttachment(eventForICS);
      icsAttachmentData = JSON.stringify(icsAttachment);
      console.log('📅 [EVENT DEBUG] ICS attachment generated successfully');
    } catch (icsError) {
      console.error('📅 [EVENT DEBUG] Error generating ICS attachment:', icsError);
      // Continue without ICS if generation fails
    }

    // Create notification queue entries
    console.log('📅 [EVENT DEBUG] Creating notification queue entries...');
    const notifications = recipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'event',
      subject_line: `New event in ${network.name}: ${eventTitle}`,
      content_preview: `${author.full_name || 'Someone'} created an event: ${eventTitle} on ${formattedDate}. ${eventDescription?.substring(0, 150) || ''}${eventDescription?.length > 150 ? '...' : ''}${coverImageUrl ? ` [image:${coverImageUrl}]` : ''}`,
      related_item_id: eventId,
      // Add ICS attachment data to metadata
      metadata: icsAttachmentData ? JSON.stringify({
        eventDate: eventDate,
        eventLocation: eventLocation,
        icsAttachment: JSON.parse(icsAttachmentData),
        organizerName: author.full_name || 'Event Organizer',
        networkId: networkId,
        eventId: eventId
      }) : JSON.stringify({
        eventDate: eventDate,
        eventLocation: eventLocation,
        organizerName: author.full_name || 'Event Organizer',
        networkId: networkId,
        eventId: eventId
      })
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
 * Queue comment notifications for post author and parent comment author
 * @param {Object} params - Comment notification parameters
 */
export const queueCommentNotification = async (params) => {
  const {
    itemType,
    itemId,
    commenterId,
    commenterName,
    content,
    originalPosterId,
    parentCommentAuthorId,
    postTitle,
    pageSlug,
    isReply
  } = params;

  try {
    console.log('🔔 [COMMENT] Queueing comment notification', params);
    
    const notificationsToQueue = [];
    
    // Get the commenter's network ID
    const { data: commenterProfile } = await supabase
      .from('profiles')
      .select('network_id')
      .eq('id', commenterId)
      .single();
    
    if (!commenterProfile) {
      console.error('🔔 [COMMENT] Could not find commenter profile');
      return { success: false, error: 'Commenter profile not found' };
    }
    
    const networkId = commenterProfile.network_id;
    
    // 1. Notify the original post author (if not the commenter)
    if (originalPosterId && originalPosterId !== commenterId) {
      // Check if they want notifications
      const { data: postAuthor } = await supabase
        .from('profiles')
        .select('contact_email, email_notifications_enabled, notify_on_news')
        .eq('id', originalPosterId)
        .single();
      
      if (postAuthor?.email_notifications_enabled && postAuthor?.notify_on_news && postAuthor?.contact_email) {
        const itemTypeDisplay = itemType === 'event' ? 'event' : itemType === 'news' ? 'news post' : 'portfolio post';
        
        notificationsToQueue.push({
          recipient_id: originalPosterId,
          network_id: networkId,
          notification_type: 'comment',
          subject_line: `${commenterName} commented on your ${itemTypeDisplay}`,
          content_preview: `${commenterName} commented on "${postTitle}": ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
          related_item_id: itemId,
          metadata: JSON.stringify({
            commenterName,
            itemType,
            postTitle,
            pageSlug,
            isReply: false
          })
        });
      }
    }
    
    // 2. Notify the parent comment author if this is a reply (and not the commenter)
    if (isReply && parentCommentAuthorId && parentCommentAuthorId !== commenterId) {
      // Check if they want notifications
      const { data: parentAuthor } = await supabase
        .from('profiles')
        .select('contact_email, email_notifications_enabled, notify_on_news')
        .eq('id', parentCommentAuthorId)
        .single();
      
      if (parentAuthor?.email_notifications_enabled && parentAuthor?.notify_on_news && parentAuthor?.contact_email) {
        notificationsToQueue.push({
          recipient_id: parentCommentAuthorId,
          network_id: networkId,
          notification_type: 'comment_reply',
          subject_line: `${commenterName} replied to your comment`,
          content_preview: `${commenterName} replied to your comment on "${postTitle}": ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
          related_item_id: itemId,
          metadata: JSON.stringify({
            commenterName,
            itemType,
            postTitle,
            pageSlug,
            isReply: true
          })
        });
      }
    }
    
    // Insert all notifications
    if (notificationsToQueue.length > 0) {
      const { error: insertError } = await supabase
        .from('notification_queue')
        .insert(notificationsToQueue);
      
      if (insertError) {
        console.error('🔔 [COMMENT] Error queueing notifications:', insertError);
        return { success: false, error: insertError.message };
      }
      
      console.log(`🔔 [COMMENT] Successfully queued ${notificationsToQueue.length} comment notifications`);
    }
    
    return { 
      success: true, 
      message: `Queued ${notificationsToQueue.length} notifications`,
      count: notificationsToQueue.length 
    };
    
  } catch (error) {
    console.error('🔔 [COMMENT] Error in queueCommentNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue a portfolio post notification for all network members who want to receive them
 * @param {string} networkId - The network ID where portfolio post was created
 * @param {string} postId - The ID of the portfolio post
 * @param {string} authorId - The ID of the user who created the post
 * @param {string} postTitle - Title of the portfolio post
 * @param {string} postDescription - Description of the portfolio post
 * @param {string} mediaUrl - URL of attached media (optional)
 * @param {string} mediaType - Type of attached media (optional)
 */
export const queuePortfolioNotifications = async (networkId, postId, authorId, postTitle, postDescription, mediaUrl = null, mediaType = null) => {
  try {
    console.log('🔔 [PORTFOLIO] Queueing notifications for portfolio post:', postTitle);

    // Get all network members who want news notifications (excluding the author)
    // Using news notification preference since portfolio posts are like news/updates
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_news')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_news', true); // Portfolio posts use news notification preference

    if (recipientsError) {
      console.error('Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      return { success: true, message: 'No recipients found' };
    }

    // Get network name for the notification
    console.log('🔔 [PORTFOLIO] Fetching network details...');
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    console.log('🔔 [PORTFOLIO] Network query result:', { network, networkError });

    if (networkError) {
      console.error('🔔 [PORTFOLIO] Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    console.log('🔔 [PORTFOLIO] Fetching author details...');
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();

    console.log('🔔 [PORTFOLIO] Author query result:', { author, authorError });

    if (authorError) {
      console.error('🔔 [PORTFOLIO] Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Create notification queue entries
    console.log('🔔 [PORTFOLIO] Creating notification queue entries...');
    const notifications = recipients.map(recipient => ({
      recipient_id: recipient.id,
      network_id: networkId,
      notification_type: 'post', // Portfolio posts have their own type
      subject_line: `New post shared in ${network.name}: ${postTitle}`,
      content_preview: `${author.full_name || 'Someone'} shared a new post: ${postTitle}. ${postDescription?.substring(0, 150) || ''}${postDescription?.length > 150 ? '...' : ''}${mediaUrl ? ` [${mediaType || 'Media'}:${mediaUrl}]` : ''}`,
      related_item_id: postId,
      metadata: JSON.stringify({
        authorName: author.full_name || 'Someone'
      })
    }));

    console.log('🔔 [PORTFOLIO] Notification entries to insert:', notifications);

    // Insert all notifications at once
    console.log('🔔 [PORTFOLIO] Inserting notifications into queue...');
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    console.log('🔔 [PORTFOLIO] Insert result:', { insertError });

    if (insertError) {
      console.error('🔔 [PORTFOLIO] Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`💼 [PORTFOLIO DEBUG] Successfully queued ${notifications.length} portfolio notifications`);
    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    console.error('💼 [PORTFOLIO DEBUG] Error in queuePortfolioNotifications:', error);
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
      related_item_id: messageId,
      metadata: JSON.stringify({
        senderName: senderProfile.full_name || 'Someone'
      })
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
 * Queue event proposal notification for network admins
 * @param {string} networkId - The network ID where event was proposed
 * @param {string} eventId - The ID of the proposed event
 * @param {string} proposerId - The ID of the user who proposed the event
 * @param {string} eventTitle - Title of the event
 * @param {string} eventDescription - Description of the event
 * @param {string} eventDate - Date of the event
 */
export const queueEventProposalNotificationForAdmins = async (networkId, eventId, proposerId, eventTitle, eventDescription, eventDate) => {
  try {
    console.log('🔔 [EVENT PROPOSAL] Starting to queue admin notifications for event proposal');
    console.log('🔔 [EVENT PROPOSAL] Network ID:', networkId);
    console.log('🔔 [EVENT PROPOSAL] Event ID:', eventId);
    console.log('🔔 [EVENT PROPOSAL] Proposer ID:', proposerId);
    console.log('🔔 [EVENT PROPOSAL] Event Title:', eventTitle);

    // Get all network admins
    console.log('🔔 [EVENT PROPOSAL] Fetching network admins...');
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled')
      .eq('network_id', networkId)
      .eq('role', 'admin')
      .eq('email_notifications_enabled', true);

    console.log('🔔 [EVENT PROPOSAL] Admins query result:', { admins, adminsError });

    if (adminsError) {
      console.error('🔔 [EVENT PROPOSAL] Error fetching network admins:', adminsError);
      return { success: false, error: adminsError.message };
    }

    if (!admins || admins.length === 0) {
      console.log('🔔 [EVENT PROPOSAL] No admins found for event proposal notifications');
      return { success: true, message: 'No admins found' };
    }

    console.log(`🔔 [EVENT PROPOSAL] Found ${admins.length} admins:`, admins);

    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      console.error('🔔 [EVENT PROPOSAL] Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get proposer name
    const { data: proposer, error: proposerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', proposerId)
      .single();

    if (proposerError) {
      console.error('🔔 [EVENT PROPOSAL] Error fetching proposer name:', proposerError);
      return { success: false, error: proposerError.message };
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

    // Create notification queue entries for admins
    const notifications = admins.map(admin => ({
      recipient_id: admin.id,
      network_id: networkId,
      notification_type: 'event_proposal',
      subject_line: `Event proposal in ${network.name}: ${eventTitle}`,
      content_preview: `${proposer.full_name || 'A member'} has proposed a new event: "${eventTitle}" scheduled for ${formattedDate}. Please review and approve/reject.`,
      related_item_id: eventId,
      metadata: JSON.stringify({
        proposerName: proposer.full_name || 'A member'
      })
    }));

    console.log('🔔 [EVENT PROPOSAL] Creating notifications for admins:', notifications);

    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    if (insertError) {
      console.error('🔔 [EVENT PROPOSAL] Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`🔔 [EVENT PROPOSAL] Successfully queued ${notifications.length} admin notifications`);
    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} admins`,
      count: notifications.length 
    };

  } catch (error) {
    console.error('🔔 [EVENT PROPOSAL] Error in queueEventProposalNotificationForAdmins:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue event approval/rejection notification for event creator
 * @param {string} eventId - The ID of the event
 * @param {string} eventCreatorId - The ID of the user who created the event
 * @param {string} eventTitle - Title of the event
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} rejectionReason - Reason for rejection (if rejected)
 * @param {string} networkId - The network ID
 */
export const queueEventStatusNotification = async (eventId, eventCreatorId, eventTitle, status, rejectionReason = '', networkId) => {
  try {
    console.log('🔔 [EVENT STATUS] Queueing event status notification');
    console.log('🔔 [EVENT STATUS] Event ID:', eventId);
    console.log('🔔 [EVENT STATUS] Creator ID:', eventCreatorId);
    console.log('🔔 [EVENT STATUS] Status:', status);

    // Get event creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled')
      .eq('id', eventCreatorId)
      .single();

    if (creatorError) {
      console.error('🔔 [EVENT STATUS] Error fetching creator profile:', creatorError);
      return { success: false, error: creatorError.message };
    }

    if (!creator.email_notifications_enabled) {
      console.log('🔔 [EVENT STATUS] Creator has email notifications disabled');
      return { success: true, message: 'Creator has notifications disabled' };
    }

    if (!creator.contact_email) {
      console.error('🔔 [EVENT STATUS] No contact_email found for event creator');
      return { success: false, error: 'Event creator has no email address configured' };
    }

    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      console.error('🔔 [EVENT STATUS] Error fetching network:', networkError);
      return { success: false, error: networkError.message };
    }

    // Create notification based on status
    const isApproved = status === 'approved';
    const notification = {
      recipient_id: eventCreatorId,
      network_id: networkId,
      notification_type: 'event_status',
      subject_line: `Your event "${eventTitle}" has been ${isApproved ? 'approved' : 'rejected'}`,
      content_preview: isApproved 
        ? `Great news! Your event "${eventTitle}" in ${network.name} has been approved and is now visible to all members.`
        : `Your event "${eventTitle}" in ${network.name} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      related_item_id: eventId,
      metadata: JSON.stringify({ status, rejectionReason })
    };

    console.log('🔔 [EVENT STATUS] Creating notification:', notification);

    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);

    if (insertError) {
      console.error('🔔 [EVENT STATUS] Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('🔔 [EVENT STATUS] Successfully queued event status notification');
    return { success: true, message: 'Event status notification queued' };

  } catch (error) {
    console.error('🔔 [EVENT STATUS] Error in queueEventStatusNotification:', error);
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

// Note: Automatic notification processing has been moved to server-side
// Notification processing is now handled via Supabase edge function and cron job
// See /supabase/functions/process-notifications for the server-side implementation