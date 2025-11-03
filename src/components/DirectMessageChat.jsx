import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useDirectMessages } from '../context/directMessagesContext';
import { getConversationMessages, sendDirectMessage, markMessagesAsRead } from '../api/directMessages';
import { supabase } from '../supabaseclient';
import { formatTime, formatDate } from '../utils/dateFormatting';
import Spinner from './Spinner';
import { useTranslation } from '../hooks/useTranslation';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
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
  PictureAsPdf as PictureAsPdfIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Gif as GifIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import LinkPreview from './LinkPreview';
import MediaUpload from './MediaUpload';
import MemberDetailsModal from './MembersDetailModal';
import EmojiPicker from 'emoji-picker-react';
import GifPicker from './GifPicker';
import { playNotificationIfEnabled, initializeAudioContext } from '../utils/notificationSounds';

function DirectMessageChat({ conversationId, partner, onBack }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { updateConversationWithMessage, markConversationAsRead, refreshConversations } = useDirectMessages();
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('offline');
  const [sendingMessages, setSendingMessages] = useState(new Set()); // Track multiple sending messages
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [pendingMedia, setPendingMedia] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const channelRef = useRef(null);
  const fetchingRef = useRef(false);
  const lastFetchedConversationId = useRef(null);
  const textFieldRef = useRef(null);
  const pendingMessagesRef = useRef(new Map()); // Track pending messages for better matching
  
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
            
            // If this is from the current user, try to find and remove the corresponding pending message
            if (payload.new.sender_id === activeProfile?.id) {
              // Find the oldest pending message with matching content from this sender
              const pendingIndex = prevMessages.findIndex(msg => 
                msg.pending && 
                msg.sender_id === payload.new.sender_id && 
                msg.content === payload.new.content
              );
              
              if (pendingIndex !== -1) {
                // Remove the pending message and add the real one
                const filteredMessages = [...prevMessages];
                const removedPending = filteredMessages.splice(pendingIndex, 1)[0];
                
                // Clean up the pending message tracking
                if (removedPending && removedPending.id) {
                  pendingMessagesRef.current.delete(removedPending.id);
                  setSendingMessages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(removedPending.id);
                    return newSet;
                  });
                }
                
                return [...filteredMessages, messageWithSender];
              }
            }
            
            // Just add the new message if no pending message was found
            return [...prevMessages, messageWithSender];
          });
          
          // Only update unread count if the message is from the other user
          if (payload.new.sender_id !== activeProfile?.id) {
            // Mark as read if we're currently viewing this conversation
            if (activeProfile) markMessagesAsRead(conversationId, activeProfile.id);
            markConversationAsRead(conversationId);

            // Play notification sound for incoming direct message
            playNotificationIfEnabled(activeProfile, 'dm');
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
  }, [conversationId, user?.id, markConversationAsRead, updateConversationWithMessage, activeProfile?.id]);
  
  // Clean up pending messages when conversation changes
  useEffect(() => {
    return () => {
      // Clear pending messages when switching conversations
      pendingMessagesRef.current.clear();
      setSendingMessages(new Set());
    };
  }, [conversationId]);
  
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
    if (messageContainerRef.current) {
      // Scroll within the container only, not the viewport
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Scroll to bottom when conversation changes or loading completes
  useEffect(() => {
    if (!loading && messagesEndRef.current && messageContainerRef.current && messages.length > 0) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [conversationId, loading, messages.length]);

  // Close emoji picker, gif picker, and media upload when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('[data-emoji-picker]')) {
        setShowEmojiPicker(false);
      }
      if (showGifPicker && !event.target.closest('[data-gif-picker]')) {
        setShowGifPicker(false);
      }
      if (showMediaUpload && !event.target.closest('[data-media-upload]')) {
        setShowMediaUpload(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showGifPicker, showMediaUpload]);
  
  
  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const cursorPos = textFieldRef.current?.selectionStart || newMessage.length;
    const textBefore = newMessage.substring(0, cursorPos);
    const textAfter = newMessage.substring(cursorPos);
    const newText = textBefore + emoji + textAfter;

    setNewMessage(newText);
    setShowEmojiPicker(false);

    // Focus back to text field and set cursor position after emoji
    setTimeout(() => {
      textFieldRef.current?.focus();
      const newCursorPos = cursorPos + emoji.length;
      textFieldRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle GIF selection
  const handleGifSelect = (gifData) => {
    console.log('GIF selected:', gifData);

    // Create media data object for the GIF
    const gifMediaData = {
      url: gifData.url,
      type: 'image', // GIFs are treated as images
      mediaType: 'image',
      fileName: gifData.title || 'giphy.gif',
      metadata: {
        fileName: gifData.title || 'giphy.gif',
        width: gifData.width,
        height: gifData.height,
        gifId: gifData.id
      }
    };

    // Set as pending media and close picker
    setPendingMedia(gifMediaData);
    setShowGifPicker(false);

    // Focus on text field
    setTimeout(() => {
      textFieldRef.current?.focus();
    }, 0);
  };

  const handleSendMessage = async (e, mediaData = null) => {
    if (e) e.preventDefault();
    
    // Use passed mediaData or pendingMedia
    const media = mediaData || pendingMedia;
    
    // Allow sending if there's text or media
    if (!newMessage.trim() && !media) return;
    if (!conversationId || !user?.id) return;
    
    const messageContent = newMessage.trim();
    const messageId = `pending-${Date.now()}-${Math.random()}`;
    
    // Clear input immediately and maintain focus
    setNewMessage('');
    setPendingMedia(null);
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
    
    // Track this specific message as sending
    setSendingMessages(prev => new Set(prev).add(messageId));

    // Create a pending message for immediate display
    const pendingMsg = {
      id: messageId,
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
    
    // Track this pending message
    pendingMessagesRef.current.set(messageId, {
      content: messageContent,
      timestamp: Date.now()
    });
    
    try {
      // Use active profile ID for sender
      if (!activeProfile) {
        throw new Error('No active profile selected');
      }
      
      const { error } = await sendDirectMessage(
        conversationId,
        activeProfile.id,
        messageContent,
        media
      );
      
      if (error) throw error;
      
      // The real message will be added via the subscription
      // Set a timeout to clean up the pending message if it doesn't arrive
      setTimeout(() => {
        // If the pending message is still there after 5 seconds, remove it
        setMessages(prev => {
          const stillPending = prev.find(m => m.id === messageId);
          if (stillPending && stillPending.pending) {
            console.log('Cleaning up stuck pending message:', messageId);
            pendingMessagesRef.current.delete(messageId);
            setSendingMessages(prevSending => {
              const newSet = new Set(prevSending);
              newSet.delete(messageId);
              return newSet;
            });
            // Remove the pending flag but keep the message visible
            return prev.map(m => 
              m.id === messageId ? { ...m, pending: false } : m
            );
          }
          return prev;
        });
      }, 5000);
      
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the pending message if there was an error
      setMessages(prev => prev.filter(m => m.id !== pendingMsg.id));
      pendingMessagesRef.current.delete(messageId);
      // Re-populate the input field so the user doesn't lose their message
      setNewMessage(messageContent);
      if (media) setPendingMedia(media);
      // Remove from sending set
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };
  
  // Format timestamp
  const formatMessageTime = (timestamp) => {
    return formatTime(timestamp);
  };
  
  // Format date for date headers
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('chat.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    } else {
      return formatDate(timestamp, { 
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
                      {t('chat.clickToPlay')}
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
            width: '100%',
            maxWidth: '100%'
          }}>
            <LinkPreview
              url={url}
              compact={false}
              isEditable={true}
              height="auto"
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
          {t('chat.selectConversation')}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: { 
          xs: 'calc(100dvh - var(--network-header-height, 80px) - 77px)',
          sm: '100%'
        },
        bgcolor: 'background.default',
        overflow: 'hidden'
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
          color: 'text.primary',
          flexShrink: 0
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
            onClick={() => setShowMemberDetailsModal(true)}
            sx={{ 
              mr: 1.5, 
              width: 40, 
              height: 40,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        </Badge>
        <Box 
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer'
          }}
          onClick={() => setShowMemberDetailsModal(true)}
        >
          <Typography 
            variant="subtitle1"
            sx={{
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            {partner.full_name || t('chat.unknownUser')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partnerStatus === 'online' ? t('chat.onlineNow') : t('chat.offline')}
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
            <Spinner size={48} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>
            <Typography variant="body2">{t('chat.error')}</Typography>
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
              onClick={() => setShowMemberDetailsModal(true)}
              sx={{ 
                width: 64, 
                height: 64, 
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              {partner.full_name ? partner.full_name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Typography 
              variant="h6" 
              onClick={() => setShowMemberDetailsModal(true)}
              sx={{ 
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              {partner.full_name || t('chat.unknownUser')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {t('chat.conversationStart', { name: partner.full_name })}
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.sender_id === activeProfile?.id;
              const showAvatar = !isUser && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
              const showDateHeader = shouldShowDateHeader(message.created_at, index);

              // Check if message contains a link
              URL_REGEX.lastIndex = 0;
              const containsLink = message.content && URL_REGEX.test(message.content);

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
                        maxWidth: containsLink ? '85%' : '70%',
                        width: containsLink ? '85%' : 'auto',
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
                            {t('chat.sending')}
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
              {pendingMedia.metadata?.fileName || pendingMedia.fileName || t('chat.untitled')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pendingMedia.type?.toUpperCase() || 'FILE'} • {t('chat.readyToSend')}
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
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Media upload button */}
          <IconButton
            color="primary"
            onClick={() => setShowMediaUpload(!showMediaUpload)}
            sx={{ mr: 1 }}
            title={t('chat.attachFile', 'Attach file')}
          >
            <AttachFileIcon />
          </IconButton>

          {/* GIF picker button */}
          <IconButton
            color="primary"
            onClick={() => setShowGifPicker(!showGifPicker)}
            sx={{ mr: 1 }}
            title={t('chat.addGif', 'Add GIF')}
          >
            <GifIcon />
          </IconButton>

          {/* Emoji picker button */}
          <IconButton
            color="primary"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            sx={{ mr: 1 }}
            title={t('chat.addEmoji', 'Add emoji')}
          >
            <EmojiEmotionsIcon />
          </IconButton>

          <TextField
            inputRef={textFieldRef}
            fullWidth
            placeholder={t('chat.placeholderWithLink')}
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            autoFocus
            onFocus={() => {
              // Initialize audio context on first user interaction
              initializeAudioContext();
            }}
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
          data-media-upload
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
            <Typography variant="subtitle2">{t('chat.uploadMedia')}</Typography>
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

      {/* GIF picker dialog */}
      {showGifPicker && (
        <Paper
          data-gif-picker
          sx={{
            position: 'absolute',
            bottom: 80,
            right: showEmojiPicker ? 328 : 16,
            width: 340,
            height: 500,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.98)' : 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 10,
            overflow: 'hidden'
          }}
        >
          <GifPicker
            onGifSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
            darkMode={true}
          />
        </Paper>
      )}

      {/* Emoji picker dialog */}
      {showEmojiPicker && (
        <Paper
          data-emoji-picker
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            p: 1,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
            <Typography variant="subtitle2">{t('chat.chooseEmoji')}</Typography>
            <IconButton size="small" onClick={() => setShowEmojiPicker(false)}>
              <CancelIcon />
            </IconButton>
          </Box>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="auto"
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </Paper>
      )}

      {/* Member Details Modal */}
      {partner && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => setShowMemberDetailsModal(false)}
          member={partner}
        />
      )}
    </Box>
  );
}

export default DirectMessageChat;