import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Badge,
  alpha,
  Switch,
  FormControlLabel
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import backgroundImage from '../assets/8-bit-artwork-sky-landscape-wallpaper-preview.jpg';
import LinkPreview from './LinkPreview'; // Import the LinkPreview component

// URL regex pattern to detect links in messages
// const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const Chat = ({ networkId, isFullscreen = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState({});
  const messageEndRef = useRef(null);
  const channelRef = useRef(null);
  const [darkMode, setDarkMode] = useState(true);

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
        
        // Fetch the complete message with user profile to ensure we have all data
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              user_id,
              network_id,
              profiles:user_id (id, full_name, profile_picture_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;
          
          // Only add if the message belongs to the current network
          if (data.network_id === networkId) {
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
          }
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          network_id: networkId,
          user_id: user.id,
          content: pendingMessage.content
        })
        .select('id')
        .single();

      if (error) throw error;
      
      console.log('Message sent successfully with ID:', data.id);
      // The realtime subscription will handle adding the confirmed message
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setError('Failed to send message');
    }
  };

 // Better URL regex pattern that can match URLs with or without the http/https prefix
const URL_REGEX = /(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

// Fixed containsUrl function that resets the regex state
const containsUrl = (content) => {
  if (!content) return false;
  
  // Reset the regex before testing
  URL_REGEX.lastIndex = 0;
  
  const hasMatch = URL_REGEX.test(content);
  console.log(`Testing URL in: "${content}" - Result: ${hasMatch}`);
  return hasMatch;
};

// Fixed extractUrl function that resets the regex state
const extractUrl = (content) => {
  if (!content) return null;
  
  // Reset the regex before matching
  URL_REGEX.lastIndex = 0;
  
  const matches = content.match(URL_REGEX);
  const url = matches ? matches[0] : null;
  
  // If we found a URL without http/https, add it
  if (url && !url.startsWith('http')) {
    return 'https://' + url;
  }
  
  console.log(`Extracted URL from: "${content}" - URL: ${url}`);
  return url;
};

  // Function to render message content (either plain text or link preview)
const renderMessageContent = (message) => {
  if (!message || !message.content) {
    return null;
  }
  
  // Important: Reset the regex before testing
  URL_REGEX.lastIndex = 0;
  
  // Check if content contains a URL
  const isUrl = URL_REGEX.test(message.content);
  console.log(`Message content: "${message.content}" - Contains URL: ${isUrl}`);
  
  if (isUrl) {
    // Reset regex again before extracting
    URL_REGEX.lastIndex = 0;
    
    const url = message.content.match(URL_REGEX)[0];
    console.log(`Found URL: ${url}`);
    
    // Check if the message is just the URL or contains additional text
    const isOnlyUrl = message.content.trim() === url;

    // Check if it's a media URL that should auto-play
    const isMediaUrl = url.match(/youtube|spotify|vimeo|soundcloud/i);
    
    // Render with link preview
    return (
      <>
        {!isOnlyUrl && (
          <Typography 
            component="span" 
            variant="body2" 
            sx={{ 
              mb: 0.5, 
              display: 'block', 
              fontSize: '0.85rem', // Smaller font size
              lineHeight: 1.4   // Tighter line height
            }}
          >
            {message.content}
          </Typography>
        )}
        
        <Box sx={{ 
          my: isOnlyUrl ? 0 : 0.5, 
          bgcolor: 'background.paper', 
          borderRadius: 1, 
          overflow: 'hidden',
          transform: 'scale(0.97)',  // Slightly smaller scale for link previews
          transformOrigin: 'top left'
        }}>
          <LinkPreview 
            url={url} 
            compact={false} 
            isEditable={true} 
            height={isMediaUrl ? (url.match(/spotify/i) ? 80 : 315) : 'auto'} 
          />
        </Box>
      </>
    );
  } else {
    // Render as plain text
    return (
      <Typography 
        component="span" 
        variant="body2" 
        sx={{ 
          fontSize: '0.85rem', // Smaller font size
          lineHeight: 1.4      // Tighter line height
        }}
      >
        {message.content}
      </Typography>
    );
  }
};

  // Count unique active users
  const activeUserCount = Object.keys(activeUsers).length;
  
  // Toggle dark/light mode handler
  const handleModeToggle = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: 3,
          background: `url(${backgroundImage}) no-repeat center center`,
          backgroundSize: 'cover',
          height: '70vh',
          borderRadius: 2,
          alignItems: 'center'
        }}
      >
        <CircularProgress sx={{ color: darkMode ? 'white' : 'primary.main' }} />
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
    <Paper 
      sx={{ 
        height: isFullscreen ? '100%' : '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: isFullscreen ? 0 : 2,
        boxShadow: isFullscreen ? 0 : 8,
        backgroundImage: darkMode ? `url(${backgroundImage})` : 'none',
        backgroundColor: darkMode ? 'transparent' : '#f5f7fa',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      {/* Semi-transparent overlay for better text readability (only in dark mode) */}
      {darkMode && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 0
          }} 
        />
      )}
      
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: darkMode 
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid rgba(0,0,0,0.1)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: darkMode
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 1,
          position: 'relative'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: darkMode ? 'white' : 'text.primary', 
            fontWeight: 500 
          }}
        >
          Chat ({messages.length} messages)
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Mode toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={handleModeToggle}
                icon={<Brightness7Icon fontSize="small" />}
                checkedIcon={<Brightness4Icon fontSize="small" />}
                sx={{
                  '& .MuiSwitch-switchBase': {
                    color: darkMode ? '#f1f1f1' : '#333'
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                  }
                }}
              />
            }
            label=""
          />
          
          <Badge 
            badgeContent={activeUserCount} 
            color="primary"
            max={99}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
          >
            <PersonIcon sx={{ color: darkMode ? 'white' : 'text.secondary' }} />
          </Badge>
        </Box>
      </Box>
      
      {/* Messages List */}
      <List 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          zIndex: 1,
          position: 'relative',
          backgroundColor: darkMode ? 'transparent' : 'rgba(255,255,255,0.3)'
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%'
          }}>
            <Typography sx={{ 
              color: darkMode ? 'white' : 'text.secondary', 
              textShadow: darkMode ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
              fontWeight: 500
            }}>
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map(message => {
            const containsLink = containsUrl(message.content);
            
            return (
              <ListItem 
                key={message.id}
                sx={{
                  opacity: message.pending ? 0.7 : 1,
                  backgroundColor: darkMode
                    ? (message.user_id === user.id 
                      ? alpha('#1976d2', 0.6) 
                      : alpha('#333', 0.5))
                    : (message.user_id === user.id 
                      ? alpha('#e3f2fd', 0.9) 
                      : alpha('#fff', 0.85)),
                  borderRadius: 2,
                  mb: 1,
                  py: 0.5, // Reduced vertical padding
                  px: 1.5, // Slightly reduced horizontal padding
                  backdropFilter: 'blur(8px)',
                  boxShadow: darkMode
                    ? '0 1px 3px rgba(0,0,0,0.2)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                  transform: message.user_id === user.id 
                    ? 'translateX(4%)' 
                    : 'translateX(-4%)',
                  maxWidth: containsLink ? '92%' : '80%', // Slightly smaller max width
                  marginLeft: message.user_id === user.id ? 'auto' : 2,
                  marginRight: message.user_id === user.id ? 2 : 'auto',
                  transition: 'all 0.2s ease',
                  border: darkMode 
                    ? 'none' 
                    : `1px solid ${message.user_id === user.id ? '#bbdefb' : '#e0e0e0'}`,
                  animation: 'fadeInUp 0.3s ease-out',
                  '@keyframes fadeInUp': {
                    from: {
                      opacity: 0,
                      transform: `translateY(10px) ${message.user_id === user.id ? 'translateX(4%)' : 'translateX(-4%)'}`
                    },
                    to: {
                      opacity: 1,
                      transform: `translateY(0) ${message.user_id === user.id ? 'translateX(4%)' : 'translateX(-4%)'}`
                    }
                  }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 42 }}> {/* Reduced avatar area width */}
                  <Avatar 
                    src={message.profiles?.profile_picture_url}
                    alt={message.profiles?.full_name}
                    component={message.profiles?.id ? Link : 'div'}
                    to={message.profiles?.id ? `/profile/${message.profiles.id}` : undefined}
                    sx={{ 
                      width: 32,  // Smaller avatar
                      height: 32, // Smaller avatar
                      border: darkMode
                        ? '2px solid white'
                        : '2px solid #e0e0e0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      cursor: message.profiles?.id ? 'pointer' : 'default',
                      '&:hover': message.profiles?.id ? {
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s ease'
                      } : {}
                    }}
                  >
                    {!message.profiles?.profile_picture_url && message.profiles?.full_name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    message.profiles?.id ? (
                      <Link 
                        to={`/profile/${message.profiles.id}`}
                        style={{ 
                          textDecoration: 'none',
                          color: darkMode 
                            ? 'white' 
                            : (message.user_id === user.id ? '#1565c0' : '#424242')
                        }}
                      >
                        <Typography 
                          variant="subtitle2" 
                          component="span"
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '0.85rem', // Slightly smaller text
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {message.profiles?.full_name || 'Anonymous'}
                          {message.user_id === user.id && ' (You)'}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: darkMode 
                            ? 'white' 
                            : (message.user_id === user.id ? '#1565c0' : '#424242'),
                          fontWeight: 500,
                          fontSize: '0.85rem' // Slightly smaller text
                        }}
                      >
                        {message.profiles?.full_name || 'Anonymous'}
                        {message.user_id === user.id && ' (You)'}
                      </Typography>
                    )
                  }
                  secondary={
                    <>
                      {renderMessageContent(message)}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          color: darkMode 
                            ? 'rgba(255, 255, 255, 0.5)'
                            : 'rgba(0, 0, 0, 0.4)',
                          fontSize: '0.65rem',
                          mt: 0.5,
                          fontStyle: 'italic'
                        }}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {message.pending && ' (sending...)'}
                      </Typography>
                    </>
                  }
                  sx={{
                    // Expand width for link previews
                    width: containsLink ? '100%' : 'auto'
                  }}
                />
              </ListItem>
            );
          })
        )}
        <div ref={messageEndRef} />
      </List>
      
      {/* Message Input */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          gap: 1, 
          bgcolor: darkMode 
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(245, 245, 245, 0.9)',
          backdropFilter: 'blur(10px)',
          borderTop: darkMode
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.08)',
          zIndex: 1,
          position: 'relative'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message or paste a link..."
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
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: darkMode 
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.8)',
              color: darkMode ? 'white' : 'text.primary',
              borderRadius: 2,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode 
                  ? 'rgba(255, 255, 255, 0.5)'
                  : 'rgba(0, 0, 0, 0.23)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode 
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(0, 0, 0, 0.15)',
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: darkMode 
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.5)',
              opacity: 1
            }
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!newMessage.trim()}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            '&.Mui-disabled': {
              bgcolor: darkMode
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.1)',
              color: darkMode
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.3)'
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Chat;