import { supabase } from '../supabaseclient';
import { queueDirectMessageNotification } from '../services/emailNotificationService';

/**
 * Get or create a conversation between two users
 * @param {string} user1Id - First user's ID
 * @param {string} user2Id - Second user's ID
 * @returns {Object} Object containing conversation data or error
 */
export const getOrCreateConversation = async (user1Id, user2Id) => {
  try {
    // Sort user IDs to ensure consistent participant arrays
    const participants = [user1Id, user2Id].sort();
    
    console.log('Searching for conversation with participants:', participants);
    
    // First approach: Check if conversation exists with exact participants array
    let { data: existingConversation, error: fetchError } = await supabase
      .from('direct_conversations')
      .select('*')
      .contains('participants', participants)
      .single();
      
    // If that doesn't work, try a different approach
    if (fetchError) {
      console.log('First approach failed, trying alternative:', fetchError);
      
      // Alternative approach: Query all conversations where both users are participants
      // This is more reliable as it handles array order differences
      const { data: conversations, error: listError } = await supabase
        .from('direct_conversations')
        .select('*');
        
      if (listError) throw listError;
      
      // Manually find a conversation containing both user IDs
      existingConversation = conversations.find(conv => 
        conv.participants.includes(user1Id) && 
        conv.participants.includes(user2Id)
      );
    }
    
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      return { conversation: existingConversation, error: null };
    }
    
    console.log('Creating new conversation between users:', user1Id, user2Id);
    
    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('direct_conversations')
      .insert({
        participants,
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating conversation:', createError);
      throw createError;
    }
    
    console.log('Created new conversation:', newConversation.id);
    return { conversation: newConversation, error: null };
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    return { conversation: null, error };
  }
};

/**
 * Get all conversations for a user with additional metadata
 * @param {string} userId - User ID
 * @returns {Object} Object containing conversations array or error
 */
export const getUserConversations = async (userId) => {
  try {
    console.log('Fetching conversations for user:', userId);
    
    // First get all conversations the user is part of
    const { data: conversations, error: convError } = await supabase
      .from('direct_conversations')
      .select('*');
      
    if (convError) throw convError;
    
    // Filter conversations to include only those where the user is a participant
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId)
    );
    
    console.log(`Found ${userConversations.length} conversations for user`);
    
    if (!userConversations || userConversations.length === 0) {
      return { conversations: [], error: null };
    }
    
    // Extract all unique partner IDs
    const partnerIds = userConversations
      .map(conv => conv.participants.find(id => id !== userId))
      .filter(id => id != null);
    
    // Batch fetch all partner profiles
    const { data: partners, error: partnersError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url')
      .in('id', partnerIds);
      
    if (partnersError) {
      console.error('Error fetching partner profiles:', partnersError);
    }
    
    // Create a map for quick partner lookup
    const partnerMap = new Map();
    partners?.forEach(partner => {
      partnerMap.set(partner.id, partner);
    });
    
    // Batch fetch last messages for all conversations
    const conversationIds = userConversations.map(conv => conv.id);
    const { data: allMessages, error: messagesError } = await supabase
      .from('direct_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });
      
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }
    
    // Group messages by conversation
    const messagesByConversation = new Map();
    allMessages?.forEach(msg => {
      if (!messagesByConversation.has(msg.conversation_id)) {
        messagesByConversation.set(msg.conversation_id, []);
      }
      messagesByConversation.get(msg.conversation_id).push(msg);
    });
    
    // Build enhanced conversations
    const enhancedConversations = userConversations.map(conversation => {
      const partnerId = conversation.participants.find(id => id !== userId);
      
      if (!partnerId) {
        console.log('No partner found in conversation:', conversation.id);
        return null;
      }
      
      const partner = partnerMap.get(partnerId) || { 
        id: partnerId, 
        full_name: 'Unknown User', 
        profile_picture_url: null 
      };
      
      const messages = messagesByConversation.get(conversation.id) || [];
      const unreadCount = messages.filter(msg => 
        msg.sender_id !== userId && msg.read_at === null
      ).length;
      
      return {
        ...conversation,
        partner,
        last_message: messages[0] || null,
        unread_count: unreadCount
      };
    });
    
    // Filter out null conversations and sort by last message date
    const validConversations = enhancedConversations
      .filter(conv => conv !== null)
      .sort((a, b) => {
        const aDate = a.last_message ? new Date(a.last_message.created_at) : new Date(a.last_message_at);
        const bDate = b.last_message ? new Date(b.last_message.created_at) : new Date(b.last_message_at);
        return bDate - aDate; // Sort descending (newest first)
      });
    
    return { conversations: validConversations, error: null };
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return { conversations: [], error };
  }
};

/**
 * Get messages for a specific conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Object containing messages array or error
 */
