import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { fetchNetworkMembers } from '../api/networks';
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
  FormControlLabel,
  Popover,
  MenuItem,
  Chip,
  Menu
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import backgroundImage from '../assets/8-bit-artwork-sky-landscape-wallpaper-preview.jpg';
import LinkPreview from './LinkPreview'; // Import the LinkPreview component
import MediaUpload from './MediaUpload';
import MediaPlayer from './MediaPlayer';
import ImageViewerModal from './ImageViewerModal';
import { uploadMediaFile } from '../utils/mediaUpload';
import { queueMentionNotification } from '../services/emailNotificationService';
import EmojiPicker from 'emoji-picker-react';

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
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [pendingMedia, setPendingMedia] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Image viewer modal state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  
  // Mention system state
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [networkMembers, setNetworkMembers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textFieldRef = useRef(null);
  
  // State for message menu
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  
  // State for replies
  const [replyingTo, setReplyingTo] = useState(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fetch network members for mention suggestions
  useEffect(() => {
    const fetchMembers = async () => {
      if (!networkId) return;
      
      try {
        const result = await fetchNetworkMembers(networkId);
        setNetworkMembers(result.members || []);
      } catch (error) {
        console.error('Error fetching network members:', error);
      }
    };
    
    fetchMembers();
  }, [networkId]);

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
            media_url,
            media_type,
            media_metadata,
            parent_message_id,
            reply_to_user_id,
            reply_to_content,
            profiles:user_id (id, full_name, profile_picture_url),
            reply_to_profile:reply_to_user_id (id, full_name)
          `)
          .eq('network_id', networkId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Debug: Log messages with media
        console.log('All messages:', data);
        const messagesWithMedia = data?.filter(msg => msg.media_url);
        if (messagesWithMedia?.length > 0) {
          console.log('Messages with media:', messagesWithMedia);
          console.log('First media message:', messagesWithMedia[0]);
        }
        
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
              media_url,
              media_type,
              media_metadata,
              parent_message_id,
              reply_to_user_id,
              reply_to_content,
              profiles:user_id (id, full_name, profile_picture_url),
              reply_to_profile:reply_to_user_id (id, full_name)
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

  // Handle message input changes and detect mentions
  const handleMessageChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewMessage(value);
    setCursorPosition(cursorPos);
    
    // Check for @ symbol to trigger mention suggestions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're still in a mention (no space after @)
      if (!textAfterAt.includes(' ')) {
        setMentionSearchTerm(textAfterAt.toLowerCase());
        const filtered = networkMembers.filter(member => 
          member.full_name?.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(true);
        setMentionAnchorEl(textFieldRef.current);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };
  
  // Handle mention selection
  const handleMentionSelect = (member) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBeforeAt = newMessage.substring(0, lastAtIndex);
      const textAfterCursor = newMessage.substring(cursorPosition);
      const newText = `${textBeforeAt}@${member.full_name} ${textAfterCursor}`;
      setNewMessage(newText);
      setShowMentionSuggestions(false);
      
      // Focus back to text field
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 0);
    }
  };
  
  // Extract mentions from message content
  const extractMentions = (content) => {
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1].trim();
      const mentionedUser = networkMembers.find(member => 
        member.full_name?.toLowerCase() === mentionedName.toLowerCase()
      );
      if (mentionedUser) {
        mentions.push(mentionedUser);
      }
    }
    
    return mentions;
  };
  
  const handleSend = async (mediaData = null) => {
    // Use passed mediaData or pendingMedia
    const media = mediaData || pendingMedia;
    
    // Allow sending if there's text or media
    if (!newMessage.trim() && !media) return;
    
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
      parent_message_id: replyingTo?.id || null,
      reply_to_user_id: replyingTo?.user_id || null,
      reply_to_content: replyingTo?.content || null,
      reply_to_profile: replyingTo ? { 
        id: replyingTo.user_id, 
        full_name: replyingTo.profiles?.full_name 
      } : null,
      pending: true
    };
    
    // Add media data to pending message if present
    if (media) {
      pendingMessage.media_url = media.url;
      pendingMessage.media_type = media.type || media.mediaType?.toLowerCase();
      pendingMessage.media_metadata = media.metadata || {
        fileName: media.fileName,
        fileSize: media.fileSize,
        mimeType: media.mimeType
      };
    }

    // Add the pending message to the UI immediately
    setMessages(prev => [...prev, pendingMessage]);
    setNewMessage('');
    setPendingMedia(null); // Clear pending media after sending
    setReplyingTo(null); // Clear reply state

    try {
      // Send the message to the database
      const messageData = {
        network_id: networkId,
        user_id: user.id,
        content: pendingMessage.content
      };
      
      // Add reply data if present
      if (replyingTo) {
        messageData.parent_message_id = replyingTo.id;
        messageData.reply_to_user_id = replyingTo.user_id;
        messageData.reply_to_content = replyingTo.content?.substring(0, 100);
      }
      
      // Add media data if present
      if (media) {
        messageData.media_url = media.url;
        messageData.media_type = media.type || media.mediaType?.toLowerCase();
        messageData.media_metadata = media.metadata || {
          fileName: media.fileName,
          fileSize: media.fileSize,
          mimeType: media.mimeType
        };
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('id')
        .single();

      if (error) throw error;
      
      console.log('Message sent successfully with ID:', data.id);
      
      // Handle mentions - queue notifications
      const mentions = extractMentions(pendingMessage.content);
      if (mentions.length > 0) {
        for (const mentionedUser of mentions) {
          if (mentionedUser.id !== user.id) { // Don't notify self
            try {
              await queueMentionNotification(
                mentionedUser.id,
                networkId,
                user.user_metadata?.full_name || 'Someone',
                pendingMessage.content,
                data.id
              );
            } catch (notifError) {
              console.error('Error queueing mention notification:', notifError);
            }
          }
        }
      }
      
      // The realtime subscription will handle adding the confirmed message
      // Clear reply state after successful send
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setError('Failed to send message');
    }
  };
  
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('[data-emoji-picker]')) {
        setShowEmojiPicker(false);
      }
      if (showMediaUpload && !event.target.closest('[data-media-upload]')) {
        setShowMediaUpload(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showMediaUpload]);

  // Handle media upload - just store it, don't send yet
  const handleMediaUpload = async (mediaData) => {
    console.log('Chat: handleMediaUpload called with:', mediaData);
    
    if (!mediaData) {
      console.error('Chat: mediaData is undefined');
      setError('Media upload failed: No data received');
      return;
    }
    
    setShowMediaUpload(false);
    setPendingMedia(mediaData);
  };
  
  // Handle message menu
  const handleMessageMenuOpen = (event, messageId) => {
    event.stopPropagation();
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessageId(messageId);
  };
  
  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessageId(null);
  };
  
  // Handle message deletion
  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', selectedMessageId)
        .eq('user_id', user.id); // Ensure users can only delete their own messages
        
      if (error) throw error;
      
      // Remove the message from local state
      setMessages(prev => prev.filter(msg => msg.id !== selectedMessageId));
      
      // Close the menu
      handleMessageMenuClose();
      
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  };
  
  // Handle reply to message
  const handleReplyToMessage = () => {
    const messageToReply = messages.find(msg => msg.id === selectedMessageId);
    console.log('Reply to message:', selectedMessageId, messageToReply);
    if (messageToReply) {
      setReplyingTo(messageToReply);
      handleMessageMenuClose();
      // Focus on input field
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100);
    } else {
      console.error('Message not found:', selectedMessageId);
    }
  };
  
  // Handle image click
  const handleImageClick = (imageUrl, title = 'Chat Image') => {
    setSelectedImage({ url: imageUrl, title });
    setImageViewerOpen(true);
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


// Function to render media (images, videos, audio)
const renderMedia = (mediaUrl, mediaType, metadata, messageId) => {
  const isExpanded = expandedMedia[messageId] || false;
  
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
                sx={{ color: darkMode ? 'white' : 'text.secondary' }}
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
            {/* Video thumbnail/preview */}
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
                onError={(e) => {
                  // If thumbnail fails to load, hide it and show video preview
                  e.target.style.display = 'none';
                  const videoElement = e.target.nextElementSibling;
                  if (videoElement) {
                    videoElement.style.display = 'block';
                  }
                }}
              />
            ) : null}
            
            {/* Video preview fallback */}
            <Box
              component="video"
              src={mediaUrl}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 300,
                objectFit: 'contain',
                display: metadata?.thumbnail ? 'none' : 'block'
              }}
              muted
              preload="metadata"
              onLoadedData={(e) => {
                // Set video to first frame
                e.target.currentTime = 1;
              }}
              onError={(e) => {
                // If video fails to load, show a placeholder
                console.error('Video preview failed to load:', mediaUrl);
                e.target.style.display = 'none';
              }}
            />
            
            {/* Play button overlay */}
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
            
            {/* Duration badge */}
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
            
            {/* File info */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: metadata?.duration ? 60 : 8,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              <Typography variant="caption" noWrap>
                {metadata?.fileName || 'Video'}
              </Typography>
            </Box>
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
            {audioImage ? (
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
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 0.9
                      }
                    }}
                    alt="Audio artwork"
                    onError={(e) => {
                      // If artwork fails to load, hide the entire paper element
                      e.target.closest('.MuiPaper-root').style.display = 'none';
                    }}
                  />
                  
                  {/* Track info overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      p: 1.5,
                      color: 'white'
                    }}
                  >
                    {metadata?.title && (
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                        {metadata.title}
                      </Typography>
                    )}
                    {metadata?.artist && (
                      <Typography variant="caption" noWrap sx={{ opacity: 0.9 }}>
                        {metadata.artist}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            ) : null}
            
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
                sx={{ color: darkMode ? 'white' : 'text.secondary' }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      
      // Check for various possible image fields in metadata
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
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
              }
            }}
            onClick={toggleExpanded}
          >
            {/* Album art or thumbnail */}
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
                      e.stopPropagation(); // Prevent triggering the audio player expansion
                      handleImageClick(audioImage, metadata?.title || 'Audio Artwork');
                    }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 0.9
                      }
                    }}
                    alt="Audio artwork"
                    onError={(e) => {
                      // On error, hide the image and its container
                      const container = e.target.closest('[class*="MuiBox-root"]');
                      if (container && container.style.width === '120px') {
                        container.style.display = 'none';
                      }
                      e.target.style.display = 'none';
                    }}
                  />
                  
                  {/* Play button overlay */}
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
                
                {/* Audio info */}
                <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ 
                      color: darkMode ? 'white' : 'text.primary',
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
                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      {metadata.artist}
                    </Typography>
                  )}
                  {metadata?.album && (
                    <Typography 
                      variant="caption" 
                      noWrap
                      sx={{ 
                        color: darkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary',
                        display: 'block'
                      }}
                    >
                      {metadata.album}
                    </Typography>
                  )}
                  {metadata?.duration && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: darkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <>
                {/* Audio icon */}
                <AudioFileIcon 
                  sx={{ 
                    fontSize: 32, 
                    color: darkMode ? 'white' : 'primary.main',
                    ml: 2,
                    flexShrink: 0
                  }} 
                />
                
                {/* Audio info */}
                <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ color: darkMode ? 'white' : 'text.primary' }}
                  >
                    {metadata?.fileName || 'Audio File'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}
                  >
                    Click to play
                  </Typography>
                </Box>
                
                {/* Play button */}
                <PlayCircleIcon 
                  sx={{ 
                    fontSize: 28, 
                    color: darkMode ? 'white' : 'primary.main',
                    mr: 2,
                    flexShrink: 0
                  }} 
                />
              </>
            )}
          </Paper>
        </Box>
      );
      
    default:
      return null;
  }
};

  // Function to render text with highlighted mentions
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention as a chip
      const mentionedName = match[1].trim();
      const mentionedUser = networkMembers.find(member => 
        member.full_name?.toLowerCase() === mentionedName.toLowerCase()
      );
      
      if (mentionedUser) {
        parts.push(
          <Chip
            key={`mention-${match.index}`}
            label={`@${mentionedName}`}
            size="small"
            component={Link}
            to={`/profile/${mentionedUser.id}`}
            sx={{
              cursor: 'pointer',
              backgroundColor: darkMode 
                ? alpha('#1976d2', 0.3)
                : alpha('#1976d2', 0.2),
              color: darkMode ? '#64b5f6' : '#1976d2',
              fontWeight: 500,
              fontSize: '0.85rem',
              height: 22,
              mx: 0.3,
              '&:hover': {
                backgroundColor: darkMode 
                  ? alpha('#1976d2', 0.5)
                  : alpha('#1976d2', 0.3),
                textDecoration: 'none'
              }
            }}
          />
        );
      } else {
        // If user not found, just show as regular text
        parts.push(`@${mentionedName}`);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return (
      <Typography 
        component="span" 
        variant="body2" 
        sx={{ 
          fontSize: '0.85rem',
          lineHeight: 1.4,
          color: darkMode 
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(0, 0, 0, 0.7)',
          // Enhanced emoji support
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", system-ui, -apple-system, sans-serif',
          '& .emoji': {
            fontSize: '1.1em',
            verticalAlign: 'baseline'
          }
        }}
      >
        {parts}
      </Typography>
    );
  };

  // Function to render message content (text, link preview, or media)
const renderMessageContent = (message) => {
  if (!message) {
    return null;
  }
  
  // Check if message has media
  if (message.media_url && message.media_type) {
    return (
      <Box>
        {message.content && (
          <Box sx={{ mb: 0.5, display: 'block' }}>
            {renderTextWithMentions(message.content)}
          </Box>
        )}
        {renderMedia(message.media_url, message.media_type, message.media_metadata, message.id)}
      </Box>
    );
  }
  
  if (!message.content) {
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
          <Box sx={{ mb: 0.5, display: 'block' }}>
            {renderTextWithMentions(message.content)}
          </Box>
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
    // Render as plain text with mentions
    return renderTextWithMentions(message.content);
  }
};

// Render media content
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
                  position: 'relative',
                  '&:hover .message-menu-button': {
                    opacity: 1
                  },
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
                      {/* Show reply context if this is a reply */}
                      {message.parent_message_id && message.reply_to_content && (
                        <Box
                          sx={{
                            borderLeft: '3px solid',
                            borderLeftColor: darkMode 
                              ? 'rgba(255, 255, 255, 0.3)' 
                              : 'rgba(0, 0, 0, 0.2)',
                            pl: 1.5,
                            mb: 0.5,
                            py: 0.5,
                            bgcolor: darkMode 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '0 4px 4px 0'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: darkMode 
                                ? 'rgba(255, 255, 255, 0.6)' 
                                : 'rgba(0, 0, 0, 0.5)',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            Replying to {message.reply_to_profile?.full_name || 'Unknown'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: darkMode 
                                ? 'rgba(255, 255, 255, 0.5)' 
                                : 'rgba(0, 0, 0, 0.4)',
                              fontSize: '0.75rem',
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {message.reply_to_content}
                          </Typography>
                        </Box>
                      )}
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
                
                {/* Menu button for message options */}
                {!message.pending && (
                  <IconButton
                    className="message-menu-button"
                    size="small"
                    onClick={(e) => handleMessageMenuOpen(e, message.id)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      backgroundColor: darkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        backgroundColor: darkMode 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : 'rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </ListItem>
            );
          })
        )}
        <div ref={messageEndRef} />
      </List>
      
      {/* Reply Preview */}
      {replyingTo && (
        <Box
          sx={{
            px: 2,
            pt: 1,
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              bgcolor: darkMode 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              mb: 1
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              >
                Replying to {replyingTo.profiles?.full_name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: darkMode 
                    ? 'rgba(255, 255, 255, 0.6)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {replyingTo.content}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setReplyingTo(null)}
              sx={{
                p: 0.5,
                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      )}
      
      {/* Pending Media Indicator */}
      {pendingMedia && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: darkMode
              ? 'rgba(0, 0, 0, 0.6)'
              : 'rgba(245, 245, 245, 0.9)',
            borderTop: darkMode
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.08)',
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
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }}
              />
            )}
            {pendingMedia.type === 'video' && (
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }}
              >
                <VideocamIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            )}
            {pendingMedia.type === 'audio' && (
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
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
                  <AudiotrackIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                )}
              </Box>
            )}
            {pendingMedia.type === 'pdf' && (
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }}
              >
                <PictureAsPdfIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
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
                width: 24,
                height: 24
              }}
            >
              <CancelIcon sx={{ fontSize: 16 }} />
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
            {pendingMedia.metadata?.fileSize && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {(pendingMedia.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>
        </Box>
      )}
      
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
          borderTop: replyingTo ? 'none' : (darkMode
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.08)'),
          zIndex: 1,
          position: 'relative'
        }}
      >
        {/* Media upload button */}
        <IconButton
          color="primary"
          onClick={() => setShowMediaUpload(!showMediaUpload)}
          disabled={false}
          sx={{ mr: 1 }}
        >
          <AttachFileIcon />
        </IconButton>
        
        {/* Emoji picker button */}
        <IconButton
          color="primary"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={false}
          sx={{ mr: 1 }}
        >
          <EmojiEmotionsIcon />
        </IconButton>
        
        <TextField
          ref={textFieldRef}
          fullWidth
          variant="outlined"
          placeholder="Type a message or paste a link..."
          value={newMessage}
          onChange={handleMessageChange}
          onKeyDown={(e) => {
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
          onClick={() => handleSend()}
          disabled={!newMessage.trim() && !pendingMedia}
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
      
      {/* Emoji picker dialog */}
      {showEmojiPicker && (
        <Paper 
          data-emoji-picker
          sx={{ 
            position: 'absolute', 
            bottom: 80, 
            right: 16, 
            p: 1,
            bgcolor: darkMode ? 'background.paper' : 'background.default',
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
            <Typography variant="subtitle2">Choose Emoji</Typography>
            <IconButton size="small" onClick={() => setShowEmojiPicker(false)}>
              <CancelIcon />
            </IconButton>
          </Box>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={darkMode ? 'dark' : 'light'}
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
      
      {/* Media upload dialog */}
      {showMediaUpload && (
        <Paper 
          data-media-upload
          sx={{ 
            position: 'absolute', 
            bottom: 80, 
            left: 16, 
            right: showEmojiPicker ? 332 : 16, // Adjust right margin when emoji picker is open
            p: 2,
            bgcolor: darkMode ? 'background.paper' : 'background.default',
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
            allowedTypes={['IMAGE', 'VIDEO', 'AUDIO']}
            bucket="networks"
            path={`chat/${networkId}`}
            maxFiles={1}
            autoUpload={true}
            compact={true}
          />
        </Paper>
      )}
      
      {/* Mention suggestions popover */}
      <Popover
        open={showMentionSuggestions}
        anchorEl={mentionAnchorEl}
        onClose={() => setShowMentionSuggestions(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          pointerEvents: 'none',
          '& .MuiPaper-root': {
            pointerEvents: 'auto',
            maxHeight: 200,
            minWidth: 200,
            overflow: 'auto'
          }
        }}
      >
        <List dense>
          {mentionSuggestions.length > 0 ? (
            mentionSuggestions.map((member) => (
              <MenuItem
                key={member.id}
                onClick={() => handleMentionSelect(member)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1
                }}
              >
                <Avatar
                  src={member.profile_picture_url}
                  sx={{ width: 24, height: 24 }}
                >
                  {!member.profile_picture_url && member.full_name?.[0]}
                </Avatar>
                <Typography variant="body2">
                  {member.full_name}
                </Typography>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No members found
              </Typography>
            </MenuItem>
          )}
        </List>
      </Popover>
      
      {/* Message options menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleReplyToMessage}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        {messages.find(msg => msg.id === selectedMessageId)?.user_id === user.id && (
          <MenuItem onClick={handleDeleteMessage}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Message
          </MenuItem>
        )}
      </Menu>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
    </Paper>
  );
};

export default Chat;