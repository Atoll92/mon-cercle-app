import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Paper,
  Divider,
  Box,
  Avatar,
  Chip,
  CircularProgress,
  Fade,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Collapse,
  Button
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ReadMore as ReadMoreIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Article as ArticleIcon,
  PlayCircleFilled as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import LazyImage from './LazyImage';
import ImageViewerModal from './ImageViewerModal';
import CommentSection from './CommentSection';

// Number of items to display initially
const ITEMS_PER_FETCH = 6;

const SocialWallTab = ({ socialWallItems = [], networkMembers = [], darkMode = false, isAdmin = false }) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Debug log for items received
  React.useEffect(() => {
    console.log('SocialWallTab received items:', socialWallItems);
    // Log post items specifically
    const postItems = socialWallItems.filter(item => item.itemType === 'post');
    console.log('Post items:', postItems);
    // Log if there are post items with images
    const postItemsWithImages = postItems.filter(item => item.image_url);
    console.log('Post items with images:', postItemsWithImages);
  }, [socialWallItems]);
  
  // When using theme.palette.custom, check first if it exists
  // This is for compatibility with both your custom theme and the default theme
  const customLightText = muiTheme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = muiTheme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = muiTheme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1));
  
  // State for infinite scroll
  const [displayItems, setDisplayItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [animationType, setAnimationType] = useState('shrink'); // Always use subtle shrink animation
  
  // State for expanded cards
  const [expandedCardId, setExpandedCardId] = useState(null);
  
  // Refs for scroll and animations
  const observer = useRef();
  const expandedCardRef = useRef(null);
  const animationFrameRef = useRef();
  const cardRefs = useRef(new Map());
  
  // State for audio playback
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  
  // State for image viewer modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  
  // Toggle card expansion with improved scroll handling
  const handleExpandCard = (id) => {
    // Toggle expanded state
    setExpandedCardId(prevId => prevId === id ? null : id);
    
    // We'll handle scrolling in the effect below, not here
  };
  
  // Effect to handle scrolling after expansion/collapse
  useEffect(() => {
    // Only run when expandedCardId changes
    if (expandedCardRef.current) {
      // Allow DOM to update before scrolling
      const timer = setTimeout(() => {
        const cardRect = expandedCardRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Only scroll if card is not fully visible in viewport
        if (cardRect.top < 100 || cardRect.bottom > windowHeight - 20) {
          const scrollOffset = cardRect.top + window.pageYOffset - 100;
          window.scrollTo({ 
            top: scrollOffset, 
            behavior: 'smooth' 
          });
        }
      }, 100); // Short delay for DOM update
      
      return () => clearTimeout(timer);
    }
  }, [expandedCardId]);
  
  // Declare a ref for the loadMore function to avoid circular dependencies
  const loadMoreFn = useRef(null);
  
  const lastItemRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && loadMoreFn.current) {
        console.log('Last item is visible, loading more items...');
        loadMoreFn.current();
      }
    }, {
      rootMargin: '200px', // Load more content before reaching the end
      threshold: 0.1 // Trigger when at least 10% of the element is visible
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  // No additional preload function needed, we're using the ref to loadMoreItems

  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.pageYOffset;
      setShowScrollTop(currentPosition > 300);
      setScrollPosition(currentPosition);
      
      // If user is scrolling back up and not near the bottom, preload more content
      const scrollingUp = currentPosition < scrollPosition;
      const nearBottom = window.innerHeight + currentPosition > document.body.offsetHeight - 1000;
      
      if (scrollingUp && !nearBottom && hasMore && !loading) {
        // Preload more content when scrolling up to ensure content is already loaded
        const shouldPreloadMore = page * ITEMS_PER_FETCH < socialWallItems.length;
        if (shouldPreloadMore && loadMoreFn.current) {
          console.log('Preloading more items while scrolling up');
          setTimeout(loadMoreFn.current, 100); // Small delay to avoid performance issues
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollPosition, hasMore, loading, page, socialWallItems.length]);
  
  // Initial load
  useEffect(() => {
    if (socialWallItems && socialWallItems.length > 0) {
      // Determine how many items to load initially - more if there are fewer total items
      const initialLoadCount = Math.min(
        ITEMS_PER_FETCH * 2, // Load 2 pages worth initially for smoother experience
        Math.max(ITEMS_PER_FETCH, Math.ceil(socialWallItems.length / 2)) // But at least half of all items
      );
      
      console.log(`Initially loading ${initialLoadCount} of ${socialWallItems.length} items`);
      
      // Load initial batch of items
      const initialItems = socialWallItems.slice(0, initialLoadCount);
      setDisplayItems(initialItems);
      setPage(Math.ceil(initialLoadCount / ITEMS_PER_FETCH)); // Set appropriate page number
      setHasMore(socialWallItems.length > initialLoadCount);
    } else {
      setDisplayItems([]);
      setHasMore(false);
    }
  }, [socialWallItems]);
  
  // Load more items
  const loadMoreItems = useCallback(() => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    
    setTimeout(() => {
      // Calculate which items to display based on the current page
      const endIndex = (page + 1) * ITEMS_PER_FETCH;
      const nextItems = socialWallItems.slice(0, endIndex);
      
      if (nextItems.length === socialWallItems.length) {
        setHasMore(false);
      } else {
        setPage(prevPage => prevPage + 1);
      }
      
      // Always set displayItems to all items up to the current page
      setDisplayItems(nextItems);
      setLoading(false);
      
      console.log(`Loaded items up to page ${page + 1}, total: ${nextItems.length} items`);
    }, 500); // Small timeout to prevent rapid scrolling issues
  }, [page, hasMore, loading, socialWallItems]);
  
  // Store the loadMoreItems function in the ref
  useEffect(() => {
    loadMoreFn.current = loadMoreItems;
  }, [loadMoreItems]);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Animation utilities
  const dvh = () => window.visualViewport?.height || document.documentElement.clientHeight;
  
  const seededRandom = (seed) => {
    let x = Math.sin(seed) * 10000;
    return (x - Math.floor(x)) * 2 - 1;
  };
  
  const fmod = (a, b) => {
    return a - b * Math.floor(a / b);
  };
  
  // Update CSS variables for animations
  const updateAnimationVariables = useCallback(() => {
    document.documentElement.style.setProperty('--vertical-center', `${window.scrollY + dvh()/2}`);
    document.documentElement.style.setProperty('--half-vertical-height', `${dvh()/2}`);
  }, []);
  
  // Apply shrink and slinky animations to cards
  const applyAnimations = useCallback(() => {
    const verticalCenter = window.scrollY + dvh() / 2;
    const halfVerticalHeight = dvh() / 2;
    const viewportBottom = window.scrollY + dvh();
    
    cardRefs.current.forEach((element) => {
      if (!element) return;
      
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.scrollY;
      const elementCenter = elementTop + (element.offsetHeight / 2);
      
      // Shrink animation for center focus
      const distanceFromCenter = Math.abs(verticalCenter - elementCenter);
      const centerThreshold = halfVerticalHeight * 1.5;
      const normalizedCenterDistance = Math.min(distanceFromCenter / centerThreshold, 1);
      const easeOut = 1 - Math.pow(normalizedCenterDistance, 2);
      const scale = 0.95 + (easeOut * 0.05);
      const opacity = 0.85 + (easeOut * 0.15);
      
      // Slinky animation for bottom viewport - make it much more obvious
      let slinkyTranslateY = 0;
      let slinkyScale = 1;
      
      // Apply to cards below viewport center or approaching from below
      if (elementCenter > verticalCenter - halfVerticalHeight * 0.3) {
        const distanceFromBottom = elementTop - viewportBottom;
        
        // Expanded range: affect cards within 1.2x viewport height below
        if (distanceFromBottom > -200 && distanceFromBottom < halfVerticalHeight * 1.2) {
          const bottomThreshold = halfVerticalHeight * 1.2;
          const normalizedBottomDistance = Math.max(0, Math.min(distanceFromBottom / bottomThreshold, 1));
          
          // More dramatic slinky effect with bounce
          const slinkyProgress = 1 - normalizedBottomDistance;
          
          // Ease-out-back for subtle bounce effect
          const bounceEase = slinkyProgress < 0.5 
            ? 2 * slinkyProgress * slinkyProgress 
            : 1 - Math.pow(-2 * slinkyProgress + 2, 3) / 2;
            
          // Much larger translation: 120px maximum
          slinkyTranslateY = normalizedBottomDistance * 120;
          
          // Slight scale effect for more dramatic appearance
          slinkyScale = 0.9 + (bounceEase * 0.1);
        }
      }
      
      // Combine transformations with more obvious effects
      const combinedScale = scale * slinkyScale;
      const combinedTransform = `scale(${combinedScale}) translateY(${slinkyTranslateY}px)`;
      
      element.style.transform = combinedTransform;
      element.style.opacity = opacity;
      element.style.filter = '';
    });
  }, []);
  
  // Animation loop
  const animationLoop = useCallback(() => {
    updateAnimationVariables();
    applyAnimations();
    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [updateAnimationVariables, applyAnimations]);
  
  // Start animation loop
  useEffect(() => {
    updateAnimationVariables();
    applyAnimations();
    animationFrameRef.current = requestAnimationFrame(animationLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationLoop, updateAnimationVariables, applyAnimations]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Format date in a user-friendly way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Clean up audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Handle audio playback
  const handleAudioPlay = (itemId, audioUrl) => {
    // If clicking the same audio, toggle play/pause
    if (playingAudioId === itemId) {
      const audio = audioRefs.current[itemId];
      if (audio) {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
    } else {
      // Stop any currently playing audio
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }
      
      // Create or get audio element for this item
      if (!audioRefs.current[itemId]) {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => {
          setPlayingAudioId(null);
        });
        audioRefs.current[itemId] = audio;
      }
      
      // Play the new audio
      audioRefs.current[itemId].play();
      setPlayingAudioId(itemId);
    }
  };

  // Get content type icon
  const getContentTypeIcon = (item) => {
    // Check for PDF
    if (item.file_type === 'pdf') {
      return { icon: <PdfIcon fontSize="small" />, label: 'PDF', color: 'error' };
    }
    
    // Check for media
    if (item.media_url && item.media_type) {
      switch (item.media_type) {
        case 'image':
          return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
        case 'video':
          return { icon: <VideoIcon fontSize="small" />, label: 'Video', color: 'info' };
        case 'audio':
          return { icon: <AudioIcon fontSize="small" />, label: 'Audio', color: 'warning' };
      }
    }
    
    // Check for legacy image
    if (item.image_url) {
      return { icon: <ImageIcon fontSize="small" />, label: 'Image', color: 'success' };
    }
    
    // Default to article/text
    return { icon: <ArticleIcon fontSize="small" />, label: 'Text', color: 'default' };
  };
  
  // Get height for masonry layout
  const getCardHeight = (item) => {
    // All cards now have dynamic height based on content
    return 'auto';
  };
  
  // Handle image click
  const handleImageClick = (url, title) => {
    setSelectedImage({ url, title });
    setImageViewerOpen(true);
  };
  
  return (
    <Paper 
      sx={{ 
        p: { xs: 2, md: 3 },
        position: 'relative',
        borderRadius: 3,
        bgcolor: darkMode ? alpha('#121212', 0.7) : 'background.paper',
        backdropFilter: 'blur(10px)',
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
      }}
      elevation={darkMode ? 4 : 1}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        position: 'relative'
      }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{
            fontWeight: 600,
            color: customLightText,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 3,
              borderRadius: 4,
              bgcolor: muiTheme.palette.primary.main
            }
          }}
        >
          Network Social Wall
        </Typography>
        
        {displayItems.length > 5 && showScrollTop && (
          <Fade in={showScrollTop}>
            <IconButton 
              onClick={scrollToTop}
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 100,
                bgcolor: muiTheme.palette.primary.main,
                color: '#ffffff',
                '&:hover': {
                  bgcolor: muiTheme.palette.primary.dark,
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <ArrowUpwardIcon />
            </IconButton>
          </Fade>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {socialWallItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography 
            variant="body1" 
            color={customFadedText}
          >
            No activity to display yet.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Masonry layout using CSS columns */}
          <Box 
            sx={{
              columns: {
                xs: '1',
                sm: '2',
                md: '3'
              },
              gap: 3,
              perspective: '2000px', // Enable 3D perspective for animations
              '& > *': {
                breakInside: 'avoid',
                marginBottom: 3
              }
            }}
          >
            {displayItems.map((item, index) => {
              // Set the ref to the last visible item, as well as to a few items before the end
              // to ensure smoother loading
              const isRefItem = index === displayItems.length - 1 || 
                               (displayItems.length > 10 && index % 10 === 0 && index > displayItems.length - 10);
              
              const cardId = item.stableId || `${item.itemType}-${item.id}`;
              
              return (
                <Card 
                  key={cardId}
                  ref={(el) => {
                    // Store card ref for animations
                    if (el) {
                      cardRefs.current.set(index, el);
                    } else {
                      cardRefs.current.delete(index);
                    }
                    
                    // Handle other refs
                    if (isRefItem && lastItemRef) {
                      lastItemRef(el);
                    }
                    if (expandedCardId === cardId && expandedCardRef) {
                      expandedCardRef.current = el;
                    }
                  }}
                  sx={{ 
                    mb: 3,
                    height: getCardHeight(item),
                    borderRadius: 2,
                    overflow: 'hidden',
                    // Smooth transitions for all transform and opacity changes
                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                    '&:hover': {
                      // Only apply hover transform if not expanded and not actively animating
                      ...(!expandedCardId || expandedCardId !== cardId ? {
                        transform: 'translateY(-2px) !important', // Subtle hover lift
                        boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
                      } : {})
                    },
                    bgcolor: darkMode ? alpha('#1e1e1e', 0.5) : 'background.paper',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${customBorder}`,
                    // Apply special styles when expanded
                    ...(expandedCardId === cardId && {
                      zIndex: 10,
                      boxShadow: darkMode ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.2)',
                      position: 'relative'
                    })
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        src={item.itemType === 'post' ? item.memberAvatar : 
                            networkMembers.find(m => m.id === item.created_by)?.profile_picture_url}
                        component={Link}
                        to={item.itemType === 'post' ? 
                          `/profile/${item.memberId}` : 
                          `/profile/${item.created_by}`}
                        sx={{ 
                          border: `2px solid ${customBorder}`,
                          bgcolor: muiTheme.palette.primary.main,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        {item.itemType === 'post' ? 
                          (item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U') : 
                          (networkMembers.find(m => m.id === item.created_by)?.full_name?.charAt(0).toUpperCase() || 'U')}
                      </Avatar>
                    }
                    action={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mr: 1 }}>
                        {(() => {
                          const contentType = getContentTypeIcon(item);
                          return (
                            <Chip
                              size="small"
                              icon={contentType.icon}
                              label={contentType.label}
                              color={contentType.color}
                              variant="outlined"
                              sx={{ 
                                height: 24,
                                fontWeight: 500,
                                '& .MuiChip-icon': {
                                  fontSize: 16
                                }
                              }}
                            />
                          );
                        })()}
                        <Chip 
                          size="small" 
                          label={item.itemType === 'post' ? 'Post' : 'News'} 
                          color={item.itemType === 'post' ? 'secondary' : 'primary'}
                          sx={{ 
                            height: 24,
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    }
                    title={
                      <Link
                        to={item.itemType === 'post' ? 
                          `/profile/${item.memberId}` : 
                          `/profile/${item.created_by}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            color: customLightText,
                            cursor: 'pointer',
                            '&:hover': {
                              color: muiTheme.palette.primary.main,
                              textDecoration: 'underline'
                            },
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {item.itemType === 'post' ? 
                            item.memberName : 
                            networkMembers.find(m => m.id === item.created_by)?.full_name || 'Network Admin'}
                        </Typography>
                      </Link>
                    }
                    subheader={
                      <Typography 
                        variant="caption" 
                        color={customFadedText}
                      >
                        {formatDate(item.createdAt)}
                      </Typography>
                    }
                  />
                  
                  {/* Display media based on type - images, PDFs, etc. */}
                  {item.file_type === 'pdf' && item.file_url ? (
                    // PDF Preview using MediaPlayer
                    <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
                      <MediaPlayer
                        src={item.file_url}
                        type="pdf"
                        title={item.title || "PDF Document"}
                        fileName={item.title || "PDF Document"}
                        darkMode={darkMode}
                      />
                    </Box>
                  ) : item.media_url ? (
                    // New media format (video/audio/image) - with fallback for missing media_type
                    <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
                      {(() => {
                        // Determine media type from URL if media_type is missing
                        let mediaType = item.media_type;
                        if (!mediaType && item.media_url) {
                          const url = item.media_url.toLowerCase();
                          if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.mov')) {
                            mediaType = 'video';
                          } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.aac')) {
                            mediaType = 'audio';
                          } else if (url.includes('.pdf')) {
                            mediaType = 'pdf';
                          } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
                            mediaType = 'image';
                          }
                        }
                        
                        if (mediaType === 'image') {
                          return (
                            <Box 
                              sx={{ 
                                position: 'relative', 
                                width: '100%', 
                                pt: '56.25%',
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.9
                                }
                              }}
                              onClick={() => handleImageClick(item.media_url, item.title)}
                            >
                              <LazyImage
                                src={item.media_url}
                                alt={item.title}
                                style={{ 
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                  padding: '8px'
                                }}
                                objectFit="contain"
                              />
                            </Box>
                          );
                        } else if (mediaType === 'audio') {
                          // Custom audio display with large artwork
                          const audioThumbnail = item.media_metadata?.thumbnail || item.image_url;
                          
                          return (
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              {audioThumbnail ? (
                                // Audio with artwork
                                <Box sx={{ position: 'relative', width: '100%', pt: '100%' /* Square aspect ratio */ }}>
                                  <LazyImage
                                    src={audioThumbnail}
                                    alt={item.media_metadata?.title || item.title}
                                    style={{ 
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                  {/* Overlay gradient */}
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: '60%',
                                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                                    }}
                                  />
                                  {/* Play button overlay */}
                                  <IconButton
                                    onClick={() => handleAudioPlay(item.id, item.media_url)}
                                    sx={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      bgcolor: 'rgba(255,255,255,0.9)',
                                      color: 'primary.main',
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,1)',
                                        transform: 'translate(-50%, -50%) scale(1.1)',
                                      },
                                      transition: 'all 0.2s ease',
                                      width: 64,
                                      height: 64,
                                    }}
                                  >
                                    {playingAudioId === item.id && audioRefs.current[item.id] && !audioRefs.current[item.id].paused ? (
                                      <PauseIcon sx={{ fontSize: 36 }} />
                                    ) : (
                                      <PlayIcon sx={{ fontSize: 36 }} />
                                    )}
                                  </IconButton>
                                  {/* Audio info overlay */}
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      p: 2,
                                      color: 'white',
                                    }}
                                  >
                                    <Typography variant="subtitle1" fontWeight="medium" noWrap>
                                      {item.media_metadata?.title || item.title}
                                    </Typography>
                                    {item.media_metadata?.artist && (
                                      <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                                        {item.media_metadata.artist}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ) : (
                                // Audio without artwork - use compact player
                                <Box sx={{ p: 2 }}>
                                  <MediaPlayer
                                    src={item.media_url}
                                    type="audio"
                                    title={item.media_metadata?.fileName || item.title}
                                    darkMode={darkMode}
                                    compact={true}
                                  />
                                </Box>
                              )}
                            </Box>
                          );
                        } else if (mediaType === 'pdf') {
                          // PDF viewer
                          return (
                            <MediaPlayer
                              src={item.media_url}
                              type="pdf"
                              title={item.media_metadata?.fileName || item.title}
                              fileName={item.media_metadata?.fileName}
                              fileSize={item.media_metadata?.fileSize}
                              numPages={item.media_metadata?.numPages}
                              author={item.media_metadata?.author}
                              thumbnail={item.media_metadata?.thumbnail}
                              darkMode={darkMode}
                            />
                          );
                        } else {
                          // Video player
                          return (
                            <MediaPlayer
                              src={item.media_url}
                              type="video"
                              title={item.media_metadata?.fileName || item.title}
                              thumbnail={item.media_metadata?.thumbnail || item.image_url}
                              darkMode={darkMode}
                              autoplay={true}
                              muted={true}
                              hideControlsUntilInteraction={true}
                            />
                          );
                        }
                      })()}
                    </Box>
                  ) : item.image_url && (
                    // Legacy image format
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        width: '100%', 
                        pt: '56.25%', /* 16:9 aspect ratio container */
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9
                        }
                      }}
                      onClick={() => handleImageClick(item.image_url, item.title)}
                    >
                      <LazyImage
                        src={item.image_url}
                        alt={item.title}
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                          padding: '8px'
                        }}
                        objectFit="contain"
                        onError={(e) => {
                          console.error("Error loading image:", item.image_url);
                          e.target.onerror = null; // Prevent infinite error loop
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                        }}
                      />
                    </Box>
                  )}
                  
                  <CardContent sx={{ pt: 1, pb: 2 }}>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: customLightText,
                        mb: 1
                      }}
                    >
                      {item.title}
                    </Typography>
                    
                    {item.itemType === 'post' ? (
                      <>
                        <Box 
                          sx={{
                            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                            overflow: 'hidden',
                            maxHeight: expandedCardId === `${item.itemType}-${item.id}` ? '2000px' : '4.5em',
                            position: 'relative',
                            mb: 2
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            color={customFadedText}
                            sx={{ 
                              ...(expandedCardId !== `${item.itemType}-${item.id}` && {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              })
                            }}
                          >
                            {item.description}
                          </Typography>
                          {expandedCardId !== `${item.itemType}-${item.id}` && item.description && item.description.length > 180 && (
                            <Box 
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '24px',
                                background: `linear-gradient(to bottom, ${alpha(darkMode ? '#1e1e1e' : '#ffffff', 0)}, ${alpha(darkMode ? '#1e1e1e' : '#ffffff', 0.9)})`,
                                pointerEvents: 'none'
                              }}
                            />
                          )}
                        </Box>
                        
                        {/* Read more button only if there's more content and not expanded */}
                        {item.description && item.description.length > 180 && (
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleExpandCard(`${item.itemType}-${item.id}`); 
                            }}
                            startIcon={expandedCardId === `${item.itemType}-${item.id}` ? <ExpandLessIcon /> : <ReadMoreIcon />}
                            sx={{ 
                              mb: 2, 
                              color: muiTheme.palette.secondary.main,
                              '&:hover': {
                                backgroundColor: alpha(muiTheme.palette.secondary.main, 0.08)
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            {expandedCardId === `${item.itemType}-${item.id}` ? 'Show less' : 'Read more'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Note: News post images are now handled by the common image section above */}
                        
                        <Box 
                          sx={{
                            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                            overflow: 'hidden',
                            maxHeight: expandedCardId === `${item.itemType}-${item.id}` ? '2000px' : '4.5em',
                            position: 'relative',
                            mb: 2
                          }}
                        >
                          <Box
                            className="tiptap-output"
                            sx={{ 
                              color: customFadedText,
                              fontSize: '0.875rem',
                              '& p': { margin: 0 },
                              ...(expandedCardId !== `${item.itemType}-${item.id}` && {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              })
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: item.content
                            }}
                          />
                          {expandedCardId !== `${item.itemType}-${item.id}` && item.content && item.content.length > 180 && (
                            <Box 
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '24px',
                                background: `linear-gradient(to bottom, ${alpha(darkMode ? '#1e1e1e' : '#ffffff', 0)}, ${alpha(darkMode ? '#1e1e1e' : '#ffffff', 0.9)})`,
                                pointerEvents: 'none'
                              }}
                            />
                          )}
                        </Box>
                        
                        {/* Read more button only if there's more content and not expanded */}
                        {item.content && item.content.length > 180 && (
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleExpandCard(`${item.itemType}-${item.id}`); 
                            }}
                            startIcon={expandedCardId === `${item.itemType}-${item.id}` ? <ExpandLessIcon /> : <ReadMoreIcon />}
                            sx={{ 
                              mb: 2,
                              color: muiTheme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(muiTheme.palette.primary.main, 0.08)
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            {expandedCardId === `${item.itemType}-${item.id}` ? 'Show less' : 'Read more'}
                          </Button>
                        )}
                      </>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                      <Box>
                        {item.itemType === 'post' && (item.url || (item.file_type === 'pdf' && item.file_url)) ? (
                          <a 
                            href={item.url || (item.file_type === 'pdf' ? item.file_url : undefined)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-project-btn"
                            style={{ 
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: muiTheme.palette.secondary.main,
                              color: '#ffffff',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent card expansion
                          >
                            {item.file_type === 'pdf' && !item.url ? 'View PDF' : 'View Link'}
                          </a>
                        ) : (
                          <Link 
                            to={item.itemType === 'post' ? 
                              `/profile/${item.memberId}` : 
                              `/network/${item.network_id}/news/${item.id}`}
                            className="view-project-btn"
                            style={{ 
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: item.itemType === 'post' ? 
                                muiTheme.palette.secondary.main : muiTheme.palette.primary.main,
                              color: '#ffffff',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent card expansion
                          >
                            {item.itemType === 'post' ? 'View Profile' : 'Read Full Post'}
                          </Link>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Comments Section */}
                    <CommentSection
                      itemType={item.itemType}
                      itemId={item.id}
                      darkMode={darkMode}
                      isAdmin={isAdmin}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          
          {/* Loading indicator for infinite scroll */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          
          {/* End of content message */}
          {!hasMore && displayItems.length > 0 && !loading && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 3,
                color: customFadedText,
                borderTop: `1px solid ${customBorder}`,
                mt: 2
              }}
            >
              <Typography variant="body2">
                You've reached the end of the social wall
              </Typography>
            </Box>
          )}
        </>
      )}
      
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

export default SocialWallTab;