import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
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
  Circle as StatusOnlineIcon,
  AttachFile as AttachFileIcon,
  Cancel as CancelIcon,
  PlayCircle as PlayCircleIcon,
  AudioFile as AudioFileIcon,
  Videocam as VideocamIcon,
  Audiotrack as AudiotrackIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import LinkPreview from './LinkPreview';
import MediaUpload from './MediaUpload';

function DirectMessageChat({ conversationId, partner, onBack }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { updateConversationWithMessage, markConversationAsRead, refreshConversations } = useDirectMessages();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('offline');
  const [sending, setSending] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [pendingMedia, setPendingMedia] = useState(null);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const channelRef = useRef(null);
  const fetchingRef = useRef(false);
  const lastFetchedConversationId = useRef(null);
  const textFieldRef = useRef(null);
  const shouldRefocusRef = useRef(false);
  
  // URL regex pattern to detect links in messages
  const URL_REGEX = /(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
  
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
          if (payload.new.sender_id !== activeProfile?.id) {
            // Mark as read if we're currently viewing this conversation
            if (activeProfile) markMessagesAsRead(conversationId, activeProfile.id);
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
        if (user?.id && activeProfile?.id) {
          console.log('Marking messages as read for conversation:', conversationId);
          const { success } = await markMessagesAsRead(conversationId, activeProfile.id);
          if (success) {
            console.log('Successfully marked messages as read');
            markConversationAsRead(conversationId);
            
            // Explicitly refresh all conversations to update unread counts globally
            if (typeof refreshConversations === 'function') {
              setTimeout(() => {
                // console.log('Refreshing all conversations to update badge');
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
          if (activeProfile) markMessagesAsRead(conversationId, activeProfile.id)
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
  }, [conversationId, user?.id, activeProfile?.id, markConversationAsRead, refreshConversations]);

  // When calling refreshConversations
if (refreshConversations) {
  setTimeout(() => {
    // console.log('Refreshing all conversations to update badge');
    refreshConversations();
  }, 300);
}
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus the input field when sending is complete
  useEffect(() => {
    if (!sending && shouldRefocusRef.current && textFieldRef.current) {
      // Small delay to ensure the TextField is enabled
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
        shouldRefocusRef.current = false;
      }, 50);
    }
  }, [sending]);
  
  const handleSendMessage = async (e, mediaData = null) => {
    if (e) e.preventDefault();
    
    // Use passed mediaData or pendingMedia
    const media = mediaData || pendingMedia;
    
    // Allow sending if there's text or media
    if (!newMessage.trim() && !media) return;
    if (!conversationId || !user?.id || sending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setPendingMedia(null);
    setSending(true);
    shouldRefocusRef.current = true;

    // Create a pending message for immediate display
    const pendingMsg = {
      id: `pending-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: activeProfile?.id || user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      pending: true,
      sender: {
        id: activeProfile?.id || user.id,
        full_name: activeProfile?.full_name || user?.user_metadata?.full_name || 'You',
        profile_picture_url: activeProfile?.profile_picture_url || user?.user_metadata?.avatar_url
      }
    };
    
    // Add media data to pending message if present
    if (media) {
      pendingMsg.media_url = media.url;
      pendingMsg.media_type = media.type || media.mediaType?.toLowerCase();
      pendingMsg.media_metadata = media.metadata || {
        fileName: media.fileName,
        fileSize: media.fileSize,
        mimeType: media.mimeType
      };
    }

    // Add to UI immediately
    setMessages(prev => [...prev, pendingMsg]);
    
    try {
      // Use active profile ID for sender
      if (!activeProfile) {
        throw new Error('No active profile selected');
      }
      
      const { data: messageData, error } = await sendDirectMessage(
        conversationId,
        activeProfile.id,
        messageContent,
        media
      );
      
      if (error) throw error;
      
      // Notification is now handled automatically at the API level in sendDirectMessage
      // The real message will be added via the subscription
      // We just leave the pending message for now - it will be replaced
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the pending message if there was an error
      setMessages(prev => prev.filter(m => m.id !== pendingMsg.id));
      // Re-populate the input field so the user doesn't lose their message
      setNewMessage(messageContent);
      if (media) setPendingMedia(media);
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
  
  // Handle media upload
  const handleMediaUpload = async (mediaData) => {
    console.log('DirectMessageChat: handleMediaUpload called with:', mediaData);
    
    if (!mediaData) {
      console.error('DirectMessageChat: mediaData is undefined');
      setError('Media upload failed: No data received');
      return;
    }
    
    setShowMediaUpload(false);
    setPendingMedia(mediaData);
  };
  
  // Check if content contains URL
  const containsUrl = (content) => {
    if (!content) return false;
    URL_REGEX.lastIndex = 0;
    return URL_REGEX.test(content);
  };
  
  // Render enhanced media with all features from Chat component
  const renderMedia = (mediaUrl, mediaType, metadata, messageId) => {
    const isExpanded = expandedMedia[messageId] || false;
    const darkMode = true; // DirectMessageChat uses dark mode
    
    const toggleExpanded = () => {
      setExpandedMedia(prev => ({
        ...prev,
        [messageId]: !prev[messageId]
      }));
    };
    
    switch (mediaType) {
      case 'image':
        return (
          <Box 
            component="img" 
            src={mediaUrl} 
            alt={metadata?.fileName || 'Image'}
            onClick={() => handleImageClick(mediaUrl, metadata?.fileName || 'Chat Image')}
            sx={{ 
              maxWidth: '100%', 
              maxHeight: 300,
              borderRadius: 1,
              mt: 1,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.9
              }
            }}
          />
        );
        
      case 'video':
        if (isExpanded) {
          return (
            <Box sx={{ mt: 1 }}>
              <MediaPlayer
                src={mediaUrl}
                type="video"
                title={metadata?.fileName}
                compact={true}
                darkMode={darkMode}
              />
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={toggleExpanded}
                  sx={{ color: 'white' }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        }
        
        return (
          <Box sx={{ mt: 1 }}>
            <Paper
              sx={{
                position: 'relative',
                width: '100%',
                backgroundColor: '#000',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover .play-overlay': {
                  opacity: 0.9
                }
              }}
              onClick={toggleExpanded}
            >
              {metadata?.thumbnail ? (
                <Box
                  component="img"
                  src={metadata.thumbnail}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 300,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  alt="Video thumbnail"
                />
              ) : (
                <Box
                  component="video"
                  src={mediaUrl}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 300,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  muted
                  preload="metadata"
                />
              )}
              
              <Box
                className="play-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <PlayCircleIcon sx={{ fontSize: 36, color: '#1976d2' }} />
                </Box>
              </Box>
              
              {metadata?.duration && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}
                >
                  {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                </Box>
              )}
            </Paper>
          </Box>
        );
        
      case 'audio':
        if (isExpanded) {
          const audioImage = metadata?.thumbnail || 
                            metadata?.albumArt || 
                            metadata?.artwork || 
                            metadata?.cover || 
                            metadata?.image ||
                            metadata?.picture;
          
          return (
            <Box sx={{ mt: 1 }}>
              {audioImage && (
                <Box sx={{ mb: 2 }}>
                  <Paper
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 300,
                      mx: 'auto',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={audioImage}
                      onClick={() => handleImageClick(audioImage, metadata?.title || 'Audio Artwork')}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer'
                      }}
                      alt="Audio artwork"
                    />
                  </Paper>
                </Box>
              )}
              
              <MediaPlayer
                src={mediaUrl}
                type="audio"
                title={metadata?.fileName}
                compact={true}
                darkMode={darkMode}
              />
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={toggleExpanded}
                  sx={{ color: 'white' }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        }
        
        const audioImage = metadata?.thumbnail || 
                          metadata?.albumArt || 
                          metadata?.artwork || 
                          metadata?.cover || 
                          metadata?.image ||
                          metadata?.picture;
        
        return (
          <Box sx={{ mt: 1 }}>
            <Paper
              sx={{
                position: 'relative',
                width: '100%',
                height: audioImage ? 120 : 80,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)'
                }
              }}
              onClick={toggleExpanded}
            >
              {audioImage ? (
                <>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      component="img"
                      src={audioImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(audioImage, metadata?.title || 'Audio Artwork');
                      }}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      alt="Audio artwork"
                    />
                    
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8,
                        borderRadius: 1
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '50%',
                          width: 44,
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        <PlayCircleIcon sx={{ fontSize: 26, color: '#1976d2' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ 
                        color: 'white',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      {metadata?.title || metadata?.fileName || 'Audio File'}
                    </Typography>
                    {metadata?.artist && (
                      <Typography 
                        variant="caption" 
                        noWrap
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          display: 'block'
                        }}
                      >
                        {metadata.artist}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  <AudioFileIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: 'white',
                      ml: 2,
                      flexShrink: 0
                    }} 
                  />
                  
                  <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ color: 'white' }}
                    >
                      {metadata?.fileName || 'Audio File'}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      Click to play
                    </Typography>
                  </Box>
                  
                  <PlayCircleIcon 
                    sx={{ 
                      fontSize: 28, 
                      color: 'white',
                      mr: 2,
                      flexShrink: 0
                    }} 
                  />
                </>
              )}
            </Paper>
          </Box>
        );
        
      case 'pdf':
        return (
          <Box sx={{ mt: 1 }}>
            <MediaPlayer
              src={mediaUrl}
              type="pdf"
              title={metadata?.fileName}
              fileName={metadata?.fileName}
              fileSize={metadata?.fileSize}
              numPages={metadata?.numPages}
              author={metadata?.author}
              compact
              darkMode
            />
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // Render message content with link preview support
  const renderMessageContent = (message) => {
    if (!message) return null;
    
    // Check if message has media
    if (message.media_url && message.media_type) {
      return (
        <Box>
          {message.content && (
            <Typography 
              variant="body2"
              sx={{ 
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                mb: 0.5
              }}
            >
              {message.content}
            </Typography>
          )}
          {renderMedia(message.media_url, message.media_type, message.media_metadata, message.id)}
        </Box>
      );
    }
    
    if (!message.content) return null;
    
    // Reset the regex before testing
    URL_REGEX.lastIndex = 0;
    
    // Check if content contains a URL
    const isUrl = URL_REGEX.test(message.content);
    
    if (isUrl) {
      // Reset regex again before extracting
      URL_REGEX.lastIndex = 0;
      
      const url = message.content.match(URL_REGEX)[0];
      const isOnlyUrl = message.content.trim() === url;
      const isMediaUrl = url.match(/youtube|spotify|vimeo|soundcloud/i);
      
      return (
        <>
          {!isOnlyUrl && (
            <Typography 
              variant="body2"
              sx={{ 
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                mb: 0.5
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
            transform: 'scale(0.97)',
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
          variant="body2"
          sx={{ 
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5
          }}
        >
          {message.content}
        </Typography>
      );
    }
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
              const isUser = message.sender_id === activeProfile?.id;
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
                        borderTopRightRadius: isUser && index > 0 && messages[index - 1].sender_id === activeProfile?.id ? 1 : undefined,
                        ml: isUser ? 0 : 0.5,
                        mr: isUser ? 0.5 : 0
                      }}
                    >
                      {/* Message content with media and link preview support */}
                      {renderMessageContent(message)}
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
      
      {/* Pending Media Indicator */}
      {pendingMedia && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {/* Media Preview */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            {pendingMedia.type === 'image' && (
              <Box
                component="img"
                src={pendingMedia.url}
                alt="Pending media"
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              />
            )}
            {pendingMedia.type === 'video' && (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <VideocamIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
              </Box>
            )}
            {pendingMedia.type === 'audio' && (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {pendingMedia.metadata?.thumbnail ? (
                  <Box
                    component="img"
                    src={pendingMedia.metadata.thumbnail}
                    alt="Album art"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <AudiotrackIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
                )}
              </Box>
            )}
            {pendingMedia.type === 'pdf' && (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <PictureAsPdfIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
              </Box>
            )}
            {/* Close button overlay */}
            <IconButton
              size="small"
              onClick={() => setPendingMedia(null)}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'error.dark'
                },
                width: 20,
                height: 20
              }}
            >
              <CancelIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          {/* Media Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {pendingMedia.metadata?.fileName || pendingMedia.fileName || 'Untitled'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pendingMedia.type?.toUpperCase() || 'FILE'} • Ready to send
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Message Input */}
      <Box 
        component="form" 
        onSubmit={handleSendMessage} 
        sx={{ 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: pendingMedia ? 'none' : '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Media upload button */}
          <IconButton
            color="primary"
            onClick={() => setShowMediaUpload(!showMediaUpload)}
            sx={{ mr: 1 }}
          >
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            inputRef={textFieldRef}
            fullWidth
            placeholder="Type a message or paste a link..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            autoFocus
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
            disabled={!newMessage.trim() && !pendingMedia}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Media upload dialog */}
      {showMediaUpload && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            bottom: 80, 
            left: 16, 
            right: 16, 
            p: 2,
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Upload Media</Typography>
            <IconButton size="small" onClick={() => setShowMediaUpload(false)}>
              <CancelIcon />
            </IconButton>
          </Box>
          <MediaUpload
            onUpload={handleMediaUpload}
            allowedTypes={['IMAGE', 'VIDEO', 'AUDIO', 'PDF']}
            bucket="networks"
            path={`direct-messages/${conversationId}`}
            maxFiles={1}
            autoUpload={true}
            compact={true}
          />
        </Paper>
      )}
      
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