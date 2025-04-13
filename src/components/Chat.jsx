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
  Typography,
  Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';

const Chat = ({ networkId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState({});
  const messageEndRef = useRef(null);
  const channelRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('Initializing chat for network:', networkId);
    
    const fetchMessages = async () => {
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
          .eq('network_id', networkId)
          .order('created_at', { ascending: true });

        if (error) throw error;
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

    // Create a proper channel name for this specific chat
    const channelName = `room:${networkId}`;
    
    // Set up Realtime channel with Presence
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Set up Postgres Changes listener for new messages
    channelRef.current
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `network_id=eq.${networkId}`
      }, async (payload) => {
        console.log('Received new message via Realtime:', payload);
        
        // Fetch the complete message with user profile
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
          
          // Add the new message only if it doesn't already exist
          setMessages(prev => {
            if (prev.some(msg => msg.id === data.id)) {
              return prev;
            }
            
            // Remove any pending version of this message if it's from the current user
            const filteredMessages = prev.filter(msg => 
              !(msg.pending && msg.user_id === user.id && msg.content === data.content)
            );
            
            return [...filteredMessages, data];
          });
        } catch (error) {
          console.error('Error fetching new message details:', error);
        }
      });

    // Set up Presence handlers
    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        console.log('Presence sync:', newState);
        setActiveUsers(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    // Subscribe to the channel and track user presence
    channelRef.current.subscribe(async (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        // Broadcast user presence with some profile data
        const userProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url,
          online_at: new Date().toISOString(),
        };
        
        await channelRef.current.track(userProfile);
      }
    });

    return () => {
      console.log('Cleaning up Realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [networkId, user]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    // Prepare optimistic UI update with pending message
    const pendingMessage = {
      id: `pending-${Date.now()}`,
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
      // Send the message to the database
      const { error } = await supabase
        .from('messages')
        .insert({
          network_id: networkId,
          user_id: user.id,
          content: pendingMessage.content
        });

      if (error) throw error;
      
      // The realtime subscription will handle adding the confirmed message
      // We don't need to update our state here as the postgres_changes event will do it
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setError('Failed to send message');
    }
  };

  // Count unique active users
  const activeUserCount = Object.keys(activeUsers).length;

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
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(0,0,0,0.12)', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Chat ({messages.length} messages)
        </Typography>
        <Badge 
          badgeContent={activeUserCount} 
          color="primary"
          max={99}
          sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
        >
          <PersonIcon color="action" />
        </Badge>
      </Box>
      
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