// src/components/MoodboardGallery.jsx - Updated to properly use background_color
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import Spinner from './Spinner';
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
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ArrowForward as ArrowForwardIcon,
  OpenInNew as OpenInNewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Link as LinkIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  ZoomOutMap as ZoomOutMapIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import FlexFlowBox from './FlexFlowBox';
import PDFPreviewEnhanced from './PDFPreviewEnhanced';

/**
 * Component to display a user's public moodboards in a gallery format
 * with auto-fitting all content into the view
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
  const [scale, setScale] = useState(0.5); // Start at 50% scale
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const theme = useTheme();
  const canvasRef = useRef(null);

  // Auto-fit all content in view (excluding background)
  const fitContentToView = useCallback(() => {
    if (!featuredItems || featuredItems.length === 0 || !canvasRef.current) return;
    
    // Find the bounds of all items, excluding any background
    const bounds = featuredItems.reduce((acc, item) => {
      // Skip background elements if they exist
      if (item.type === 'background') return acc;
      
      // Update min and max coordinates for non-background items only
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
    
    // Check if we have valid bounds (no items would result in MAX_SAFE_INTEGER - MIN_SAFE_INTEGER)
    if (bounds.minX === Number.MAX_SAFE_INTEGER || bounds.maxX === Number.MIN_SAFE_INTEGER) {
      // No valid items to fit, use default position and scale
      setScale(0.5);
      setPosition({ x: 0, y: 0 });
      return;
    }
    
    // Calculate content dimensions
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // Get canvas dimensions
    const canvasWidth = canvasRef.current.clientWidth || 600;
    const canvasHeight = canvasRef.current.clientHeight || 400;
    
    // Add padding (percentage of canvas size)
    const paddingX = canvasWidth * 0.1;
    const paddingY = canvasHeight * 0.1;
    
    // Calculate scale needed to fit content
    const scaleX = (canvasWidth - paddingX * 2) / contentWidth;
    const scaleY = (canvasHeight - paddingY * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 0.9); // Cap at 0.9x to ensure content isn't too large
    
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
    
    console.log(`Auto-fitted ${featuredItems.length} items to view with scale ${newScale.toFixed(2)}`);
  }, [featuredItems]);

  // Auto-fit content when items change
  useEffect(() => {
    if (featuredItems.length > 0 && canvasRef.current) {
      // Wait a bit for the canvas to be properly rendered
      const timer = setTimeout(() => {
        fitContentToView();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [featuredItems, fitContentToView]);

  useEffect(() => {
    const fetchMoodboards = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query to get moodboards - all moodboards are now public per the migration
        const query = supabase
          .from('moodboards')
          .select(`
            *,
            profiles:created_by (full_name, profile_picture_url)
          `)
          .eq('created_by', userId)
          .order('updated_at', { ascending: false });

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
              
              // Log item types to help with debugging
              if (itemsData && itemsData.length > 0) {
                const itemTypes = itemsData.reduce((acc, item) => {
                  acc[item.type] = (acc[item.type] || 0) + 1;
                  return acc;
                }, {});
                console.log('Item types:', itemTypes);
                
                // Log field names for debugging
                console.log('Item field names:', Object.keys(itemsData[0]));
              }
              
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
          setFeaturedBoard(null);
          setFeaturedItems([]);
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
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.2));
  };
  
  const handleZoomReset = () => {
    fitContentToView();
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


  // Render MoodboardItem component - just like in MoodboardPage
  const MoodboardItem = ({ item }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Check for any null or undefined properties and provide defaults
    const safeItem = {
      ...item,
      x: item.x || 0,
      y: item.y || 0,
      width: item.width || 200,
      height: item.height || 200,
      // Handle both zIndex and z_index (depending on your database field name)
      zIndex: item.zIndex || item.z_index || 1
    };
    
    // Render different content based on item type
    const renderContent = () => {
      switch (item.type) {
        case 'pdf':
          return (
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <PDFPreviewEnhanced
                url={item.content}
                fileName={item.title || 'PDF Document'}
                title={item.title || 'PDF Document'}
                height="100%"
                showFileName={false}
                borderRadius={0}
              />
            </Box>
          );
        case 'image':
          return (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
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
                  <Spinner size={48} />
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
                borderRadius: item.border_radius || 1,
                pointerEvents: 'none'
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
          left: `${safeItem.x}px`,
          top: `${safeItem.y}px`,
          width: `${safeItem.width}px`,
          height: `${safeItem.height}px`,
          overflow: 'hidden',
          cursor: 'default',
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s ease',
          zIndex: safeItem.zIndex,
          transform: safeItem.rotation ? `rotate(${safeItem.rotation}deg)` : 'none',
          opacity: safeItem.opacity !== undefined ? safeItem.opacity / 100 : 1,
          borderRadius: safeItem.border_radius ? `${safeItem.border_radius}px` : '4px',
        }}
      >
        {renderContent()}
      </Paper>
    );
  };

  // Render featured moodboard with auto-fit view
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
        {/* Moodboard Header */}
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
            
            <Tooltip title="Fit All Content">
              <IconButton 
                onClick={handleZoomReset}
                color="primary"
                size="small"
              >
                <ZoomOutMapIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Main Canvas with auto-fit view - Apply backgroundColor from database*/}
        <Box
          ref={canvasRef}
          sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            overflow: 'hidden',
            bgcolor: featuredBoard.background_color || '#f5f5f5', // Use background_color from database
            cursor: 'default'
          }}
        >
          {featuredItems.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary'
              }}
            >
              <DashboardIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1">
                {isOwnProfile ? 'This moodboard is empty. Add some content!' : 'This moodboard has no visible content.'}
              </Typography>
            </Box>
          ) : (
            /* The infinite canvas with proper transform */
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
              {/* Background grid - Only show if no background_color is set */}
              {!featuredBoard.background_color && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    inset: '-5000px',
                    width: '10000px',
                    height: '10000px',
                    backgroundImage: `linear-gradient(#ddd 1px, transparent 1px), 
                                    linear-gradient(90deg, #ddd 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    zIndex: 0,
                    pointerEvents: 'none' // Ensure background doesn't interfere with interactions
                  }} 
                />
              )}
              
              {/* Render all items with auto-fit positioning */}
              {featuredItems.map(item => (
                <MoodboardItem key={item.id} item={item} />
              ))}
            </Box>
          )}
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
              <Chip 
                icon={<PdfIcon fontSize="small" />} 
                label={featuredItems.filter(item => item.type === 'pdf').length || 0} 
                size="small"
                variant="outlined"
                color="error"
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

  if (!loading && moodboards.length === 0 && !featuredBoard) {
    // Only show error if there's an actual error, not just no moodboards
    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }
    
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {isOwnProfile 
          ? "You haven't created any moodboards yet." 
          : "This user hasn't shared any public moodboards yet."}
      </Alert>
    );
  }

  // Show error only if there's an error AND we have some moodboards
  if (error && (moodboards.length > 0 || featuredBoard)) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{mb: 2}}>
      {/* Featured Moodboard */}
      {showFeatured && loading ? (
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2, mb: 4 }} />
      ) : (
        showFeatured && renderFeaturedMoodboard()
      )}
      
      {/* Grid of other moodboards */}
      {(!showFeatured || moodboards.length > 0) && (
        <FlexFlowBox>
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
                              : moodboard.background_color
                                ? {
                                    backgroundColor: moodboard.background_color
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
        </FlexFlowBox>
      )}
    </Box>
  );
};

export default MoodboardGallery;