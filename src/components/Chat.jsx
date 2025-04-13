import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
  Divider,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chat = ({ networkId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messageEndRef = useRef(null);
  const channelRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug logging function
  const logDebug = (message, data) => {
    console.log(`[CHAT DEBUG] ${message}`, data);
  };

  useEffect(() => {
    logDebug('Setting up chat with networkId:', networkId);
    
    const fetchMessages = async () => {
      try {
        logDebug('Fetching initial messages for network:', networkId);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (id, full_name, profile_picture_url)
          `)
          .eq('network_id', networkId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        logDebug('Initial messages loaded:', data.length);
        setMessages(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
        setLoading(false);
      }
    };

    fetchMessages();

    // Clean up any existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up real-time subscription with a more specific channel name
    const channelName = `chat-${networkId}-${Date.now()}`;
    logDebug('Setting up real-time subscription with channel:', channelName);
    
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `network_id=eq.${networkId}`
      }, async (payload) => {
        logDebug('Received real-time message:', payload);
        
        // When a new message is inserted, fetch the complete message with user profile
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles:user_id (id, full_name, profile_picture_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;
          
          logDebug('Fetched complete message data:', data);
          
          // Check if this message is already in our state (to avoid duplicates)
          setMessages(prev => {
            // If we already have this message, don't add it again
            if (prev.some(msg => msg.id === data.id)) {
              logDebug('Message already exists in state, skipping:', data.id);
              return prev;
            }
            
            // Check for and remove any pending version of this message
            const pendingId = `pending-${data.id}`;
            const hasPendingVersion = prev.some(msg => msg.id === pendingId);
            
            if (hasPendingVersion) {
              logDebug('Replacing pending message with confirmed message:', data.id);
              return prev
                .filter(msg => msg.id !== pendingId)
                .concat(data);
            }
            
            // Otherwise, just add the new message
            logDebug('Adding new message to state:', data.id);
            return [...prev, data];
          });
        } catch (error) {
          console.error('Error fetching new message details:', error);
        }
      })
      .subscribe((status) => {
        logDebug('Subscription status:', status);
      });

    return () => {
      logDebug('Cleaning up subscription for networkId:', networkId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [networkId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    logDebug('Sending new message');
    
    // Prepare optimistic UI update with pending message
    const tempId = Date.now().toString();
    const pendingMessage = {
      id: `pending-${tempId}`,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'You',
        profile_picture_url: user.user_metadata?.avatar_url
      },
      pending: true
    };

    // Add the pending message to the UI immediately
    setMessages(prev => [...prev, pendingMessage]);
    setNewMessage('');

    try {
      logDebug('Inserting message into database');
      // Send the message to the database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          network_id: networkId,
          user_id: user.id,
          content: pendingMessage.content
        })
        .select();

      if (error) throw error;

      logDebug('Message sent successfully, data:', data);
      
      // Update our pending message to be the confirmed message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === pendingMessage.id 
            ? { 
                ...msg, 
                pending: false, 
                id: data[0].id,
                // Ensure we have the exact timestamp from the server
                created_at: data[0].created_at
              } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        Chat ({messages.length} messages)
      </Typography>
      
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          messages.map(message => (
            <ListItem 
              key={message.id}
              sx={{
                opacity: message.pending ? 0.7 : 1,
                backgroundColor: message.user_id === user.id ? 'rgba(0, 0, 255, 0.05)' : 'transparent'
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  src={message.profiles?.profile_picture_url}
                  alt={message.profiles?.full_name}
                >
                  {!message.profiles?.profile_picture_url && message.profiles?.full_name?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2">
                    {message.profiles?.full_name || 'Anonymous'}
                    {message.user_id === user.id && ' (You)'}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ 
                        display: 'block',
                        wordBreak: 'break-word', 
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {new Date(message.created_at).toLocaleTimeString()}
                      {message.pending && ' (sending...)'}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))
        )}
        <div ref={messageEndRef} />
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          multiline
          maxRows={3}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Chat;