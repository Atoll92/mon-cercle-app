import { supabase } from '../supabaseclient';

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
    
    // For each conversation, get the partner's info and the last message
    const enhancedConversations = await Promise.all(userConversations.map(async (conversation) => {
      // Get partner ID (the other user in the conversation)
      const partnerId = conversation.participants.find(id => id !== userId);
      
      if (!partnerId) {
        console.log('No partner found in conversation:', conversation.id);
        return null; // Skip conversations with no valid partner
      }
      
      // Get partner profile
      const { data: partner, error: partnerError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .eq('id', partnerId)
        .single();
        
      if (partnerError) {
        console.error('Error fetching partner profile:', partnerError);
      }
      
      // Get last message and unread count
      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      }
      
      // Calculate unread count
      const unreadCount = messages 
        ? messages.filter(msg => msg.sender_id !== userId && msg.read_at === null).length 
        : 0;
      
      return {
        ...conversation,
        partner: partner || { id: partnerId, full_name: 'Unknown User', profile_picture_url: null },
        last_message: messages && messages.length > 0 ? messages[0] : null,
        unread_count: unreadCount
      };
    }));
    
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
    // First get all messages for this conversation
    const { data: rawMessages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // For each message, get the sender info
    const messagesWithSenders = await Promise.all(rawMessages.map(async (message) => {
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .eq('id', message.sender_id)
        .single();
        
      return {
        ...message,
        sender: sender || { id: message.sender_id, full_name: 'Unknown User' }
      };
    }));
    
    return { messages: messagesWithSenders, error: null };
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
 * @returns {Object} Object containing the sent message or error
 */
export const sendDirectMessage = async (conversationId, senderId, content) => {
  try {
    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content
      })
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
    const { error } = await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
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