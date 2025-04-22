import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authcontext';
import { useDirectMessages } from '../context/directMessagesContext';
import { getConversationMessages, sendDirectMessage, markMessagesAsRead } from '../api/directmessages';
import { supabase } from '../supabaseclient';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

function DirectMessageChat({ conversationId, partner, onBack }) {
  const { user } = useAuth();
  const { updateConversationWithMessage, markConversationAsRead } = useDirectMessages();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Subscription for real-time messages
  useEffect(() => {
    if (!conversationId) return;
    
    const channel = supabase.channel(`conversation-${conversationId}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('New message received in conversation:', payload);
        
        // Get sender info to display with the message
        const fetchSenderInfo = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, profile_picture_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          const messageWithSender = {
            ...payload.new,
            sender: data
          };
          
          setMessages(prevMessages => [...prevMessages, messageWithSender]);
          
          // Only update unread count if the message is from the other user
          if (payload.new.sender_id !== user?.id) {
            // Mark as read if we're currently viewing this conversation
            markMessagesAsRead(conversationId, user?.id);
            markConversationAsRead(conversationId);
          } else {
            // Update the conversation with our sent message
            updateConversationWithMessage(conversationId, messageWithSender);
          }
        };
        
        fetchSenderInfo();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);
  
  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { messages: fetchedMessages, error } = await getConversationMessages(conversationId);
        
        if (error) throw error;
        
        setMessages(fetchedMessages);
        
        // Mark messages as read
        if (user?.id) {
          await markMessagesAsRead(conversationId, user.id);
          markConversationAsRead(conversationId);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId, user?.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId || !user?.id) return;
    
    try {
      const { message, error } = await sendDirectMessage(
        conversationId,
        user.id,
        newMessage.trim()
      );
      
      if (error) throw error;
      
      // Message will be added via the subscription
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      // Add error notification if needed
    }
  };
  
  // Format timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!conversationId || !partner) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          p: 3,
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      {/* Chat Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <IconButton 
          size="small" 
          sx={{ mr: 1, display: { sm: 'none' } }}
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Avatar 
          src={partner.profile_picture_url} 
          alt={partner.full_name}
          sx={{ mr: 1.5, width: 40, height: 40 }}
        >
          {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">
            {partner.full_name || 'Unknown User'}
          </Typography>
        </Box>
      </Paper>
      
      {/* Messages Container */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No messages yet. Send a message to start the conversation.
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isUser = message.sender_id === user?.id;
            const showAvatar = !isUser && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
            
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  mb: 1,
                  alignItems: 'flex-end'
                }}
              >
                {!isUser && showAvatar ? (
                  <Avatar 
                    src={partner.profile_picture_url} 
                    alt={partner.full_name}
                    sx={{ width: 28, height: 28, mr: 1 }}
                  >
                    {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                ) : !isUser ? (
                  <Box sx={{ width: 28, mr: 1 }} />
                ) : null}
                
                <Box
                  sx={{
                    bgcolor: isUser ? 'primary.main' : 'background.paper',
                    color: isUser ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    maxWidth: '70%',
                    boxShadow: 1,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right',
                      mt: 0.5,
                      color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      fontSize: '0.7rem'
                    }}
                  >
                    {formatMessageTime(message.created_at)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message Input */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
          />
          <IconButton 
            color="primary" 
            type="submit"
            disabled={!newMessage.trim()}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default DirectMessageChat;