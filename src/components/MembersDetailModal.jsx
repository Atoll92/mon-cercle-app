import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useFadeIn } from '../hooks/useAnimation';
import { formatTimeAgo } from '../utils/dateFormatting';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  alpha,
  Paper,
  Stack,
  CircularProgress,
  Tooltip,
  useTheme,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  Mail as MailIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Label as LabelIcon,
  Work as WorkIcon,
  Dashboard as DashboardIcon,
  OpenInNew as OpenInNewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';

const MemberDetailsModal = ({ 
  open, 
  onClose, 
  member, 
  posts: initialPosts = [], // Changed from portfolioItems to posts
  isCurrentUser,
  darkMode = false
}) => {
  const muiTheme = useTheme(); // Get the MUI theme
  
  // When using theme.palette.custom, check first if it exists
  // This is for compatibility with both your custom theme and the default theme
  const customLightText = muiTheme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = muiTheme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = muiTheme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1));
  
  const [memberPosts, setMemberPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for member's moodboards
  const [featuredMoodboard, setFeaturedMoodboard] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [loadingMoodboard, setLoadingMoodboard] = useState(false);
  const [moodboardError, setMoodboardError] = useState(null);
  
  // State for cover display
  const [scale, setScale] = useState(0.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Ref for cover canvas
  const canvasRef = useRef(null);
  
  // Fetch posts only if not provided through props
  useEffect(() => {
    // Skip if modal is not open
    if (!open || !member) {
      return;
    }

    // Initialize with provided items if available
    if (initialPosts && initialPosts.length > 0) {
      console.log("Using provided posts:", initialPosts);
      setMemberPosts(initialPosts);
      setLoading(false);
      return;
    }

    // Only fetch if we don't have posts already or if member changed
    if (memberPosts.length === 0 || memberPosts[0]?.profile_id !== member.id) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log("Fetching posts for member:", member.id);
          const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('profile_id', member.id)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          console.log("Fetched posts:", data);
          setMemberPosts(data || []);
        } catch (err) {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts');
        } finally {
          setLoading(false);
        }
      };
      
      fetchPosts();
    }
  }, [member?.id, open]); // Only depend on member.id and open

  // Fetch member's featured moodboard
  useEffect(() => {
    const fetchFeaturedMoodboard = async () => {
      if (!member || !open) return;
      
      try {
        setLoadingMoodboard(true);
        setMoodboardError(null);
        
        // Get the member's most recent public moodboard
        const { data, error } = await supabase
          .from('moodboards')
          .select('*')
          .eq('created_by', member.id)
          .in('permissions', ['public', 'collaborative'])
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFeaturedMoodboard(data[0]);
          
          // Fetch items for the featured moodboard
          const { data: itemsData, error: itemsError } = await supabase
            .from('moodboard_items')
            .select('*')
            .eq('moodboard_id', data[0].id)
            .order('created_at', { ascending: true });
            
          if (itemsError) throw itemsError;
          
          setMoodboardItems(itemsData || []);
          
          // Auto fit the canvas to show all items
          setTimeout(() => {
            fitContentToView();
          }, 300);
        }
      } catch (err) {
        console.error('Error fetching featured moodboard:', err);
        setMoodboardError('Failed to load moodboard');
      } finally {
        setLoadingMoodboard(false);
      }
    };
    
    fetchFeaturedMoodboard();
  }, [member, open]);
  
  // Function to fit all moodboard content to view
  const fitContentToView = () => {
    if (!moodboardItems.length || !canvasRef.current) return;
    
    // Find the bounds of all items
    const bounds = moodboardItems.reduce((acc, item) => {
      // Skip background elements
      if (item.type === 'background') return acc;
      
      // Update min and max coordinates
      acc.minX = Math.min(acc.minX, item.x || 0);
      acc.minY = Math.min(acc.minY, item.y || 0);
      acc.maxX = Math.max(acc.maxX, (item.x || 0) + (item.width || 200));
      acc.maxY = Math.max(acc.maxY, (item.y || 0) + (item.height || 200));
      return acc;
    }, { 
      minX: Number.MAX_SAFE_INTEGER, 
      minY: Number.MAX_SAFE_INTEGER, 
      maxX: Number.MIN_SAFE_INTEGER, 
      maxY: Number.MIN_SAFE_INTEGER 
    });
    
    // Check if we have valid bounds
    if (bounds.minX === Number.MAX_SAFE_INTEGER || bounds.maxX === Number.MIN_SAFE_INTEGER) {
      setScale(0.5);
      setPosition({ x: 0, y: 0 });
      return;
    }
    
    // Calculate content dimensions
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // Get canvas dimensions
    const canvasWidth = canvasRef.current.clientWidth || 600;
    const canvasHeight = canvasRef.current.clientHeight || 200;
    
    // Add padding
    const paddingX = canvasWidth * 0.1;
    const paddingY = canvasHeight * 0.1;
    
    // Calculate scale needed to fit content
    const scaleX = (canvasWidth - paddingX * 2) / contentWidth;
    const scaleY = (canvasHeight - paddingY * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 0.8);
    
    // Calculate position to center content
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const contentCenterX = bounds.minX + contentWidth / 2;
    const contentCenterY = bounds.minY + contentHeight / 2;
    
    // Set new position and scale
    setScale(newScale);
    setPosition({
      x: centerX - contentCenterX * newScale,
      y: centerY - contentCenterY * newScale
    });
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.2));
  };
  
  const handleZoomReset = () => {
    fitContentToView();
  };
  
  // MoodboardItem component - a simplified version
  const MoodboardItem = ({ item }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Provide defaults for item properties
    const safeItem = {
      ...item,
      x: item.x || 0,
      y: item.y || 0,
      width: item.width || 200,
      height: item.height || 200,
      zIndex: item.zIndex || item.z_index || 1
    };
    
    // Render item content based on type
    const renderContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              backgroundColor: 'rgba(245, 245, 245, 0.5)',
            }}>
              {!imageLoaded && item.content && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                >
                  <CircularProgress size={16} />
                </Box>
              )}
              
              <img 
                src={item.content} 
                alt={item.title || 'Moodboard image'} 
                onLoad={() => setImageLoaded(true)}
                onError={(e) => console.error('Image load error:', item.content)}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  opacity: imageLoaded ? 1 : 0.3,
                  transition: 'opacity 0.3s ease',
                }} 
              />
            </Box>
          );
        case 'text':
          return (
            <Box sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <Typography 
                variant="body1" 
                component="div" 
                sx={{ 
                  p: 2, 
                  overflow: 'auto',
                  width: '100%',
                  height: '100%',
                  color: item.textColor || '#000000',
                  backgroundColor: item.backgroundColor || 'transparent',
                  fontFamily: item.font_family || 'inherit',
                  fontSize: item.font_size || 'inherit',
                  fontWeight: item.font_weight || 'normal',
                  lineHeight: item.line_height || 'normal',
                  textAlign: item.text_align || 'left',
                  pointerEvents: 'none'
                }}
              >
                {item.content}
              </Typography>
            </Box>
          );
        case 'link':
          return (
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: item.backgroundColor || '#f5f5f5',
                borderRadius: item.border_radius || 1,
                pointerEvents: 'none'
              }}
            >
              <LanguageIcon sx={{ fontSize: 24, mb: 1, color: 'primary.main' }} />
              <Typography 
                variant="body2" 
                component="div" 
                sx={{ 
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 'medium',
                  textAlign: 'center',
                  wordBreak: 'break-word'
                }}
              >
                {item.title || item.content}
              </Typography>
            </Box>
          );
        default:
          return null;
      }
    };
  
    return (
      <Paper
        elevation={1}
        sx={{
          position: 'absolute',
          left: `${safeItem.x}px`,
          top: `${safeItem.y}px`,
          width: `${safeItem.width}px`,
          height: `${safeItem.height}px`,
          overflow: 'hidden',
          cursor: 'default',
          border: `1px solid ${customBorder}`,
          transition: 'box-shadow 0.2s ease',
          zIndex: safeItem.zIndex,
          transform: safeItem.rotation ? `rotate(${safeItem.rotation}deg)` : 'none',
          opacity: safeItem.opacity !== undefined ? safeItem.opacity / 100 : 1,
          borderRadius: safeItem.border_radius ? `${safeItem.border_radius}px` : '2px',
        }}
      >
        {renderContent()}
      </Paper>
    );
  };

  if (!member) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      TransitionComponent={Zoom}
      TransitionProps={{
        timeout: 300
      }}
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#121212' : 'background.paper',
          backgroundImage: darkMode ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' : 'none',
          boxShadow: 24,
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1.5,
        pl: 2.5,
        bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.5),
        color: customLightText,
        borderBottom: '1px solid',
        borderColor: customBorder
      }}>
        <Typography variant="h6" component="div">
          Member Profile
        </Typography>
        <IconButton 
          edge="end" 
          onClick={onClose} 
          aria-label="close"
          sx={{ color: customLightText }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent 
        dividers
        sx={{ 
          p: 0, 
          bgcolor: darkMode ? '#121212' : 'background.paper',
          color: customLightText
        }}
      >
        {/* Moodboard Cover Image Section */}
        <Box 
          sx={{ 
            position: 'relative',
            height: '200px',
            width: '100%',
            bgcolor: featuredMoodboard?.background_color || (darkMode ? alpha('#333333', 0.5) : alpha('#f5f5f5', 0.8)),
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: customBorder
          }}
          ref={canvasRef}
        >
          {/* If there's no moodboard or it's loading, show a placeholder */}
          {(loadingMoodboard || !featuredMoodboard) ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                width: '100%'
              }}
            >
              {loadingMoodboard ? (
                <CircularProgress size={32} />
              ) : (
                <>
                  <DashboardIcon 
                    sx={{ 
                      fontSize: 40, 
                      mb: 1, 
                      color: customFadedText
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color={customFadedText}
                  >
                    No public moodboards
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <>
              {/* The interactive moodboard canvas */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}
              >
                {/* Only show grid background if no background color is set */}
                {!featuredMoodboard.background_color && (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      inset: '-5000px',
                      width: '10000px',
                      height: '10000px',
                      backgroundImage: `linear-gradient(#dddddd 1px, transparent 1px), 
                                      linear-gradient(90deg, #dddddd 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }} 
                  />
                )}
                
                {/* Canvas with transform for items */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transformOrigin: 'center center',
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: 'transform 0.2s ease'
                  }}
                >
                  {/* Render all moodboard items */}
                  {moodboardItems.map(item => (
                    <MoodboardItem key={item.id} item={item} />
                  ))}
                </Box>
              </Box>
              
              {/* Zoom controls and moodboard title overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                  zIndex: 10
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: darkMode ? alpha('#000000', 0.7) : alpha('#ffffff', 0.7),
                    borderRadius: 1,
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={customLightText}
                  >
                    {featuredMoodboard.title}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    gap: 0.5,
                    bgcolor: darkMode ? alpha('#000000', 0.7) : alpha('#ffffff', 0.7),
                    borderRadius: 1,
                    p: 0.5
                  }}
                >
                  <Tooltip title="Zoom Out">
                    <IconButton onClick={handleZoomOut} size="small">
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Fit Content">
                    <IconButton onClick={handleZoomReset} size="small" color="primary">
                      <DashboardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Zoom In">
                    <IconButton onClick={handleZoomIn} size="small">
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Open Moodboard">
                    <IconButton 
                      component={Link}
                      to={`/moodboard/${featuredMoodboard.id}`}
                      size="small"
                      color="primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </>
          )}
        </Box>
        
        {/* Profile Info Section with Avatar partially overlapping moodboard */}
        <Box 
          sx={{ 
            position: 'relative',
            pl: 3,
            pr: 3,
            pt: 0,
            pb: 2,
            mt: '-60px' // Negative margin to overlap with moodboard
          }}
        >
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm="auto" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                src={member.profile_picture_url}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: `4px solid ${darkMode ? alpha('#121212', 0.95) : '#ffffff'}`,
                  boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.1)'
                }}
              >
                {member.full_name ? member.full_name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
            </Grid>

            <Grid item xs={12} sm>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {member.full_name || 'Unnamed User'}
                  {isCurrentUser && ' (You)'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={member.role === 'admin' ? 'Admin' : 'Member'} 
                    color={member.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    sx={{ 
                      bgcolor: darkMode ? 
                        (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333333', 0.8)) : 
                        undefined
                    }}
                  />
                  
                  {member.created_at && (
                    <Chip
                      icon={<EventNoteIcon fontSize="small" />}
                      label={`Joined ${formatTimeAgo(member.created_at)}`}
                      size="small"
                      sx={{ 
                        bgcolor: darkMode ? alpha('#555555', 0.8) : undefined,
                        color: darkMode ? '#ffffff' : undefined
                      }}
                    />
                  )}
                </Box>
                
                {member.bio && (
                  <Typography 
                    variant="body1" 
                    paragraph
                    sx={{ 
                      color: customFadedText,
                      maxWidth: '600px'
                    }}
                  >
                    {member.bio}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm="auto">
              <Stack direction="column" spacing={1}>
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MailIcon />}
                    component={Link}
                    to={`/messages/${member.id}`}
                    fullWidth
                  >
                    Message
                  </Button>
                )}

                <Button
                  variant={darkMode ? "outlined" : "contained"}
                  color={darkMode ? "inherit" : "primary"}
                  component={Link}
                  to={`/profile/${member.id}`}
                  fullWidth
                  sx={{ 
                    color: darkMode ? '#ffffff' : undefined,
                    borderColor: darkMode ? alpha('#ffffff', 0.3) : undefined,
                    '&:hover': {
                      borderColor: darkMode ? '#ffffff' : undefined
                    }
                  }}
                >
                  Full Profile
                </Button>
                
                {featuredMoodboard && (
                  <Button
                    variant="outlined"
                    startIcon={<DashboardIcon />}
                    component={Link}
                    to={`/moodboard/${featuredMoodboard.id}`}
                    fullWidth
                    color={darkMode ? "secondary" : "secondary"}
                    sx={{
                      mt: 1
                    }}
                  >
                    View Moodboard
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
        
        {/* Contact and Links */}
        {(member.contact_email || member.portfolio_url || member.linkedin_url) && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                mr: 1, 
                bgcolor: darkMode ? alpha('#1976d2', 0.2) : alpha('#1976d2', 0.1),
                color: darkMode ? '#90caf9' : '#1976d2',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <MailIcon fontSize="small" />
              </Box>
              Contact & Links
            </Typography>
            
            <Grid container spacing={2} sx={{ ml: 1 }}>
              {member.contact_email && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <MailIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={`mailto:${member.contact_email}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      {member.contact_email}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.portfolio_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LanguageIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={member.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      Portfolio Website
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {member.linkedin_url && (
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: darkMode ? alpha('#000000', 0.3) : alpha('#f5f5f5', 0.8),
                      border: '1px solid',
                      borderColor: customBorder,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#000000', 0.4) : alpha('#f5f5f5', 1)
                      }
                    }}
                  >
                    <LinkedInIcon sx={{ mr: 1, color: darkMode ? '#90caf9' : '#1976d2' }} />
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        textDecoration: 'none',
                        color: customLightText,
                        wordBreak: 'break-all'
                      }}
                    >
                      LinkedIn Profile
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        <Divider sx={{ mx: 3 }} />
        
        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <Box sx={{ p: 3, pt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                mr: 1, 
                bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                color: darkMode ? '#ce93d8' : '#9c27b0',
                p: 0.5,
                borderRadius: '50%'
              }}>
                <LabelIcon fontSize="small" />
              </Box>
              Skills & Expertise
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
              {member.skills.map((skill, index) => (
                <Chip 
                  key={`${skill}-${index}`} 
                  label={skill} 
                  sx={{ 
                    bgcolor: darkMode ? alpha('#9c27b0', 0.2) : alpha('#9c27b0', 0.1),
                    color: darkMode ? '#ce93d8' : '#9c27b0',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: darkMode ? alpha('#9c27b0', 0.3) : alpha('#9c27b0', 0.2),
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Posts preview */}
        <Divider sx={{ mx: 3 }} />
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              display: 'inline-flex', 
              mr: 1, 
              bgcolor: darkMode ? alpha('#ff9800', 0.2) : alpha('#ff9800', 0.1),
              color: darkMode ? '#ffb74d' : '#ff9800',
              p: 0.5,
              borderRadius: '50%'
            }}>
              <WorkIcon fontSize="small" />
            </Box>
            Posts {memberPosts.length > 0 && `(${memberPosts.length})`}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          ) : memberPosts.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {memberPosts.slice(0, 3).map(item => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: darkMode ? alpha('#000000', 0.3) : 'background.paper',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      {item.image_url && (
                        <Box sx={{ 
                          width: '100%', 
                          height: 140, 
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }} 
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ p: 2, flexGrow: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ fontWeight: 'medium' }}
                        >
                          {item.title}
                        </Typography>
                        
                        {item.description && (
                          <Typography 
                            variant="body2"
                            color={customFadedText}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 1
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                      
                      {item.url && (
                        <Box sx={{ p: 1, pt: 0, borderTop: '1px solid', borderColor: customBorder }}>
                          <Button
                            size="small"
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              color: darkMode ? '#90caf9' : '#1976d2',
                              '&:hover': {
                                bgcolor: darkMode ? alpha('#1976d2', 0.1) : undefined
                              }
                            }}
                          >
                            View Project
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              {memberPosts.length > 3 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    to={`/profile/${member.id}`}
                    color={darkMode ? "inherit" : "primary"}
                    sx={{ 
                      color: darkMode ? '#90caf9' : undefined 
                    }}
                  >
                    View All {memberPosts.length} Posts
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography 
              variant="body2" 
              color={customFadedText}
              sx={{ p: 1, fontStyle: 'italic' }}
            >
              No posts yet
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsModal;