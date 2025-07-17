import React, { createContext, useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './authcontext';
import { useProfile } from './profileContext';
import { supabase } from '../supabaseclient';
import { getUserConversations } from '../api/directMessages';
import useRealtimeChannel from '../hooks/useRealtimeChannel';

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
  const { activeProfile } = useProfile();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  // Use refs to prevent infinite loops
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const channelRef = useRef(null);
  
  // Memoized fetch function to prevent recreation on each render
  const fetchConversations = useCallback(async (force = false) => {
    // Prevent redundant fetches happening too close together
    const now = Date.now();
    if (!force && fetchingRef.current) {
      // console.log('Already fetching conversations, skipping redundant fetch');
      return;
    }
    
    // Don't fetch too frequently (throttle to once per second unless forced)
    if (!force && now - lastFetchRef.current < 1000) {
      // console.log('Fetch throttled, too soon since last fetch');
      return;
    }
    
    if (!user || !activeProfile) {
      setConversations([]);
      setUnreadTotal(0);
      setLoading(false);
      return;
    }
    
    try {
      // Set fetching flag to true
      fetchingRef.current = true;
      lastFetchRef.current = now;
      
      if (loading) {
        setLoading(true);
      }
      setError(null);
      
      // console.log('Fetching conversations for profile:', activeProfile.id);
      
      const { conversations, error } = await getUserConversations(activeProfile.id);
      
      if (error) throw error;
      
      // console.log(`Found ${conversations.length} conversations for user`);
      
      setConversations(conversations);
      
      // Calculate total unread messages
      const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadTotal(total);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load your conversations');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user, activeProfile, loading]);
  
  // Initial fetch and setup subscriptions
  useEffect(() => {
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    fetchConversations(true);
    
    // Only set up realtime subscription if user is logged in and profile is selected
    if (user && activeProfile) {
      // Set up a single channel with multiple subscriptions
      const channel = supabase.channel('direct-messages-updates');
      
      // Listen for new direct messages
      channel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages'
          }, 
          (payload) => {
            console.log('New direct message:', payload);
            
            // Check if this message belongs to one of our conversations
            if (conversations.some(c => c.id === payload.new.conversation_id)) {
              // Instead of immediate fetch, we'll wait a bit and only do it if no other
              // fetches have happened in the meantime
              const fetchTimeout = setTimeout(() => {
                if (Date.now() - lastFetchRef.current >= 1000) {
                  fetchConversations();
                }
              }, 1000);
              
              return () => clearTimeout(fetchTimeout);
            }
          }
        )
        // Listen for new conversations
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_conversations'
          }, 
          (payload) => {
            console.log('New conversation created:', payload);
            
            // Check if current profile is part of this conversation
            if (payload.new.participants && payload.new.participants.includes(activeProfile.id)) {
              fetchConversations();
            }
          }
        )
        .subscribe();
        
      channelRef.current = channel;
      
      return () => {
        // Cleanup subscription when component unmounts or user/profile changes
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }
  }, [user, activeProfile, fetchConversations]);
  
  // Get active conversation
  const getActiveConversation = useCallback(() => {
    if (!activeConversationId) return null;
    return conversations.find(conv => conv.id === activeConversationId) || null;
  }, [activeConversationId, conversations]);
  
  // Update conversations list with a new message
  const updateConversationWithMessage = useCallback((conversationId, message) => {
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
        // Only increment unread count if the message is from the other profile
        unread_count: message.sender_id !== activeProfile?.id 
          ? (updatedConversations[existingConvIndex].unread_count || 0) + 1 
          : updatedConversations[existingConvIndex].unread_count
      };
      
      return updatedConversations;
    });
    
    // Recalculate total unread
    calculateUnreadTotal();
  }, [user, activeProfile]);
  
  // Calculate total unread messages
  const calculateUnreadTotal = useCallback(() => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setUnreadTotal(total);
  }, [conversations]);
  
  // Add a new conversation to the list
  const addConversation = useCallback((conversation) => {
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
    calculateUnreadTotal();
  }, [calculateUnreadTotal]);
  
  // Mark conversation as read
  const markConversationAsRead = useCallback((conversationId) => {
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
    calculateUnreadTotal();
  }, [calculateUnreadTotal]);
  
  // Manual refresh function with debounce
  const refreshConversations = useCallback(() => {
    // Only refresh if it's been at least 1 second since the last fetch
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      // console.log('Refresh throttled, too soon since last fetch');
      return;
    }
    
    fetchConversations(true);
  }, [fetchConversations]);
  
  // Memoized context value to prevent unnecessary renders
  const contextValue = React.useMemo(() => ({
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
  }), [
    conversations, 
    loading, 
    error, 
    unreadTotal, 
    activeConversationId, 
    getActiveConversation,
    updateConversationWithMessage,
    addConversation,
    markConversationAsRead,
    refreshConversations
  ]);
  
  return (
    <DirectMessagesContext.Provider value={contextValue}>
      {children}
    </DirectMessagesContext.Provider>
  );
};

export default DirectMessagesContext;