import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
import MembersDetailModal from './MembersDetailModal';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';
import UserContent from './UserContent';
import Spinner from './Spinner';
import { formatTimeAgo } from '../utils/dateFormatting';
import {
  Typography,
  Paper,
  Divider,
  Box,
  Avatar,
  Fade,
  Card,
  CardContent,
  IconButton,
  useTheme,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowForward as ArrowForwardIcon,
  PlayCircleFilled as PlayIcon,
  Pause as PauseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import MediaPlayer from './MediaPlayer';
import MediaCarousel from './MediaCarousel';
import LazyImage from './LazyImage';
import ImageViewerModal from './ImageViewerModal';
import CommentSection from './CommentSection';
import LinkPreview from './LinkPreview';
import { getCommentCount } from '../api/comments';
import { fetchNetworkCategories } from '../api/categories';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { getUserProfile } from '../api/networks';

// Number of items to display initially
const ITEMS_PER_FETCH = 6;

const SocialWallTab = ({ socialWallItems = [], networkMembers = [], darkMode = false, isAdmin = false, networkId, onPostDeleted, onPostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const muiTheme = useTheme();
  
  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
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
  
  // Refs for scroll and animations
  const observer = useRef();
  const animationFrameRef = useRef();
  const cardRefs = useRef(new Map());
  
  // State for audio playback
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  
  // State for image viewer modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '' });
  
  // State for comment counts
  const [commentCounts, setCommentCounts] = useState({});
  
  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  
  // Create post modal state
  const [createPostOpen, setCreatePostOpen] = useState(false);
  
  // Delete post state
  const [deletingPostId, setDeletingPostId] = useState(null);
  
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
  
  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      if (!networkId && !activeProfile?.network_id) return;
      const netId = networkId || activeProfile?.network_id;
      const { data, error } = await fetchNetworkCategories(netId, true); // Only active categories
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId, activeProfile]);

  // Filter items based on selected category and sort by date (latest first)
  const filteredItems = React.useMemo(() => {
    let items = socialWallItems;
    
    // Filter by category if selected
    if (selectedCategory) {
      items = items.filter(item => {
        // Check category_id for both news and portfolio items
        return item.category_id === selectedCategory;
      });
    }
    
    // Sort by createdAt date in descending order (latest first)
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Latest first
    });
  }, [socialWallItems, selectedCategory]);

  // Fetch comment counts for all items
  const fetchCommentCounts = useCallback(async (items) => {
    const counts = {};
    
    // Fetch counts in parallel for better performance
    const countPromises = items.map(async (item) => {
      const { count } = await getCommentCount(item.itemType, item.id);
      return { 
        key: `${item.itemType}-${item.id}`, 
        count: count || 0 
      };
    });
    
    const results = await Promise.all(countPromises);
    
    // Convert array of results to object
    results.forEach(({ key, count }) => {
      counts[key] = count;
    });
    
    setCommentCounts(counts);
  }, []);

  // Initial load
  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      // Determine how many items to load initially - more if there are fewer total items
      const initialLoadCount = Math.min(
        ITEMS_PER_FETCH * 2, // Load 2 pages worth initially for smoother experience
        Math.max(ITEMS_PER_FETCH, Math.ceil(filteredItems.length / 2)) // But at least half of all items
      );
      
      console.log(`Initially loading ${initialLoadCount} of ${filteredItems.length} items`);
      
      // Load initial batch of items
      const initialItems = filteredItems.slice(0, initialLoadCount);
      setDisplayItems(initialItems);
      setPage(Math.ceil(initialLoadCount / ITEMS_PER_FETCH)); // Set appropriate page number
      setHasMore(filteredItems.length > initialLoadCount);
      
      // Fetch comment counts for all items
      fetchCommentCounts(socialWallItems);
    } else {
      setDisplayItems([]);
      setHasMore(false);
    }
  }, [filteredItems, fetchCommentCounts]);
  
  // Load more items
  const loadMoreItems = useCallback(() => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    
    setTimeout(() => {
      // Calculate which items to display based on the current page
      const endIndex = (page + 1) * ITEMS_PER_FETCH;
      const nextItems = filteredItems.slice(0, endIndex);
      
      if (nextItems.length === filteredItems.length) {
        setHasMore(false);
      } else {
        setPage(prevPage => prevPage + 1);
      }
      
      // Always set displayItems to all items up to the current page
      setDisplayItems(nextItems);
      setLoading(false);
      
      console.log(`Loaded items up to page ${page + 1}, total: ${nextItems.length} items`);
    }, 500); // Small timeout to prevent rapid scrolling issues
  }, [page, hasMore, loading, filteredItems]);
  
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
  
  // Handle member click
  const handleMemberClick = async (memberId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Find member in networkMembers first
      let member = networkMembers.find(m => m.id === memberId);
      
      if (!member) {
        // If not found in networkMembers, fetch from profiles table
        member = await getUserProfile(memberId);
        if (!member) throw new Error('Profile not found');
      }
      
      if (member) {
        setSelectedMember(member);
        setMemberModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      // Fallback to profile page if modal fails
      window.location.href = `/profile/${memberId}`;
    }
  };
  
  // Handle post creation
  const handlePostCreated = (newPost) => {
    console.log('New post created:', newPost);
    
    // Call the parent's callback to update the social wall items
    if (onPostCreated) {
      onPostCreated(newPost);
    }
    
    // The new post will appear through the updated socialWallItems prop
  };
  
  // Handle post deletion
  const handleDeletePost = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(t('socialWall.confirmDeletePost'))) {
      return;
    }
    
    try {
      setDeletingPostId(item.id);
      
      // Delete from portfolio_items table (posts are stored there)
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', item.id)
        .eq('profile_id', activeProfile?.id || user.id); // Ensure user can only delete their own posts
        
      if (error) throw error;
      
      console.log('Post deleted successfully:', item.id);
      
      // Remove the post from local state immediately
      setDisplayItems(prevItems => prevItems.filter(displayItem => 
        !(displayItem.itemType === 'post' && displayItem.id === item.id)
      ));
      
      // Call parent callback if provided to update the main social wall items
      if (onPostDeleted) {
        onPostDeleted(item.id, 'post');
      }
      
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(t('socialWall.deletePostFailed'));
    } finally {
      setDeletingPostId(null);
    }
  };
  
  // Check if user owns the post
  const isUserPost = (item) => {
    return item.itemType === 'post' && item.memberId === user?.id;
  };
  
  return (
    <Paper 
      sx={{ 
        p: { xs: 2, md: 3 },
        mt: 1.5,
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
        position: 'relative',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%' }}>
          {/* Post Creation Trigger */}
          <Card
            onClick={() => setCreatePostOpen(true)}
            sx={{
              width: '100%',
              p: 2,
              cursor: 'pointer',
              bgcolor: darkMode ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
              border: `1px solid ${darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)}`,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: darkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                borderColor: muiTheme.palette.primary.main,
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={activeProfile?.profile_picture_url || user?.profile_picture_url}
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: muiTheme.palette.primary.main
                }}
              >
                {(activeProfile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <TextField
                fullWidth
                placeholder={t('socialWall.whatsOnYourMind')}
                variant="outlined"
                disabled
                sx={{
                  pointerEvents: 'none',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: darkMode ? alpha('#ffffff', 0.05) : 'background.paper',
                    '& fieldset': {
                      borderColor: 'transparent'
                    }
                  }
                }}
              />
              <IconButton
                sx={{
                  bgcolor: muiTheme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: muiTheme.palette.primary.dark,
                  },
                  width: 40,
                  height: 40,
                  pointerEvents: 'none'
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Card>
          
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel shrink>{t('socialWall.filterByCategory')}</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label={t('socialWall.filterByCategory')}
                displayEmpty
              >
                <MenuItem value="">
                  <em>{t('socialWall.allCategories')}</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 0.5,
                          bgcolor: category.color,
                          flexShrink: 0
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        
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
            {t('socialWall.noActivity')}
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
              
              // Handle posts with PostCard component
              if (item.itemType === 'post') {
                // Create author object from social wall data structure
                const author = {
                  id: item.memberId,
                  full_name: item.memberName,
                  profile_picture_url: item.memberAvatar
                };
                
                return (
                  <div 
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
                    }}
                    style={{ marginBottom: '24px' }}
                  >
                    <PostCard
                      post={item}
                      author={author}
                      category={item.category_id ? categories.find(c => c.id === item.category_id) : null}
                      darkMode={darkMode}
                      isOwner={item.profile_id === (activeProfile?.id || user?.id)}
                      onAuthorClick={handleMemberClick}
                      onPostUpdated={onPostDeleted}
                      onPostDeleted={onPostDeleted}
                      sx={{ 
                        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
                        }
                      }}
                    />
                  </div>
                );
              }
              
              // Handle announcement items with existing Card component
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
                  }}
                  sx={{ 
                    mb: 3,
                    height: getCardHeight(item),
                    borderRadius: 2,
                    overflow: 'hidden',
                    // Smooth transitions for all transform and opacity changes
                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px) !important', // Subtle hover lift
                      boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
                    },
                    bgcolor: darkMode ? alpha('#1e1e1e', 0.5) : 'background.paper',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${customBorder}`
                  }}
                >
                  <Box sx={{ p: 2, pb: 1 }}>
                    {/* Custom header layout */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* Left column: Avatar */}
                      <Avatar
                        src={item.itemType === 'post' ? item.memberAvatar : 
                            networkMembers.find(m => m.id === item.created_by)?.profile_picture_url}
                        onClick={(e) => handleMemberClick(
                          item.itemType === 'post' ? item.memberId : item.created_by, 
                          e
                        )}
                        sx={{ 
                          width: 40,
                          height: 40,
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
                      
                      {/* Middle: Name and Date */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          onClick={(e) => handleMemberClick(
                            item.itemType === 'post' ? item.memberId : item.created_by, 
                            e
                          )}
                          sx={{ 
                            fontWeight: 600,
                            color: customLightText,
                            cursor: 'pointer',
                            '&:hover': {
                              color: muiTheme.palette.primary.main,
                              textDecoration: 'underline'
                            },
                            transition: 'color 0.2s ease',
                            lineHeight: 1.4,
                            mb: 0.5
                          }}
                        >
                          {item.itemType === 'post' ? 
                            item.memberName : 
                            networkMembers.find(m => m.id === item.created_by)?.full_name || 'Network Admin'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color={customFadedText}
                          sx={{ 
                            whiteSpace: 'nowrap',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            lineHeight: 1,
                            display: 'block'
                          }}
                        >
                          {formatTimeAgo(item.createdAt)}
                        </Typography>
                      </Box>
                      
                      {/* Right: Actions */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        {/* Top row: Action buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Delete button for user's own posts */}
                          {isUserPost(item) && (
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeletePost(item, e)}
                              disabled={deletingPostId === item.id}
                              sx={{
                                color: 'error.main',
                                width: 28,
                                height: 28,
                                '&:hover': {
                                  bgcolor: alpha(muiTheme.palette.error.main, 0.08)
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {deletingPostId === item.id ? (
                                <Spinner size={16} />
                              ) : (
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          )}
                          
                          {item.itemType === 'news' && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: alpha(muiTheme.palette.primary.main, 0.12),
                                border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(muiTheme.palette.primary.main, 0.18),
                                  borderColor: alpha(muiTheme.palette.primary.main, 0.4),
                                  transform: 'scale(1.05)'
                                }
                              }}
                            >
                              <CampaignIcon
                                sx={{
                                  fontSize: 14,
                                  color: muiTheme.palette.primary.main
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        
                        {/* Category indicator */}
                        {item.category_id && categories.find(c => c.id === item.category_id) && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '16px',
                              bgcolor: alpha(categories.find(c => c.id === item.category_id).color, 0.12),
                              border: `1px solid ${alpha(categories.find(c => c.id === item.category_id).color, 0.3)}`,
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                bgcolor: alpha(categories.find(c => c.id === item.category_id).color, 0.18),
                                borderColor: alpha(categories.find(c => c.id === item.category_id).color, 0.4),
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: categories.find(c => c.id === item.category_id).color,
                                letterSpacing: '0.02em',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              #{categories.find(c => c.id === item.category_id).name}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
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
                  ) : (() => {
                    // Check for multiple media items - first check direct field, then check media_metadata  
                    let mediaItemsArray = null;
                    
                    if (item.media_items && Array.isArray(item.media_items) && item.media_items.length > 0) {
                      mediaItemsArray = item.media_items;
                    } else if (item.media_metadata?.media_items && Array.isArray(item.media_metadata.media_items) && item.media_metadata.media_items.length > 0) {
                      mediaItemsArray = item.media_metadata.media_items;
                    }
                    
                    if (mediaItemsArray) {
                      // For single media items, use appropriate component based on type
                      if (mediaItemsArray.length === 1) {
                        const mediaItem = mediaItemsArray[0];
                        const mediaType = mediaItem.type?.toLowerCase();
                        
                        // For images, use img element directly since MediaPlayer doesn't handle images
                        if (mediaType === 'image') {
                          return (
                            <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
                              <img
                                src={mediaItem.url}
                                alt={mediaItem.metadata?.fileName || item.title}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '400px',
                                  objectFit: 'contain',
                                  borderRadius: '8px'
                                }}
                              />
                            </Box>
                          );
                        }
                        
                        // For video, audio, pdf use MediaPlayer
                        return (
                          <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
                            <MediaPlayer
                              src={mediaItem.url}
                              type={mediaType}
                              title={mediaItem.metadata?.fileName}
                              thumbnail={mediaItem.metadata?.thumbnail}
                              darkMode={darkMode}
                              autoplay={mediaType === 'video'}
                              muted={true}
                              hideControlsUntilInteraction={true}
                            />
                          </Box>
                        );
                      }
                      
                      // For multiple media items, use MediaCarousel
                      return (
                        <Box sx={{ bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', p: 2 }}>
                          <MediaCarousel
                            media={mediaItemsArray.map(mediaItem => ({
                              url: mediaItem.url,
                              type: mediaItem.type,
                              metadata: mediaItem.metadata || {}
                            }))}
                            darkMode={darkMode}
                            height={400}
                            autoplay={false}
                            showThumbnails={true}
                            compact={false}
                          />
                        </Box>
                      );
                    }
                    
                    // Single media item fallback
                    if (item.media_url) {
                      return (
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
                      );
                    }
                    
                    // Legacy image_url fallback
                    if (item.image_url) {
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
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                            }}
                          />
                        </Box>
                      );
                    }
                    
                    return null;
                  })()}
                  
                  
                  <CardContent sx={{ pt: 1, pb: 2 }}>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: customLightText,
                        mb: 1
                      }}
                    >
                      {item.title}
                    </Typography>
                    
                    <Box 
                      sx={{
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        overflow: 'hidden',
                        maxHeight: '4.5em',
                        position: 'relative',
                        mb: 2
                      }}
                    >
                      <UserContent
                        content={item.content}
                        html={true}
                        noShowMore={true} // Disable built-in "Show more" since we have a button below to view full announcement
                        maxLines={3}
                        sx={{ 
                          color: customFadedText,
                          fontSize: '0.875rem'
                        }}
                      />
                    </Box>
                    
                    {/* Comments Section */}
                    <CommentSection
                      itemType={item.itemType}
                      itemId={item.id}
                      darkMode={darkMode}
                      isAdmin={isAdmin}
                      initialCount={commentCounts[`${item.itemType}-${item.id}`] || 0}
                      onMemberClick={handleMemberClick}
                      TopRightElement={
                        <Button
                          component={Link}
                          to={`/network/${item.network_id}/news/${item.id}`}
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          {t('socialWall.readFullPost')}
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          
          {/* Loading indicator for infinite scroll */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <Spinner size={64} />
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
                {t('socialWall.endOfWall')}
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
      
      {/* Member Detail Modal */}
      <MembersDetailModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        member={selectedMember}
        darkMode={darkMode}
      />
      
      {/* Create Post Modal */}
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
        darkMode={darkMode}
      />
    </Paper>
  );
};

export default SocialWallTab;