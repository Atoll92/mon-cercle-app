// Email notification service for sending notifications to network members
import { supabase } from '../supabaseclient';
import { createICSAttachment } from '../utils/icsGenerator';
import { logger } from '../utils/logger';

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

    // Get all network members who want news notifications (excluding the author)
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_news')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_news', true);


    if (recipientsError) {
      logger.error('Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      return { success: true, message: 'No recipients found' };
    }


    // Get network name for the notification
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();


    if (networkError) {
      logger.error('Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();


    if (authorError) {
      logger.error('Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Create notification queue entries
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


    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);


    if (insertError) {
      logger.error('Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    logger.error('Error in queueNewsNotifications:', error);
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
    
    // Check if the user wants mention notifications
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled, notify_on_mentions')
      .eq('id', mentionedUserId)
      .single();
      
    if (profileError) {
      logger.error('Error fetching user profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!userProfile.email_notifications_enabled || !userProfile.notify_on_mentions) {
      return { success: true, message: 'User has mention notifications disabled' };
    }
    
    // Check if user has email configured
    if (!userProfile.contact_email) {
      logger.error('No contact_email found for mentioned user');
      return { success: false, error: 'Mentioned user has no email address configured' };
    }
    
    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();
      
    if (networkError) {
      logger.error('Error fetching network:', networkError);
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
    
    
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);
      
    if (insertError) {
      logger.error('Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }
    
    return { success: true, message: 'Mention notification queued' };
    
  } catch (error) {
    logger.error('Error in queueMentionNotification:', error);
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

    // Get all network members who want event notifications (excluding the author)
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled, notify_on_events')
      .eq('network_id', networkId)
      .neq('id', authorId)
      .eq('email_notifications_enabled', true)
      .eq('notify_on_events', true);


    if (recipientsError) {
      logger.error('Error fetching notification recipients:', recipientsError);
      return { success: false, error: recipientsError.message };
    }

    if (!recipients || recipients.length === 0) {
      return { success: true, message: 'No recipients found' };
    }


    // Get network name for the notification
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();


    if (networkError) {
      logger.error('Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();


    if (authorError) {
      logger.error('Error fetching author name:', authorError);
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
    } catch (icsError) {
      logger.error('Error generating ICS attachment:', icsError);
      // Continue without ICS if generation fails
    }

    // Create notification queue entries
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


    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);


    if (insertError) {
      logger.error('Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    logger.error('Error in queueEventNotifications:', error);
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
        logger.error('Error queueing notifications:', insertError);
        return { success: false, error: insertError.message };
      }
      
    }
    
    return { 
      success: true, 
      message: `Queued ${notificationsToQueue.length} notifications`,
      count: notificationsToQueue.length 
    };
    
  } catch (error) {
    logger.error('Error in queueCommentNotification:', error);
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
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();


    if (networkError) {
      logger.error('Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get author name for the notification
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single();


    if (authorError) {
      logger.error('Error fetching author name:', authorError);
      return { success: false, error: authorError.message };
    }

    // Create notification queue entries
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


    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);


    if (insertError) {
      logger.error('Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} recipients`,
      count: notifications.length 
    };

  } catch (error) {
    logger.error('Error in queuePortfolioNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old notifications (older than 30 days)
 * This helps keep the notification queue table manageable
 */
export const cleanupOldNotifications = async () => {
  try {
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error } = await supabase
      .from('notification_queue')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('is_sent', true);
      
    if (error) {
      logger.error('Error cleaning up notifications:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Old notifications cleaned up' };
    
  } catch (error) {
    logger.error('Error in cleanupOldNotifications:', error);
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
    
    // Don't send notification to self
    if (recipientId === senderId) {
      return { success: true, message: 'No notification needed for self-messaging' };
    }
    
    // Check if the recipient wants direct message notifications
    const { data: recipientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled, notify_on_direct_messages, network_id')
      .eq('id', recipientId)
      .single();
      
    if (profileError) {
      logger.error('Error fetching recipient profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    if (!recipientProfile.email_notifications_enabled || !recipientProfile.notify_on_direct_messages) {
      return { success: true, message: 'Recipient has direct message notifications disabled' };
    }
    
    // Use contact_email as the notification email (should be populated during profile creation)
    const recipientEmail = recipientProfile.contact_email;
    if (!recipientEmail) {
      logger.error('No contact_email found for recipient');
      return { success: false, error: 'Recipient has no email address configured' };
    }
    
    // Get sender name
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();
      
    if (senderError) {
      logger.error('Error fetching sender profile:', senderError);
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
    
    
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);
      
    if (insertError) {
      logger.error('Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }
    
    return { success: true, message: 'Direct message notification queued' };
    
  } catch (error) {
    logger.error('Error in queueDirectMessageNotification:', error);
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

    // Get all network admins
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, contact_email, email_notifications_enabled')
      .eq('network_id', networkId)
      .eq('role', 'admin')
      .eq('email_notifications_enabled', true);


    if (adminsError) {
      logger.error('Error fetching network admins:', adminsError);
      return { success: false, error: adminsError.message };
    }

    if (!admins || admins.length === 0) {
      return { success: true, message: 'No admins found' };
    }


    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      logger.error('Error fetching network name:', networkError);
      return { success: false, error: networkError.message };
    }

    // Get proposer name
    const { data: proposer, error: proposerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', proposerId)
      .single();

    if (proposerError) {
      logger.error('Error fetching proposer name:', proposerError);
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


    // Insert all notifications at once
    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert(notifications);

    if (insertError) {
      logger.error('Error queueing notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      message: `Queued notifications for ${notifications.length} admins`,
      count: notifications.length 
    };

  } catch (error) {
    logger.error('Error in queueEventProposalNotificationForAdmins:', error);
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

    // Get event creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('full_name, contact_email, email_notifications_enabled')
      .eq('id', eventCreatorId)
      .single();

    if (creatorError) {
      logger.error('Error fetching creator profile:', creatorError);
      return { success: false, error: creatorError.message };
    }

    if (!creator.email_notifications_enabled) {
      return { success: true, message: 'Creator has notifications disabled' };
    }

    if (!creator.contact_email) {
      logger.error('No contact_email found for event creator');
      return { success: false, error: 'Event creator has no email address configured' };
    }

    // Get network name
    const { data: network, error: networkError } = await supabase
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single();

    if (networkError) {
      logger.error('Error fetching network:', networkError);
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


    const { error: insertError } = await supabase
      .from('notification_queue')
      .insert([notification]);

    if (insertError) {
      logger.error('Error inserting notification:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, message: 'Event status notification queued' };

  } catch (error) {
    logger.error('Error in queueEventStatusNotification:', error);
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