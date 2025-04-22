import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './authcontext';
import { supabase } from '../supabaseclient';
import { getUserConversations } from '../api/directMessages';

const DirectMessagesContext = createContext(null);

export const useDirectMessages = () => {
  const context = useContext(DirectMessagesContext);
  if (context === null) {
    throw new Error('useDirectMessages must be used within a DirectMessagesProvider');
  }
  return context;
};

export const DirectMessagesProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  // Fetch user's conversations
  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setUnreadTotal(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { conversations, error } = await getUserConversations(user.id);
      
      if (error) throw error;
      
      setConversations(conversations);
      
      // Calculate total unread messages
      const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadTotal(total);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load your conversations');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch and setup subscriptions
  useEffect(() => {
    fetchConversations();
    
    // Set up real-time subscription for new messages
    if (user) {
      // Listen for any new direct messages
      const messagesChannel = supabase.channel('public:direct_messages');
      
      messagesChannel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages'
          }, 
          (payload) => {
            console.log('New message received:', payload);
            // Refresh conversations to update last message and unread count
            fetchConversations();
          }
        )
        .subscribe();
        
      // Listen for new conversations
      const conversationsChannel = supabase.channel('public:direct_conversations');
      
      conversationsChannel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_conversations'
          }, 
          (payload) => {
            console.log('New conversation created:', payload);
            // Refresh conversations
            fetchConversations();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [user]);
  
  // Get active conversation
  const getActiveConversation = () => {
    if (!activeConversationId) return null;
    return conversations.find(conv => conv.id === activeConversationId) || null;
  };
  
  // Update conversations list with a new message
  const updateConversationWithMessage = (conversationId, message) => {
    setConversations(prevConversations => {
      // Check if the conversation exists
      const existingConvIndex = prevConversations.findIndex(conv => conv.id === conversationId);
      
      if (existingConvIndex === -1) {
        console.log('Conversation not found, will be added in next fetch');
        return prevConversations;
      }
      
      const updatedConversations = [...prevConversations];
      updatedConversations[existingConvIndex] = {
        ...updatedConversations[existingConvIndex],
        last_message: message,
        last_message_at: message.created_at,
        // Only increment unread count if the message is from the other user
        unread_count: message.sender_id !== user?.id 
          ? (updatedConversations[existingConvIndex].unread_count || 0) + 1 
          : updatedConversations[existingConvIndex].unread_count
      };
      
      return updatedConversations;
    });
    
    // Recalculate total unread
    setTimeout(() => calculateUnreadTotal(), 0);
  };
  
  // Calculate total unread messages
  const calculateUnreadTotal = () => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setUnreadTotal(total);
  };
  
  // Add a new conversation to the list
  const addConversation = (conversation) => {
    // Don't add if it's null or undefined
    if (!conversation) return;
    
    setConversations(prevConversations => {
      // Check if conversation already exists
      const exists = prevConversations.some(conv => conv.id === conversation.id);
      
      if (exists) {
        console.log('Conversation already exists, not adding duplicate');
        return prevConversations;
      }
      
      console.log('Adding new conversation to state:', conversation.id);
      // Add to beginning of list
      return [conversation, ...prevConversations];
    });
    
    // Recalculate unread total
    setTimeout(() => calculateUnreadTotal(), 0);
  };
  
  // Mark conversation as read
  const markConversationAsRead = (conversationId) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unread_count: 0
          };
        }
        return conv;
      })
    );
    
    // Recalculate total unread
    setTimeout(() => calculateUnreadTotal(), 0);
  };
  
  // Refresh conversations manually
  const refreshConversations = () => {
    fetchConversations();
  };
  
  return (
    <DirectMessagesContext.Provider value={{
      conversations,
      loading,
      error,
      unreadTotal,
      activeConversationId,
      activeConversation: getActiveConversation(),
      setActiveConversation: setActiveConversationId,
      updateConversationWithMessage,
      addConversation,
      markConversationAsRead,
      refreshConversations
    }}>
      {children}
    </DirectMessagesContext.Provider>
  );
};

export default DirectMessagesContext;