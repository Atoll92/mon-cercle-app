import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Avatar, Typography, CircularProgress, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getUserProfile } from '../api/networks';
import { getUserMoodboardItems } from '../api/moodboards';
import GridViewIcon from '@mui/icons-material/GridView';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import LinkPreview from '../components/LinkPreview';

const MicroConclavPage = () => {
  const { userId } = useParams();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [moodboardBackgroundColor, setMoodboardBackgroundColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'moodboard'
  const [zoom, setZoom] = useState(1); // Zoom level (1 = 100%)
  const containerRef = useRef(null);
  const contentZoneRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMoodboardItems = async (pageNum = 0) => {
    if (!hasMore && pageNum > 0) return;
    
    try {
      setLoadingMore(pageNum > 0);
      const result = await getUserMoodboardItems(userId, pageNum * 20, 20);
      
      if (result.items.length < 20) {
        setHasMore(false);
      }
      
      if (pageNum === 0) {
        setMoodboardItems(result.items);
        setMoodboardBackgroundColor(result.backgroundColor);
      } else {
        setMoodboardItems(prev => [...prev, ...result.items]);
      }
    } catch (error) {
      console.error('Error fetching moodboard items:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchMoodboardItems(0)
      ]);
      setLoading(false);
    };
    
    init();
  }, [userId]);

  const handleScroll = useCallback(() => {
    if (viewMode !== 'grid') return; // Only handle scroll in grid mode
    
    if (containerRef.current && contentZoneRef.current) {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Load more items when near bottom
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loadingMore && hasMore) {
        setPage(prev => prev + 1);
      }
    }
  }, [loadingMore, hasMore, viewMode]);

  // Handle wheel zoom (only with Ctrl key)
  const handleWheel = useCallback((e) => {
    if (viewMode !== 'moodboard') return;
    
    // Only zoom if Ctrl or Cmd key is pressed
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05; // Smaller increments for smoother zoom
      setZoom(prev => Math.max(0.2, Math.min(3, prev * zoomDelta)));
    }
  }, [viewMode]);

  useEffect(() => {
    if (page > 0) {
      fetchMoodboardItems(page);
    }
  }, [page]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleScroll, handleWheel]);

  // Center the view when switching to moodboard mode
  useEffect(() => {
    if (viewMode === 'moodboard' && containerRef.current && moodboardItems.length > 0) {
      // Scroll to center the content
      const container = containerRef.current;
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;
      
      // Scroll to center of the canvas (10000px is the center)
      container.scrollLeft = 10000 - viewportWidth / 2;
      container.scrollTop = 10000 - viewportHeight / 2;
    }
  }, [viewMode, moodboardItems]);

  const handleViewModeChange = (_, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3)); // Max zoom 300%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2)); // Min zoom 20%
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Profile not found</Typography>
      </Box>
    );
  }

  // Render moodboard item based on type
  const renderMoodboardItem = (item) => {
    switch (item.type) {
      case 'image':
        return (
          <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <img 
              src={item.content} 
              alt={item.title || ''} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                pointerEvents: 'none'
              }} 
            />
          </Box>
        );
      case 'text':
        return (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              p: 2,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: item.backgroundColor || 'transparent',
              color: item.textColor || 'inherit',
              fontFamily: item.font_family || 'inherit',
              fontSize: item.font_size || 'inherit',
              fontWeight: item.font_weight || 'normal',
              textAlign: item.text_align || 'center',
              lineHeight: item.line_height || 'normal'
            }}
          >
            <Typography 
              component="div"
              sx={{
                width: '100%',
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                textAlign: 'inherit',
                lineHeight: 'inherit'
              }}
            >
              {item.content}
            </Typography>
          </Box>
        );
      case 'link':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LinkPreview url={item.content} />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
        overflow: 'auto',
        backgroundColor: theme.palette.background.default,
        position: 'relative',
      }}
    >
      {/* Floating User Info Popup */}
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1000,
          minWidth: 250,
          maxWidth: 300,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={profile.profile_picture_url}
            alt={profile.full_name}
            sx={{ width: 60, height: 60 }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {profile.full_name}
            </Typography>
            {profile.bio && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {profile.bio}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* View Mode Toggle */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: 2
        }}
      >
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="grid" aria-label="grid view">
            <GridViewIcon sx={{ mr: 0.5 }} />
            Grid
          </ToggleButton>
          <ToggleButton value="moodboard" aria-label="moodboard view">
            <DashboardIcon sx={{ mr: 0.5 }} />
            Moodboard
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Zoom Controls - Only show in moodboard view */}
      {viewMode === 'moodboard' && (
        <Box 
          sx={{ 
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            boxShadow: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            p: 0.5
          }}
          title="Use Ctrl+Scroll to zoom"
        >
          <IconButton 
            onClick={handleZoomIn}
            size="small"
            disabled={zoom >= 3}
            title="Zoom In"
          >
            <ZoomInIcon />
          </IconButton>
          <Typography 
            variant="caption" 
            sx={{ 
              textAlign: 'center', 
              minWidth: 40,
              fontSize: '0.7rem'
            }}
          >
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton 
            onClick={handleZoomOut}
            size="small"
            disabled={zoom <= 0.2}
            title="Zoom Out"
          >
            <ZoomOutIcon />
          </IconButton>
          <IconButton 
            onClick={handleZoomReset}
            size="small"
            title="Reset Zoom"
            sx={{ fontSize: '0.7rem' }}
          >
            1:1
          </IconButton>
        </Box>
      )}

      {/* Content Zone */}
      <Box
        ref={contentZoneRef}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: viewMode === 'grid' ? 'visible' : 'hidden',
        }}
      >
        {viewMode === 'grid' ? (
          /* Grid View */
          <Box
            sx={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '80px 20px',
              minHeight: '100vh',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 3,
                pb: 4,
              }}
            >
            {moodboardItems.map((item, index) => (
              <Paper
                key={`${item.id}-${index}`}
                elevation={2}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ width: '100%', height: 300 }}>
                  {renderMoodboardItem(item)}
                </Box>
              </Paper>
            ))}
            </Box>
          </Box>
        ) : (
          /* Moodboard View - Original Layout */
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'auto',
              backgroundColor: moodboardBackgroundColor || '#f5f5f5',
            }}
          >
            {/* Canvas container with repeating content */}
            <Box
              sx={{
                position: 'relative',
                width: '20000px', // Even larger for more repetitions
                height: '20000px', // Even larger for more repetitions
                backgroundColor: moodboardBackgroundColor || '#f5f5f5',
                // Add a subtle grid pattern for visual reference
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                backgroundPosition: '0 0',
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {/* Scroll hint */}
              {moodboardItems.length > 0 && (
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    zIndex: 1000,
                    pointerEvents: 'none',
                  }}
                >
                  Scroll to explore • Ctrl+Scroll to zoom
                </Box>
              )}
              
              {(() => {
                if (moodboardItems.length === 0) return null;
                
                // Calculate content bounds
                const bounds = moodboardItems.reduce((acc, item) => {
                  const left = item.x || 0;
                  const top = item.y || 0;
                  const right = left + (item.width || 200);
                  const bottom = top + (item.height || 200);
                  
                  return {
                    minX: Math.min(acc.minX, left),
                    minY: Math.min(acc.minY, top),
                    maxX: Math.max(acc.maxX, right),
                    maxY: Math.max(acc.maxY, bottom),
                  };
                }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
                
                // Calculate pattern dimensions with some padding
                const patternWidth = bounds.maxX - bounds.minX + 200;
                const patternHeight = bounds.maxY - bounds.minY + 200;
                
                // Create a 7x7 grid of repetitions (49 total)
                const repetitions = [];
                for (let row = -3; row <= 3; row++) {
                  for (let col = -3; col <= 3; col++) {
                    const offsetX = col * patternWidth + 10000; // Center in the canvas
                    const offsetY = row * patternHeight + 10000; // Center in the canvas
                    
                    repetitions.push(
                      moodboardItems.map((item, index) => {
                        // Safe defaults for item properties
                        const safeItem = {
                          x: item.x || 0,
                          y: item.y || 0,
                          width: item.width || 200,
                          height: item.height || 200,
                          rotation: item.rotation || 0,
                          opacity: item.opacity !== undefined ? item.opacity : 1,
                          border_radius: item.border_radius || 0,
                          zIndex: item.zIndex || 0,
                          backgroundColor: item.backgroundColor || 'transparent',
                          textColor: item.textColor || theme.palette.text.primary,
                          ...item
                        };

                        return (
                          <Paper
                            key={`${item.id}-${row}-${col}-${index}`}
                            elevation={1}
                            sx={{
                              position: 'absolute',
                              left: `${safeItem.x - bounds.minX + offsetX}px`,
                              top: `${safeItem.y - bounds.minY + offsetY}px`,
                              width: `${safeItem.width}px`,
                              height: `${safeItem.height}px`,
                              transform: safeItem.rotation ? `rotate(${safeItem.rotation}deg)` : 'none',
                              opacity: safeItem.opacity * (row === 0 && col === 0 ? 1 : 0.8), // Slightly fade repetitions
                              borderRadius: `${safeItem.border_radius}px`,
                              overflow: 'hidden',
                              zIndex: safeItem.zIndex,
                              transition: 'box-shadow 0.2s',
                              cursor: 'default',
                              '&:hover': {
                                boxShadow: 3,
                              },
                            }}
                          >
                            {renderMoodboardItem(safeItem)}
                          </Paper>
                        );
                      })
                    );
                  }
                }
                
                return repetitions;
              })()}
            </Box>
          </Box>
        )}

        {loadingMore && viewMode === 'grid' && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MicroConclavPage;