export const getConversationMessages = async (conversationId) => {
  try {
    // Fetch messages with sender information in a single query using join
    const { data: messagesWithSenders, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Handle cases where sender profile might be null
    const messages = messagesWithSenders.map(message => ({
      ...message,
      sender: message.sender || { 
        id: message.sender_id, 
        full_name: 'Unknown User',
        profile_picture_url: null
      }
    }));
    
    return { messages, error: null };
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return { messages: [], error };
  }
};

/**
 * Send a direct message
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender's user ID
 * @param {string} content - Message content
 * @param {Object} mediaData - Optional media data {url, type, metadata}
 * @returns {Object} Object containing the sent message or error
 */
export const sendDirectMessage = async (conversationId, senderId, content, mediaData = null) => {
  try {
    // Build message data
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      content
    };
    
    // Add media data if provided
    if (mediaData) {
      messageData.media_url = mediaData.url;
      messageData.media_type = mediaData.type;
      if (mediaData.metadata) {
        messageData.media_metadata = mediaData.metadata;
      }
    }
    
    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert(messageData)
      .select()
      .single();
      
    if (messageError) throw messageError;
    
    // Update conversation last_message_at
    const { error: updateError } = await supabase
      .from('direct_conversations')
      .update({
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);
      
    if (updateError) throw updateError;
    
    // Get sender info for the returned message
    const { data: senderInfo, error: senderError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url')
      .eq('id', senderId)
      .single();
      
    if (senderError) throw senderError;
    
    // Get recipient ID from conversation participants
    const { data: conversation, error: convError } = await supabase
      .from('direct_conversations')
      .select('participants')
      .eq('id', conversationId)
      .single();
      
    if (!convError && conversation) {
      const recipientId = conversation.participants.find(id => id !== senderId);
      
      if (recipientId) {
        // Queue notification for the recipient (similar to news notifications)
        try {
          console.log('💬 [DM API DEBUG] Queueing notification for recipient:', recipientId);
          const notificationResult = await queueDirectMessageNotification(
            recipientId,           // recipient ID
            senderId,              // sender ID
            content || '[Media message]',  // message content
            message.id             // message ID
          );
          
          if (notificationResult.success) {
            console.log('💬 [DM API DEBUG] Notification queued successfully');
          } else {
            console.warn('💬 [DM API DEBUG] Failed to queue notification:', notificationResult.error);
          }
        } catch (notificationError) {
          console.error('💬 [DM API DEBUG] Error queueing notification:', notificationError);
          // Don't fail the message sending if notification fails
        }
      }
    }
    
    return { 
      message: { 
        ...message, 
        sender: senderInfo 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { message: null, error };
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Current user's ID
 * @returns {Object} Object indicating success or error
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    // First, get the message IDs that will be marked as read
    const { data: messagesToMarkRead, error: fetchError } = await supabase
      .from('direct_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);
    
    if (fetchError) throw fetchError;
    
    // If there are messages to mark as read
    if (messagesToMarkRead && messagesToMarkRead.length > 0) {
      const messageIds = messagesToMarkRead.map(msg => msg.id);
      
      // Mark messages as read
      const { error: updateError } = await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds);
        
      if (updateError) throw updateError;
      
      // Remove any pending notifications for these messages from the queue
      // Notifications reference the message ID in the related_item_id field
      const { error: deleteNotificationError } = await supabase
        .from('notification_queue')
        .delete()
        .eq('notification_type', 'direct_message')
        .eq('recipient_id', userId)
        .in('related_item_id', messageIds)
        .eq('is_sent', false); // Only delete unsent notifications
      
      if (deleteNotificationError) {
        console.warn('Warning: Failed to remove notifications from queue:', deleteNotificationError);
        // Don't throw - this is not critical to the main operation
      } else {
        console.log(`Removed pending notifications for ${messageIds.length} read messages`);
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - Conversation ID
 * @param {string} profileId - Current profile's ID (for authorization)
 * @returns {Object} Object indicating success or error
 */
export const deleteConversation = async (conversationId, profileId) => {
  console.log('🗑️ [API] deleteConversation called with:', { conversationId, profileId });
  
  try {
    console.log('🗑️ [API] Fetching conversation to verify permissions...');
    // First verify the profile is a participant in this conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('direct_conversations')
      .select('participants')
      .eq('id', conversationId)
      .single();
      
    console.log('🗑️ [API] Conversation fetch result:', { conversation, fetchError });
      
    if (fetchError) {
      console.error('🗑️ [API] Fetch error:', fetchError);
      throw fetchError;
    }
    
    if (!conversation?.participants?.includes(profileId)) {
      console.error('🗑️ [API] Profile not authorized. Participants:', conversation?.participants, 'Profile:', profileId);
      throw new Error('You are not authorized to delete this conversation');
    }
    
    console.log('🗑️ [API] User authorized, deleting conversation...');
    // Delete the conversation (messages will be deleted automatically via CASCADE)
    const { error: conversationError } = await supabase
      .from('direct_conversations')
      .delete()
      .eq('id', conversationId);
      
    console.log('🗑️ [API] Delete result:', { conversationError });
      
    if (conversationError) {
      console.error('🗑️ [API] Delete error:', conversationError);
      throw conversationError;
    }
    
    console.log('🗑️ [API] Conversation deleted successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('🗑️ [API] Error deleting conversation:', error);
    return { success: false, error };
  }
};

/**
 * Get user profile for messaging
 * @param {string} userId - User ID
 * @returns {Object} Object containing user data or error
 */
export const getUserForMessaging = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return { user: data, error: null };
  } catch (error) {
    console.error('Error fetching user for messaging:', error);
    return { user: null, error };
  }
};