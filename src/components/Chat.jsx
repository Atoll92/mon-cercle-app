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

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
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

    // Set up real-time subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `network_id=eq.${networkId}`
      }, async (payload) => {
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
          
          setMessages(prev => [...prev, data]);
        } catch (error) {
          console.error('Error fetching new message details:', error);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [networkId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    // Prepare optimistic UI update with pending message
    const pendingMessage = {
      id: 'pending-' + Date.now(),
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          network_id: networkId,
          user_id: user.id,
          content: pendingMessage.content
        })
        .select();

      if (error) throw error;

      // The real-time subscription will handle adding the confirmed message
      // But we can also update our pending message to remove the pending state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === pendingMessage.id 
            ? { ...msg, pending: false, id: data[0].id } 
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
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {messages.map(message => (
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
              primary={message.profiles?.full_name || 'Anonymous'}
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {message.content}
                  </Typography>
                  <br />
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
        ))}
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
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
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