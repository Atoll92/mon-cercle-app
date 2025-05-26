import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../context/authcontext';
import { useDirectMessages } from '../context/directMessagesContext';
import { getConversationMessages, sendDirectMessage, markMessagesAsRead } from '../api/directMessages';
import { supabase } from '../supabaseclient';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Badge,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Circle as StatusOnlineIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';

function DirectMessageChat({ conversationId, partner, onBack }) {
  const { user } = useAuth();
  const { updateConversationWithMessage, markConversationAsRead, refreshConversations } = useDirectMessages();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('offline');
  const [sending, setSending] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const channelRef = useRef(null);
  const fetchingRef = useRef(false);
  const lastFetchedConversationId = useRef(null);
  
  // Set a stable online status based on the partner's ID
  useEffect(() => {
    if (!partner || !partner.id) return;
    
    // Use a deterministic approach based on user ID
    const isOnline = partner.id.charCodeAt(0) % 2 === 0;
    setPartnerStatus(isOnline ? 'online' : 'offline');
  }, [partner]);
  
  // Subscription for real-time messages
  useEffect(() => {
    if (!conversationId) return;
    
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
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
          
          setMessages(prevMessages => {
            // Check if the message already exists
            if (prevMessages.some(msg => msg.id === messageWithSender.id)) {
              return prevMessages;
            }
            
            // Filter out any pending versions of this message
            const filteredMessages = prevMessages.filter(msg => 
              !(msg.pending && msg.sender_id === payload.new.sender_id && msg.content === payload.new.content)
            );
            
            return [...filteredMessages, messageWithSender];
          });
          
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
      
    channelRef.current = channel;
      
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user?.id, markConversationAsRead, updateConversationWithMessage, ]);
  
  // Fetch messages when conversation changes
  useEffect(() => {
    // Skip if no conversation ID or already fetching or same conversation
    if (!conversationId || fetchingRef.current || conversationId === lastFetchedConversationId.current) {
      return;
    }
    
    const fetchMessages = async () => {
      try {
        fetchingRef.current = true;
        setLoading(true);
        setError(null);
        
        console.log(`Fetching messages for conversation: ${conversationId}`);
        const { messages: fetchedMessages, error } = await getConversationMessages(conversationId);
        
        if (error) throw error;
        
        setMessages(fetchedMessages);
        lastFetchedConversationId.current = conversationId;
        
        // Mark messages as read and trigger a context refresh to update the badge
        if (user?.id) {
          console.log('Marking messages as read for conversation:', conversationId);
          const { success } = await markMessagesAsRead(conversationId, user.id);
          if (success) {
            console.log('Successfully marked messages as read');
            markConversationAsRead(conversationId);
            
            // Explicitly refresh all conversations to update unread counts globally
            if (typeof refreshConversations === 'function') {
              setTimeout(() => {
                console.log('Refreshing all conversations to update badge');
                refreshConversations();
              }, 300);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    fetchMessages();
    
    // Set up an interval to mark messages as read periodically while viewing
    const markReadInterval = setInterval(() => {
      if (user?.id && conversationId && messageContainerRef.current) {
        // Only mark as read if the user is actually viewing the messages (e.g., window is in focus)
        if (document.hasFocus()) {
          console.log('Periodic check: marking messages as read');
          markMessagesAsRead(conversationId, user.id)
            .then(({ success }) => {
              if (success) {
                markConversationAsRead(conversationId);
                if (typeof refreshConversations === 'function') {
                  refreshConversations();
                }
              }
            })
            .catch(err => console.error('Error in periodic mark read:', err));
        }
      }
    }, 5000); // Check every 5 seconds
  
    return () => {
      clearInterval(markReadInterval);
    };
  }, [conversationId, user?.id, markConversationAsRead, refreshConversations]);

  // When calling refreshConversations
if (refreshConversations) {
  setTimeout(() => {
    console.log('Refreshing all conversations to update badge');
    refreshConversations();
  }, 300);
}
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId || !user?.id || sending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Create a pending message for immediate display
    const pendingMessage = {
      id: `pending-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      pending: true,
      sender: {
        id: user.id,
        full_name: user?.user_metadata?.full_name || 'You',
        profile_picture_url: user?.user_metadata?.avatar_url
      }
    };

    // Add to UI immediately
    setMessages(prev => [...prev, pendingMessage]);
    
    try {
      const { error } = await sendDirectMessage(
        conversationId,
        user.id,
        messageContent
      );
      
      if (error) throw error;
      
      // The real message will be added via the subscription
      // We just leave the pending message for now - it will be replaced
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the pending message if there was an error
      setMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
      // Re-populate the input field so the user doesn't lose their message
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };
  
  // Format timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for date headers
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric'
      });
    }
  };
  
  // Check if we need to show a date header
  const shouldShowDateHeader = (messageDate, index) => {
    if (index === 0) return true;
    
    const prevMessageDate = new Date(messages[index - 1].created_at).toDateString();
    const currentMessageDate = new Date(messageDate).toDateString();
    
    return prevMessageDate !== currentMessageDate;
  };
  
  // Handle image click
  const handleImageClick = (imageUrl, imageTitle = 'Image') => {
    setSelectedImage({ url: imageUrl, title: imageTitle });
    setImageViewerOpen(true);
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
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}
      >
        <IconButton 
          size="small" 
          sx={{ mr: 1, display: { sm: 'none' } }}
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            partnerStatus === 'online' ? 
            <StatusOnlineIcon sx={{ fontSize: 12, color: 'success.main' }} /> : 
            null
          }
        >
          <Avatar 
            src={partner.profile_picture_url} 
            alt={partner.full_name}
            sx={{ mr: 1.5, width: 40, height: 40 }}
          >
            {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        </Badge>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">
            {partner.full_name || 'Unknown User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partnerStatus === 'online' ? 'Online now' : 'Offline'}
          </Typography>
        </Box>
        <Tooltip title="More options">
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Paper>
      
      {/* Messages Container */}
      <Box 
        ref={messageContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : '#f5f7f9',
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
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Avatar 
              src={partner.profile_picture_url} 
              alt={partner.full_name}
              sx={{ width: 64, height: 64, mb: 2 }}
            >
              {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {partner.full_name || 'Unknown User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              This is the beginning of your conversation with {partner.full_name}.
              <br />Send a message to get started.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.sender_id === user?.id;
              const showAvatar = !isUser && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
              const showDateHeader = shouldShowDateHeader(message.created_at, index);
              
              return (
                <Fragment key={message.id}>
                  {showDateHeader && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        my: 2,
                      }}
                    >
                      <Chip
                        label={formatMessageDate(message.created_at)}
                        size="small"
                        sx={{ 
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)', 
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      mb: 1,
                      alignItems: 'flex-end',
                      opacity: message.pending ? 0.7 : 1
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
                        bgcolor: isUser ? 'primary.main' : (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
                        color: isUser ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        maxWidth: '70%',
                        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        borderTopLeftRadius: !isUser && !showAvatar ? 1 : undefined,
                        borderTopRightRadius: isUser && index > 0 && messages[index - 1].sender_id === user?.id ? 1 : undefined,
                        ml: isUser ? 0 : 0.5,
                        mr: isUser ? 0.5 : 0
                      }}
                    >
                      {/* Message content */}
                      {message.content && (
                        <Typography 
                          variant="body2"
                          sx={{ 
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5
                          }}
                        >
                          {message.content}
                        </Typography>
                      )}
                      
                      {/* Media attachment */}
                      {message.media_url && (
                        <Box sx={{ mt: message.content ? 1 : 0 }}>
                          {message.media_type === 'image' ? (
                            <Box
                              onClick={() => handleImageClick(message.media_url, message.media_metadata?.fileName || 'Image')}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 1,
                                overflow: 'hidden',
                                maxWidth: '300px',
                                '&:hover': {
                                  opacity: 0.9
                                }
                              }}
                            >
                              <img
                                src={message.media_url}
                                alt={message.media_metadata?.fileName || 'Shared image'}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </Box>
                          ) : (
                            <MediaPlayer
                              src={message.media_url}
                              type={message.media_type}
                              title={message.media_metadata?.fileName || `Shared ${message.media_type}`}
                              thumbnail={message.media_metadata?.thumbnail}
                              compact
                              darkMode
                              // PDF specific props
                              fileName={message.media_metadata?.fileName}
                              fileSize={message.media_metadata?.fileSize}
                              numPages={message.media_metadata?.numPages}
                              author={message.media_metadata?.author}
                            />
                          )}
                        </Box>
                      )}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        mt: 0.5,
                        gap: 0.5
                      }}>
                        {message.pending && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.6rem',
                              color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                            }}
                          >
                            Sending...
                          </Typography>
                        )}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                            fontSize: '0.6rem'
                          }}
                        >
                          {formatMessageTime(message.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      {/* Message Input */}
      <Box 
        component="form" 
        onSubmit={handleSendMessage} 
        sx={{ 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f7f9',
              }
            }}
            multiline
            maxRows={3}
          />
          <IconButton 
            color="primary" 
            type="submit"
            disabled={!newMessage.trim() || sending}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Box>
  );
}

export default DirectMessageChat;