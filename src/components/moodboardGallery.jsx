// src/components/MoodboardGallery.jsx - Simplified version with direct Supabase query
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Skeleton,
  Chip,
  Alert,
  Fade,
  Paper,
  useTheme,
  alpha,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
  PeopleAlt as PeopleAltIcon,
  OpenInNew as OpenInNewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Link as LinkIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

/**
 * Component to display a user's public moodboards in a gallery format
 * using the exact same layout as the MoodboardPage
 * 
 * @param {string} userId - The user ID whose moodboards to display
 * @param {boolean} isOwnProfile - Whether this is the current user's profile
 * @param {number} limit - Maximum number of moodboards to show (optional)
 * @param {boolean} showFeatured - Whether to display the first moodboard in a featured format with items
 */
const MoodboardGallery = ({ userId, isOwnProfile, limit, showFeatured = false }) => {
  const [moodboards, setMoodboards] = useState([]);
  const [featuredBoard, setFeaturedBoard] = useState(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(0.5); // Start at 50% scale to show more content
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const theme = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchMoodboards = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query to get moodboards
        let query = supabase
          .from('moodboards')
          .select(`
            *,
            profiles:created_by (full_name, profile_picture_url)
          `)
          .eq('created_by', userId)
          .order('updated_at', { ascending: false });

        // If not own profile, only show public moodboards
        if (!isOwnProfile) {
          query = query.eq('permissions', 'public');
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          // Find first moodboard for featured display
          if (showFeatured) {
            const featured = data[0];
            setFeaturedBoard(featured);
            
            // Fetch items for the featured moodboard directly
            const { data: itemsData, error: itemsError } = await supabase
              .from('moodboard_items')
              .select('*')
              .eq('moodboard_id', featured.id)
              .order('created_at', { ascending: true });
              
            if (itemsError) {
              console.error('Error fetching moodboard items:', itemsError);
            } else {
              console.log(`Found ${itemsData?.length || 0} items for featured moodboard`);
              setFeaturedItems(itemsData || []);
            }
          }
          
          // Count items for each moodboard
          const boardsWithCounts = await Promise.all(data.map(async (moodboard) => {
            const { count, error: countError } = await supabase
              .from('moodboard_items')
              .select('id', { count: 'exact' })
              .eq('moodboard_id', moodboard.id);
              
            return {
              ...moodboard,
              itemCount: count || 0
            };
          }));

          // Apply limit if needed and if not showing featured (since we already take first one for featured)
          if (limit && !showFeatured) {
            setMoodboards(boardsWithCounts.slice(0, limit));
          } else if (limit && showFeatured) {
            // Skip the first one if it's already featured
            setMoodboards(boardsWithCounts.slice(1, limit + 1));
          } else {
            setMoodboards(boardsWithCounts);
          }
        } else {
          setMoodboards([]);
        }
      } catch (err) {
        console.error('Error fetching moodboards:', err);
        setError('Failed to load moodboards');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMoodboards();
    }
  }, [userId, isOwnProfile, limit, showFeatured]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };
  
  const handleZoomReset = () => {
    setScale(0.5);
    setPosition({ x: 0, y: 0 });
  };

  // Skeleton loader for loading state
  const renderSkeletons = () => {
    return Array(limit || 3).fill(0).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
        <Card sx={{ 
          height: 240, 
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <Skeleton variant="rectangular" height={140} />
          <CardContent>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={20} />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 4 }} />
              <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 4 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  // Generate a visual preview for moodboards without actual thumbnails
  const generateMoodboardPreview = (moodboard) => {
    // Create a pattern based on the moodboard ID
    const id = moodboard.id || '';
    const patternSeed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate colors based on seed
    const hue = (patternSeed % 360);
    const primaryColor = `hsl(${hue}, 60%, 60%)`;
    const secondaryColor = `hsl(${(hue + 40) % 360}, 70%, 75%)`;
    
    // Different pattern styles
    const patterns = [
      `linear-gradient(45deg, ${primaryColor} 25%, ${secondaryColor} 25%, ${secondaryColor} 50%, ${primaryColor} 50%, ${primaryColor} 75%, ${secondaryColor} 75%)`,
      `radial-gradient(circle at 50% 50%, ${primaryColor} 20%, ${secondaryColor} 20%, ${secondaryColor} 30%, ${primaryColor} 30%, ${primaryColor} 40%, ${secondaryColor} 40%)`,
      `linear-gradient(60deg, ${primaryColor}, ${secondaryColor})`,
      `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
    ];
    
    const patternIndex = patternSeed % patterns.length;
    
    return {
      background: patterns[patternIndex],
      backgroundSize: patternIndex === 0 ? '20px 20px' : patternIndex === 1 ? '20px 20px' : '100% 100%'
    };
  };

  // Render permission indicator chip
  const renderPermissionChip = (permission) => {
    switch (permission) {
      case 'public':
        return (
          <Chip 
            icon={<PublicIcon fontSize="small" />} 
            label="Public" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.dark,
              fontWeight: 500
            }}
          />
        );
      case 'private':
        return (
          <Chip 
            icon={<LockIcon fontSize="small" />} 
            label="Private" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.grey[500], 0.1),
              color: theme.palette.grey[700],
              fontWeight: 500
            }}
          />
        );
      case 'collaborative':
        return (
          <Chip 
            icon={<PeopleAltIcon fontSize="small" />} 
            label="Collaborative" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.dark,
              fontWeight: 500
            }}
          />
        );
      default:
        return null;
    }
  };

  // Render MoodboardItem component - just like in MoodboardPage
  const MoodboardItem = ({ item }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Render different content based on item type
    const renderContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              backgroundColor: '#f5f5f5', // Add background to make loading more visible
            }}>
              {/* Loading indicator */}
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
                  <CircularProgress size={24} />
                </Box>
              )}
              
              <img 
                src={item.content} 
                alt={item.title || 'Moodboard image'} 
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.error('Image load error:', item.content);
                }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', // Use contain instead of cover to preserve aspect ratio
                  pointerEvents: 'none', // Prevent image from capturing mouse events
                  opacity: imageLoaded ? 1 : 0.3, // Fade in when loaded
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
                  // Use snake_case property names to match database schema
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
                borderRadius: item.border_radius || 1, // Use border_radius from database
                pointerEvents: 'none' // Always none in preview
              }}
            >
              <LinkIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
              <Typography 
                variant="body1" 
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
          return (
            <Box sx={{ p: 2, pointerEvents: 'none' }}>
              <Typography variant="body2" color="text.secondary">
                Unknown item type
              </Typography>
            </Box>
          );
      }
    };
  
    return (
      <Paper
        elevation={1}
        sx={{
          position: 'absolute',
          left: `${item.x}px`,
          top: `${item.y}px`,
          width: `${item.width}px`,
          height: `${item.height}px`,
          overflow: 'hidden',
          cursor: 'default',
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s ease',
          zIndex: item.zIndex || 1,
          transform: item.rotation ? `rotate(${item.rotation}deg)` : 'none',
          opacity: item.opacity ? item.opacity / 100 : 1,
          borderRadius: item.border_radius ? `${item.border_radius}px` : '4px',
        }}
      >
        {renderContent()}
      </Paper>
    );
  };

  // Render featured moodboard with the exact same layout as MoodboardPage
  const renderFeaturedMoodboard = () => {
    if (!featuredBoard) return null;

    return (
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          height: '500px' // Fixed height for preview
        }}
      >
        {/* Moodboard Header - just like in MoodboardPage */}
        <Box 
          sx={{ 
            p: 1, 
            display: 'flex', 
            justifyContent: 'space-between',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: '1px solid',
            borderColor: 'divider',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">{featuredBoard.title}</Typography>
            <Box sx={{ ml: 2 }}>
              {renderPermissionChip(featuredBoard.permissions)}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              minWidth: 60,
              mx: 0.5
            }}>
              <Typography variant="body2" align="center" sx={{ width: '100%' }}>
                {Math.round(scale * 100)}%
              </Typography>
            </Box>
            
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            
            <Button 
              size="small" 
              variant="outlined" 
              onClick={handleZoomReset}
              sx={{ ml: 1 }}
            >
              Reset View
            </Button>
          </Box>
        </Box>
        
        {/* Main Canvas - just like in MoodboardPage */}
        <Box
          ref={canvasRef}
          sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            overflow: 'hidden',
            bgcolor: '#f5f5f5',
            cursor: 'default'
          }}
        >
          {/* The infinite canvas with proper transform */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformOrigin: '0 0',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: 'transform 0.1s ease'
            }}
          >
            {/* Background grid */}
            <Box 
              sx={{ 
                position: 'absolute',
                inset: '-5000px',
                width: '10000px',
                height: '10000px',
                backgroundImage: `linear-gradient(#ddd 1px, transparent 1px), 
                                  linear-gradient(90deg, #ddd 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                zIndex: 0
              }} 
            />
            
            {/* Render all items exactly as in MoodboardPage */}
            {featuredItems.map(item => (
              <MoodboardItem key={item.id} item={item} />
            ))}
          </Box>
        </Box>
        
        {/* Footer with count and open link */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderTop: '1px solid', 
          borderColor: 'divider' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon fontSize="small" />
            <Typography variant="body2">{featuredItems.length} items</Typography>
            <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
              <Chip 
                icon={<ImageIcon fontSize="small" />} 
                label={featuredItems.filter(item => item.type === 'image').length || 0} 
                size="small" 
                variant="outlined"
                color="primary"
              />
              <Chip 
                icon={<TextFieldsIcon fontSize="small" />} 
                label={featuredItems.filter(item => item.type === 'text').length || 0} 
                size="small"
                variant="outlined"
                color="secondary" 
              />
              <Chip 
                icon={<LinkIcon fontSize="small" />} 
                label={featuredItems.filter(item => item.type === 'link').length || 0} 
                size="small"
                variant="outlined"
                color="info"
              />
            </Box>
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            component={Link}
            to={`/moodboard/${featuredBoard.id}`}
            endIcon={<OpenInNewIcon />}
          >
            Open Moodboard
          </Button>
        </Box>
      </Paper>
    );
  };

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!loading && moodboards.length === 0 && !featuredBoard) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {isOwnProfile 
          ? "You haven't created any moodboards yet." 
          : "This user hasn't shared any public moodboards yet."}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Featured Moodboard */}
      {showFeatured && loading ? (
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2, mb: 4 }} />
      ) : (
        showFeatured && renderFeaturedMoodboard()
      )}
      
      {/* Grid of other moodboards */}
      {(!showFeatured || moodboards.length > 0) && (
        <Grid container spacing={3}>
          {loading 
            ? renderSkeletons() 
            : moodboards.map(moodboard => (
                <Grid item xs={12} sm={6} md={4} key={moodboard.id}>
                  <Fade in={true} timeout={500}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: theme.shadows[2],
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardActionArea 
                        component={Link} 
                        to={`/moodboard/${moodboard.id}`}
                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        {/* Preview/Thumbnail Area */}
                        <Box 
                          sx={{ 
                            height: 140,
                            position: 'relative',
                            ...(moodboard.cover_image_url 
                              ? {
                                  backgroundImage: `url(${moodboard.cover_image_url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                } 
                              : generateMoodboardPreview(moodboard))
                          }}
                        >
                          {/* Item count badge */}
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              borderRadius: 4,
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <DashboardIcon fontSize="inherit" />
                            {moodboard.itemCount} items
                          </Box>
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom noWrap>
                            {moodboard.title}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1.5,
                              height: '40px' // Fixed height for description
                            }}
                          >
                            {moodboard.description || "No description provided"}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
                            {renderPermissionChip(moodboard.permissions)}
                            
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {new Date(moodboard.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Fade>
                </Grid>
              ))}
        </Grid>
      )}
      
      {limit && moodboards.length > 0 && moodboards.length >= limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button 
            variant="outlined" 
            endIcon={<ArrowForwardIcon />}
            component={Link}
            to={`/profile/${userId}/moodboards`}
          >
            View All Moodboards
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MoodboardGallery;