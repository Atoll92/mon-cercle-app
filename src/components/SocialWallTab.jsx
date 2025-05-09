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
  ReadMore as ReadMoreIcon
} from '@mui/icons-material';

// Number of items to display initially
const ITEMS_PER_FETCH = 6;

const SocialWallTab = ({ socialWallItems = [], networkMembers = [], darkMode = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for infinite scroll
  const [displayItems, setDisplayItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // State for expanded cards
  const [expandedCardId, setExpandedCardId] = useState(null);
  
  // Refs for scroll and animations
  const observer = useRef();
  const expandedCardRef = useRef(null);
  
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
  const lastItemRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreItems();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Initial load
  useEffect(() => {
    if (socialWallItems && socialWallItems.length > 0) {
      // Load first batch of items
      const initialItems = socialWallItems.slice(0, ITEMS_PER_FETCH);
      setDisplayItems(initialItems);
      setHasMore(socialWallItems.length > initialItems.length);
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
      const nextItems = socialWallItems.slice(
        page * ITEMS_PER_FETCH,
        (page + 1) * ITEMS_PER_FETCH
      );
      
      if (nextItems.length === 0) {
        setHasMore(false);
      } else {
        setDisplayItems(prevItems => [...prevItems, ...nextItems]);
        setPage(prevPage => prevPage + 1);
      }
      
      setLoading(false);
    }, 500); // Small timeout to prevent rapid scrolling issues
  }, [page, hasMore, loading, socialWallItems]);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
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
  
  // Get height for masonry layout
  const getCardHeight = (item) => {
    // All cards now have dynamic height based on content
    return 'auto';
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
            color: darkMode ? 'white' : 'text.primary',
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
              bgcolor: theme.palette.primary.main
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
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
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
          <Typography variant="body1" color="text.secondary">
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
              '& > *': {
                breakInside: 'avoid',
                marginBottom: 3
              }
            }}
          >
            {displayItems.map((item, index) => {
              const isLastItem = index === displayItems.length - 1;
              
              return (
                <Card 
                  key={`${item.itemType}-${item.id}`}
                  ref={isLastItem ? lastItemRef : (expandedCardId === `${item.itemType}-${item.id}` ? expandedCardRef : null)}
                  sx={{ 
                    mb: 3,
                    height: getCardHeight(item),
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: expandedCardId === `${item.itemType}-${item.id}` ? 'none' : 'translateY(-4px)',
                      boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)'
                    },
                    bgcolor: darkMode ? alpha('#1e1e1e', 0.5) : 'background.paper',
                    backdropFilter: 'blur(10px)',
                    border: darkMode ? `1px solid ${alpha('#fff', 0.05)}` : 'none',
                    // Apply special styles when expanded
                    ...(expandedCardId === `${item.itemType}-${item.id}` && {
                      zIndex: 10,
                      boxShadow: darkMode ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.2)',
                      transform: 'scale(1.03)',
                      position: 'relative'
                    })
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        src={item.itemType === 'portfolio' ? item.memberAvatar : 
                            networkMembers.find(m => m.id === item.created_by)?.profile_picture_url}
                        sx={{ 
                          border: darkMode ? `2px solid ${alpha('#fff', 0.1)}` : 'none',
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {item.itemType === 'portfolio' ? 
                          (item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U') : 
                          (networkMembers.find(m => m.id === item.created_by)?.full_name?.charAt(0).toUpperCase() || 'U')}
                      </Avatar>
                    }
                    action={
                      <Chip 
                        size="small" 
                        label={item.itemType === 'portfolio' ? 'Portfolio' : 'News'} 
                        color={item.itemType === 'portfolio' ? 'secondary' : 'primary'}
                        sx={{ 
                          height: 24,
                          mt: 1,
                          mr: 1,
                          fontWeight: 500
                        }}
                      />
                    }
                    title={
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600,
                          color: darkMode ? 'white' : 'text.primary'
                        }}
                      >
                        {item.itemType === 'portfolio' ? 
                          item.memberName : 
                          networkMembers.find(m => m.id === item.created_by)?.full_name || 'Network Admin'}
                      </Typography>
                    }
                    subheader={
                      <Typography 
                        variant="caption" 
                        color={darkMode ? alpha("white", 0.6) : "text.secondary"}
                      >
                        {formatDate(item.createdAt)}
                      </Typography>
                    }
                  />
                  
                  {/* Image for portfolio items */}
                  {item.itemType === 'portfolio' && item.image_url && (
                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' /* 16:9 aspect ratio container */ }}>
                      <CardMedia
                        component="img"
                        image={item.image_url}
                        alt={item.title}
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain', // Never crop the image
                          bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                          p: 1 // Add slight padding around the image
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
                        color: darkMode ? 'white' : 'text.primary',
                        mb: 1
                      }}
                    >
                      {item.title}
                    </Typography>
                    
                    {item.itemType === 'portfolio' ? (
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
                            color={darkMode ? alpha("white", 0.7) : "text.secondary"}
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
                              color: theme.palette.secondary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.08)
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
                              color: darkMode ? alpha("white", 0.7) : "text.secondary",
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
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08)
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
                        {item.itemType === 'portfolio' && item.url ? (
                          <a 
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-project-btn"
                            style={{ 
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: theme.palette.secondary.main,
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent card expansion
                          >
                            View Project
                          </a>
                        ) : (
                          <Link 
                            to={item.itemType === 'portfolio' ? 
                              `/profile/${item.memberId}` : 
                              `/news/${item.id}`}
                            className="view-project-btn"
                            style={{ 
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: item.itemType === 'portfolio' ? 
                                theme.palette.secondary.main : theme.palette.primary.main,
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent card expansion
                          >
                            {item.itemType === 'portfolio' ? 'View Profile' : 'Read Full Post'}
                          </Link>
                        )}
                      </Box>
                    </Box>
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
                color: darkMode ? alpha('white', 0.5) : 'text.secondary',
                borderTop: `1px solid ${darkMode ? alpha('white', 0.1) : alpha('#000', 0.1)}`,
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
    </Paper>
  );
};

export default SocialWallTab;